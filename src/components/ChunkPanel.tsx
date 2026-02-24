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
      // Expand the card first, then scroll after it has re-rendered
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

  if (chunks.length === 0) return null;

  return (
    <div className="mt-5">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
        <h3 className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">
          Matched Fragments
        </h3>
        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
      </div>
      <div ref={containerRef} className="space-y-1.5">
        {chunks.map((chunk, i) => (
          <ChunkCard key={`${chunk.docId}-${i}`} chunk={chunk} />
        ))}
      </div>
    </div>
  );
}
