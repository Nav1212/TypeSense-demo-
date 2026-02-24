'use client';

export interface ChunkData {
  docId: string;
  title: string;
  source: string;
  snippet: string;
}

interface ChunkCardProps {
  chunk: ChunkData;
}

function stripMark(html: string): string {
  return html.replace(/<\/?mark>/g, '');
}

export default function ChunkCard({ chunk }: ChunkCardProps) {
  return (
    <div
      data-doc-id={chunk.docId}
      className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700
        bg-white dark:bg-slate-800/60 cursor-pointer select-none
        hover:border-brand-300 dark:hover:border-brand-600
        hover:bg-brand-50/60 dark:hover:bg-brand-900/10
        transition-all text-xs group"
    >
      <div className="font-medium text-slate-800 dark:text-slate-200 truncate leading-snug group-hover:text-brand-700 dark:group-hover:text-brand-300 transition-colors">
        {chunk.title.slice(0, 36)}{chunk.title.length > 36 && '…'}
      </div>
      <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mb-1">
        {chunk.source}
      </div>
      <div className="text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
        {stripMark(chunk.snippet)}
      </div>
    </div>
  );
}
