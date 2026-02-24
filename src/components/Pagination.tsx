'use client';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageMode: 'documents' | 'lines';
  onPageModeChange: (mode: 'documents' | 'lines') => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  pageMode,
  onPageModeChange,
  pageSize,
  onPageSizeChange,
}: PaginationProps) {
  const navBtn =
    'w-7 h-7 flex items-center justify-center rounded-md text-sm font-medium transition-colors ' +
    'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 ' +
    'disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent dark:disabled:hover:bg-transparent';

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 py-2.5 px-1
      text-xs text-slate-500 dark:text-slate-400
      border-b border-slate-200 dark:border-slate-700">

      {/* Navigation */}
      <div className="flex items-center gap-0.5">
        <button title="First page" onClick={() => onPageChange(1)} disabled={currentPage <= 1} className={navBtn}>
          «
        </button>
        <button title="Previous page" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage <= 1} className={navBtn}>
          ‹
        </button>
        <span className="px-2.5 tabular-nums font-semibold text-slate-700 dark:text-slate-300 text-xs">
          {currentPage} / {Math.max(totalPages, 1)}
        </span>
        <button title="Next page" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages} className={navBtn}>
          ›
        </button>
        <button title="Last page" onClick={() => onPageChange(totalPages)} disabled={currentPage >= totalPages} className={navBtn}>
          »
        </button>
      </div>

      {/* Page-by toggle */}
      <div className="flex items-center gap-1">
        <span className="text-slate-400 dark:text-slate-500 mr-0.5">Page by:</span>
        {(['documents', 'lines'] as const).map((m) => (
          <button
            key={m}
            onClick={() => onPageModeChange(m)}
            className={`px-2 py-0.5 rounded-md capitalize font-medium transition-colors ${
              pageMode === m
                ? 'bg-brand-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Page size */}
      <div className="flex items-center gap-1.5">
        <span className="text-slate-400 dark:text-slate-500">Per page:</span>
        <input
          type="number"
          min={1}
          value={pageSize}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            if (v > 0) onPageSizeChange(v);
          }}
          className="w-14 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-600
            bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs
            focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>
    </div>
  );
}
