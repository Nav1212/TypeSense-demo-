'use client';

import type { ReactNode } from 'react';

export interface Highlight {
  field: string;
  snippet?: string;
  value?: string;
  matched_tokens?: string[];
}

export interface DocDocument {
  id: string;
  source: string;
  title?: string;
  author?: string;
  genre?: string;
  description?: string;
  content?: string;
  created_at?: number;
}

export interface DocHit {
  document: DocDocument;
  highlights?: Highlight[];
  text_match?: number;
  text_match_info?: { score: string };
  vector_distance?: number;
  hybrid_search_info?: { rank_fusion_score?: number };
}

/** Format a Unix timestamp (seconds) as "Jan 15, 2024" */
function formatDate(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Parse TypeSense <mark>…</mark> HTML into styled React nodes. */
export function renderHighlight(raw: string, firstChunkId?: string): ReactNode[] {
  const parts = raw.split(/(<mark>.*?<\/mark>)/g);
  let isFirst = true;

  return parts.map((part, i) => {
    if (part.startsWith('<mark>')) {
      const text = part.replace(/<\/?mark>/g, '');
      const id = isFirst && firstChunkId ? firstChunkId : undefined;
      isFirst = false;
      return (
        <mark
          key={i}
          id={id}
          className="bg-brand-100 dark:bg-brand-500/25 text-brand-800 dark:text-brand-200 rounded px-0.5 not-italic font-medium"
        >
          {text}
        </mark>
      );
    }
    return part;
  });
}

/** Source badge colour mapping */
function sourceBadgeClass(source: string): string {
  if (source.includes('books')) return 'bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400';
  if (source.includes('quotes')) return 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400';
  if (source.includes('doctor')) return 'bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400';
  return 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
}

interface DocCardProps {
  hit: DocHit;
  rank: number;
  isMatched: boolean;
  isHovered: boolean;
}

export default function DocCard({ hit, rank, isMatched, isHovered }: DocCardProps) {
  const { document: doc, highlights, text_match_info, hybrid_search_info } = hit;

  const textScore = text_match_info?.score
    ? (parseInt(text_match_info.score, 10) / 2_147_483_647).toFixed(2)
    : null;
  const hybridScore = hybrid_search_info?.rank_fusion_score?.toFixed(2) ?? null;
  const displayScore = hybridScore ?? textScore;

  const titleHL = highlights?.find((h) => h.field === 'title');
  const authorHL = highlights?.find((h) => h.field === 'author');
  const bodyHL = highlights?.find((h) => ['description', 'content'].includes(h.field));

  const borderClass = isMatched
    ? 'border-l-[3px] border-brand-500'
    : 'border-l-[3px] border-transparent';

  const bgClass = isMatched
    ? 'bg-brand-50/60 dark:bg-brand-900/10'
    : 'bg-white dark:bg-slate-900';

  const ringStyle: React.CSSProperties = isHovered
    ? { boxShadow: '0 0 0 2px #3B82F6, 0 4px 16px rgba(59,130,246,0.18)' }
    : {};

  return (
    <div
      id={`doc-${doc.id}`}
      className={`rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mb-3 transition-all
        ${borderClass} ${bgClass}`}
      style={ringStyle}
    >
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Title */}
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-snug">
              {titleHL?.value
                ? renderHighlight(titleHL.value)
                : doc.title ?? doc.content?.slice(0, 80) ?? 'Untitled'}
            </h3>

            {/* Author · Genre */}
            {(doc.author || doc.genre) && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {authorHL?.value ? renderHighlight(authorHL.value) : doc.author}
                {doc.author && doc.genre && <span className="mx-1 opacity-40">·</span>}
                {doc.genre && <span className="italic">{doc.genre}</span>}
              </p>
            )}

            {/* Badges row */}
            <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
              <span className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-md ${sourceBadgeClass(doc.source)}`}>
                {doc.source}
              </span>
              {doc.created_at && (
                <span className="inline-block text-[10px] text-slate-400 dark:text-slate-500">
                  {formatDate(doc.created_at)}
                </span>
              )}
            </div>
          </div>

          {/* Rank + score badge */}
          {isMatched && (
            <div className="flex-shrink-0 flex flex-col items-end gap-1">
              <span className="text-[11px] bg-brand-500/10 text-brand-700 dark:text-brand-300 px-2 py-0.5 rounded-full font-mono whitespace-nowrap">
                #{rank}
                {displayScore && ` · ${displayScore}`}
              </span>
            </div>
          )}
        </div>

        {/* Body snippet */}
        {bodyHL?.snippet ? (
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-4">
            {renderHighlight(bodyHL.snippet, `chunk-${doc.id}`)}
          </p>
        ) : (doc.description ?? doc.content) ? (
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
            {doc.description ?? doc.content}
          </p>
        ) : null}
      </div>
    </div>
  );
}
