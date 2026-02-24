'use client';

import { useMemo } from 'react';
import DocCard, { type DocHit } from './DocCard';

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
  queryTime: number | null;
  mode: 'fuzzy' | 'hybrid';
  resultCount: number;
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
  queryTime,
  mode,
  resultCount,
}: DocListProps) {
  const pageSlices = useMemo(
    () => buildPageSlices(hits, pageMode, pageSize),
    [hits, pageMode, pageSize],
  );

  const totalPages = pageSlices.length;
  const safePage = Math.max(1, Math.min(currentPage, totalPages));
  const slice = pageSlices[safePage - 1] ?? { start: 0, end: 0 };
  const pageHits = hits.slice(slice.start, slice.end);

  // ── Empty state ──
  if (hits.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <svg width="28" height="28" fill="none" stroke="#94a3b8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
        </div>
        <p style={{ color: '#64748b', fontWeight: 500, margin: 0, fontSize: 14 }}>
          {isSearchMode ? 'No results found' : 'No documents yet'}
        </p>
        <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>
          {isSearchMode
            ? 'Try a different query or switch search modes'
            : 'Indexing in progress…'}
        </p>
      </div>
    );
  }

  // ── Page nav buttons ──
  const navBtnStyle = (disabled: boolean): React.CSSProperties => ({
    background: 'none',
    border: 'none',
    padding: '4px 2px',
    borderRadius: 4,
    cursor: disabled ? 'default' : 'pointer',
    color: '#94a3b8',
    fontSize: 13,
    display: 'inline-flex',
    alignItems: 'center',
    opacity: disabled ? 0.35 : 1,
    lineHeight: 1,
  });

  return (
    <div>

      {/* ── pcn-meta bar ── */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        fontSize: 14,
        gap: 8,
      }}>
        {/* Left: count · time · mode */}
        <div style={{ fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'baseline' }}>
          <span>{resultCount} result{resultCount !== 1 ? 's' : ''}</span>
          {queryTime !== null && (
            <span style={{ color: '#94a3b8', fontWeight: 400, marginLeft: 8, whiteSpace: 'nowrap' }}>
              · {queryTime} ms · {mode === 'hybrid' ? 'Hybrid' : 'Fuzzy'}
            </span>
          )}
        </div>

        {/* Right: controls */}
        <div style={{
          display: 'inline-flex',
          flexWrap: 'nowrap',
          alignItems: 'center',
          gap: 6,
          fontSize: 13,
          color: '#64748b',
          whiteSpace: 'nowrap',
        }}>
          {isSearchMode && (
            <a href="#" onClick={(e) => e.preventDefault()}
              style={{ color: '#2563eb', fontWeight: 500, textDecoration: 'none', marginRight: 2 }}>
              Search results
            </a>
          )}

          {/* Prev / page / next */}
          <button
            onClick={() => onPageChange(safePage - 1)}
            disabled={safePage <= 1}
            style={navBtnStyle(safePage <= 1)}
          >
            ‹
          </button>
          <span style={{ fontSize: 13 }}>{safePage} / {Math.max(totalPages, 1)}</span>
          <button
            onClick={() => onPageChange(safePage + 1)}
            disabled={safePage >= totalPages}
            style={navBtnStyle(safePage >= totalPages)}
          >
            ›
          </button>

          {/* Page-by toggle */}
          <span style={{ marginLeft: 8 }}>Page by:</span>
          {(['documents', 'lines'] as const).map((m) => (
            <span
              key={m}
              onClick={() => onPageModeChange(m)}
              style={{
                padding: '2px 8px',
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                background: pageMode === m ? '#2563eb' : 'transparent',
                color: pageMode === m ? '#fff' : '#64748b',
                display: 'inline-block',
              }}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </span>
          ))}

          {/* Per page */}
          <span style={{ marginLeft: 8 }}>Per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              if (v > 0) onPageSizeChange(v);
            }}
            style={{
              border: '1px solid #e2e8f0',
              borderRadius: 4,
              padding: '2px 8px',
              fontSize: 12,
              background: '#fff',
              outline: 'none',
              color: '#1e293b',
              fontFamily: 'inherit',
            }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* ── Result cards ── */}
      <div>
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

      {/* ── Bottom pagination (only when multiple pages) ── */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 16, fontSize: 13, color: '#64748b' }}>
          <button
            onClick={() => onPageChange(safePage - 1)}
            disabled={safePage <= 1}
            style={navBtnStyle(safePage <= 1)}
          >
            ‹ Prev
          </button>
          <span>{safePage} / {totalPages}</span>
          <button
            onClick={() => onPageChange(safePage + 1)}
            disabled={safePage >= totalPages}
            style={navBtnStyle(safePage >= totalPages)}
          >
            Next ›
          </button>
        </div>
      )}
    </div>
  );
}
