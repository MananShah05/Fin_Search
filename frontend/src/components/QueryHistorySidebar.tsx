"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getQueryHistory, toggleStar, type QueryHistoryItem } from "@/lib/api";
import { cn } from "@/lib/utils";
import { getFirebaseAuth, signInWithGoogle, onAuthChange } from "@/lib/firebase";

interface QueryHistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectQuery: (query: string) => void;
}

export default function QueryHistorySidebar({
  isOpen,
  onClose,
  onSelectQuery,
}: QueryHistorySidebarProps) {
  const [queries, setQueries] = useState<QueryHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    if (isOpen) {
      loadHistory();
      unsubscribe = onAuthChange((fbUser) => {
        if (fbUser) {
          loadHistory();
        } else {
          setError("Please sign in to view your search history.");
          setQueries([]);
        }
      });
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isOpen]);

  const loadHistory = async () => {
    const auth = getFirebaseAuth();
    if (!auth.currentUser) {
      setError("Please sign in to view your search history.");
      setQueries([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await getQueryHistory();
      setQueries(res.queries);
    } catch {
      setError("Failed to load history");
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

  const starred = queries.filter((q) => q.starred);
  const recent = queries.filter((q) => !q.starred);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20 z-40"
            onClick={onClose}
          />

          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{
              duration: 0.24,
              ease: [0.32, 0.72, 0, 1],
            }}
            className="fixed inset-y-0 left-0 w-full max-w-sm bg-white shadow-xl z-50
                       flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-black/8">
              <h2 className="text-sm font-medium tracking-tight">
                Query History
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Close sidebar"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="skeleton h-12 rounded-lg"
                    />
                  ))}
                </div>
              ) : error ? (
              <div className="text-center py-12 px-6 flex flex-col items-center">
                <p className="text-sm text-gray-400 mb-4">{error}</p>
                {error.includes("sign in") ? (
                  <button
                    onClick={async () => {
                      const user = await signInWithGoogle();
                      if (user) {
                        loadHistory();
                      }
                    }}
                    className="px-4 py-2 bg-accent text-white rounded-lg text-xs font-medium 
                               hover:bg-accent-light transition-colors shadow-sm"
                  >
                    Sign In
                  </button>
                ) : (
                  <button
                    onClick={loadHistory}
                    className="text-xs text-accent hover:underline font-medium"
                  >
                    Retry
                  </button>
                )}
              </div>
              ) : queries.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-400">
                    No queries yet. Start searching!
                  </p>
                </div>
              ) : (
                <>
                  {starred.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                        Starred
                      </h3>
                      <div className="space-y-1">
                        {starred.map((q) => (
                          <HistoryItem
                            key={q.id}
                            item={q}
                            onSelect={onSelectQuery}
                            onToggleStar={handleToggleStar}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {recent.length > 0 && (
                    <div>
                      <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                        Recent
                      </h3>
                      <div className="space-y-1">
                        {recent.map((q) => (
                          <HistoryItem
                            key={q.id}
                            item={q}
                            onSelect={onSelectQuery}
                            onToggleStar={handleToggleStar}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function HistoryItem({
  item,
  onSelect,
  onToggleStar,
}: {
  item: QueryHistoryItem;
  onSelect: (query: string) => void;
  onToggleStar: (id: string, starred: boolean) => void;
}) {
  return (
    <div
      className="group flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50
                 cursor-pointer transition-colors"
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
        <p className="text-sm truncate">{item.text}</p>
        <p className="text-xs text-gray-400">
          {item.result_count} results
        </p>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleStar(item.id, !item.starred);
        }}
        className={cn(
          "p-1 rounded opacity-0 group-hover:opacity-100 transition-all",
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
    </div>
  );
}