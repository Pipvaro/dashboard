// components/skeletons/PageSkeleton.tsx
export function PageSkeleton() {
  return (
    <main className="w-full max-w-full md:max-w-4/5 p-6">
      <div className="h-8 w-40 bg-gray-800/50 rounded animate-pulse" />
      <div className="h-4 w-64 bg-gray-800/40 rounded mt-2 animate-pulse" />
      <div className="mt-6 space-y-3">
        {[...Array(2)].map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-xl border border-gray-800/60 bg-gray-900/40 animate-pulse"
          />
        ))}
      </div>
    </main>
  );
}
