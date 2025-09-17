"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import Image from "next/image";
import Card from "@/components/packs/Card";
import {
  CalendarDays,
  MapPin,
  ChevronDown,
  Download,
  AlertTriangle,
  CircleDot,
  Dot,
  Clock3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "@heroicons/react/24/outline";

/* ----------------------------- Types & helpers ---------------------------- */

type FFItem = {
  title: string;
  country?: string;
  impact?: "High" | "Medium" | "Low" | string;
  date?: string;
  time?: string;
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
  instrument: string | null; // country/currency label
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
function fmtTime(d: Date) {
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}
function fmtDayShort(d: Date) {
  return d.toLocaleDateString(undefined, { weekday: "short", day: "2-digit" });
}
function fmtRange(a: Date, b: Date) {
  const sameMonth = a.getMonth() === b.getMonth();
  const sameYear = a.getFullYear() === b.getFullYear();
  const optA: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
  };
  const optB: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
  };
  const sa = a.toLocaleDateString(undefined, optA);
  const sb = b.toLocaleDateString(
    undefined,
    sameMonth && sameYear
      ? { day: "2-digit", year: "numeric", month: "short" }
      : optB
  );
  return `${sa} - ${sb}`;
}
function impactKey(x?: string): Event["impact"] {
  const v = String(x || "").toLowerCase();
  if (v.startsWith("high")) return "High";
  if (v.startsWith("med")) return "Medium";
  if (v.startsWith("low")) return "Low";
  return "Other";
}
function impactPill(i: Event["impact"]) {
  if (i === "High")
    return "bg-rose-500/15 text-rose-300 border border-rose-500/30";
  if (i === "Medium")
    return "bg-amber-500/15 text-amber-300 border border-amber-500/30";
  if (i === "Low") return "bg-sky-500/15 text-sky-300 border border-sky-500/30";
  return "bg-gray-600/10 text-gray-300 border border-gray-600/30";
}
function impactIcon(i: Event["impact"]) {
  if (i === "High") return <AlertTriangle className="size-4" />;
  if (i === "Medium") return <CircleDot className="size-4" />;
  return <Dot className="size-5" />;
}

/* --------------------------------- Page ---------------------------------- */

