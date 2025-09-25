/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  LayoutDashboard,
  Activity,
  Server,
  Zap,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import SiteBanner from "@/components/SiteBanner";
import Card from "@/components/packs/Card";

/* ---------- tiny UI bits ---------- */
function Stat({
  icon,
  label,
  value,
  sub,
  tone = "indigo",
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  tone?: "indigo" | "green" | "blue" | "amber" | "rose";
}) {
  const tones: Record<string, string> = {
    indigo: "bg-indigo-500/10 text-indigo-300 ring-indigo-500/20",
    green: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/20",
    blue: "bg-blue-500/10 text-blue-300 ring-blue-500/20",
    amber: "bg-amber-500/10 text-amber-300 ring-amber-500/20",
    rose: "bg-rose-500/10 text-rose-300 ring-rose-500/20",
  };
  return (
    <Card>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ring-1 ${tones[tone]}`}>{icon}</div>
        <div className="min-w-0">
          <div className="text-xs text-gray-400">{label}</div>
          <div className="text-lg text-white font-semibold truncate">
            {value}
          </div>
          {sub && <div className="text-[11px] text-gray-500 mt-0.5">{sub}</div>}
        </div>
      </div>
    </Card>
  );
}
function Pill({
  children,
  color = "gray",
}: {
  children: React.ReactNode;
  color?: "green" | "red" | "gray" | "blue" | "amber";
}) {
  const map: Record<string, string> = {
    green: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    red: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    gray: "bg-zinc-700/20 text-zinc-300 border-zinc-600/30",
    blue: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    amber: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  };
  return (
    <span
      className={`px-1.5 py-[1px] rounded-full text-[10px] leading-4 border ${map[color]} whitespace-nowrap`}
    >
      {children}
    </span>
  );
}
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-white/5 rounded ${className}`} />;
}

