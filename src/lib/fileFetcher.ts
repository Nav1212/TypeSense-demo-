import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import Papa from 'papaparse';

export interface Document {
  id: string;
  source: string;
  title?: string;
  author?: string;
  genre?: string;
  description?: string;
  content?: string;
  created_at: number; // Unix timestamp (seconds)
}

interface BookRow {
  title: string;
  author: string;
  genre: string;
  description: string;
}

/** Returns a random Unix timestamp within the last two years. */
function randomCreatedAt(): number {
  const nowSec = Math.floor(Date.now() / 1000);
  const twoYearsAgo = nowSec - 2 * 365 * 24 * 3600;
  return twoYearsAgo + Math.floor(Math.random() * (nowSec - twoYearsAgo));
}

export class FileFetcher {
  private dataDir: string;

  constructor(dataDir: string = join(process.cwd(), 'data')) {
    this.dataDir = dataDir;
  }

  fetchDocuments(): Document[] {
    const docs: Document[] = [
      ...this.readCSV('books.csv'),
      ...this.readTXT('quotes.txt'),
      ...this.readDoctorNotes(),
    ];
    return docs;
  }

  private readCSV(filename: string): Document[] {
    const filePath = join(this.dataDir, filename);
    const content = readFileSync(filePath, 'utf-8');

    const result = Papa.parse<BookRow>(content, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      transform: (v) => v.trim(),
    });

    return result.data.map((row, index) => ({
      id: `csv-${index}`,
      source: filename,
      title: row.title || undefined,
      author: row.author || undefined,
      genre: row.genre || undefined,
      description: row.description || undefined,
      created_at: randomCreatedAt(),
    }));
  }

  private readDoctorNotes(): Document[] {
    const notesDir = join(this.dataDir, 'doctor-notes');
    const docs: Document[] = [];

    const doctors = readdirSync(notesDir);
    for (const doctorSlug of doctors) {
      const doctorName = doctorSlug
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

      const doctorDir = join(notesDir, doctorSlug);
      const files = readdirSync(doctorDir).filter((f) => f.endsWith('.txt'));

      for (const file of files) {
        const content = readFileSync(join(doctorDir, file), 'utf-8').trim();
        docs.push({
          id: `note-${doctorSlug}-${file.replace('.txt', '')}`,
          source: 'doctor-notes',
          title: `Clinical Note — ${doctorName}`,
          author: doctorName,
          content,
          created_at: randomCreatedAt(),
        });
      }
    }

    return docs;
  }

  private readTXT(filename: string): Document[] {
    const filePath = join(this.dataDir, filename);
    const content = readFileSync(filePath, 'utf-8');

    return content
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line, index) => ({
        id: `txt-${index}`,
        source: filename,
        content: line,
        created_at: randomCreatedAt(),
      }));
  }
}
