'use client';

import { useMemo } from 'react';
import DocCard, { type DocHit } from './DocCard';
import Pagination from './Pagination';

interface DocListProps {
  hits: DocHit[];
  isSearchMode: boolean;
  hoveredDocId: string | null;
  pageMode: 'documents' | 'lines';
  onPageModeChange: (mode: 'documents' | 'lines') => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  currentPage: number;
  onPageChange: (page: number) => void;
}

interface PageSlice {
  start: number;
  end: number;
}

function estimateLines(hit: DocHit): number {
  const text = hit.document.description ?? hit.document.content ?? '';
  return Math.max(1, Math.floor(text.length / 80)) + 2;
}

function buildPageSlices(
  hits: DocHit[],
  pageMode: 'documents' | 'lines',
  pageSize: number,
): PageSlice[] {
  if (hits.length === 0) return [{ start: 0, end: 0 }];

  if (pageMode === 'documents') {
    const slices: PageSlice[] = [];
    for (let i = 0; i < hits.length; i += pageSize) {
      slices.push({ start: i, end: Math.min(i + pageSize, hits.length) });
    }
    return slices;
  }

  // Lines mode
  const slices: PageSlice[] = [];
  let start = 0;
  let accumulated = 0;
  for (let i = 0; i < hits.length; i++) {
    const lines = estimateLines(hits[i]);
    if (i > start && accumulated + lines > pageSize) {
      slices.push({ start, end: i });
      start = i;
      accumulated = lines;
    } else {
      accumulated += lines;
    }
  }
  if (start < hits.length) slices.push({ start, end: hits.length });
  return slices;
}

export default function DocList({
  hits,
  isSearchMode,
  hoveredDocId,
  pageMode,
  onPageModeChange,
  pageSize,
  onPageSizeChange,
  currentPage,
  onPageChange,
}: DocListProps) {
  const pageSlices = useMemo(
    () => buildPageSlices(hits, pageMode, pageSize),
    [hits, pageMode, pageSize],
  );

  const totalPages = pageSlices.length;
  const safePage = Math.max(1, Math.min(currentPage, totalPages));
  const slice = pageSlices[safePage - 1] ?? { start: 0, end: 0 };
  const pageHits = hits.slice(slice.start, slice.end);

  if (hits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
          <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
        </div>
        <p className="text-slate-600 dark:text-slate-400 font-medium">
          {isSearchMode ? 'No results found' : 'No documents yet'}
        </p>
        <p className="text-slate-400 dark:text-slate-600 text-sm mt-1">
          {isSearchMode
            ? 'Try a different query or switch search modes'
            : 'Indexing in progress…'}
        </p>
      </div>
    );
  }

  const sectionTitle = isSearchMode
    ? `${hits.length} result${hits.length !== 1 ? 's' : ''}`
    : `All documents — ${hits.length} total`;

  const paginationBar = (
    <Pagination
      currentPage={safePage}
      totalPages={totalPages}
      onPageChange={onPageChange}
      pageMode={pageMode}
      onPageModeChange={onPageModeChange}
      pageSize={pageSize}
      onPageSizeChange={onPageSizeChange}
    />
  );

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {sectionTitle}
        </h2>
        {isSearchMode && (
          <span className="text-[11px] text-brand-600 dark:text-brand-400 font-medium bg-brand-50 dark:bg-brand-900/20 px-2 py-0.5 rounded-full">
            Search results
          </span>
        )}
      </div>

      {paginationBar}

      <div className="mt-4">
        {pageHits.map((hit, idx) => (
          <DocCard
            key={hit.document.id}
            hit={hit}
            rank={slice.start + idx + 1}
            isMatched={isSearchMode}
            isHovered={hoveredDocId === hit.document.id}
          />
        ))}
      </div>

      {totalPages > 1 && <div className="mt-2">{paginationBar}</div>}
    </div>
  );
}
