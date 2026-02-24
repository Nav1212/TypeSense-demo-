import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const NOTES_DIR = join(process.cwd(), 'data', 'doctor-notes');

const ALLOWED_DOCTORS = ['dr-emily-chen', 'dr-marcus-reed'] as const;
type AllowedDoctor = (typeof ALLOWED_DOCTORS)[number];

function isAllowedDoctor(d: string): d is AllowedDoctor {
  return ALLOWED_DOCTORS.includes(d as AllowedDoctor);
}

/**
 * GET /api/notes/:doctor/:filename
 * Returns a single doctor note by filename.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { doctor: string; filename: string } },
) {
  const { doctor, filename } = params;

  if (!isAllowedDoctor(doctor)) {
    return NextResponse.json(
      {
        error: `Unknown doctor "${doctor}". Valid values: ${ALLOWED_DOCTORS.join(', ')}`,
        validDoctors: ALLOWED_DOCTORS,
      },
      { status: 404 },
    );
  }

  // Sanitise filename — only allow simple alphanumeric + dash/dot names
  if (!/^[\w\-. ]+\.txt$/.test(filename)) {
    return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
  }

  const filePath = join(NOTES_DIR, doctor, filename);

  if (!existsSync(filePath)) {
    return NextResponse.json(
      { error: `Note "${filename}" not found for doctor "${doctor}"` },
      { status: 404 },
    );
  }

  const content = readFileSync(filePath, 'utf-8');
  return NextResponse.json({ doctor, name: filename, content });
}
