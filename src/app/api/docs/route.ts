import { NextResponse } from 'next/server';
import { TypeSenseService } from '@/lib/ingestion';

const tsService = new TypeSenseService();

export async function GET() {
  try {
    const results = await tsService.fetchAll();
    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json(
      { hits: [], found: 0, error: String(error) },
      { status: 500 },
    );
  }
}
