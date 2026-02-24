/**
 * Standalone ingestion script.
 * Run: pnpm seed
 * Reads .env.local for TypeSense connection settings.
 */

import 'dotenv/config';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local (Next.js convention)
config({ path: resolve(process.cwd(), '.env.local') });

import { createContainer } from '../src/lib/container';

async function main() {
  console.log('🚀 TypeSense Demo — Data Seeder');
  console.log(`   Host: ${process.env.TYPESENSE_HOST ?? 'localhost'}:${process.env.TYPESENSE_PORT ?? '8108'}`);
  console.log('');

  const container = createContainer();

  try {
    await container.bootstrap();
    console.log('');
    console.log('✅ Data ingested successfully!');
    console.log('   Start the app with: pnpm dev');
  } catch (err) {
    console.error('');
    console.error('❌ Ingestion failed:', err);
    console.error('');
    console.error('Make sure TypeSense is running:');
    console.error(
      '  docker run -p 8108:8108 -v $(pwd)/.typesense-data:/data \\',
    );
    console.error(
      '    typesense/typesense:latest \\',
    );
    console.error(
      '    --data-dir /data --api-key=demo-key --enable-cors',
    );
    process.exit(1);
  }
}

main();
