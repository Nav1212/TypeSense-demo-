'use client';

import { useEffect, useRef } from 'react';
import ChunkCard, { type ChunkData } from './ChunkCard';
import type { DocHit } from './DocCard';

interface ChunkPanelProps {
  hits: DocHit[];
  onHoverDoc: (docId: string | null) => void;
}

function extractChunks(hits: DocHit[]): ChunkData[] {
  const chunks: ChunkData[] = [];

  for (const hit of hits.slice(0, 15)) {
    const doc = hit.document;
    const bodyHighlights = (hit.highlights ?? []).filter((h) =>
      ['description', 'content', 'title'].includes(h.field),
    );

    for (const hl of bodyHighlights.slice(0, 2)) {
      const snippet = hl.snippet ?? hl.value ?? '';
      if (!snippet) continue;
      chunks.push({
        docId: doc.id,
        title: doc.title ?? doc.content?.slice(0, 40) ?? 'Untitled',
        source: doc.source,
        snippet,
      });
      if (chunks.length >= 20) return chunks;
    }
  }

  return chunks;
}

export default function ChunkPanel({ hits, onHoverDoc }: ChunkPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chunks = extractChunks(hits);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const getDocId = (target: EventTarget | null): string | null => {
      const el = (target as Element | null)?.closest('[data-doc-id]');
      return el?.getAttribute('data-doc-id') ?? null;
    };

    const handleMouseOver = (e: MouseEvent) => {
      const docId = getDocId(e.target);
      if (docId) onHoverDoc(docId);
    };
    const handleMouseOut = (e: MouseEvent) => {
      const docId = getDocId(e.target);
      if (docId) onHoverDoc(null);
    };
    const handleClick = (e: MouseEvent) => {
      const docId = getDocId(e.target);
      if (!docId) return;
      document.dispatchEvent(new CustomEvent('expand-doc', { detail: { docId } }));
      setTimeout(() => {
        document.getElementById(`doc-${docId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    };

    container.addEventListener('mouseover', handleMouseOver);
    container.addEventListener('mouseout', handleMouseOut);
    container.addEventListener('click', handleClick);
    return () => {
      container.removeEventListener('mouseover', handleMouseOver);
      container.removeEventListener('mouseout', handleMouseOut);
      container.removeEventListener('click', handleClick);
    };
  }, [chunks, onHoverDoc]);

  return (
    <div>
      {/* "MATCHED FRAGMENTS" title */}
      <div style={{
        fontSize: 11,
        fontWeight: 700,
        color: '#94a3b8',
        letterSpacing: '0.05em',
        textAlign: 'center',
        marginBottom: 16,
        textTransform: 'uppercase',
      }}>
        Matched Fragments
      </div>

      {chunks.length === 0 ? (
        <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>
          Type to see matched fragments
        </div>
      ) : (
        /* Timeline list with vertical rail */
        <div ref={containerRef} style={{ position: 'relative', paddingLeft: 16 }}>
          {/* Vertical timeline rail */}
          <div style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 1,
            background: '#e2e8f0',
          }} />
          {chunks.map((chunk, i) => (
            <ChunkCard key={`${chunk.docId}-${i}`} chunk={chunk} />
          ))}
        </div>
      )}
    </div>
  );
}
