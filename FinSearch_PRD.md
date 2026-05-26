# FinSearch — Product Requirements Document

**Version:** 1.0  
**Stack:** Next.js · React · Lenis · Framer Motion · Firebase · FastAPI  
**Status:** In Development

---

## 1. Product Overview

FinSearch is a semantic search engine for financial reports and regulatory filings. Analysts query thousands of unstructured PDFs in natural language. Results surface relevant passages with citations, relevance scores, and source attribution — in under 200ms.

**Core pain:** Keyword search misses context. Manual scanning of annual reports / SEC filings wastes analyst hours.  
**Core solve:** Hybrid dense + sparse retrieval over a vector-indexed financial corpus.

---

## 2. Goals

| Goal | Metric |
|------|--------|
| Sub-200ms query latency | p95 ≤ 200ms end-to-end |
| High-recall retrieval | MRR@10 ≥ 0.75 on eval set |
| Zero GPU cost infra | CPU-only embedding inference |
| Auth + multi-user | Firebase Auth, per-user query history |
| Polished search UX | Lenis smooth scroll, Framer Motion transitions |

---

## 3. Non-Goals (v1)

- No document upload by end users (corpus managed by admin)
- No multi-language support
- No real-time streaming answers (v2)
- No LLM-generated summaries (v2)
- No mobile-native app

---

## 4. User Personas

### 4.1 Primary — Equity Analyst
- Searches 20–50 filings/day
- Needs: citation, exact passage, source doc name, page number
- Hates: irrelevant results, latency > 1s, losing search context on navigation

### 4.2 Secondary — Compliance Officer
- Needs: clause-level precision, audit trail of searches
- Hates: ambiguous matches without score transparency

---

## 5. User Stories

### Search
- `US-01` As an analyst, I can type a natural language query and receive ranked passages within 200ms.
- `US-02` As an analyst, I can see which document + page each result came from.
- `US-03` As an analyst, I can see a relevance score per result.
- `US-04` As an analyst, I receive real-time autocomplete suggestions as I type.
- `US-05` As an analyst, I can filter results by document type (10-K, 10-Q, annual report) and date range.
- `US-06` As an analyst, I can click a result and jump to the highlighted passage in the source PDF viewer.

### Auth + History
- `US-07` As a user, I can sign in via Google (Firebase Auth).
- `US-08` As a user, my last 50 queries are stored and accessible from the sidebar.
- `US-09` As a user, I can star/save a query+result set for later reference.

### Admin
- `US-10` As an admin, I can upload new PDFs that get ingested, chunked, embedded, and indexed automatically.
- `US-11` As an admin, I can see corpus stats: document count, chunk count, index health.

---

## 6. Functional Requirements

### 6.1 Search API (FastAPI)

#### `POST /api/v1/search`
```json
Request:
{
  "query": "string",
  "filters": {
    "doc_type": ["10-K", "10-Q", "annual_report"],
    "date_from": "YYYY-MM-DD",
    "date_to": "YYYY-MM-DD"
  },
  "top_k": 10
}

Response:
{
  "results": [
    {
      "chunk_id": "uuid",
      "text": "string",
      "score": 0.92,
      "doc_name": "Apple_10K_2023.pdf",
      "doc_type": "10-K",
      "page": 34,
      "company": "Apple Inc.",
      "date": "2023-10-27"
    }
  ],
  "latency_ms": 147,
  "query_id": "uuid"
}
```

#### `GET /api/v1/autocomplete?q={partial}`
Returns top 5 query suggestions. Latency ≤ 50ms. Uses trigram index on past queries + common financial terms.

#### `POST /api/v1/ingest` _(admin only)_
Accepts PDF file upload. Triggers chunking → embedding → upsert pipeline. Returns job_id.

#### `GET /api/v1/ingest/status/{job_id}`
Polling endpoint. Returns `{ status, chunks_processed, chunks_total }`.

---

### 6.2 Document Ingestion Pipeline

