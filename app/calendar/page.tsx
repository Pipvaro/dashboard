"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import Image from "next/image";
import Card from "@/components/packs/Card";
import {
  CalendarDays,
  Filter,
  AlertTriangle,
  CircleDot,
  Dot,
  Clock3,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ----------------------------- Types & helpers ---------------------------- */

type FFItem = {
  title: string;
  country?: string;
  impact?: "High" | "Medium" | "Low" | string;
  date?: string; // e.g. "Sep 17"
  time?: string; // e.g. "8:30am"
  timestamp?: number; // unix seconds
  previous?: string | null;
  forecast?: string | null;
  actual?: string | null;
  currency?: string | null;
};

type Event = {
  id: string;
  dt: Date; // local Date
  impact: "High" | "Medium" | "Low" | "Other";
  title: string;
  country: string | null;
  previous?: string | null;
  forecast?: string | null;
  actual?: string | null;
};

function startOfWeek(d = new Date()) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // Mon=0 ... Sun=6
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - day);
  return x;
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function fmtDayLabel(d: Date) {
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}
function fmtTime(d: Date) {
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}
function impactKey(x?: string): Event["impact"] {
  const v = String(x || "").toLowerCase();
  if (v.startsWith("high")) return "High";
  if (v.startsWith("med")) return "Medium";
  if (v.startsWith("low")) return "Low";
  return "Other";
}
function impactHue(i: Event["impact"]) {
  if (i === "High") return "text-rose-400 border-rose-500/30 bg-rose-500/10";
  if (i === "Medium")
    return "text-amber-300 border-amber-500/30 bg-amber-500/10";
  if (i === "Low") return "text-sky-300 border-sky-500/30 bg-sky-500/10";
  return "text-gray-300 border-gray-600/30 bg-gray-600/10";
}
function impactDot(i: Event["impact"]) {
  if (i === "High") return <AlertTriangle className="size-3.5" />;
  if (i === "Medium") return <CircleDot className="size-3.5" />;
  if (i === "Low") return <Dot className="size-4" />;
  return <Dot className="size-4" />;
}

/* --------------------------------- Page ---------------------------------- */

