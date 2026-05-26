"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

interface PDFViewerProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl?: string;
  docName?: string;
  pageNumber?: number;
}

export default function PDFViewer({
  isOpen,
  onClose,
  pdfUrl,
  docName = "Document",
  pageNumber = 1,
}: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(pageNumber);
  const [loadError, setLoadError] = useState(false);

  const onLoadSuccess = ({ numPages: pages }: { numPages: number }) => {
    setNumPages(pages);
    setLoadError(false);
  };

  const onLoadError = () => {
    setLoadError(true);
  };

  if (!pdfUrl) {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{
              duration: 0.28,
              ease: [0.32, 0.72, 0, 1],
            }}
            className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-xl z-50
                       flex items-center justify-center"
          >
            <p className="text-gray-400">No PDF URL provided</p>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

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
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{
              duration: 0.28,
              ease: [0.32, 0.72, 0, 1],
            }}
            className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-xl z-50
                       flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-black/8">
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-medium tracking-tight truncate">
                  {docName}
                </h2>
                {numPages && (
                  <p className="text-xs text-gray-400 font-mono mt-0.5">
                    Page {currentPage} of {numPages}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.max(1, p - 1))
                  }
                  disabled={currentPage <= 1}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"
                  aria-label="Previous page"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((p) =>
                      numPages ? Math.min(numPages, p + 1) : p + 1
                    )
                  }
                  disabled={numPages !== null && currentPage >= numPages}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"
                  aria-label="Next page"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Close viewer"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
              {loadError ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <p className="text-gray-400 mb-2">Failed to load PDF</p>
                    <button
                      onClick={() => setLoadError(false)}
                      className="text-sm text-accent hover:underline"
                    >
                      Try again
                    </button>
                  </div>
                </div>
              ) : (
                <Document
                  file={pdfUrl}
                  onLoadSuccess={onLoadSuccess}
                  onLoadError={onLoadError}
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
                    className="mx-auto shadow-md"
                    width={Math.min(700, typeof window !== "undefined" ? window.innerWidth - 80 : 700)}
                  />
                </Document>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}