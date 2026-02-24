import { NextResponse } from 'next/server';
import { typesenseClient } from '@/lib/typesense';
import { TypeSenseService } from '@/lib/ingestion';

const tsService = new TypeSenseService();

export async function GET() {
  try {
    await typesenseClient.health.retrieve();

    // Check if hybrid (vector search) is available after collection exists
    const hybridAvailable = await tsService.isHybridAvailable();

    return NextResponse.json({ healthy: true, hybridAvailable });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[health] TypeSense error:', msg);
    return NextResponse.json(
      { healthy: false, hybridAvailable: false, error: msg },
      { status: 503 },
    );
  }
}
