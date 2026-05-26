"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getAutocomplete } from "@/lib/api";
import { debounce, cn } from "@/lib/utils";

interface SearchBarProps {
  onSearch: (query: string) => void;
  initialQuery?: string;
  autoFocus?: boolean;
}

export default function SearchBar({
  onSearch,
  initialQuery = "",
  autoFocus = false,
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  const fetchSuggestions = useCallback(
    debounce(async (q: string) => {
      if (q.trim().length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      try {
        setIsLoading(true);
        const res = await getAutocomplete(q);
        setSuggestions(res.suggestions);
        setShowSuggestions(res.suggestions.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 200),
    []
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setSelectedIndex(-1);
    fetchSuggestions(val);
  };

  const handleSubmit = (val?: string) => {
    const q = (val || query).trim();
    if (!q) return;
    setShowSuggestions(false);
    onSearch(q);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === "Enter") handleSubmit();
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0) {
          const selected = suggestions[selectedIndex];
          setQuery(selected);
          setShowSuggestions(false);
          handleSubmit(selected);
        } else {
          handleSubmit();
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  return (
    <div className="relative w-full max-w-2xl">
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setShowSuggestions(true);
          }}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder="Search financial reports..."
          className="w-full h-14 pl-5 pr-14 bg-white border border-black/10 rounded-xl
                     text-lg tracking-tight outline-none
                     focus:border-accent/40 focus:ring-2 focus:ring-accent/10
                     transition-all duration-200"
          aria-label="Search financial reports"
          role="combobox"
          aria-expanded={showSuggestions}
          aria-controls="search-suggestions"
        />
        <button
          onClick={() => handleSubmit()}
          className="absolute right-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Search"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-gray-500"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </button>
      </div>

      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            id="search-suggestions"
            ref={dropdownRef}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-black/8
                       rounded-xl shadow-lg overflow-hidden z-50"
            role="listbox"
          >
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onMouseDown={() => {
                  setQuery(suggestion);
                  setShowSuggestions(false);
                  handleSubmit(suggestion);
                }}
                className={cn(
                  "w-full text-left px-5 py-3 text-sm tracking-tight transition-colors",
                  idx === selectedIndex
                    ? "bg-accent/10 text-accent-dark"
                    : "hover:bg-gray-50"
                )}
                role="option"
                aria-selected={idx === selectedIndex}
              >
                {suggestion}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}