'use client';

import { useState, useEffect } from 'react';
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

/** Highlight matched tokens inside plain text by splitting on word boundaries. */
function highlightTokens(text: string, tokens: string[]): ReactNode[] {
  if (!tokens.length) return [text];
  const escaped = tokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <span
        key={i}
        style={{
          color: '#1d4ed8',
          fontWeight: 700,
          background: 'rgba(191,219,254,.35)',
          padding: '0 2px',
          borderRadius: 2,
        }}
      >
        {part}
      </span>
    ) : (
      part
    ),
  );
}

/** Parse TypeSense <mark>…</mark> HTML into styled React nodes (pcn-hl style). */
export function renderHighlight(raw: string): ReactNode[] {
  const parts = raw.split(/(<mark>.*?<\/mark>)/g);
  return parts.map((part, i) => {
    if (part.startsWith('<mark>')) {
      const text = part.replace(/<\/?mark>/g, '');
      return (
        <span
          key={i}
          style={{
            color: '#1d4ed8',
            fontWeight: 700,
            background: 'rgba(191,219,254,.35)',
            padding: '0 2px',
            borderRadius: 2,
          }}
        >
          {text}
        </span>
      );
    }
    return part;
  });
}

interface DocCardProps {
  hit: DocHit;
  rank: number;
  isMatched: boolean;
  isHovered: boolean;
}

export default function DocCard({ hit, rank, isMatched, isHovered }: DocCardProps) {
  const { document: doc, highlights, text_match_info, hybrid_search_info } = hit;
  const [expanded, setExpanded] = useState(false);

  // Auto-expand when a ChunkPanel click targets this doc
  useEffect(() => {
    const handler = (e: Event) => {
      if ((e as CustomEvent<{ docId: string }>).detail.docId === doc.id) setExpanded(true);
    };
    document.addEventListener('expand-doc', handler);
    return () => document.removeEventListener('expand-doc', handler);
  }, [doc.id]);

  const dateLabel = doc.created_at ? formatDate(doc.created_at) : null;

  const titleHL = highlights?.find((h) => h.field === 'title');
  const authorHL = highlights?.find((h) => h.field === 'author');
  const bodyTokens = highlights
    ?.filter((h) => ['description', 'content'].includes(h.field))
    .flatMap((h) => h.matched_tokens ?? []) ?? [];

  const cardStyle: React.CSSProperties = {
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    padding: '16px 18px',
    background: '#fff',
    marginBottom: 12,
    transition: 'box-shadow .15s',
    boxShadow: isHovered
      ? '0 4px 12px rgba(59,130,246,0.15), 0 0 0 2px #3B82F6'
      : '0 1px 3px rgba(0,0,0,0.04)',
  };

  return (
    <div id={`doc-${doc.id}`} style={cardStyle}>

      {/* ── Top row ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Title */}
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>
            {titleHL?.value
              ? renderHighlight(titleHL.value)
              : (doc.title ?? doc.content?.slice(0, 80) ?? 'Untitled')}
          </h3>

          {/* Author · Genre subtitle */}
          {(doc.author || doc.genre) && (
            <div style={{ fontSize: 14, color: '#64748b', marginTop: 2 }}>
              {authorHL?.value ? renderHighlight(authorHL.value) : doc.author}
              {doc.author && doc.genre && <span style={{ margin: '0 4px' }}>·</span>}
              {doc.genre && <em>{doc.genre}</em>}
            </div>
          )}

          {/* Meta row: source badge + date */}
          <div style={{ display: 'flex', flexWrap: 'nowrap', alignItems: 'center', gap: 12, marginTop: 6 }}>
            <span style={{
              fontSize: 11,
              fontWeight: 500,
              color: '#059669',
              background: '#ecfdf5',
              padding: '2px 8px',
              borderRadius: 9999,
              whiteSpace: 'nowrap',
            }}>
              {doc.source}
            </span>
            {doc.created_at && (
              <span style={{ fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                {formatDate(doc.created_at)}
              </span>
            )}
          </div>
        </div>

        {/* Rank + score tag */}
        {isMatched && (
          <div style={{
            fontSize: 11,
            fontWeight: 600,
            color: '#2563eb',
            background: '#eff6ff',
            padding: '4px 10px',
            borderRadius: 4,
            border: '1px solid #dbeafe',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            alignSelf: 'flex-start',
            fontFamily: 'ui-monospace, monospace',
          }}>
            #{rank}{dateLabel ? ` · ${dateLabel}` : ''}
          </div>
        )}
      </div>

      {/* ── Body text ── */}
      {(() => {
        const fullText = doc.description ?? doc.content;

        if (expanded && fullText) {
          return (
            <div style={{ marginTop: 12 }}>
              <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.625, whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'inherit' }}>
                {fullText}
              </p>
              <button
                onClick={() => setExpanded(false)}
                style={{ marginTop: 8, fontSize: 11, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}
              >
                Show less
              </button>
            </div>
          );
        }

        if (fullText) {
          return (
            <p
              style={{
                fontSize: 14,
                color: '#334155',
                lineHeight: 1.625,
                marginTop: 12,
                margin: '12px 0 0',
                cursor: 'pointer',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                fontFamily: 'inherit',
              }}
              onClick={() => setExpanded(true)}
            >
              {highlightTokens(fullText, bodyTokens)}
            </p>
          );
        }

        return null;
      })()}
    </div>
  );
}
