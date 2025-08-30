// Server Component – kein useEffect, kein Spam.
// Lädt einmal pro Request/Refresh und rendert die Liste.

type Collector = {
  collector_id: string;
  hostname: string;
  version: string;
  interval_sec: number;
  first_seen: string;
  last_seen: string;
  started_at: string;
  online: boolean;
  age_ms: number;
};

export const revalidate = 0; // immer frisch, aber nur 1x pro Aufruf (kein Polling)

export default async function CollectorsList() {
  const res = await fetch("https://api.pipvaro.com/collectors", {
    cache: "no-store", // keine Zwischen-Caches
  });
  if (!res.ok) throw new Error("API-Error while loading collectors");

  const data: { ok: boolean; collectors: Collector[] } = await res.json();

  return (
    <ul role="list" className="divide-y mx-4 my-4">
      {data.collectors.map((c) => (
        <li
          key={c.collector_id}
          className="relative flex items-center space-x-4 py-4 bg-gray-800/50"
        >
          <div className="min-w-0 flex-auto px-4">
            <div className="flex items-center gap-x-3">
              {!c.online ? (
                <div className="flex-none rounded-full bg-gray-100/10 p-1 text-gray-500">
                  <div className="size-2 rounded-full bg-current" />
                </div>
              ) : (
                <div className="flex-none rounded-full bg-green-100 p-1 text-green-500">
                  <div className="size-2 rounded-full bg-current" />
                </div>
              )}
              <h2 className="min-w-0 text-sm/6 font-semibold text-white">
                {c.hostname} <span className="text-gray-500">/</span>{" "}
                <span className="whitespace-nowrap">{c.collector_id}</span>
              </h2>
            </div>
            <div className="mt-3 flex items-center gap-x-2.5 text-xs/5 text-gray-400">
              <p className="truncate">{(c.age_ms / 1000).toFixed(0)}s</p>
              <svg
                viewBox="0 0 2 2"
                className="size-0.5 flex-none fill-gray-500"
              >
                <circle r={1} cx={1} cy={1} />
              </svg>
              <p className="whitespace-nowrap">
                Last seen {new Date(c.last_seen).toLocaleString()}
              </p>
              <svg
                viewBox="0 0 2 2"
                className="size-0.5 flex-none fill-gray-500"
              >
                <circle r={1} cx={1} cy={1} />
              </svg>
              <p className="whitespace-nowrap">{c.version}</p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