/* ---------- simple SVG charts (no deps) ---------- */
function BarChart({
  data,
  max,
  height = 160,
  label = (d: any) => String(d?.label ?? ""),
  value = (d: any) => Number(d?.value ?? 0),
  valueLabel = (d: any) => String(value(d)),
  barFill = (d: any) => "rgba(99,102,241,0.85)", // indigo-400/85
}: {
  data: any[];
  max?: number;
  height?: number;
  label?: (d: any) => string;
  value?: (d: any) => number;
  valueLabel?: (d: any) => string;
  barFill?: (d: any) => string;
}) {
  if (!data || data.length === 0)
    return <div className="text-[11px] text-gray-500">No data</div>;

  const width = 900; // groß, skaliert per CSS
  const barH = 18;
  const gap = 12;
  const totalH = Math.min(height, data.length * (barH + gap));
  const vMax = max ?? Math.max(...data.map(value));

  return (
    <div className="w-full flex justify-center px-2">
      <svg
        width={width}
        height={totalH}
        viewBox={`0 0 ${width} ${totalH}`}
        className="w-full max-w-5xl"
      >
        {data.map((d, i) => {
          const v = value(d);
          const w = vMax > 0 ? (Math.abs(v) / vMax) * (width - 220) : 0; // Platz für labels & value
          const y = i * (barH + gap);

          const inside = w > 56;
          const txInside = 180 + Math.min(w - 8, width - 230);

          return (
            <g key={i} transform={`translate(0, ${y})`}>
              {/* left label */}
              <text x={0} y={barH - 5} className="fill-gray-300 text-[11px]">
                {label(d).length > 40 ? label(d).slice(0, 40) + "…" : label(d)}
              </text>

              {/* track */}
              <rect
                x={180}
                y={0}
                width={width - 220}
                height={barH}
                rx={7}
                fill="rgba(255,255,255,0.08)"
              />

              {/* value bar */}
              <rect
                x={180}
                y={0}
                width={Math.max(0, w)}
                height={barH}
                rx={7}
                fill={barFill(d)}
              />

              {/* value text (weiß im Balken, sonst daneben) */}
              <text
                x={inside ? txInside : 180 + w + 8}
                y={barH - 5}
                textAnchor={inside ? "end" : "start"}
                className={
                  inside
                    ? "fill-white text-[11px]"
                    : "fill-gray-300 text-[11px]"
                }
                style={{ pointerEvents: "none" }}
              >
                {valueLabel(d)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* --- Line/Area chart mit X-Achse --- */
function LineChart({
  series,
  height = 260,
  yFormat = (v: number) => v.toLocaleString(),
  xTicks,
}: {
  series: {
    label?: string;
    points: { x: number; y: number }[];
    color?: string;
  }[];
  height?: number;
  yFormat?: (v: number) => string;
  xTicks?: { x: number; label: string }[];
}) {
  const width = 900;
  const pad = 70; // genug Platz links für $49,xxx

  const all = series.flatMap((s) => s.points);
  if (all.length === 0)
    return (
      <div className="text-[11px] text-gray-500">No data in selected range</div>
    );

  const minX = Math.min(...all.map((p) => p.x));
  const maxX = Math.max(...all.map((p) => p.x));
  const minY = Math.min(...all.map((p) => p.y));
  const maxY = Math.max(...all.map((p) => p.y));

  const sx = (x: number) =>
    pad + ((x - minX) / Math.max(1, maxX - minX)) * (width - pad * 2);
  const sy = (y: number) =>
    height - pad / 2 - ((y - minY) / Math.max(1, maxY - minY)) * (height - pad);

  const gridY = [0, 0.25, 0.5, 0.75, 1].map(
    (t) => minY + t * (maxY - minY || 1)
  );

  return (
    <div className="w-full flex justify-center px-2">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full max-w-5xl"
      >
        {/* grid */}
        {gridY.map((gy, i) => (
          <g key={i}>
            <line
              x1={pad}
              x2={width - pad}
              y1={sy(gy)}
              y2={sy(gy)}
              className="stroke-white/10"
            />
            <text
              x={pad - 10}
              y={sy(gy)}
              textAnchor="end"
              dominantBaseline="middle"
              className="fill-gray-500 text-[11px]"
            >
              {yFormat(gy)}
            </text>
          </g>
        ))}

        {xTicks?.length
          ? xTicks.map((t, i) => (
              <g key={i}>
                <line
                  x1={sx(t.x)}
                  x2={sx(t.x)}
                  y1={sy(minY)}
                  y2={height - pad / 2}
                  className="stroke-white/5"
                />
                <text
                  x={sx(t.x)}
                  y={height - 6}
                  textAnchor="middle"
                  className="fill-gray-400 text-[10px]"
                >
                  {t.label}
                </text>
              </g>
            ))
          : null}

        {/* areas + lines */}
        {series.map((s, idx) => {
          const c = s.color || ["#6366F1", "#22C55E", "#F59E0B"][idx % 3];
          const pts = s.points.length ? s.points : [{ x: minX, y: minY }];
          const d = pts
            .map((p, i) => `${i ? "L" : "M"}${sx(p.x)},${sy(p.y)}`)
            .join(" ");
          // iOS-kompatibel: kein .at(-1)
          const last = pts[pts.length - 1];
          const area =
            `M${sx(pts[0].x)},${sy(pts[0].y)} ` +
            pts
              .slice(1)
              .map((p) => `L${sx(p.x)},${sy(p.y)}`)
              .join(" ") +
            ` L${sx(last.x)},${sy(minY)} L${sx(pts[0].x)},${sy(minY)} Z`;

          return (
            <g key={idx}>
              <path d={area} fill={`${c}22`} />
              <path d={d} fill="none" stroke={c} strokeWidth={2} />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ---------- helpers ---------- */
function n(v: any, d = 0) {
  const x = Number(v);
  return Number.isFinite(x) ? x : d;
}
function profitOf(t: any): number {
  const cand = [
    t?.profit,
    t?.pnl,
    t?.net_profit,
    t?.pl,
    t?.result,
    t?.net,
    t?.gain,
  ];
  for (const c of cand) {
    const v = Number(c);
    if (Number.isFinite(v)) return v;
  }
  return 0;
}
const truncate = (s: string, len = 120) =>
  s.length > len ? s.slice(0, len - 1) + "…" : s;

/* --- Range handling --- */
type RangeKey = "1h" | "4h" | "1d" | "3d" | "5d" | "7d";
const RANGE_MS: Record<RangeKey, number> = {
  "1h": 60 * 60 * 1000,
  "4h": 4 * 60 * 60 * 1000,
  "1d": 24 * 60 * 60 * 1000,
  "3d": 3 * 24 * 60 * 60 * 1000,
  "5d": 5 * 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
};
function fmtTick(ts: number, range: RangeKey) {
  const d = new Date(ts);
  if (range === "1h" || range === "4h")
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (range === "1d") return d.toLocaleTimeString([], { hour: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "2-digit" });
}
function RangeTabs({
  value,
  onChange,
  label,
}: {
  value: RangeKey;
  onChange: (r: RangeKey) => void;
  label: string;
}) {
  const items: RangeKey[] = ["1h", "4h", "1d", "3d", "5d", "7d"];
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-400">{label}:</span>
      <div className="flex items-center gap-1">
        {items.map((k) => (
          <button
            key={k}
            onClick={() => onChange(k)}
            className={`text-[11px] px-2 py-1 rounded border ${
              value === k
                ? "bg-white/10 border-white/20 text-white"
                : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
            }`}
          >
            {k}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [receivers, setReceivers] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [trades, setTrades] = useState<any[] | null>(null); // null == initial loading
  const [error, setError] = useState<string | null>(null);

  const [metrics, setMetrics] = useState<any[] | null>(null);
  const [history, setHistory] = useState<any[] | null>(null);

  const [activeAid, setActiveAid] = useState<string | null>(null);

  const [eqRange, setEqRange] = useState<RangeKey>("1d");
  const [balRange, setBalRange] = useState<RangeKey>("1d");

  // System Notes (News)
  const [news, setNews] = useState<
    { id: string; type: "news" | "changelog"; title: string; date: string }[]
  >([]);

  // guards gegen flackern
  const coreLoadedRef = useRef(false);
  const deepLoadedRef = useRef(false);

  /* --------- fetchers (reused for polling) ---------- */
  const fetchCore = useCallback(async () => {
    const [r1, r2, r3] = await Promise.all([
      fetch("/api/my-receivers", { cache: "no-store" }),
      fetch("/api/my-accounts", { cache: "no-store" }),
      fetch("/api/my-accounts", { cache: "no-store" }).catch(() => null),
    ]);
    if (!r1.ok || !r2.ok) throw new Error("fetch_failed");
    const d1 = await r1.json();
    const d2 = await r2.json();

    // NICHT trades auf null setzen – nur aktualisieren, wenn vorhanden
    if (r3 && r3.ok) {
      const d3 = await r3.json();
      if (Array.isArray(d3?.items)) setTrades(d3.items);
    }

    const accs = Array.isArray(d2?.accounts) ? d2.accounts : [];
    setReceivers(Array.isArray(d1?.receivers) ? d1.receivers : []);
    setAccounts(accs);

    if (!activeAid && accs.length > 0) {
      const a = accs[0]?.account || {};
      setActiveAid(String(a.id ?? a.login ?? ""));
    }
    coreLoadedRef.current = true;
  }, [activeAid]);

  // hohes Limit, damit Range 7d genug Daten hat
  const limitForRange = (r: RangeKey) => {
    switch (r) {
      case "7d":
      case "5d":
        return 2000;
      case "3d":
        return 1500;
      case "1d":
        return 900;
      case "4h":
        return 400;
      case "1h":
      default:
        return 200;
    }
  };

  const fetchDeep = useCallback(
    async (aid: string, eqR: RangeKey, balR: RangeKey) => {
      const limit = Math.max(limitForRange(eqR), limitForRange(balR));
      const [m, h, t] = await Promise.all([
        fetch(
          `/api/accounts/${encodeURIComponent(aid)}/metrics?limit=${limit}`,
          { cache: "no-store" }
        ).then((r) => r.json()),
        fetch(
          `/api/accounts/${encodeURIComponent(aid)}/history?limit=${limit}`,
          { cache: "no-store" }
        ).then((r) => r.json()),
        fetch(
          `/api/accounts/${encodeURIComponent(
            aid
          )}/trades?state=CLOSED&limit=150`,
          { cache: "no-store" }
        ).then((r) => r.json()),
      ]);

      setMetrics(Array.isArray(m?.items) ? m.items : []);
      setHistory(Array.isArray(h?.items) ? h.items : []);
      if (Array.isArray(t?.items)) setTrades(t.items); // nie auf null setzen
      deepLoadedRef.current = true;
    },
    []
  );

  // News (nur kurz cachen & top 3)
  const fetchNews = useCallback(async () => {
    try {
      const r = await fetch("/api/news?limit=12", { cache: "no-store" });
      const d = await r.json().catch(() => ({}));
      if (r.ok && Array.isArray(d?.items)) {
        const items = d.items.slice(0, 3).map((it: any) => ({
          id: String(it.id),
          type: it.type === "news" ? "news" : "changelog",
          title: String(it.title || ""),
          date: String(it.date || ""),
        }));
        setNews(items);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // initial load
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await fetchCore();
        await fetchNews();
        setLoading(false);
      } catch {
        if (!mounted) return;
        setError("Could not load data");
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [fetchCore, fetchNews]);

  // poll every 5s (ohne flicker) – Core + Deep
  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        await fetchCore();
        if (activeAid) await fetchDeep(activeAid, eqRange, balRange);
      } catch {
        /* ignore */
      }
      if (!cancelled) setTimeout(tick, 5000);
    };
    tick();
    return () => {
      cancelled = true;
    };
  }, [activeAid, eqRange, balRange, fetchCore, fetchDeep]);

  // sofort nach Wechseln von Account oder Range nachladen
  useEffect(() => {
    if (!activeAid) return;
    (async () => {
      try {
        await fetchDeep(activeAid, eqRange, balRange);
      } catch {
        /* ignore */
      }
    })();
  }, [activeAid, eqRange, balRange, fetchDeep]);

  // totals
  const totals = useMemo(() => {
    let equity = 0;
    let balance = 0;
    let openPos = 0;

    if (accounts.length > 0) {
      accounts.forEach((a) => {
        equity += n(a?.trading?.equity);
        balance += n(a?.trading?.balance);
        openPos += n(a?.trading?.positions_total);
      });
    } else {
      receivers.forEach((r) => {
        const t = r?.account_snapshot?.trading || {};
        equity += n(t.equity);
        balance += n(t.balance);
        openPos += n(t.positions_total);
      });
    }

    const online = receivers.filter((r) => {
      const last = r?.last_seen ? new Date(r.last_seen).getTime() : 0;
      return last && Date.now() - last < 90_000;
    });

    return {
      equity,
      balance,
      openPos,
      totalReceivers: receivers.length,
      onlineReceivers: online.length,
    };
  }, [receivers, accounts]);

  // overview charts – data shaping
  const equityByAccount = useMemo(() => {
    if (accounts.length > 0) {
      return accounts
        .map((a) => ({
          label: a?.account?.name || a?.account?.id || "Account",
          value: n(a?.trading?.equity),
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8);
    }
    return receivers
      .map((r) => ({
        label: r?.name || r?.receiver_id,
        value: n(r?.account_snapshot?.trading?.equity),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [accounts, receivers]);

  const openPosByReceiver = useMemo(() => {
    if (accounts.length > 0) {
      return accounts
        .map((a) => ({
          label: a?.account?.name || a?.account?.id || "Account",
          value: n(a?.trading?.positions_total),
        }))
        .filter((d) => d.value > 0)
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);
    }
    return receivers
      .map((r) => ({
        label: r?.name || r?.receiver_id,
        value: n(r?.account_snapshot?.trading?.positions_total),
      }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [accounts, receivers]);

  // Vollserien (ungefiltert)
  const equitySeriesFull = useMemo(() => {
    const rows = (metrics?.length ? metrics : history) || [];
    const pts = rows
      .map((r: any) => {
        const ts = r?.ts || r?.time || r?.timestamp || r?.created_at;
        const eq =
          r?.equity ??
          r?.trading?.equity ??
          r?.account?.equity ??
          r?.metrics?.equity ??
          null;
        return ts && eq != null ? { x: +new Date(ts), y: Number(eq) } : null;
      })
      .filter(Boolean) as { x: number; y: number }[];
    pts.sort((a, b) => a.x - b.x);
    return pts;
  }, [metrics, history]);

  const balanceSeriesFull = useMemo(() => {
    const rows = (metrics?.length ? metrics : history) || [];
    const pts = rows
      .map((r: any) => {
        const ts = r?.ts || r?.time || r?.timestamp || r?.created_at;
        const bal =
          r?.balance ??
          r?.trading?.balance ??
          r?.account?.balance ??
          r?.metrics?.balance ??
          null;
        return ts && bal != null ? { x: +new Date(ts), y: Number(bal) } : null;
      })
      .filter(Boolean) as { x: number; y: number }[];
    pts.sort((a, b) => a.x - b.x);
    return pts;
  }, [metrics, history]);

  // Range strikt anwenden + Ticks
  function applyRangeStrict(pts: { x: number; y: number }[], range: RangeKey) {
    if (!pts.length)
      return { pts: [], ticks: [] as { x: number; label: string }[] };
    const now = Date.now();
    const from = now - RANGE_MS[range];
    const filtered = pts.filter((p) => p.x >= from);
    if (!filtered.length) return { pts: [], ticks: [] };
    const minX = filtered[0].x;
    const maxX = filtered[filtered.length - 1].x;
    const T = 6;
    const ticks = Array.from({ length: T }, (_, i) => {
      const x = Math.round(minX + (i / (T - 1)) * (maxX - minX));
      return { x, label: fmtTick(x, range) };
    });
    return { pts: filtered, ticks };
  }

  const eqPrepared = useMemo(
    () => applyRangeStrict(equitySeriesFull, eqRange),
    [equitySeriesFull, eqRange]
  );
  const balPrepared = useMemo(
    () => applyRangeStrict(balanceSeriesFull, balRange),
    [balanceSeriesFull, balRange]
  );

  // PnL by day (closed trades)
  const pnlByDay = useMemo(() => {
    if (trades === null) return []; // initial skeleton handled below
    if (!trades || trades.length === 0) return [];
    const map = new Map<string, number>();
    trades.forEach((t: any) => {
      const ts = t?.close_time || t?.time || t?.ts || t?.close_at;
      const d = ts ? new Date(ts) : null;
      const key = d ? d.toISOString().slice(0, 10) : "unknown";
      const p = profitOf(t);
      map.set(key, (map.get(key) || 0) + p);
    });
    return Array.from(map.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => (a.label > b.label ? 1 : -1))
      .slice(-20);
  }, [trades]);

  // Win stats
  const winStats = useMemo(() => {
    if (trades === null) return { wins: 0, losses: 0, breakeven: 0, rate: 0 };
    if (!trades || trades.length === 0)
      return { wins: 0, losses: 0, breakeven: 0, rate: 0 };
    let w = 0,
      l = 0,
      b = 0;
    const eps = 1e-8;
    trades.forEach((t: any) => {
      const p = profitOf(t);
      if (p > eps) w++;
      else if (p < -eps) l++;
      else b++;
    });
    const denom = Math.max(1, w + l); // breakeven exkludiert
    return { wins: w, losses: l, breakeven: b, rate: (w / denom) * 100 };
  }, [trades]);

  const accountOptions = useMemo(
    () =>
      accounts.map((a) => {
        const acc = a?.account || {};
        const id = String(acc.id ?? acc.login ?? "");
        const label =
          (acc.name ? `${acc.name}` : id) +
          (acc.server ? ` • ${acc.server}` : "");
        return { id, label };
      }),
    [accounts]
  );

  return (
    <div className="w-full h-screen flex">
      <Sidebar />
      <main className="w-full max-w-full md:ml-72">
        <SiteBanner />
        <div className="h-20 border-b md:hidden border-gray-700/50 flex justify-between items-center px-4">
          <Image
            src={"/assets/Transparent/logo-beta.svg"}
            alt="logo"
            height={100}
            width={250}
            className="w-32 md:hidden block"
          />
          <MobileNav />
        </div>

        {/* Header */}
        <div className="px-6 pt-6 flex items-center justify-between">
          <div className="mr-6">
            <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
              <LayoutDashboard className="size-5 text-indigo-400" />
              Dashboard
            </h1>
            <p className="text-sm text-gray-400">
              A quick overview of your trading setup — receivers, equity and
              recent activity.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-10 space-y-4 mt-4">
          {/* Quick stats */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
          ) : error ? (
            <Card>
              <div className="flex items-center gap-2 text-amber-300">
                <AlertTriangle className="size-4" />
                <span>{error}</span>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              <Stat
                icon={<Server className="size-5" />}
                label="Receivers"
                value={
                  <span>
                    {totals.onlineReceivers}/{totals.totalReceivers}{" "}
                    <span className="text-sm text-gray-400">online</span>
                  </span>
                }
                sub={<span>Health over last 90s</span>}
                tone="blue"
              />
              <Stat
                icon={<TrendingUp className="size-5" />}
                label="Total Equity"
                value={`$${totals.equity.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`}
                sub={<span>Across all linked accounts</span>}
                tone="indigo"
              />
              <Stat
                icon={<Activity className="size-5" />}
                label="Open Positions"
                value={totals.openPos}
                sub={<span>Live across accounts</span>}
                tone="green"
              />
              <Stat
                icon={<Zap className="size-5" />}
                label="Balance"
                value={`$${totals.balance.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`}
                sub={<span>Account balances</span>}
                tone="amber"
              />
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
            {/* Receiver Health */}
            <Card>
              <div className="flex items-center justify-between">
                <div className="text-white font-medium">Receiver Health</div>
                <Link
                  href="/receivers"
                  className="text-xs text-indigo-300 hover:text-indigo-200"
                >
                  View all
                </Link>
              </div>

              {loading ? (
                <div className="mt-3 space-y-2">
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                </div>
              ) : receivers.slice(0, 5).length === 0 ? (
                <div className="text-sm text-gray-500 mt-3">
                  No receivers yet. Create one to get started.
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  {receivers.slice(0, 5).map((r) => {
                    const st = r?.settings || {};
                    const rules = st?.trade_rules || {};
                    const last = r?.last_seen
                      ? new Date(r.last_seen).getTime()
                      : 0;
                    const online = last && Date.now() - last < 90_000;
                    const acc = r?.account_snapshot?.account || {};
                    const equity = n(r?.account_snapshot?.trading?.equity);
                    return (
                      <Link
                        key={r.receiver_id}
                        href={`/receivers/${r.receiver_id}`}
                        className="group flex items-center justify-between rounded-lg border border-white/5 bg-white/5 hover:bg-white/[0.07] transition px-3 py-2"
                      >
                        <div className="min-w-0">
                          <div className="text-sm text-white font-medium truncate">
                            {r.name ?? r.receiver_id}
                          </div>
                          <div className="text-[11px] text-gray-400 truncate">
                            {acc?.company ?? "—"}{" "}
                            {acc?.server ? `• ${acc.server}` : ""}{" "}
                            {acc?.leverage ? `• 1:${acc.leverage}` : ""}
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <Pill color={online ? "green" : "red"}>
                              {online ? "Online" : "Offline"}
                            </Pill>
                            <Pill color="blue">
                              v{r.settings_version ?? "—"}
                            </Pill>
                            <Pill color="gray">
                              {rules?.breakeven?.mode ?? "BE: —"}
                            </Pill>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <div className="text-sm text-white font-semibold">
                            ${equity.toLocaleString()}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Quick Actions */}
            <Card>
              <div className="text-white font-medium">Quick Actions</div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <Link
                  href="/receivers?open=create"
                  className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-200 text-sm py-2 text-center"
                >
                  New Receiver
                </Link>
                <Link
                  href="/receivers"
                  className="rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-gray-200 text-sm py-2 text-center"
                >
                  Manage Receivers
                </Link>
                <Link
                  href="/accounts"
                  className="rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-gray-200 text-sm py-2 text-center"
                >
                  Accounts
                </Link>
                <Link
                  href="/news"
                  className="rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-gray-200 text-sm py-2 text-center"
                >
                  Changelogs
                </Link>
              </div>
            </Card>

            {/* System Notes (aus /api/news – Top 3) */}
            <Card>
              <div className="flex items-center justify-between">
                <div className="text-white font-medium">System Notes</div>
                <Link
                  href="/news"
                  className="text-xs text-indigo-300 hover:text-indigo-200"
                >
                  View all
                </Link>
              </div>

              <ul className="mt-3 space-y-2 text-sm text-gray-300">
                {news.length > 0 ? (
                  news.slice(0, 3).map((it) => (
                    <li key={it.id} className="flex items-start gap-2">
                      <span className="mt-1.5 size-1.5 rounded-full bg-blue-400/80" />
                      <Link
                        href="/news"
                        className="hover:text-indigo-300 transition-colors"
                      >
                        {truncate(it.title, 120)}
                      </Link>
                    </li>
                  ))
                ) : (
                  <>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 size-1.5 rounded-full bg-emerald-400/80" />
                      <span>
                        Breakeven on{" "}
                        <span className="text-white font-medium">TP hit</span>{" "}
                        has been fixed and is broker-safe.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 size-1.5 rounded-full bg-blue-400/80" />
                      <span>
                        Download the latest EA from{" "}
                        <Link href="/receivers" className="text-indigo-300">
                          Receivers
                        </Link>
                        .
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 size-1.5 rounded-full bg-amber-400/80" />
                      <span>
                        Registrations can be toggled in{" "}
                        <span className="text-white font-medium">
                          Site Settings
                        </span>{" "}
                        (Sanity).
                      </span>
                    </li>
                  </>
                )}
              </ul>
            </Card>
          </div>

          {/* Overview charts (zentriert) */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            <Card>
              <div className="text-white font-medium mb-3">
                Equity by Account
              </div>
              {loading ? (
                <Skeleton className="h-44" />
              ) : (
                <BarChart
                  data={equityByAccount}
                  valueLabel={(d) =>
                    `$${n(d.value).toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}`
                  }
                />
              )}
            </Card>
            <Card>
              <div className="text-white font-medium mb-3">
                Open Positions by Receiver
              </div>
              {loading ? (
                <Skeleton className="h-44" />
              ) : (
                <BarChart
                  data={openPosByReceiver}
                  valueLabel={(d) => String(n(d.value))}
                />
              )}
            </Card>
          </div>

          {/* Deep-dive */}
          {activeAid && (
            <>
              {/* Account + Range */}
              <Card>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-white font-medium">Analytics</div>
                  <div className="flex items-center gap-4 flex-col md:flex-row">
                    {accountOptions.length > 1 && (
                      <div className="text-sm text-gray-300 flex items-center gap-2">
                        <span>Account:</span>
                        <select
                          className="bg-white/5 border border-white/10 rounded px-2 py-1 text-gray-200"
                          value={activeAid ?? ""}
                          onChange={(e) => setActiveAid(e.target.value || null)}
                        >
                          {accountOptions.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <RangeTabs
                      value={eqRange}
                      onChange={setEqRange}
                      label="Equity"
                    />
                    <RangeTabs
                      value={balRange}
                      onChange={setBalRange}
                      label="Balance"
                    />
                  </div>
                </div>
              </Card>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                <Card>
                  <div className="text-white font-medium mb-2">
                    Equity Timeline ({String(activeAid)})
                  </div>
                  {!coreLoadedRef.current || !deepLoadedRef.current ? (
                    <Skeleton className="h-64" />
                  ) : (
                    <LineChart
                      series={[
                        {
                          label: "Equity",
                          points: eqPrepared.pts,
                          color: "#6366F1",
                        },
                      ]}
                      xTicks={eqPrepared.ticks}
                      yFormat={(v) =>
                        `$${v.toLocaleString(undefined, {
                          maximumFractionDigits: 0,
                        })}`
                      }
                    />
                  )}
                </Card>

                <Card>
                  <div className="text-white font-medium mb-2">
                    Balance Timeline ({String(activeAid)})
                  </div>
                  {!coreLoadedRef.current || !deepLoadedRef.current ? (
                    <Skeleton className="h-64" />
                  ) : (
                    <LineChart
                      series={[
                        {
                          label: "Balance",
                          points: balPrepared.pts,
                          color: "#22C55E",
                        },
                      ]}
                      xTicks={balPrepared.ticks}
                      yFormat={(v) =>
                        `$${v.toLocaleString(undefined, {
                          maximumFractionDigits: 0,
                        })}`
                      }
                    />
                  )}
                </Card>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                <Card>
                  <div className="text-white font-medium mb-2">
                    Daily PnL (last ~20 days)
                  </div>
                  {trades === null ? (
                    <Skeleton className="h-56" />
                  ) : pnlByDay.length === 0 ? (
                    <div className="text-sm text-gray-500">No trades.</div>
                  ) : (
                    <>
                      <BarChart
                        data={pnlByDay}
                        height={300}
                        value={(d) => Math.abs(n(d.value))}
                        valueLabel={(d) =>
                          `${n(d.value) >= 0 ? "+" : ""}${n(d.value).toFixed(2)}`
                        }
                        barFill={
                          (d) =>
                            n(d.value) >= 0
                              ? "rgba(16,185,129,0.9)" // emerald
                              : "rgba(244,63,94,0.9)" // rose
                        }
                      />
                      <div className="mt-2 text-[11px] text-gray-400 px-2">
                        Bars are sized by absolute PnL; color encodes sign.
                      </div>
                    </>
                  )}
                </Card>

                <Card>
                  <div className="text-white font-medium mb-2">
                    Win Rate (last {trades?.length ?? 0} closed trades)
                  </div>
                  {trades === null ? (
                    <Skeleton className="h-56" />
                  ) : (
                    <div className="w-full flex justify-center">
                      <div className="flex items-center gap-8 max-w-5xl w-full px-2">
                        <div className="relative w-36 h-36 mx-auto">
                          {/* donut */}
                          <svg viewBox="0 0 36 36" className="w-36 h-36">
                            <circle
                              cx="18"
                              cy="18"
                              r="15.915"
                              fill="none"
                              stroke="currentColor"
                              className="text-white/10"
                              strokeWidth="3"
                            />
                            <circle
                              cx="18"
                              cy="18"
                              r="15.915"
                              fill="none"
                              strokeDasharray={`${Math.min(
                                100,
                                winStats.rate
                              )}, 100`}
                              strokeDashoffset="25"
                              className="text-emerald-400"
                              strokeWidth="3"
                              strokeLinecap="round"
                              style={{
                                transform: "rotate(-90deg)",
                                transformOrigin: "50% 50%",
                              }}
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-white text-lg font-semibold">
                              {winStats.rate.toFixed(0)}%
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-300">
                          <div>
                            Wins:{" "}
                            <span className="text-emerald-300">
                              {winStats.wins}
                            </span>
                          </div>
                          <div>
                            Losses:{" "}
                            <span className="text-rose-300">
                              {winStats.losses}
                            </span>
                          </div>
                          {winStats.breakeven > 0 && (
                            <div>
                              Breakeven:{" "}
                              <span className="text-gray-300">
                                {winStats.breakeven}
                              </span>
                            </div>
                          )}
                          <div className="text-[11px] text-gray-500 mt-1">
                            Rate excludes breakeven trades
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
