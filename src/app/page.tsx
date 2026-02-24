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

// ── OkRx top header (static) ─────────────────────────────────────────────────

function AppHeader({ theme, mounted, onToggleTheme }: {
  theme: string | undefined;
  mounted: boolean;
  onToggleTheme: () => void;
}) {
  return (
    <header className="h-14 flex-shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center px-4 gap-3 z-30">
      {/* Hamburger */}
      <button className="w-8 h-8 flex flex-col items-center justify-center gap-[5px] rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-default">
        <span className="block w-[18px] h-px bg-current" />
        <span className="block w-[18px] h-px bg-current" />
        <span className="block w-[18px] h-px bg-current" />
      </button>

      {/* OkRx logo */}
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

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right group */}
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

        {/* Email */}
        <svg className="w-5 h-5 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"
          strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>

        {/* Settings */}
        <svg className="w-5 h-5 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"
          strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>

        {/* Theme toggle */}
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

        {/* Avatar */}
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

  const isSearchMode    = !!query.trim();
  const displayHits     = isSearchMode ? (searchResults?.hits ?? []) : allDocs;
  const isBootstrapping = bootstrapStatus === 'running';

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">

      {/* ── OkRx header ── */}
      <AppHeader
        theme={theme}
        mounted={mounted}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      />

      {/* ── Indexing progress bar (below header, in document flow) ── */}
      {isBootstrapping && (
        <div className="flex-shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 z-20">
          <div className="h-[3px] bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-brand-600 transition-all duration-300 ease-out rounded-r-full"
              style={{ width: `${Math.round(bootstrapProgress * 100)}%` }}
            />
          </div>
          <div className="px-5 py-2 flex items-center gap-3">
            <svg className="w-4 h-4 text-brand-500 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm text-slate-700 dark:text-slate-300 font-medium flex-1">
              {bootstrapMessage || 'Indexing documents…'}
            </span>
            <span className="text-sm font-bold text-brand-600 dark:text-brand-400 tabular-nums">
              {Math.round(bootstrapProgress * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Col 1: OkRx nav sidebar (far left) */}
        <NavSidebar />

        {/* Col 2: Document area — search bar attached at top, then doc list */}
        <main className="flex-1 overflow-hidden flex flex-col">

          {/* Search bar — visually starts where documents do */}
          <div className="flex-shrink-0 bg-white dark:bg-slate-900 px-6 pt-4">
            <SearchBar
              query={query}
              onQueryChange={setQuery}
              mode={mode}
              onModeChange={setMode}
              hybridAvailable={hybridAvailable}
              resultCount={isSearchMode ? (searchResults?.found ?? 0) : allDocs.length}
              queryTime={isSearchMode ? (searchResults?.search_time_ms ?? null) : null}
              loading={loading}
            />
          </div>

          {/* Document list */}
          <div className="flex-1 overflow-y-auto">
            {tsError && (
              <div className="animate-fade-in sticky top-0 z-20 bg-red-500 text-white px-5 py-3 flex items-start gap-3 shadow">
                <span className="text-sm flex-1 whitespace-pre-wrap font-medium leading-snug">{tsError}</span>
                <button onClick={() => setTsError(null)} className="text-white/70 hover:text-white mt-0.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {fallbackWarning && (
              <div className="animate-fade-in sticky top-0 z-20 bg-amber-500 text-white px-5 py-2.5 flex items-center gap-3 shadow">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                </svg>
                <span className="text-sm flex-1">{fallbackWarning}</span>
                <button onClick={() => setFallbackWarning(null)} className="text-white/70 hover:text-white">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            <div className="p-6">
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
              />
            </div>
          </div>
        </main>

        {/* Col 3: TypeSense sidebar (far right) */}
        <aside className="w-64 flex-shrink-0 flex flex-col border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <div className="px-4 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-md bg-brand-600 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
              </div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 tracking-widest uppercase">
                TypeSense Search
              </span>
            </div>

            {bootstrapStatus === 'running' ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] text-amber-600 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />Indexing…
              </span>
            ) : bootstrapStatus === 'done' ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] text-green-600 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />Connected
              </span>
            ) : bootstrapStatus === 'error' ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] text-red-600 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />Bootstrap failed
              </span>
            ) : tsError ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] text-red-500 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />Disconnected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />Connecting…
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto sidebar-scroll px-4 py-4">
            <ChunkPanel
              hits={isSearchMode ? (searchResults?.hits ?? []) : []}
              onHoverDoc={setHoveredDocId}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
