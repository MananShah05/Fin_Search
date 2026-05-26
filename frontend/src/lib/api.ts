const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export interface SearchFilters {
  doc_type?: string[];
  date_from?: string;
  date_to?: string;
}

export interface SearchResult {
  chunk_id: string;
  text: string;
  score: number;
  doc_name: string;
  doc_type: string;
  page: number;
  company: string;
  date: string;
}

export interface SearchResponse {
  results: SearchResult[];
  latency_ms: number;
  query_id: string;
}

export interface AutocompleteResponse {
  suggestions: string[];
}

export interface Document {
  id: string;
  name: string;
  type: string;
  company: string;
  date: string;
  chunk_count: number;
  status: string;
  ingested_at: string | null;
}

export interface DocumentListResponse {
  documents: Document[];
  total: number;
}

export interface CorpusStats {
  document_count: number;
  chunk_count: number;
  index_health: string;
}

export interface QueryHistoryItem {
  id: string;
  text: string;
  result_count: number;
  top_result_doc: string;
  starred: boolean;
  created_at: string;
}

export interface QueryHistoryResponse {
  queries: QueryHistoryItem[];
}

export interface IngestResponse {
  job_id: string;
  status: string;
  message: string;
}

export interface IngestStatusResponse {
  job_id: string;
  status: string;
  chunks_processed: number;
  chunks_total: number;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  try {
    const { getFirebaseAuth } = await import("./firebase");
    const auth = getFirebaseAuth();
    const token = await auth.currentUser?.getIdToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  } catch {
    // Not authenticated
  }
  return headers;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || `Request failed: ${res.status}`);
  }

  return res.json();
}

export async function searchQuery(
  query: string,
  filters?: SearchFilters,
  top_k: number = 10
): Promise<SearchResponse> {
  return request<SearchResponse>("/search", {
    method: "POST",
    body: JSON.stringify({ query, filters, top_k }),
  });
}

export async function getAutocomplete(
  q: string,
  limit: number = 5
): Promise<AutocompleteResponse> {
  const params = new URLSearchParams({ q, limit: String(limit) });
  return request<AutocompleteResponse>(`/autocomplete?${params}`);
}

export async function getDocuments(): Promise<DocumentListResponse> {
  return request<DocumentListResponse>("/documents");
}

export async function getCorpusStats(): Promise<CorpusStats> {
  return request<CorpusStats>("/documents/stats");
}

export async function getQueryHistory(): Promise<QueryHistoryResponse> {
  return request<QueryHistoryResponse>("/queries");
}

export async function toggleStar(queryId: string, starred: boolean): Promise<void> {
  await request(`/queries/${queryId}/star`, {
    method: "PATCH",
    body: JSON.stringify({ starred }),
  });
}

export async function uploadDocument(
  file: File,
  docType: string,
  company: string,
  date: string
): Promise<IngestResponse> {
  const headers = await getAuthHeaders();
  const formData = new FormData();
  formData.append("file", file);
  formData.append("doc_type", docType);
  formData.append("company", company);
  formData.append("date", date);

  const res = await fetch(`${API_BASE}/ingest`, {
    method: "POST",
    headers: { Authorization: headers["Authorization"] || "" },
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || "Upload failed");
  }

  return res.json();
}

export async function getIngestStatus(jobId: string): Promise<IngestStatusResponse> {
  return request<IngestStatusResponse>(`/ingest/status/${jobId}`);
}

export async function checkAuth(): Promise<{ uid: string; email: string; role: string } | null> {
  try {
    return await request("/auth/me");
  } catch {
    return null;
  }
}