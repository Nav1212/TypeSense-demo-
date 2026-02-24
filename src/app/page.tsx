'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTheme } from 'next-themes';
import SearchBar from '@/components/SearchBar';
import DocList from '@/components/DocList';
import ChunkPanel from '@/components/ChunkPanel';
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

  // ── Fetch all docs sorted by created_at ────────────────────────────────────
  const fetchAllDocs = useCallback(async () => {
    try {
      const res = await fetch('/api/docs');
      const data: SearchResponse = await res.json();
      setAllDocs(data.hits ?? []);
    } catch {
      // silently fail — search still works
    }
  }, []);

  // ── Bootstrap with SSE progress ───────────────────────────────────────────
  useEffect(() => {
    async function init() {
      try {
        const healthRes = await fetch('/api/health', {
          signal: AbortSignal.timeout(15_000),
        });
        const health: { healthy: boolean; hybridAvailable: boolean; error?: string } =
          await healthRes.json();

        if (!health.healthy) {
          setTsError(
            'Cannot reach Typesense Cloud.' +
              (health.error
                ? `\n${health.error}`
                : '\nCheck TYPESENSE_HOST and TYPESENSE_API_KEY in .env.local and restart the dev server.'),
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

          if (!bRes.ok || !bRes.body) {
            setBootstrapStatus('error');
            return;
          }

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
              } catch {
                // malformed event — skip
              }
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

  // Fetch all docs once bootstrap is done
  useEffect(() => {
    if (bootstrapStatus === 'done') {
      fetchAllDocs();
    }
  }, [bootstrapStatus, fetchAllDocs]);

  // ── Search ─────────────────────────────────────────────────────────────────
  const runSearch = useCallback(
    async (q: string, searchMode: 'fuzzy' | 'hybrid') => {
      if (!q.trim()) {
        setSearchResults(null);
        return;
      }
      setLoading(true);
      setFallbackWarning(null);
      const t0 = performance.now();
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(q)}&mode=${searchMode}`,
        );
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
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, mode, runSearch]);

  // ── Display logic ──────────────────────────────────────────────────────────
  const isSearchMode = !!query.trim();
  const displayHits = isSearchMode ? (searchResults?.hits ?? []) : allDocs;
  const isBootstrapping = bootstrapStatus === 'running';

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">

      {/* ── Progress bar (fixed top) ── */}
      {isBootstrapping && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <div className="h-[3px] bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-brand-600 transition-all duration-300 ease-out rounded-r-full"
              style={{ width: `${Math.round(bootstrapProgress * 100)}%` }}
            />
          </div>
          <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-5 py-2.5 flex items-center gap-3 shadow-sm">
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

      {/* ── Sidebar ── */}
      <aside
        className={`w-72 flex-shrink-0 flex flex-col h-screen border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 ${isBootstrapping ? 'pt-[52px]' : ''}`}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            {/* Logo mark */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shadow-sm">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                    d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-none">TypeSense</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-none mt-0.5">Search Demo</p>
              </div>
            </div>

            {/* Theme toggle */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                title="Toggle theme"
                className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {theme === 'dark' ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M20.354 15.354A9 9 0 0 1 8.646 3.646 9.003 9.003 0 0 0 12 21a9.003 9.003 0 0 0 8.354-5.646z" />
                  </svg>
                )}
              </button>
            )}
          </div>

          {/* Status */}
          {bootstrapStatus === 'running' ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Indexing…
            </span>
          ) : bootstrapStatus === 'done' ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-green-600 dark:text-green-500 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Connected
            </span>
          ) : bootstrapStatus === 'error' ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-red-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              Bootstrap failed
            </span>
          ) : tsError ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-red-500 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              Disconnected
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
              Connecting…
            </span>
          )}
        </div>

        {/* Scrollable sidebar body */}
        <div className="flex-1 overflow-y-auto sidebar-scroll px-5 py-4">
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
          <ChunkPanel
            hits={isSearchMode ? (searchResults?.hits ?? []) : []}
            onHoverDoc={setHoveredDocId}
          />
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className={`flex-1 overflow-y-auto ${isBootstrapping ? 'pt-[52px]' : ''}`}>
        {/* Error banner */}
        {tsError && (
          <div className="animate-fade-in sticky top-0 z-20 bg-red-500 text-white px-5 py-3 flex items-start gap-3 shadow">
            <span className="text-sm flex-1 whitespace-pre-wrap font-medium leading-snug">{tsError}</span>
            <button onClick={() => setTsError(null)} className="text-white/70 hover:text-white transition-colors mt-0.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Hybrid fallback warning */}
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
      </main>
    </div>
  );
}
