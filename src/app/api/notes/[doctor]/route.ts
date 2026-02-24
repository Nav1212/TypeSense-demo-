import { NextRequest, NextResponse } from 'next/server';
import { readdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

const NOTES_DIR = join(process.cwd(), 'data', 'doctor-notes');

const ALLOWED_DOCTORS = ['dr-emily-chen', 'dr-marcus-reed'] as const;
type AllowedDoctor = (typeof ALLOWED_DOCTORS)[number];

function isAllowedDoctor(d: string): d is AllowedDoctor {
  return ALLOWED_DOCTORS.includes(d as AllowedDoctor);
}

/**
 * GET /api/notes/:doctor
 * Returns all notes for a doctor as a JSON array.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { doctor: string } },
) {
  const { doctor } = params;

  if (!isAllowedDoctor(doctor)) {
    return NextResponse.json(
      {
        error: `Unknown doctor "${doctor}". Valid values: ${ALLOWED_DOCTORS.join(', ')}`,
        validDoctors: ALLOWED_DOCTORS,
      },
      { status: 404 },
    );
  }

  const dirPath = join(NOTES_DIR, doctor);

  if (!existsSync(dirPath)) {
    return NextResponse.json(
      { error: `Directory not found for doctor "${doctor}". Run the seed first.` },
      { status: 404 },
    );
  }

  const filenames = readdirSync(dirPath)
    .filter((f) => f.endsWith('.txt'))
    .sort();

  const files = filenames.map((name) => ({
    name,
    content: readFileSync(join(dirPath, name), 'utf-8'),
  }));

  return NextResponse.json({ doctor, files });
}
