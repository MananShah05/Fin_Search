"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { SearchFilters } from "@/lib/api";

const DOC_TYPES = [
  { value: "10-K", label: "10-K" },
  { value: "10-Q", label: "10-Q" },
  { value: "annual_report", label: "Annual Report" },
];

interface FilterPanelProps {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export default function FilterPanel({
  filters,
  onChange,
  isOpen,
  onToggle,
}: FilterPanelProps) {
  const toggleDocType = (type: string) => {
    const current = filters.doc_type || [];
    const next = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    onChange({ ...filters, doc_type: next.length > 0 ? next : undefined });
  };

  const clearFilters = () => {
    onChange({});
  };

  const hasFilters =
    (filters.doc_type && filters.doc_type.length > 0) ||
    !!filters.date_from ||
    !!filters.date_to;

  return (
    <div>
      <button
        onClick={onToggle}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
          isOpen || hasFilters
            ? "bg-accent/10 text-accent"
            : "text-gray-500 hover:bg-gray-100"
        )}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="4" y1="21" x2="4" y2="14" />
          <line x1="4" y1="10" x2="4" y2="3" />
          <line x1="12" y1="21" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12" y2="3" />
          <line x1="20" y1="21" x2="20" y2="16" />
          <line x1="20" y1="12" x2="20" y2="3" />
          <line x1="1" y1="14" x2="7" y2="14" />
          <line x1="9" y1="8" x2="15" y2="8" />
          <line x1="17" y1="16" x2="23" y2="16" />
        </svg>
        Filters
        {hasFilters && (
          <span className="w-2 h-2 rounded-full bg-accent" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="mt-3 p-4 bg-white border border-black/8 rounded-xl space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">
                  Document Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {DOC_TYPES.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => toggleDocType(value)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium transition-colors border",
                        (filters.doc_type || []).includes(value)
                          ? "bg-accent text-white border-accent"
                          : "bg-white text-gray-600 border-gray-200 hover:border-accent/30"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    From
                  </label>
                  <input
                    type="date"
                    value={filters.date_from || ""}
                    onChange={(e) =>
                      onChange({
                        ...filters,
                        date_from: e.target.value || undefined,
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg
                               outline-none focus:border-accent/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    To
                  </label>
                  <input
                    type="date"
                    value={filters.date_to || ""}
                    onChange={(e) =>
                      onChange({
                        ...filters,
                        date_to: e.target.value || undefined,
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg
                               outline-none focus:border-accent/40"
                  />
                </div>
              </div>

              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-gray-400 hover:text-accent transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}