"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import AuthGuard from "@/components/AuthGuard";
import { HistorySkeleton } from "@/components/SkeletonLoader";
import { getQueryHistory, toggleStar, type QueryHistoryItem } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function HistoryPage() {
  const router = useRouter();
  const [queries, setQueries] = useState<QueryHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getQueryHistory();
      setQueries(res.queries);
    } catch {
      setError("Failed to load query history");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStar = async (id: string, starred: boolean) => {
    try {
      await toggleStar(id, starred);
      setQueries((prev) =>
        prev.map((q) => (q.id === id ? { ...q, starred } : q))
      );
    } catch {
      // Silently fail
    }
  };

  const handleSelectQuery = (text: string) => {
    router.push(`/search?q=${encodeURIComponent(text)}`);
  };

  const starred = queries.filter((q) => q.starred);
  const recent = queries.filter((q) => !q.starred);

  return (
    <AuthGuard>
      <div className="max-w-container mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: "easeInOut" }}
        >
          <h1 className="text-2xl font-bold tracking-tight mb-6">
            Query History
          </h1>

          {loading && <HistorySkeleton />}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <p className="text-sm text-red-600 mb-3">{error}</p>
              <button
                onClick={loadHistory}
                className="text-sm text-accent hover:underline"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && queries.length === 0 && (
            <div className="text-center py-16">
              <p className="text-gray-400 mb-2">No queries yet</p>
              <button
                onClick={() => router.push("/search")}
                className="text-sm text-accent hover:underline"
              >
                Start searching
              </button>
            </div>
          )}

          {!loading && !error && queries.length > 0 && (
            <div className="max-w-2xl space-y-6">
              {starred.length > 0 && (
                <section>
                  <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                    Starred ({starred.length})
                  </h2>
                  <div className="space-y-1">
                    {starred.map((q, i) => (
                      <HistoryCard
                        key={q.id}
                        item={q}
                        index={i}
                        onSelect={handleSelectQuery}
                        onToggleStar={handleToggleStar}
                      />
                    ))}
                  </div>
                </section>
              )}

              <section>
                <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                  Recent ({recent.length})
                </h2>
                <div className="space-y-1">
                  {recent.map((q, i) => (
                    <HistoryCard
                      key={q.id}
                      item={q}
                      index={i}
                      onSelect={handleSelectQuery}
                      onToggleStar={handleToggleStar}
                    />
                  ))}
                </div>
              </section>
            </div>
          )}
        </motion.div>
      </div>
    </AuthGuard>
  );
}

function HistoryCard({
  item,
  index,
  onSelect,
  onToggleStar,
}: {
  item: QueryHistoryItem;
  index: number;
  onSelect: (text: string) => void;
  onToggleStar: (id: string, starred: boolean) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      className="group flex items-center gap-3 px-4 py-3 bg-white border border-black/8
                 rounded-lg cursor-pointer hover:border-accent/20 transition-colors"
      onClick={() => onSelect(item.text)}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="shrink-0 text-gray-300"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{item.text}</p>
        <p className="text-xs text-gray-400">
          {item.result_count} results
          {item.top_result_doc && ` · ${item.top_result_doc}`}
        </p>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleStar(item.id, !item.starred);
        }}
        className={cn(
          "p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all",
          item.starred && "opacity-100"
        )}
        aria-label={item.starred ? "Unstar" : "Star"}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill={item.starred ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2"
          className={item.starred ? "text-yellow-500" : "text-gray-300"}
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      </button>
    </motion.div>
  );
}