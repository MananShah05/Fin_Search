import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatScore(score: number): string {
  return (score * 100).toFixed(0);
}

export function formatLatency(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function highlightQueryTerms(text: string, query: string): string {
  if (!query.trim()) return text;
  const terms = query
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 2)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (terms.length === 0) return text;
  const pattern = new RegExp(`(${terms.join("|")})`, "gi");
  return text.replace(pattern, "<mark class='bg-accent/20 text-accent-dark rounded-sm px-0.5'>$1</mark>");
}

export function truncateText(text: string, maxLength: number = 300): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "...";
}

export function getDocTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    "10-K": "10-K",
    "10-Q": "10-Q",
    annual_report: "Annual Report",
    other: "Document",
  };
  return labels[type] || type;
}

export function getDocTypeColor(type: string): string {
  const colors: Record<string, string> = {
    "10-K": "bg-blue-100 text-blue-800",
    "10-Q": "bg-purple-100 text-purple-800",
    annual_report: "bg-green-100 text-green-800",
  };
  return colors[type] || "bg-gray-100 text-gray-800";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}