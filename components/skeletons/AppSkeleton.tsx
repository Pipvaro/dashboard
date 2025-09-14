// components/skeletons/AppSkeleton.tsx
export function AppSkeleton() {
  return (
    <div className="w-full h-screen flex">
      {/* Sidebar-Stub */}
      <aside className="hidden md:flex w-64 shrink-0 h-full border-r border-gray-800/60 p-4">
        <div className="w-full flex flex-col gap-3 animate-pulse">
          <div className="h-8 w-28 rounded bg-gray-800/60" />
          <div className="h-6 w-24 rounded bg-gray-800/60" />
          <div className="mt-4 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-9 rounded bg-gray-800/40" />
            ))}
          </div>
          <div className="mt-auto h-10 rounded bg-gray-800/40" />
        </div>
      </aside>

      {/* Page-Stub */}
      <main className="w-full max-w-full md:max-w-4/5 p-6">
        <div className="h-8 w-40 bg-gray-800/50 rounded animate-pulse" />
        <div className="h-4 w-64 bg-gray-800/40 rounded mt-2 animate-pulse" />
        <div className="mt-6 space-y-3">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-xl border border-gray-800/60 bg-gray-900/40 animate-pulse"
            />
          ))}
        </div>
      </main>
    </div>
  );
}
