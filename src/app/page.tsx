'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTheme } from 'next-themes';
import SearchBar from '@/components/SearchBar';
import DocList from '@/components/DocList';
import ChunkPanel from '@/components/ChunkPanel';
import NavSidebar from '@/components/NavSidebar';
import type { DocHit } from '@/components/DocCard';

interface SearchResponse {
  hits: DocHit[];
  found: number;
  search_time_ms: number;
  _fallback?: boolean;
  _fallbackReason?: string;
  error?: string;
}

interface BootstrapEvent {
  stage: 'creating' | 'indexing' | 'done' | 'error';
  message: string;
  progress?: number;
  indexed?: number;
  total?: number;
}

const BOOTSTRAP_KEY = 'typesense-demo-bootstrapped-v3';

const TABS = [
  { label: 'Patient Info ▾', id: 'patient-info' },
  { label: 'Brands', id: 'brands' },
  { label: 'Medication Requests', id: 'medication-requests' },
  { label: 'Clinical Overview ▾', id: 'clinical-overview' },
  { label: 'Forms', id: 'forms' },
  { label: 'Programs', id: 'programs' },
  { label: 'Services ▾', id: 'services' },
  { label: 'More ▾', id: 'more' },
];

// ── OkRx top header ──────────────────────────────────────────────────────────

