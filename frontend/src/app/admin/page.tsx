"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import AuthGuard from "@/components/AuthGuard";
import AdminUpload from "@/components/AdminUpload";
import { AdminStatsSkeleton } from "@/components/SkeletonLoader";
import { getDocuments, getCorpusStats, type Document, type CorpusStats } from "@/lib/api";
import { getDocTypeLabel, getDocTypeColor, cn } from "@/lib/utils";

export default function AdminPage() {
  const [stats, setStats] = useState<CorpusStats | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, docsData] = await Promise.all([
        getCorpusStats(),
        getDocuments(),
      ]);
      setStats(statsData);
      setDocuments(docsData.documents);
    } catch {
      setError("Failed to load corpus data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard requireAdmin>
      <div className="max-w-container mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: "easeInOut" }}
        >
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
            <button
              onClick={loadData}
              className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-200
                         rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              Refresh
            </button>
          </div>

          {loading && <AdminStatsSkeleton />}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center mb-6">
              <p className="text-sm text-red-600 mb-3">{error}</p>
              <button
                onClick={loadData}
                className="text-sm text-accent hover:underline"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && stats && (
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { label: "Documents", value: stats.document_count },
                { label: "Chunks", value: stats.chunk_count },
                { label: "Index Health", value: stats.index_health },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="bg-white border border-black/8 rounded-xl p-5"
                >
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                    {label}
                  </p>
                  <p className="text-2xl font-bold tracking-tight">{value}</p>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <AdminUpload />

            <div>
              <h3 className="text-sm font-medium tracking-tight mb-4">
                Document Index
              </h3>
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="skeleton h-16 rounded-lg" />
                  ))}
                </div>
              ) : documents.length === 0 ? (
                <div className="bg-white border border-black/8 rounded-xl p-6 text-center">
                  <p className="text-sm text-gray-400">
                    No documents indexed yet. Upload a PDF to get started.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="bg-white border border-black/8 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            {doc.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={cn(
                                "text-xs px-1.5 py-0.5 rounded",
                                getDocTypeColor(doc.type)
                              )}
                            >
                              {getDocTypeLabel(doc.type)}
                            </span>
                            {doc.company && (
                              <span className="text-xs text-gray-400">
                                {doc.company}
                              </span>
                            )}
                            <span className="text-xs text-gray-400">
                              {doc.chunk_count} chunks
                            </span>
                          </div>
                        </div>
                        <StatusBadge status={doc.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AuthGuard>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    indexed: "bg-green-100 text-green-700",
    processing: "bg-yellow-100 text-yellow-700",
    pending: "bg-gray-100 text-gray-500",
    error: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={cn(
        "text-xs px-2 py-0.5 rounded-full font-medium",
        colors[status] || "bg-gray-100 text-gray-500"
      )}
    >
      {status}
    </span>
  );
}