```
PDF Upload
  → pdfplumber extraction (text + page numbers)
  → Chunking (512 tokens, 64 overlap, sentence-aware)
  → Embedding (sentence-transformers/all-MiniLM-L6-v2, CPU)
  → Vector upsert (Qdrant or Weaviate)
  → BM25 index update (Elasticsearch or BM25Okapi)
  → Firestore metadata write (doc_name, type, company, date, chunk_count)
```

**Chunk size rationale:** 512 tokens balances context window with retrieval precision. 64-token overlap prevents boundary splits from losing context.

---

### 6.3 Hybrid Search Engine

```
Query
  → Encode with same sentence-transformer (CPU)
  → Dense search: cosine similarity over vector DB (top-50)
  → Sparse search: BM25 score over same corpus (top-50)
  → Reciprocal Rank Fusion (alpha=0.6 dense, 0.4 sparse)
  → Re-rank top-10 by combined score
  → Return
```

**Alpha tuning:** alpha=0.6 prioritizes semantic relevance; adjustable per query type in v2.

---

### 6.4 Frontend (Next.js + React)

#### Pages / Routes
| Route | Description |
|-------|-------------|
| `/` | Landing — hero, product pitch, CTA |
| `/search` | Main search interface |
| `/search?q={query}` | Search results page (shareable URL) |
| `/document/{doc_id}` | PDF viewer with passage highlight |
| `/history` | Saved queries + starred results |
| `/admin` | Document upload + corpus stats (admin role) |
| `/login` | Firebase Google Auth |

#### Core Components

**`<SearchBar />`**
- Autofocus on mount
- Debounced autocomplete (200ms)
- Keyboard nav through suggestions (↑ ↓ Enter)
- Framer Motion: suggestions dropdown animates in with `ease-out`, 150ms, `scale(0.97) → scale(1)` + `opacity: 0 → 1`
- Lenis: smooth scroll to results on submit

**`<ResultCard />`**
- Displays: passage text with query term highlight, doc name, page number, relevance score badge, company + date
- Framer Motion: stagger reveal on results mount (`staggerChildren: 0.05s`)
- Hover: `translateY(-2px)` + shadow intensify, 120ms ease-out
- Click: `layoutId` shared element transition into PDF viewer

**`<PDFViewer />`**
- Renders source PDF via `react-pdf`
- Jumps to and highlights the matched passage
- Framer Motion: slide-in from right (drawer pattern), `ease-drawer: cubic-bezier(0.32, 0.72, 0, 1)`, 280ms

**`<FilterPanel />`**
- Collapsible sidebar
- Filters: doc_type (multi-select chips), date range (dual slider)
- Framer Motion: `AnimatePresence` on mount/unmount, height animate via `layout` prop

**`<QueryHistorySidebar />`**
- Left-drawer, persisted from Firestore
- Starred queries pinned to top
- Framer Motion: slide from left, `ease-drawer`, 240ms

---

## 7. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Latency** | p95 search ≤ 200ms; autocomplete ≤ 50ms |
| **Throughput** | 100 concurrent queries without degradation |
| **Embedding** | CPU-only, no GPU dependency |
| **Availability** | 99.5% uptime (Firebase + Railway/Render for FastAPI) |
| **Auth** | Firebase Auth, JWT validated on every FastAPI route |
| **Data retention** | Query history stored 90 days in Firestore |
| **PDF storage** | Firebase Storage for raw PDFs |
| **Scroll perf** | Lenis smooth scroll at 60fps; no layout thrash |
| **Animation perf** | Framer Motion animate only `transform` + `opacity`; never `height`/`width` directly |
| **Reduced motion** | All animations respect `prefers-reduced-motion` |

---

## 8. Data Models

### Firestore Collections

#### `users/{uid}`
```json
{
  "email": "string",
  "role": "analyst | admin",
  "created_at": "timestamp",
  "query_count": 0
}
```

#### `users/{uid}/queries/{query_id}`
```json
{
  "text": "string",
  "filters": {},
  "result_count": 10,
  "top_result_doc": "Apple_10K_2023.pdf",
  "starred": false,
  "created_at": "timestamp"
}
```