function AppHeader({ theme, mounted, onToggleTheme }: {
  theme: string | undefined;
  mounted: boolean;
  onToggleTheme: () => void;
}) {
  return (
    <header className="h-14 flex-shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center px-4 gap-3 z-30">
      <button className="w-8 h-8 flex flex-col items-center justify-center gap-[5px] rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-default">
        <span className="block w-[18px] h-px bg-current" />
        <span className="block w-[18px] h-px bg-current" />
        <span className="block w-[18px] h-px bg-current" />
      </button>

      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center shadow-sm flex-shrink-0">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"
            strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <span className="text-[17px] font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Ok<span className="text-brand-600">Rx</span>
        </span>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-4">
        <button className="flex items-center gap-1 text-sm font-medium text-brand-600 dark:text-brand-400 cursor-default">
          Tester Pharmacy
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
            strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        <span className="text-sm font-medium text-brand-600 dark:text-brand-400 hidden sm:block">
          Welcome!
        </span>

        <svg className="w-5 h-5 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"
          strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>

        {mounted && (
          <button onClick={onToggleTheme} title="Toggle theme"
            className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
            {theme === 'dark' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        )}

        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-300">TP</span>
        </div>
      </div>
    </header>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'fuzzy' | 'hybrid'>('fuzzy');
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [allDocs, setAllDocs] = useState<DocHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [hybridAvailable, setHybridAvailable] = useState(true);
  const [tsError, setTsError] = useState<string | null>(null);
  const [fallbackWarning, setFallbackWarning] = useState<string | null>(null);
  const [bootstrapStatus, setBootstrapStatus] = useState<
    'idle' | 'running' | 'done' | 'error'
  >('idle');
  const [bootstrapProgress, setBootstrapProgress] = useState(0);
  const [bootstrapMessage, setBootstrapMessage] = useState('');
  const [hoveredDocId, setHoveredDocId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageMode, setPageMode] = useState<'documents' | 'lines'>('documents');
  const [pageSize, setPageSize] = useState(10);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('clinical-overview');

  const { theme, setTheme } = useTheme();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setMounted(true), []);

  const fetchAllDocs = useCallback(async () => {
    try {
      const res = await fetch('/api/docs');
      const data: SearchResponse = await res.json();
      setAllDocs(data.hits ?? []);
    } catch { /* silently fail */ }
  }, []);

  useEffect(() => {
    async function init() {
      try {
        const healthRes = await fetch('/api/health', { signal: AbortSignal.timeout(15_000) });
        const health: { healthy: boolean; hybridAvailable: boolean; error?: string } =
          await healthRes.json();

        if (!health.healthy) {
          setTsError(
            'Cannot reach Typesense Cloud.' +
              (health.error ? `\n${health.error}` : '\nCheck TYPESENSE_HOST and TYPESENSE_API_KEY in .env.local.'),
          );
          return;
        }

        setHybridAvailable(health.hybridAvailable);

        const alreadyBootstrapped = localStorage.getItem(BOOTSTRAP_KEY);
        if (!alreadyBootstrapped) {
          setBootstrapStatus('running');
          setBootstrapProgress(0);
          setBootstrapMessage('Connecting…');

          const bRes = await fetch('/api/bootstrap', { method: 'POST' });
          if (!bRes.ok || !bRes.body) { setBootstrapStatus('error'); return; }

          const reader = bRes.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';
            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              try {
                const event: BootstrapEvent = JSON.parse(line.slice(6));
                if (event.stage === 'creating' || event.stage === 'indexing') {
                  setBootstrapProgress(event.progress ?? 0);
                  setBootstrapMessage(event.message);
                } else if (event.stage === 'done') {
                  setBootstrapProgress(1);
                  setBootstrapMessage(event.message);
                  localStorage.setItem(BOOTSTRAP_KEY, '1');
                  setBootstrapStatus('done');
                } else if (event.stage === 'error') {
                  setBootstrapStatus('error');
                  setTsError(`Bootstrap failed: ${event.message}`);
                }
              } catch { /* malformed — skip */ }
            }
          }

          const h2 = await fetch('/api/health').then((r) => r.json());
          setHybridAvailable(h2.hybridAvailable ?? false);
        } else {
          setBootstrapStatus('done');
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setTsError(`Network error — ${msg}`);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (bootstrapStatus === 'done') fetchAllDocs();
  }, [bootstrapStatus, fetchAllDocs]);

  const runSearch = useCallback(
    async (q: string, searchMode: 'fuzzy' | 'hybrid') => {
      if (!q.trim()) { setSearchResults(null); return; }
      setLoading(true);
      setFallbackWarning(null);
      const t0 = performance.now();
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&mode=${searchMode}`);
        const data: SearchResponse = await res.json();
        data.search_time_ms = Math.round(performance.now() - t0);
        if (data._fallback) {
          setFallbackWarning('Hybrid unavailable — showing fuzzy results.');
          setHybridAvailable(false);
        }
        setSearchResults(data);
        setCurrentPage(1);
      } catch (err) {
        console.error('Search error', err);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(query, mode), 280);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, mode, runSearch]);

  const isSearchMode = !!query.trim();
  const rawHits = isSearchMode ? (searchResults?.hits ?? []) : allDocs;
  const displayHits = [...rawHits].sort(
    (a, b) => (b.document.created_at ?? 0) - (a.document.created_at ?? 0),
  );
  const isBootstrapping = bootstrapStatus === 'running';

  // TypeSense connection status label + dot
  const tsStatusNode = (() => {
    if (bootstrapStatus === 'running') return (
      <div style={{ display: 'flex', alignItems: 'center', fontSize: 12, color: '#d97706', fontWeight: 500, marginBottom: 32 }}>
        <span style={{ width: 6, height: 6, background: '#f59e0b', borderRadius: '50%', marginRight: 8, flexShrink: 0, animation: 'pulse 1.5s infinite' }} />
        Indexing…
      </div>
    );
    if (bootstrapStatus === 'done' && !tsError) return (
      <div style={{ display: 'flex', alignItems: 'center', fontSize: 12, color: '#16a34a', fontWeight: 500, marginBottom: 32 }}>
        <span style={{ width: 6, height: 6, background: '#22c55e', borderRadius: '50%', marginRight: 8, flexShrink: 0 }} />
        Connected
      </div>
    );
    if (bootstrapStatus === 'error' || tsError) return (
      <div style={{ display: 'flex', alignItems: 'center', fontSize: 12, color: '#dc2626', fontWeight: 500, marginBottom: 32 }}>
        <span style={{ width: 6, height: 6, background: '#ef4444', borderRadius: '50%', marginRight: 8, flexShrink: 0 }} />
        {bootstrapStatus === 'error' ? 'Bootstrap failed' : 'Disconnected'}
      </div>
    );
    return (
      <div style={{ display: 'flex', alignItems: 'center', fontSize: 12, color: '#94a3b8', fontWeight: 500, marginBottom: 32 }}>
        <span style={{ width: 6, height: 6, background: '#94a3b8', borderRadius: '50%', marginRight: 8, flexShrink: 0 }} />
        Connecting…
      </div>
    );
  })();

  return (
    <div className="flex flex-col h-screen overflow-hidden">

      {/* ── OkRx header ── */}
      <AppHeader
        theme={theme}
        mounted={mounted}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      />

      {/* ── Indexing progress bar ── */}
      {isBootstrapping && (
        <div className="flex-shrink-0 bg-white border-b border-slate-200 z-20">
          <div className="h-[3px] bg-slate-100 overflow-hidden">
            <div
              className="h-full transition-all duration-300 ease-out rounded-r-full"
              style={{ width: `${Math.round(bootstrapProgress * 100)}%`, background: '#0f6b3e' }}
            />
          </div>
          <div className="px-5 py-2 flex items-center gap-3">
            <svg className="w-4 h-4 animate-spin flex-shrink-0" style={{ color: '#0f6b3e' }} fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm font-medium flex-1" style={{ color: '#334155' }}>
              {bootstrapMessage || 'Indexing documents…'}
            </span>
            <span className="text-sm font-bold tabular-nums" style={{ color: '#0f6b3e' }}>
              {Math.round(bootstrapProgress * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden" style={{ background: '#edf2f9' }}>

        {/* Col 1: OkRx nav sidebar */}
        <NavSidebar />

        {/* Col 2: Clinical notes content */}
        <main className="flex-1 flex flex-col overflow-hidden">

          {/* Error / fallback banners */}
          {tsError && (
            <div className="flex-shrink-0 animate-fade-in z-20 flex items-start gap-3 px-5 py-3 shadow"
              style={{ background: '#ef4444', color: '#fff' }}>
              <span className="text-sm flex-1 whitespace-pre-wrap font-medium leading-snug">{tsError}</span>
              <button onClick={() => setTsError(null)} style={{ color: 'rgba(255,255,255,0.7)' }}
                className="hover:text-white mt-0.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          {fallbackWarning && (
            <div className="flex-shrink-0 animate-fade-in z-20 flex items-center gap-3 px-5 py-2.5 shadow"
              style={{ background: '#f59e0b', color: '#fff' }}>
              <span className="text-sm flex-1">{fallbackWarning}</span>
              <button onClick={() => setFallbackWarning(null)} style={{ color: 'rgba(255,255,255,0.7)' }}
                className="hover:text-white">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* ── Green patient context bar ── */}
          <div style={{
            background: '#0f6b3e',
            color: '#fff',
            padding: '8px 24px',
            fontSize: 14,
            fontWeight: 500,
            flexShrink: 0,
            fontFamily: 'inherit',
          }}>
            Aaron Jones
          </div>

          {/* ── Patient sub-tabs ── */}
          <div style={{
            display: 'flex',
            flexWrap: 'nowrap',
            gap: '2rem',
            padding: '0 24px',
            background: '#fff',
            borderBottom: '1px solid #e2e8f0',
            flexShrink: 0,
            overflowX: 'auto',
          }}>
            {TABS.map((tab) => (
              <div
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '12px 0',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: activeTab === tab.id ? 700 : 500,
                  color: activeTab === tab.id ? '#0f6b3e' : '#64748b',
                  borderBottom: activeTab === tab.id ? '2px solid #0f6b3e' : '2px solid transparent',
                  transition: 'all .15s',
                  userSelect: 'none',
                  whiteSpace: 'nowrap',
                  fontFamily: 'inherit',
                }}
              >
                {tab.label}
              </div>
            ))}
          </div>

          {/* ── Scrollable page content ── */}
          <div className="flex-1 overflow-y-auto" style={{ padding: '24px' }}>

            {/* ── Patient header card (top half, no bottom border) ── */}
            <div style={{
              background: '#fff',
              padding: 24,
              border: '1px solid #e2e8f0',
              borderBottom: 0,
              borderRadius: '8px 8px 0 0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <h1 style={{
                  fontSize: 30,
                  fontWeight: 300,
                  color: '#0f6b3e',
                  margin: 0,
                  lineHeight: 1.2,
                  fontFamily: 'inherit',
                }}>
                  Aaron Jones
                </h1>
                <p style={{
                  color: '#64748b',
                  fontSize: 18,
                  margin: '4px 0 0',
                  fontFamily: 'inherit',
                }}>
                  Clinical Notes Search
                </p>
              </div>
              {/* Stethoscope / clinical icon */}
              <div style={{
                width: 64,
                height: 64,
                background: '#e6f4ed',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                  stroke="#0f6b3e" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                  <rect x="9" y="3" width="6" height="4" rx="1" ry="1" />
                  <line x1="12" y1="11" x2="12" y2="17" />
                  <line x1="9" y1="14" x2="15" y2="14" />
                </svg>
              </div>
            </div>

            {/* ── Search body card (bottom half) ── */}
            <div style={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '0 0 8px 8px',
              padding: 20,
              display: 'flex',
              gap: 20,
            }}>

              {/* Left: search + results */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <SearchBar
                  query={query}
                  onQueryChange={(q) => { setQuery(q); setCurrentPage(1); }}
                  mode={mode}
                  onModeChange={setMode}
                  hybridAvailable={hybridAvailable}
                  loading={loading}
                />
                <DocList
                  hits={displayHits}
                  isSearchMode={isSearchMode}
                  hoveredDocId={hoveredDocId}
                  pageMode={pageMode}
                  onPageModeChange={setPageMode}
                  pageSize={pageSize}
                  onPageSizeChange={setPageSize}
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
                  queryTime={isSearchMode ? (searchResults?.search_time_ms ?? null) : null}
                  mode={mode}
                  resultCount={displayHits.length}
                />
              </div>

              {/* Right: TypeSense sidebar (hidden below xl breakpoint) */}
              <div className="hidden xl:block" style={{
                width: 260,
                flexShrink: 0,
                borderLeft: '1px solid #f1f5f9',
                paddingLeft: 20,
              }}>
                {/* Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#64748b',
                  letterSpacing: '0.05em',
                  marginBottom: 8,
                  whiteSpace: 'nowrap',
                  fontFamily: 'inherit',
                }}>
                  <div style={{
                    width: 20,
                    height: 20,
                    background: '#dbeafe',
                    color: '#2563eb',
                    borderRadius: 4,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 8,
                    fontSize: 10,
                    flexShrink: 0,
                  }}>
                    <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                    </svg>
                  </div>
                  TYPESENSE SEARCH
                </div>

                {/* Connection status */}
                {tsStatusNode}

                {/* Matched fragments */}
                <ChunkPanel
                  hits={isSearchMode ? (searchResults?.hits ?? []) : []}
                  onHoverDoc={setHoveredDocId}
                />
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
