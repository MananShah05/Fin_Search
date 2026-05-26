export function ResultCardSkeleton() {
  return (
    <div className="bg-white border border-black/8 rounded-xl p-5 animate-pulse">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-2">
          <div className="skeleton h-5 w-16 rounded-full" />
          <div className="skeleton h-4 w-24" />
        </div>
        <div className="flex items-center gap-2">
          <div className="skeleton h-4 w-8" />
          <div className="skeleton h-5 w-12 rounded-full" />
        </div>
      </div>
      <div className="space-y-2 mb-3">
        <div className="skeleton h-3 w-full" />
        <div className="skeleton h-3 w-5/6" />
        <div className="skeleton h-3 w-4/6" />
      </div>
      <div className="skeleton h-3 w-40" />
    </div>
  );
}

export function SearchResultsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <ResultCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function AdminStatsSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white border border-black/8 rounded-xl p-5 animate-pulse">
          <div className="skeleton h-4 w-24 mb-2" />
          <div className="skeleton h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

export function HistorySkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-white border border-black/8 rounded-lg p-4 animate-pulse">
          <div className="skeleton h-4 w-3/4 mb-2" />
          <div className="skeleton h-3 w-1/4" />
        </div>
      ))}
    </div>
  );
}