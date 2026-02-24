'use client';

interface SearchBarProps {
  query: string;
  onQueryChange: (q: string) => void;
  mode: 'fuzzy' | 'hybrid';
  onModeChange: (m: 'fuzzy' | 'hybrid') => void;
  hybridAvailable: boolean;
  resultCount: number;
  queryTime: number | null;
  loading: boolean;
}

export default function SearchBar({
  query,
  onQueryChange,
  mode,
  onModeChange,
  hybridAvailable,
  resultCount,
  queryTime,
  loading,
}: SearchBarProps) {
  return (
    <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 pb-4 border-b border-slate-200 dark:border-slate-700">
      {/* Input */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search documents…"
          className="w-full pl-9 pr-9 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600
            bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100
            placeholder-slate-400 dark:placeholder-slate-500
            focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent focus:bg-white dark:focus:bg-slate-800
            text-sm transition-all"
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-400">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </span>
        )}
      </div>

      {/* Mode toggle */}
      <div className="flex gap-1.5 mt-3 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
        <button
          onClick={() => onModeChange('fuzzy')}
          className={`flex-1 py-1.5 text-xs rounded-md font-semibold transition-all ${
            mode === 'fuzzy'
              ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Fuzzy
        </button>

        <div
          className="flex-1 relative"
          title={!hybridAvailable ? 'Model may still be downloading' : ''}
        >
          <button
            onClick={() => hybridAvailable && onModeChange('hybrid')}
            disabled={!hybridAvailable}
            className={`w-full py-1.5 text-xs rounded-md font-semibold transition-all ${
              mode === 'hybrid'
                ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 shadow-sm'
                : hybridAvailable
                  ? 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  : 'text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-50'
            }`}
          >
            Hybrid
            {!hybridAvailable && <span className="ml-1 text-[10px]">⚠</span>}
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-2 h-4">
        {queryTime !== null ? (
          <p className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
            <span className="font-semibold text-slate-700 dark:text-slate-300">{resultCount}</span>
            {' '}result{resultCount !== 1 ? 's' : ''} ·{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-300">{queryTime}</span> ms ·{' '}
            <span className={mode === 'hybrid' ? 'text-violet-600 dark:text-violet-400' : 'text-brand-600 dark:text-brand-400'}>
              {mode === 'hybrid' ? 'Hybrid' : 'Fuzzy'}
            </span>
          </p>
        ) : (
          <p className="text-[11px] text-slate-400 dark:text-slate-600">Type to search…</p>
        )}
      </div>
    </div>
  );
}
