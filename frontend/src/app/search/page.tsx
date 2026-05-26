"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import SearchBar from "@/components/SearchBar";
import ResultCard from "@/components/ResultCard";
import FilterPanel from "@/components/FilterPanel";
import PDFViewer from "@/components/PDFViewer";
import QueryHistorySidebar from "@/components/QueryHistorySidebar";
import { SearchResultsSkeleton } from "@/components/SkeletonLoader";
import { searchQuery, type SearchResult, type SearchFilters } from "@/lib/api";
import { formatLatency } from "@/lib/utils";

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [latency, setLatency] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(!!initialQuery);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [filterOpen, setFilterOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);

  const performSearch = useCallback(
    async (q: string, f?: SearchFilters) => {
      if (!q.trim()) return;
      setQuery(q);
      setLoading(true);
      setError(null);

      try {
        const res = await searchQuery(q, f || filters);
        setResults(res.results);
        setLatency(res.latency_ms);
        setHasSearched(true);

        if (q !== searchParams.get("q")) {
          router.replace(`/search?q=${encodeURIComponent(q)}`, {
            scroll: false,
          });
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Search failed. Please try again."
        );
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [filters, router, searchParams]
  );

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (q: string) => {
    performSearch(q);
  };

  const handleFilterChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
    if (query) {
      performSearch(query, newFilters);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    setSelectedResult(result);
    setPdfViewerOpen(true);
  };

  const handleHistorySelect = (q: string) => {
    setQuery(q);
    setSidebarOpen(false);
    performSearch(q);
  };

  return (
    <div className="max-w-container mx-auto px-6 py-8">
      <div className="flex items-start gap-4 mb-6">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400"
          aria-label="Open history"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </button>

        <div className="flex-1">
          <SearchBar onSearch={handleSearch} initialQuery={query} autoFocus />
        </div>
      </div>

      <div className="flex gap-8">
        <div className="flex-1 min-w-0">
          {hasSearched && !loading && !error && (
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-gray-400">
                {results.length} result{results.length !== 1 ? "s" : ""}
                {latency !== null && ` · ${formatLatency(latency)}`}
              </p>
              <FilterPanel
                filters={filters}
                onChange={handleFilterChange}
                isOpen={filterOpen}
                onToggle={() => setFilterOpen(!filterOpen)}
              />
            </div>
          )}

          {loading && <SearchResultsSkeleton count={5} />}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 rounded-xl p-6 text-center"
            >
              <p className="text-sm text-red-600 mb-3">{error}</p>
              <button
                onClick={() => performSearch(query)}
                className="text-sm text-accent hover:underline"
              >
                Retry
              </button>
            </motion.div>
          )}

          {!loading && !error && hasSearched && results.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <p className="text-gray-500 mb-2">
                No results for this query
              </p>
              <p className="text-sm text-gray-400 mb-4">
                Try rephrasing or using different terms.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  "revenue vs net income",
                  "cash flow from operations",
                  "debt to equity ratio",
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSearch(q)}
                    className="px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-full
                               hover:border-accent/30 hover:text-accent transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {!loading && !error && !hasSearched && (
            <div className="text-center py-16">
              <p className="text-gray-400">
                Enter a query above to search financial reports.
              </p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="space-y-3">
              {results.map((result, idx) => (
                <ResultCard
                  key={result.chunk_id}
                  result={result}
                  index={idx}
                  query={query}
                  onClick={() => handleResultClick(result)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <QueryHistorySidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSelectQuery={handleHistorySelect}
      />

      <PDFViewer
        isOpen={pdfViewerOpen}
        onClose={() => setPdfViewerOpen(false)}
        pdfUrl={selectedResult ? `/api/pdf-proxy/${selectedResult.doc_name}` : undefined}
        docName={selectedResult?.doc_name}
        pageNumber={selectedResult?.page || 1}
      />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-container mx-auto px-6 py-8">
          <div className="skeleton h-14 w-full max-w-2xl rounded-xl mb-6" />
          <SearchResultsSkeleton count={5} />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}