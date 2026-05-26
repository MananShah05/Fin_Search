"use client";

import { motion } from "framer-motion";
import type { SearchResult } from "@/lib/api";
import { cn, formatScore, getDocTypeLabel, getDocTypeColor } from "@/lib/utils";

interface ResultCardProps {
  result: SearchResult;
  index: number;
  query: string;
  onClick?: () => void;
}

export default function ResultCard({
  result,
  index,
  query,
  onClick,
}: ResultCardProps) {
  const highlightText = (text: string): string => {
    if (!query.trim()) return text;
    const terms = query
      .trim()
      .split(/\s+/)
      .filter((t) => t.length > 2)
      .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    if (terms.length === 0) return text;
    const pattern = new RegExp(`(${terms.join("|")})`, "gi");
    return text.replace(
      pattern,
      "<mark class='bg-accent/20 text-accent-dark rounded-sm px-0.5'>$1</mark>"
    );
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: index * 0.05,
        ease: [0.23, 1, 0.32, 1],
      }}
      whileHover={{
        y: -2,
        transition: { duration: 0.12, ease: "easeOut" },
      }}
      onClick={onClick}
      className="group bg-white border border-black/8 rounded-xl p-5 cursor-pointer
                 hover:shadow-md hover:border-accent/20 transition-shadow duration-120"
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full",
              getDocTypeColor(result.doc_type)
            )}
          >
            {getDocTypeLabel(result.doc_type)}
          </span>
          {result.company && (
            <span className="text-xs text-gray-500">{result.company}</span>
          )}
          {result.date && (
            <span className="text-xs text-gray-400">{result.date}</span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-gray-400 font-mono">
            p.{result.page}
          </span>
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-medium",
              "bg-accent/10 text-accent animate-score-pulse"
            )}
          >
            {formatScore(result.score)}%
          </span>
        </div>
      </div>

      <p
        className="text-sm leading-relaxed text-gray-700 line-clamp-4 mb-2"
        dangerouslySetInnerHTML={{
          __html: highlightText(result.text),
        }}
      />

      <div className="flex items-center gap-2 text-xs text-gray-400">
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="shrink-0"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
        <span className="truncate">{result.doc_name}</span>
      </div>
    </motion.div>
  );
}