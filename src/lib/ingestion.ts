import { typesenseClient, COLLECTION_NAME } from './typesense';
import type { Document } from './fileFetcher';

const COLLECTION_SCHEMA = {
  name: COLLECTION_NAME,
  fields: [
    { name: 'id', type: 'string' },
    { name: 'source', type: 'string', facet: true },
    { name: 'title', type: 'string', optional: true },
    { name: 'author', type: 'string', optional: true, facet: true },
    { name: 'genre', type: 'string', optional: true, facet: true },
    { name: 'description', type: 'string', optional: true },
    { name: 'content', type: 'string', optional: true },
    { name: 'created_at', type: 'int32' },
    {
      name: 'embedding',
      type: 'float[]',
      embed: {
        from: ['title', 'description', 'content', 'author', 'genre'],
        model_config: { model_name: 'ts/all-MiniLM-L12-v2' },
      },
    },
  ] as unknown as import('typesense/lib/Typesense/Collection').CollectionFieldSchema[],
  default_sorting_field: '',
} as const;

export interface SearchParams {
  q: string;
  mode: 'fuzzy' | 'hybrid';
}

const MIN_HYBRID_SCORE = 0.25;

export class TypeSenseService {
  async createCollection(): Promise<void> {
    try {
      await typesenseClient.collections(COLLECTION_NAME).delete();
      console.log('Dropped existing collection');
    } catch {
      // Collection did not exist — fine
    }

    await typesenseClient.collections().create(COLLECTION_SCHEMA as never);
    console.log('Collection created');
  }

  async indexDocuments(docs: Document[]): Promise<void> {
    const response = await typesenseClient
      .collections(COLLECTION_NAME)
      .documents()
      .import(docs as never[], { action: 'upsert' });

    const errors = (response as Array<{ success: boolean; error?: string }>).filter(
      (r) => !r.success,
    );
    if (errors.length > 0) {
      console.warn(`${errors.length} document(s) failed to index:`, errors.slice(0, 3));
    }
    console.log(`Indexed ${docs.length - errors.length}/${docs.length} documents`);
  }

  async search(params: SearchParams) {
    const base = {
      highlight_full_fields: 'title,author',
      highlight_affix_num_tokens: 20,
      per_page: 250,
    };

    if (params.mode === 'hybrid') {
      const results = await typesenseClient
        .collections(COLLECTION_NAME)
        .documents()
        .search({
          ...base,
          q: params.q,
          query_by: 'title,description,content,author,genre,embedding',
          vector_query: 'embedding:([], alpha:0.5)',
        } as never);

      // Filter out low-confidence hybrid results
      const hits = ((results as any).hits ?? []) as Array<{
        hybrid_search_info?: { rank_fusion_score?: number };
      }>;
      const filtered = hits.filter(
        (h) => (h.hybrid_search_info?.rank_fusion_score ?? 0) >= MIN_HYBRID_SCORE,
      );
      return { ...results, hits: filtered, found: filtered.length };
    }

    return typesenseClient
      .collections(COLLECTION_NAME)
      .documents()
      .search({
        ...base,
        q: params.q,
        query_by: 'title,description,content,author,genre',
        num_typos: 2,
      } as never);
  }

  async fetchAll() {
    return typesenseClient
      .collections(COLLECTION_NAME)
      .documents()
      .search({
        q: '*',
        query_by: 'title,content',
        sort_by: 'created_at:desc',
        per_page: 250,
      } as never);
  }

  async isHybridAvailable(): Promise<boolean> {
    try {
      await typesenseClient.collections(COLLECTION_NAME).retrieve();
      await typesenseClient
        .collections(COLLECTION_NAME)
        .documents()
        .search({
          q: '*',
          query_by: 'embedding',
          vector_query: 'embedding:([], alpha:0.5)',
          per_page: 1,
        } as never);
      return true;
    } catch {
      return false;
    }
  }
}
