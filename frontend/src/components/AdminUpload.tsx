"use client";

import { useState, useRef } from "react";
import { uploadDocument, getIngestStatus } from "@/lib/api";
import { cn } from "@/lib/utils";

const DOC_TYPES = [
  { value: "10-K", label: "10-K Annual Report" },
  { value: "10-Q", label: "10-Q Quarterly Report" },
  { value: "annual_report", label: "Annual Report" },
  { value: "other", label: "Other" },
];

export default function AdminUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState("other");
  const [company, setCompany] = useState("");
  const [date, setDate] = useState("");
  const [uploading, setUploading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [progress, setProgress] = useState({ processed: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setError(null);
    setStatus("uploading");

    try {
      const res = await uploadDocument(file, docType, company, date);
      setJobId(res.job_id);
      setStatus("processing");

      const poll = setInterval(async () => {
        try {
          const s = await getIngestStatus(res.job_id);
          setProgress({
            processed: s.chunks_processed,
            total: s.chunks_total,
          });
          if (s.status === "completed") {
            setStatus("completed");
            clearInterval(poll);
          } else if (s.status === "error") {
            setStatus("error");
            setError("Ingestion failed");
            clearInterval(poll);
          }
        } catch {
          clearInterval(poll);
        }
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setStatus("error");
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setDocType("other");
    setCompany("");
    setDate("");
    setJobId(null);
    setStatus(null);
    setProgress({ processed: 0, total: 0 });
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="bg-white border border-black/8 rounded-xl p-6">
      <h3 className="text-sm font-medium tracking-tight mb-4">
        Upload Document
      </h3>

      {status === "completed" ? (
        <div className="text-center py-6">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#3D6B4F"
              strokeWidth="2"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-700 mb-1">
            Document indexed successfully
          </p>
          <p className="text-xs text-gray-400 mb-4">
            {progress.total} chunks processed
          </p>
          <button
            onClick={resetForm}
            className="text-sm text-accent hover:underline"
          >
            Upload another
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              PDF File *
            </label>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              required
              className="w-full text-sm file:mr-4 file:py-2 file:px-4
                         file:rounded-lg file:border-0
                         file:text-sm file:font-medium
                         file:bg-accent/10 file:text-accent
                         hover:file:bg-accent/20
                         file:cursor-pointer
                         border border-gray-200 rounded-lg p-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Document Type
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg
                           outline-none focus:border-accent/40 bg-white"
              >
                {DOC_TYPES.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Company
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Apple Inc."
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg
                           outline-none focus:border-accent/40"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Filing Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg
                         outline-none focus:border-accent/40"
            />
          </div>

          {status === "processing" && (
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Processing chunks...</span>
                <span>
                  {progress.processed} / {progress.total}
                </span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-300"
                  style={{
                    width:
                      progress.total > 0
                        ? `${(progress.processed / progress.total) * 100}%`
                        : "0%",
                  }}
                />
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <button
            type="submit"
            disabled={!file || uploading}
            className={cn(
              "w-full py-2.5 rounded-lg text-sm font-medium transition-all",
              "bg-accent text-white hover:bg-accent-light",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {uploading
              ? "Uploading..."
              : status === "processing"
              ? "Processing..."
              : "Upload & Index"}
          </button>
        </form>
      )}
    </div>
  );
}