export default function CalendarPage() {
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [stale, setStale] = useState(false);

  // filter: show low/medium/high
  const [showLow, setShowLow] = useState(true);
  const [showMed, setShowMed] = useState(true);
  const [showHigh, setShowHigh] = useState(true);

  // fetch current week feed via our cached API
  useEffect(() => {
    let canceled = false;
    async function load() {
      try {
        setLoading(true);
        setErr(null);

        const r = await fetch("/api/calendar/week", { cache: "no-store" });
        const d = await r.json();
        if (!d?.ok) throw new Error("feed failed");

        setStale(Boolean(d.stale));

        // Die ForexFactory-Datei ist ein Array von Items – d.items direkt nutzen.
        const feed = d.items;
        const arr: FFItem[] = Array.isArray(feed)
          ? feed
          : Array.isArray(feed?.result)
            ? feed.result
            : [];

        const normalized: Event[] = arr
          .map((x, idx) => {
            const ts =
              typeof x.timestamp === "number" ? x.timestamp * 1000 : undefined;
            const dt =
              ts && !Number.isNaN(ts)
                ? new Date(ts)
                : new Date(`${x.date} ${new Date().getFullYear()} ${x.time}`);
            return {
              id: `${ts || idx}-${x.title}`,
              dt,
              impact: impactKey(x.impact),
              title: x.title,
              country: x.country || x.currency || null,
              previous: x.previous ?? null,
              forecast: x.forecast ?? null,
              actual: x.actual ?? null,
            };
          })
          .filter((e) => Number.isFinite(e.dt.getTime()))
          .sort((a, b) => a.dt.getTime() - b.dt.getTime());

        if (!canceled) setEvents(normalized);
      } catch {
        if (!canceled) setErr("Failed to load calendar feed.");
      } finally {
        if (!canceled) setLoading(false);
      }
    }
    load();
    return () => {
      canceled = true;
    };
  }, []);

  // current week days (Mon..Sun)
  const weekStart = useMemo(() => startOfWeek(new Date()), []);
  const days = useMemo(
    () => [...Array(7)].map((_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  // filter by impact
  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (e.impact === "High" && !showHigh) return false;
      if (e.impact === "Medium" && !showMed) return false;
      if (e.impact === "Low" && !showLow) return false;
      return true;
    });
  }, [events, showHigh, showLow, showMed]);

  // bucket by day (Index relativ zur Wochenbasis, robust an Monatsgrenzen)
  const byDay = useMemo(() => {
    const map: Record<number, Event[]> = {
      0: [],
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
      6: [],
    };
    const base = weekStart.getTime();
    for (const e of filtered) {
      const idx = Math.floor((e.dt.getTime() - base) / 86_400_000); // ms -> Tage
      if (idx >= 0 && idx < 7) map[idx].push(e);
    }
    for (const k of Object.keys(map)) {
      const i = Number(k);
      map[i].sort((a, b) => a.dt.getTime() - b.dt.getTime());
    }
    return map;
  }, [filtered, weekStart]);

  return (
    <div className="min-h-screen bg-[#0b0f14]">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Mobile header */}
      <div className="h-20 border-b md:hidden border-gray-700/50 flex justify-between items-center px-4">
        <Image
          src={"/assets/Transparent/logo-dash.png"}
          alt="logo"
          height={100}
          width={250}
          className="w-32 md:hidden block"
        />
        <MobileNav />
      </div>

      <main className="md:ml-72 px-6 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
              <CalendarDays className="size-5 text-indigo-400" />
              Economic Calendar
            </h1>
            <p className="text-sm text-gray-400">
              Current week, grouped by day. Times are shown in your local
              timezone.
            </p>
          </div>
        </div>

        {/* Controls */}
        <Card>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="text-xs text-gray-400 flex items-center gap-2">
              <Filter className="size-4" /> Impact filter
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <FilterPill
                active={showHigh}
                onClick={() => setShowHigh((v) => !v)}
                color="rose"
                icon={<AlertTriangle className="size-4" />}
              >
                High
              </FilterPill>
              <FilterPill
                active={showMed}
                onClick={() => setShowMed((v) => !v)}
                color="amber"
                icon={<CircleDot className="size-4" />}
              >
                Medium
              </FilterPill>
              <FilterPill
                active={showLow}
                onClick={() => setShowLow((v) => !v)}
                color="sky"
                icon={<Dot className="size-5" />}
              >
                Low
              </FilterPill>
            </div>
          </div>

          {stale && (
            <div className="mt-3 text-[11px] text-amber-300">
              Showing cached data (source is rate-limited and updates hourly).
            </div>
          )}
        </Card>

        {/* Loading / Error */}
        {loading && (
          <Card className="mt-4">
            <div className="py-8 text-center text-gray-400">
              Loading calendar…
            </div>
          </Card>
        )}
        {err && !loading && (
          <Card className="mt-4">
            <div className="py-8 text-center text-rose-300">{err}</div>
          </Card>
        )}

        {/* Week grid */}
        {!loading && !err && (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-7 gap-4">
            {days.map((d, idx) => {
              const list = byDay[idx] || [];
              const isToday = sameDay(d, new Date());
              return (
                <Card
                  key={d.toISOString()}
                  className={cn(
                    "p-0 overflow-hidden",
                    isToday && "ring-1 ring-indigo-500/50"
                  )}
                >
                  {/* Day header */}
                  <div
                    className={cn(
                      "px-4 py-3 border-b border-gray-800 flex items-center justify-between",
                      isToday ? "bg-indigo-500/10" : "bg-[#0f1419]"
                    )}
                  >
                    <div className="text-white font-medium">
                      {fmtDayLabel(d)}
                    </div>
                    {isToday && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        Today
                      </span>
                    )}
                  </div>

                  {/* Events */}
                  <div className="p-3 space-y-2">
                    {!list.length ? (
                      <div className="text-xs text-gray-500 py-4 text-center">
                        No events
                      </div>
                    ) : (
                      list.map((e) => (
                        <div
                          key={e.id}
                          className={cn(
                            "rounded-md border px-3 py-2 text-sm",
                            impactHue(e.impact)
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span
                                  className={cn(
                                    "inline-flex items-center justify-center size-5 rounded",
                                    impactHue(e.impact)
                                  )}
                                >
                                  {impactDot(e.impact)}
                                </span>
                                <span className="text-white truncate">
                                  {e.title}
                                </span>
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-3 text-[12px] text-gray-300">
                                <span className="inline-flex items-center gap-1">
                                  <Clock3 className="size-3.5" />{" "}
                                  {fmtTime(e.dt)}
                                </span>
                                {e.country && (
                                  <span className="inline-flex items-center gap-1">
                                    <Globe className="size-3.5" /> {e.country}
                                  </span>
                                )}
                                {e.actual && (
                                  <span className="text-emerald-300">
                                    Actual: {e.actual}
                                  </span>
                                )}
                                {e.forecast && (
                                  <span className="text-indigo-300">
                                    Forecast: {e.forecast}
                                  </span>
                                )}
                                {e.previous && (
                                  <span className="text-gray-400">
                                    Prev: {e.previous}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Attribution */}
        <p className="text-[11px] text-gray-500 mt-6">
          Data source: ForexFactory weekly calendar feed.
        </p>
      </main>
    </div>
  );
}

/* -------------------------------- Components ------------------------------ */

function FilterPill({
  active,
  onClick,
  color,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  color: "rose" | "amber" | "sky";
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const activeCls =
    color === "rose"
      ? "bg-rose-500/15 border-rose-500 text-rose-300"
      : color === "amber"
        ? "bg-amber-500/15 border-amber-500 text-amber-300"
        : "bg-sky-500/15 border-sky-500 text-sky-300";
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm border transition",
        active
          ? activeCls
          : "bg-[#0f1419] border-gray-800 text-gray-300 hover:border-gray-700"
      )}
      aria-pressed={active}
    >
      {icon}
      {children}
    </button>
  );
}
