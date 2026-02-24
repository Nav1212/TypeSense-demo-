import { NextRequest, NextResponse } from 'next/server';
import { TypeSenseService } from '@/lib/ingestion';

// Module-level singleton — reused across requests in the same serverless instance
const tsService = new TypeSenseService();

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get('q') ?? '';
  const rawMode = searchParams.get('mode') ?? 'fuzzy';
  const mode = rawMode === 'hybrid' ? 'hybrid' : 'fuzzy';

  if (!q.trim()) {
    return NextResponse.json({ hits: [], found: 0, search_time_ms: 0 });
  }

  try {
    const results = await tsService.search({ q, mode });
    return NextResponse.json(results);
  } catch (hybridError) {
    if (mode === 'hybrid') {
      // Fall back to fuzzy search gracefully
      try {
        const fallbackResults = await tsService.search({ q, mode: 'fuzzy' });
        return NextResponse.json({
          ...fallbackResults,
          _fallback: true,
          _fallbackReason: String(hybridError),
        });
      } catch (fallbackError) {
        return NextResponse.json(
          { hits: [], found: 0, search_time_ms: 0, error: String(fallbackError) },
          { status: 500 },
        );
      }
    }
    return NextResponse.json(
      { hits: [], found: 0, search_time_ms: 0, error: String(hybridError) },
      { status: 500 },
    );
  }
}
