# TypeSense Demo

A self-contained search demo: local CSV/TXT data indexed into TypeSense, with a polished
Next.js UI featuring fuzzy keyword search and hybrid (semantic + keyword) search.

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 20+ |
| pnpm | 9+ (`npm i -g pnpm`) |
| Docker | any recent version |

---

## 1 — Start TypeSense

```bash
docker run -p 8108:8108 \
  -v $(pwd)/.typesense-data:/data \
  typesense/typesense:latest \
  --data-dir /data \
  --api-key=demo-key \
  --enable-cors
```

TypeSense will be available at `http://localhost:8108`.
Default API key: **`demo-key`**.

> On first run TypeSense downloads the `ts/all-MiniLM-L12-v2` embedding model (~45 MB).
> Hybrid mode in the UI is automatically disabled until the model is ready.

---

## 2 — Install dependencies

```bash
pnpm install
```

---

## 3 — Start the app

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

On first visit the app automatically calls `POST /api/bootstrap` to create the TypeSense
collection and index the sample data files.
A `bootstrapped` flag is stored in `localStorage` so re-indexing only happens once per
browser session.

---

## 4 — Seed data manually

```bash
pnpm seed
```

This runs `scripts/seed.ts` via `tsx`, reads `.env.local` for connection settings, drops and
re-creates the collection, then bulk-imports all documents.

---

## 5 — Environment variables

Create / edit `.env.local` in the project root:

```env
TYPESENSE_HOST=localhost
TYPESENSE_PORT=8108
TYPESENSE_PROTOCOL=http
TYPESENSE_API_KEY=demo-key
```

---

## Data files

| File | Description |
|------|-------------|
| `data/books.csv` | 10 books — columns: `title, author, genre, description` |
| `data/quotes.txt` | 15 quotes, one per line |
| `data/doctor-notes/dr-emily-chen/*.txt` | Clinical notes by Dr Emily Chen |
| `data/doctor-notes/dr-marcus-reed/*.txt` | Clinical notes by Dr Marcus Reed |

---

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/bootstrap` | Drop + re-create collection, bulk-index all data files |
| `GET` | `/api/search?q=…&mode=fuzzy\|hybrid` | Proxy search to TypeSense |
| `GET` | `/api/health` | TypeSense connectivity + hybrid-availability check |
| `GET` | `/api/notes/:doctor` | All notes for a doctor (JSON array) |
| `GET` | `/api/notes/:doctor/:filename` | Single doctor note by filename |

### Doctor notes API examples

```bash
# All notes for Dr Emily Chen
curl http://localhost:3000/api/notes/dr-emily-chen

# Single note
curl http://localhost:3000/api/notes/dr-emily-chen/note-001.txt

# All notes for Dr Marcus Reed
curl http://localhost:3000/api/notes/dr-marcus-reed

# Single note
curl http://localhost:3000/api/notes/dr-marcus-reed/note-003.txt
```

---

## Search modes

### Fuzzy (keyword)
Multi-field BM25 search with up to 2 typos tolerated.
Fields searched: `title · description · content · author · genre`

### Hybrid (semantic + keyword)
Combines BM25 with vector similarity from the `ts/all-MiniLM-L12-v2` model.
Alpha `0.5` = equal weight between semantic and keyword scores.
Auto-disabled if the embedding model is not yet loaded.

---

## Swapping the embedding model

Edit the `model_name` in `src/lib/ingestion.ts`:

```typescript
model_config: { model_name: 'ts/all-MiniLM-L12-v2' }
```

Any TypeSense built-in model works (`ts/e5-small`, `ts/multilingual-e5-small`, …).
See the [TypeSense model docs](https://typesense.org/docs/guide/semantic-search.html) for the full list.

### Disabling hybrid search entirely

Remove the `embedding` field from `COLLECTION_SCHEMA` in `src/lib/ingestion.ts` and the
`Hybrid` button will be disabled automatically via the health check.

---

## Project structure

```
typesense-demo/
├── data/
│   ├── books.csv
│   ├── quotes.txt
│   └── doctor-notes/
│       ├── dr-emily-chen/
│       └── dr-marcus-reed/
├── src/
│   ├── lib/
│   │   ├── typesense.ts       TypeSense client singleton
│   │   ├── fileFetcher.ts     CSV/TXT → Document[]
│   │   ├── ingestion.ts       Collection schema + search
│   │   └── container.ts       DI wiring
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx           Main search page (client component)
│   │   └── api/
│   │       ├── bootstrap/     POST — ingest data
│   │       ├── search/        GET  — search proxy
│   │       ├── health/        GET  — connectivity check
│   │       └── notes/         GET  — doctor notes API
│   └── components/
│       ├── SearchBar.tsx
│       ├── DocCard.tsx
│       ├── DocList.tsx
│       ├── Pagination.tsx
│       ├── ChunkPanel.tsx
│       └── ChunkCard.tsx
├── scripts/
│   └── seed.ts
├── next.config.ts
├── tailwind.config.ts
└── package.json
```
