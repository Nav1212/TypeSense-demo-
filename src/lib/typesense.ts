import Typesense from 'typesense';

const host = process.env.TYPESENSE_HOST!;
const port = parseInt(process.env.TYPESENSE_PORT ?? '443', 10);
const protocol = (process.env.TYPESENSE_PROTOCOL ?? 'https') as 'http' | 'https';
const apiKey = process.env.TYPESENSE_API_KEY!;

if (!host || !apiKey) {
  throw new Error('TYPESENSE_HOST and TYPESENSE_API_KEY environment variables are required');
}

export const typesenseClient = new Typesense.Client({
  nodes: [{ host, port, protocol }],
  apiKey,
  connectionTimeoutSeconds: 5,
  retryIntervalSeconds: 0.1,
  numRetries: 2,
});

export const COLLECTION_NAME = 'documents';
