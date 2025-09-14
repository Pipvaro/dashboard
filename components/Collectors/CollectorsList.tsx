// components/Collectors/CollectorsList.tsx
import Card from "@/components/packs/Card";
import { timeAgo } from "@/lib/format";

type Collector = {
  collector_id: string;
  hostname: string;
  version: string;
  interval_sec: number;
  first_seen: string | null;
  last_seen: string | null;
  started_at: string | null;
  online: boolean;
  age_ms: number;
};

export const revalidate = 0;

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md bg-gray-800/60 px-2 py-0.5 text-[11px] text-gray-300">
      {children}
    </span>
  );
}

function StatusBadge({ online }: { online: boolean }) {
  const cls = online
    ? "bg-green-400/10 text-green-400"
    : "bg-gray-400/10 text-gray-400";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${cls}`}
    >
      <span
        className={`size-1.5 rounded-full ${
          online ? "bg-green-500 animate-pulse" : "bg-gray-500"
        }`}
      />
      {online ? "Online" : "Offline"}
    </span>
  );
}

function fmtUptime(started_at?: string | null) {
  if (!started_at) return "—";
  const ms = Date.now() - new Date(started_at).getTime();
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default async function CollectorsList() {
  const base = process.env.NEXT_PUBLIC_MASTER_URL || "https://api.pipvaro.com";
  const url = `${base}/collectors`;

  let collectors: Collector[] = [];
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("Bad response");
    const data: { ok: boolean; collectors: Collector[] } = await res.json();
    collectors = Array.isArray(data?.collectors) ? data.collectors : [];
  } catch {
    // Fallback: leere Liste anzeigen
    collectors = [];
  }

  return (
    <div className="px-6 space-y-3">
      {collectors.length === 0 ? (
        <Card>Keine Collector gefunden.</Card>
      ) : (
        collectors.map((c) => (
          <Card key={c.collector_id}>
            <div className="flex items-start justify-between gap-4">
              {/* Left: Host / ID */}
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <StatusBadge online={c.online} />
                  <div className="truncate text-white font-medium">
                    {c.hostname}
                    <span className="text-gray-500"> / </span>
                    <span className="text-gray-300">{c.collector_id}</span>
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Chip>Interval: {c.interval_sec}s</Chip>
                  <Chip>Uptime: {fmtUptime(c.started_at)}</Chip>
                  <Chip>
                    Since: {c.first_seen ? timeAgo(c.first_seen) : "—"}
                  </Chip>
                </div>
              </div>

              {/* Right: Meta */}
              <div className="text-right">
                <div className="text-xs text-gray-400">
                  {c.last_seen ? `Last seen ${timeAgo(c.last_seen)}` : "—"}
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">
                  {c.version || "collector"}
                </div>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