export default function CalendarPage() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const didAutoScroll = useRef(false); // <- auto-scroll only once

  // filters
  const [fHigh, setFHigh] = useState(true);
  const [fMed, setFMed] = useState(true);
  const [fLow, setFLow] = useState(true);
  const [hidePast, setHidePast] = useState(false);
  const [instrument, setInstrument] = useState<string>("All");

  // fetch (mit FF/TE behind /api/calendar/week)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const r = await fetch("/api/calendar/week", { cache: "no-store" });
        const d = await r.json();
        if (!d?.ok || !Array.isArray(d.items)) throw new Error("feed failed");
        const arr: FFItem[] = d.items;

        const normalized: Event[] = arr
          .map((x, idx) => {
            let dt: Date | null = null;
            if (typeof x.timestamp === "number") {
              const ms = x.timestamp * 1000;
              if (Number.isFinite(ms)) dt = new Date(ms);
            }
            if (!dt && x.date && x.time) {
              const t = new Date(
                `${x.date} ${new Date().getFullYear()} ${x.time}`
              );
              if (!isNaN(t.getTime())) dt = t;
            }
            if (!dt && x.date) {
              const t = new Date(x.date);
              if (!isNaN(t.getTime())) dt = t;
            }
            if (!dt) return null;

            return {
              id: `${x.timestamp ?? idx}-${x.title}`,
              dt,
              impact: impactKey(x.impact),
              title: x.title,
              instrument: x.country || x.currency || null,
              previous: x.previous ?? null,
              forecast: x.forecast ?? null,
              actual: x.actual ?? null,
            } as Event;
          })
          .filter((e): e is Event => !!e)
          .sort((a, b) => a.dt.getTime() - b.dt.getTime());

        if (!cancelled) setEvents(normalized);
      } catch (e) {
        if (!cancelled) setErr("Failed to load calendar feed.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // week range + days
  const weekStart = useMemo(() => startOfWeek(new Date()), []);
  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);
  const days = useMemo(
    () => [...Array(7)].map((_, i) => addDays(weekStart, i)),
    [weekStart]
  );
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "Local";

  // instruments from data
  const instruments = useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => e.instrument && set.add(e.instrument));
    return ["All", ...Array.from(set).sort()];
  }, [events]);

  // filtered
  const filtered = useMemo(() => {
    const now = new Date();
    return events.filter((e) => {
      if (hidePast && e.dt < now) return false;
      if (!fHigh && e.impact === "High") return false;
      if (!fMed && e.impact === "Medium") return false;
      if (!fLow && e.impact === "Low") return false;
      if (instrument !== "All" && e.instrument !== instrument) return false;
      return true;
    });
  }, [events, fHigh, fMed, fLow, hidePast, instrument]);

  // bucket by day (nur Events dieser Woche)
  const byDay = useMemo(() => {
    const map: Record<string, Event[]> = {};
    days.forEach((d) => {
      const k = new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate()
      ).toDateString();
      map[k] = [];
    });
    const weekEndNext = addDays(weekEnd, 1);
    filtered.forEach((e) => {
      if (e.dt >= weekStart && e.dt < weekEndNext) {
        const key = new Date(
          e.dt.getFullYear(),
          e.dt.getMonth(),
          e.dt.getDate()
        ).toDateString();
        if (map[key]) map[key].push(e);
      }
    });
    Object.values(map).forEach((list) =>
      list.sort((a, b) => a.dt.getTime() - b.dt.getTime())
    );
    return map;
  }, [filtered, days, weekStart, weekEnd]);

  // --- NEW: auto-scroll to "today" on first load
  useEffect(() => {
    if (didAutoScroll.current) return;
    // run after first paint to ensure anchors exist
    const id = "today-anchor";
    const doScroll = () => {
      const el = document.getElementById(id);
      if (el) {
        didAutoScroll.current = true;
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
    // give the browser one frame
    const t = setTimeout(doScroll, 0);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-[#0b0f14] overflow-x-hidden">
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

      <div className="bg-[#3f4bf2] w-full py-2 px-4 text-white md:ml-72">
        <p className="text-sm">
          🚀 Welcome to Pipvaro! Your trading automation starts here.{" "}
          <strong>
            Since we are currently in beta phase some features may not be
            available.
          </strong>
        </p>
      </div>
      <main className="md:ml-72 px-4 md:px-6 py-6 space-y-4">
        {/* Header bar – FTMO-like */}
        <div>
          <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
            <CalendarIcon className="size-5 text-indigo-400" />
            Economic Calendar
          </h1>
          <p className="text-sm text-gray-400">
            Stay updated with the latest economic events and their impact on the
            markets.
          </p>
        </div>
        <Card className="p-0 overflow-hidden hover:bg-gray-800/50">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between px-4 py-3 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <button
                className="rounded-md border border-gray-700 px-3 py-1.5 text-sm text-gray-200 hover:bg-gray-700/30"
                onClick={() => {
                  const todayEl = document.getElementById("today-anchor");
                  todayEl?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }}
              >
                Today
              </button>
              <div className="text-white font-medium">
                {fmtRange(weekStart, weekEnd)}
              </div>
            </div>

            <div className="flex items-center">
              <div className="hidden md:flex items-center gap-2 text-gray-300 text-sm px-2 py-1.5 rounded-md border border-gray-800">
                <MapPin className="size-4 text-indigo-300" />
                {tz}
              </div>
            </div>
          </div>

          {/* Day "tabs" */}
          <div className="flex flex-wrap gap-2 px-4 py-3 border-b border-gray-800">
            {days.map((d) => {
              const isToday = sameDay(d, new Date());
              return (
                <a
                  key={d.toISOString()}
                  href={`#d-${d.toDateString()}`}
                  className={cn(
                    "min-w-[84px] text-center rounded-md px-3 py-1.5 text-sm border",
                    isToday
                      ? "bg-indigo-500/15 border-indigo-500 text-indigo-300"
                      : "bg-[#0f1419] border-gray-800 text-gray-300 hover:border-gray-700"
                  )}
                >
                  {fmtDayShort(d)}
                </a>
              );
            })}
          </div>

          {/* Filters row */}
          <div className="px-4 py-3 grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Impact */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs text-gray-400">Impact</span>
              <CheckChip
                active={fHigh}
                onChange={() => setFHigh((v) => !v)}
                color="rose"
                icon={<AlertTriangle className="size-4" />}
                label="High"
              />
              <CheckChip
                active={fMed}
                onChange={() => setFMed((v) => !v)}
                color="amber"
                icon={<CircleDot className="size-4" />}
                label="Medium"
              />
              <CheckChip
                active={fLow}
                onChange={() => setFLow((v) => !v)}
                color="sky"
                icon={<Dot className="size-5" />}
                label="Low"
              />
            </div>

            {/* Visibility */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs text-gray-400">Visibility</span>
              <ToggleChip
                active={hidePast}
                onClick={() => setHidePast((v) => !v)}
                label="Hide past news"
              />
            </div>

            {/* Instrument */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs text-gray-400">Instrument</span>
              <div className="relative">
                <select
                  value={instrument}
                  onChange={(e) => setInstrument(e.target.value)}
                  className="appearance-none bg-[#0f1419] border border-gray-800 text-gray-200 text-sm rounded-md pl-3 pr-7 py-1.5 outline-none hover:border-gray-700"
                >
                  {instruments.map((it) => (
                    <option key={it} value={it}>
                      {it}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
              </div>
            </div>
          </div>
        </Card>

        {/* Loading / Error */}
        {loading && (
          <Card>
            <div className="py-8 text-center text-gray-400">
              Loading calendar…
            </div>
          </Card>
        )}
        {err && !loading && (
          <Card>
            <div className="py-8 text-center text-rose-300">{err}</div>
          </Card>
        )}

        {/* Day sections (untereinander) */}
        {!loading &&
          !err &&
          days.map((d) => {
            const key = new Date(
              d.getFullYear(),
              d.getMonth(),
              d.getDate()
            ).toDateString();
            const list = byDay[key] || [];
            const isToday = sameDay(d, new Date());
            return (
              <section key={key} id={isToday ? "today-anchor" : `d-${key}`}>
                {/* Day header */}
                <div className="mt-2 mb-2 px-2">
                  <div
                    className={cn(
                      "inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium border",
                      isToday
                        ? "bg-indigo-500/15 border-indigo-500 text-indigo-300"
                        : "bg-[#0f1419] border-gray-800 text-gray-200"
                    )}
                  >
                    {d.toLocaleDateString(undefined, {
                      weekday: "long",
                      day: "2-digit",
                      month: "short",
                    })}
                    {isToday && (
                      <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        Today
                      </span>
                    )}
                  </div>
                </div>

                {/* Table like FTMO */}
                {/* NOTE: hover explicitly disabled ONLY here */}
                <Card className="p-0 overflow-hidden hover:shadow-none hover:bg-gray-800/50 hover:ring-0 transition-none">
                  {/* header row */}
                  <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-2 text-xs text-gray-400 border-b border-gray-800">
                    <div className="col-span-6">Description</div>
                    <div className="col-span-2">Instrument</div>
                    <div className="col-span-2">Date</div>
                    <div className="col-span-1 text-right">Forecast</div>
                    <div className="col-span-1 text-right">Previous</div>
                  </div>

                  {!list.length ? (
                    <div className="px-4 py-6 text-sm text-gray-500">
                      No events
                    </div>
                  ) : (
                    <ul>
                      {list.map((e) => (
                        <li
                          key={e.id}
                          className={cn(
                            "grid grid-cols-1 md:grid-cols-12 gap-2 px-4 py-3 border-b border-gray-900/60",
                            e.impact === "High" && "bg-rose-500/5"
                          )}
                        >
                          {/* description + impact pill */}
                          <div className="col-span-6 flex items-start gap-2">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px]",
                                impactPill(e.impact)
                              )}
                            >
                              {impactIcon(e.impact)}
                              {e.impact}
                            </span>
                            <div className="text-gray-100 leading-tight">
                              {e.title}
                            </div>
                          </div>

                          {/* instrument */}
                          <div className="col-span-2 text-gray-300">
                            {e.instrument ?? "—"}
                          </div>

                          {/* time */}
                          <div className="col-span-2 text-gray-300 inline-flex items-center gap-1">
                            <Clock3 className="size-4 text-gray-400" />
                            {fmtTime(e.dt)}
                          </div>

                          {/* forecast / previous (right aligned like FTMO) */}
                          <div className="col-span-1 md:text-right text-gray-200">
                            {e.forecast ?? "—"}
                          </div>
                          <div className="col-span-1 md:text-right text-gray-400">
                            {e.previous ?? "—"}
                          </div>

                          {/* mobile extra row: actual (falls vorhanden) */}
                          {e.actual && (
                            <div className="md:hidden col-span-12 text-[12px] text-emerald-300 pt-1">
                              Actual: {e.actual}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </section>
            );
          })}

        <p className="text-[11px] text-gray-500">
          Source: ForexFactory & TradingEconomics (weekly feed). Times shown in{" "}
          {tz}.
        </p>
      </main>
    </div>
  );
}

/* -------------------------------- UI bits -------------------------------- */

function CheckChip({
  active,
  onChange,
  color,
  icon,
  label,
}: {
  active: boolean;
  onChange: () => void;
  color: "rose" | "amber" | "sky";
  icon: React.ReactNode;
  label: string;
}) {
  const activeCls =
    color === "rose"
      ? "bg-rose-500/15 border-rose-500 text-rose-300"
      : color === "amber"
        ? "bg-amber-500/15 border-amber-500 text-amber-300"
        : "bg-sky-500/15 border-sky-500 text-sky-300";
  return (
    <button
      onClick={onChange}
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm border",
        active
          ? activeCls
          : "bg-[#0f1419] border-gray-800 text-gray-300 hover:border-gray-700"
      )}
      aria-pressed={active}
    >
      {icon}
      {label}
    </button>
  );
}

function ToggleChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm border",
        active
          ? "bg-indigo-500/15 border-indigo-500 text-indigo-300"
          : "bg-[#0f1419] border-gray-800 text-gray-300 hover:border-gray-700"
      )}
      aria-pressed={active}
    >
      {active ? "✓" : ""} {label}
    </button>
  );
}
