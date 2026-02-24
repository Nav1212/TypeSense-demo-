import { FileFetcher } from '@/lib/fileFetcher';
import { TypeSenseService } from '@/lib/ingestion';

/**
 * Index one document at a time so the TypeSense Cloud instance never has to
 * generate more than one embedding simultaneously, avoiding OOM errors on
 * resource-constrained plans. A small delay between each document lets the
 * server breathe before the next embedding request.
 */
const BATCH_SIZE = 1;
const DELAY_MS = 120; // pause between batches (ms)

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export async function POST() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const fileFetcher = new FileFetcher();
        const tsService = new TypeSenseService();

        send({ stage: 'creating', message: 'Creating collection…', progress: 0 });
        await tsService.createCollection();

        // Give TypeSense a moment to finish initialising the embedding model
        // before we start sending documents.
        await sleep(1500);

        const docs = fileFetcher.fetchDocuments();
        const total = docs.length;
        let indexed = 0;
        let skipped = 0;

        send({ stage: 'indexing', message: `Starting — ${total} documents`, progress: 0, indexed: 0, total });

        for (let i = 0; i < docs.length; i += BATCH_SIZE) {
          const batch = docs.slice(i, i + BATCH_SIZE);

          try {
            await tsService.indexDocuments(batch);
            indexed += batch.length;
          } catch (batchErr) {
            const msg = String(batchErr);
            // OOM or 422 — skip this document and keep going
            if (msg.includes('OUT_OF_MEMORY') || msg.includes('422') || msg.includes('ObjectUnprocessable')) {
              console.warn(`Skipping doc ${batch.map(d => d.id).join(',')} due to: ${msg.slice(0, 120)}`);
              skipped += batch.length;
            } else {
              // Unexpected error — abort
              throw batchErr;
            }
          }

          const done = indexed + skipped;
          const suffix = skipped > 0 ? ` (${skipped} skipped)` : '';
          send({
            stage: 'indexing',
            message: `Indexed ${indexed} of ${total}${suffix}`,
            progress: done / total,
            indexed: done,
            total,
          });

          if (i + BATCH_SIZE < docs.length) {
            await sleep(DELAY_MS);
          }
        }

        const suffix = skipped > 0 ? ` — ${skipped} skipped (OOM)` : '';
        send({ stage: 'done', message: `Indexing complete${suffix}`, progress: 1, total });
      } catch (err) {
        send({ stage: 'error', message: String(err) });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
