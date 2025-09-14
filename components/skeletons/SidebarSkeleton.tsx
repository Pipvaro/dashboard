// components/skeletons/SidebarSkeleton.tsx
export function SidebarSkeleton() {
  return (
    <aside className="w-64 shrink-0 h-screen border-r border-gray-800/60 p-4 hidden md:flex flex-col">
      <div className="animate-pulse space-y-3">
        <div className="h-8 w-28 rounded bg-gray-800/60" />
        <div className="h-6 w-24 rounded bg-gray-800/60" />
      </div>
      <div className="mt-6 space-y-2 animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-9 rounded bg-gray-800/40" />
        ))}
      </div>
      <div className="mt-auto pt-4 animate-pulse">
        <div className="h-10 rounded bg-gray-800/40" />
      </div>
    </aside>
  );
}
