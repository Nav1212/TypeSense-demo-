'use client';

import { renderHighlight } from './DocCard';

export interface ChunkData {
  docId: string;
  title: string;
  source: string;
  snippet: string;
}

export default function ChunkCard({ chunk }: { chunk: ChunkData }) {
  return (
    <div
      data-doc-id={chunk.docId}
      style={{
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 4,
        padding: 12,
        boxShadow: '0 1px 2px rgba(0,0,0,.04)',
        marginBottom: 12,
        position: 'relative',
        cursor: 'pointer',
        transition: 'border-color .15s, background .15s',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = '#93c5fd';
        (e.currentTarget as HTMLDivElement).style.background = '#eff6ff';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = '#e2e8f0';
        (e.currentTarget as HTMLDivElement).style.background = '#fff';
      }}
    >
      {/* Connecting horizontal line from timeline rail */}
      <div style={{
        position: 'absolute',
        left: -16,
        top: 16,
        width: 12,
        height: 1,
        background: '#e2e8f0',
      }} />

      <div style={{
        fontSize: 12,
        fontWeight: 700,
        color: '#1e293b',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {chunk.title.slice(0, 40)}{chunk.title.length > 40 && '…'}
      </div>
      <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 6 }}>
        {chunk.source}
      </div>
      <div style={{
        fontSize: 11,
        color: '#475569',
        lineHeight: 1.4,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {renderHighlight(chunk.snippet)}
      </div>
    </div>
  );
}
