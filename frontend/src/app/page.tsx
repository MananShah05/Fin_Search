"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import SearchBar from "@/components/SearchBar";

export default function LandingPage() {
  const router = useRouter();

  const handleSearch = (query: string) => {
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="max-w-container mx-auto px-6">
      <div className="min-h-[calc(100vh-8rem)] flex flex-col justify-center">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          >
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-gray-900 leading-[1.1] mb-4">
              Search financial reports
              <br />
              with{" "}
              <span className="text-accent underline decoration-accent/30 decoration-2 underline-offset-4">
                meaning
              </span>
              , not just keywords.
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: 0.15,
              ease: [0.23, 1, 0.32, 1],
            }}
            className="text-lg text-gray-500 leading-relaxed mb-8 max-w-xl"
          >
            FinSearch understands the context behind your queries. Find relevant
            passages across thousands of SEC filings, annual reports, and
            financial documents — in under 200ms.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: 0.3,
              ease: [0.23, 1, 0.32, 1],
            }}
          >
            <SearchBar onSearch={handleSearch} autoFocus />

            <div className="mt-6 flex items-center gap-4 text-xs text-gray-400">
              <span className="font-medium">Try searching:</span>
              {[
                "revenue growth 2024",
                "risk factors",
                "net income trend",
                "executive compensation",
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => handleSearch(q)}
                  className="hover:text-accent transition-colors underline decoration-dotted underline-offset-2"
                >
                  {q}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}