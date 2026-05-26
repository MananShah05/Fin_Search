"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

export default function DocumentPage() {
  const params = useParams();
  const router = useRouter();
  const docId = params.doc_id as string;

  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadError, setLoadError] = useState(false);

  return (
    <div className="max-w-container mx-auto px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: "easeInOut" }}
      >
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-accent transition-colors mb-4"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to results
        </button>

        <div className="bg-white border border-black/8 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-black/8">
            <div>
              <h1 className="text-sm font-medium tracking-tight">
                Document: {docId.slice(0, 8)}...
              </h1>
              {numPages && (
                <p className="text-xs text-gray-400 font-mono mt-0.5">
                  Page {currentPage} of {numPages}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg
                           hover:bg-gray-50 disabled:opacity-30 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setCurrentPage((p) =>
                    numPages ? Math.min(numPages, p + 1) : p + 1
                  )
                }
                disabled={numPages !== null && currentPage >= numPages}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg
                           hover:bg-gray-50 disabled:opacity-30 transition-colors"
              >
                Next
              </button>
            </div>
          </div>

          <div className="bg-gray-50 p-4 flex justify-center min-h-[60vh]">
            {loadError ? (
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <p className="text-gray-400 mb-2">
                    PDF preview not available
                  </p>
                  <p className="text-xs text-gray-400">
                    Document ID: {docId}
                  </p>
                </div>
              </div>
            ) : (
              <Document
                file={`/api/pdf-proxy/${docId}`}
                onLoadSuccess={({ numPages: pages }) => {
                  setNumPages(pages);
                  setLoadError(false);
                }}
                onLoadError={() => setLoadError(true)}
                loading={
                  <div className="flex items-center justify-center h-full">
                    <div className="skeleton h-8 w-32" />
                  </div>
                }
              >
                <Page
                  pageNumber={currentPage}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  className="shadow-md"
                  width={Math.min(800, typeof window !== "undefined" ? window.innerWidth - 120 : 800)}
                />
              </Document>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}