#### `documents/{doc_id}`
```json
{
  "name": "string",
  "type": "10-K | 10-Q | annual_report | other",
  "company": "string",
  "date": "YYYY-MM-DD",
  "chunk_count": 0,
  "storage_path": "gs://finsearch-bucket/...",
  "ingested_at": "timestamp",
  "status": "pending | processing | indexed | error"
}
```

### Vector DB Schema (per chunk)
```json
{
  "id": "uuid",
  "vector": [384-dim float array],
  "payload": {
    "doc_id": "string",
    "doc_name": "string",
    "doc_type": "string",
    "company": "string",
    "date": "string",
    "page": 34,
    "text": "string"
  }
}
```

---

## 9. UI/UX Design Directives

### Aesthetic
- Background: `#F5F3EE` (warm off-white matching reference design)
- Cards: white `#FFFFFF`, `border: 1px solid rgba(0,0,0,0.08)`
- Accent: single — Deep Sage Green (`#3D6B4F`) for scores, CTAs, highlights
- No AI purple. No neon gradients.
- Font: `Geist` (UI) + `Geist Mono` (scores, latency, IDs)
- Tracking: `tracking-tight` for headers; `leading-relaxed` for passage text

### Layout
- Search results: asymmetric — 65% result list / 35% filter + document preview
- No centered hero bias — left-aligned content on landing
- `max-w-[1400px] mx-auto` container

### Animation Budget
| Element | Duration | Easing |
|---------|----------|--------|
| Result card stagger | 50ms per card | `cubic-bezier(0.23, 1, 0.32, 1)` |
| Autocomplete dropdown | 150ms | `ease-out` |
| PDF viewer drawer | 280ms | `cubic-bezier(0.32, 0.72, 0, 1)` |
| Filter panel | 200ms | `ease-out` |
| Page transitions | 240ms | `ease-in-out` |
| Score badge pulse | infinite, 2s | `ease-in-out` |

**Never animate on keyboard actions** (e.g., ↑↓ autocomplete nav — instant).  
All Framer Motion perpetual animations isolated in leaf Client Components.

### States Required
- Loading: skeleton shimmer matching result card layout
- Empty: "No results for this query" with suggested reformulations
- Error: inline FastAPI error message with retry CTA
- Indexing: progress bar in admin panel during ingestion

---

## 10. Technical Architecture

```
┌─────────────────────────────────────────────┐
│              Next.js Frontend               │
│  Lenis scroll · Framer Motion · React       │
│  Firebase Auth SDK · Firestore SDK          │
└──────────────────┬──────────────────────────┘
                   │ REST / JSON
┌──────────────────▼──────────────────────────┐
│              FastAPI Backend                │
│  /search · /autocomplete · /ingest          │
│  Firebase Admin SDK (token verify)          │
└────────┬─────────────────────┬──────────────┘
         │                     │
┌────────▼───────┐   ┌─────────▼──────────────┐
│   Vector DB    │   │   Firebase Services     │
│   (Qdrant)     │   │  Auth · Firestore       │
│  Dense search  │   │  Storage (PDFs)         │
└────────────────┘   └────────────────────────┘
         │
┌────────▼───────┐
│  BM25 Index    │
│ (in-memory /   │
│  Elasticsearch)│
└────────────────┘
```

---

## 11. Success Metrics (v1 Launch)

| Metric | Target |
|--------|--------|
| Search p95 latency | ≤ 200ms |
| MRR@10 on 100-query eval set | ≥ 0.75 |
| Corpus size supported | ≥ 1,000 PDFs |
| Auth + query history working | 100% |
| Zero GPU infra cost | ✓ CPU-only |
| Lighthouse performance score | ≥ 85 |

---

## 12. Out of Scope (Deferred to v2)

- LLM-powered answer synthesis (RAG layer over results)
- Streaming SSE responses
- User-uploaded document support
- Multi-language query support
- Mobile native (React Native)
- Alerting: watch a query, get notified when new filings match
