/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";

// ---- Simple in-memory cache (persists while serverless instance lives) ----
type Cache = { items: any[]; ts: number; source: "ff" | "te" };
let CACHE: Cache | null = null;
let LAST_FAIL = 0;

const TTL_MS = 60 * 60 * 1000; // serve fresh up to 60 min
const FAIL_BACKOFF_MS = 5 * 60 * 1000; // after a failure, don't hammer upstream for 5 min

function startOfWeek(d = new Date()) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // Mon=0
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - day);
  return x;
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function ymd(d: Date) {
  return d.toISOString().slice(0, 10);
}

function ok(items: any[], source: "ff" | "te", stale = false) {
  return NextResponse.json({ ok: true, items, source, stale });
}
function err(message: string, code = 503) {
  return NextResponse.json(
    { ok: false, error: message, message },
    { status: code }
  );
}

// ---------------------------- Fetchers / Mappers ---------------------------

// 1) ForexFactory "this week" JSON
async function fetchFF(): Promise<any[]> {
  const url = "https://nfs.faireconomy.media/ff_calendar_thisweek.json";
  const r = await fetch(url, {
    cache: "no-store",
    headers: {
      // freundlicher UA (hilft teils bei restriktiven Kanten)
      "User-Agent": "PipvaroDashboard/1.0 (+https://pipvaro.com)",
    },
  });
  if (!r.ok) throw new Error(`ff_upstream_${r.status}`);
  const json = await r.json();
  // die Datei ist bereits ein Array mit Items
  if (Array.isArray(json)) return json;
  if (Array.isArray((json as any)?.result)) return (json as any).result;
  throw new Error("ff_unexpected_shape");
}

// 2) TradingEconomics (Fallback)
// Docs: https://docs.tradingeconomics.com/?javascript#calendar
// Kostenloser Gast: c=guest:guest  (empfohlen: ENV mit eigenen Credentials)
async function fetchTE(d1: string, d2: string): Promise<any[]> {
  const cred = process.env.TRADING_ECONOMICS_CRED?.trim() || "guest:guest";
  const url = `https://api.tradingeconomics.com/calendar?d1=${d1}&d2=${d2}&c=${encodeURIComponent(
    cred
  )}&format=json`;
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`te_upstream_${r.status}`);
  const arr = await r.json();
  if (!Array.isArray(arr)) throw new Error("te_unexpected_shape");

  // -> Map auf FF-ähnliche Struktur, damit Frontend nichts ändern muss
  // TE Felder: Country, Category, DateTime, Importance(1-3), Previous, Forecast, Actual, Currency
  return arr.map((x: any) => {
    const impNum = Number(x?.Importance ?? 0);
    const impact =
      impNum >= 3
        ? "High"
        : impNum === 2
          ? "Medium"
          : impNum === 1
            ? "Low"
            : "Other";

    const ts = x?.Date || x?.DateTime;
    const unix = ts ? Math.floor(new Date(ts).getTime() / 1000) : undefined;

    return {
      title: x?.Category || x?.Event || "—",
      country: x?.Country || null,
      currency: x?.Currency ?? null,
      impact,
      timestamp: unix,
      previous: x?.Previous ?? null,
      forecast: x?.Forecast ?? null,
      actual: x?.Actual ?? null,
    };
  });
}

// --------------------------------- Handler ---------------------------------

export async function GET() {
  const now = Date.now();

  // serve fresh cache
  if (CACHE && now - CACHE.ts < TTL_MS) {
    return ok(CACHE.items, CACHE.source, false);
  }

  // if we recently failed, and we *have* a cache: serve stale and don't hammer upstream
  if (now - LAST_FAIL < FAIL_BACKOFF_MS && CACHE) {
    return ok(CACHE.items, CACHE.source, true);
  }

  const weekStart = startOfWeek(new Date());
  const weekEnd = addDays(weekStart, 6);
  const d1 = ymd(weekStart);
  const d2 = ymd(weekEnd);

  // Try FF first (beste Kompatibilität mit deinem Mapping)
  try {
    const items = await fetchFF();
    CACHE = { items, ts: now, source: "ff" };
    return ok(items, "ff", false);
  } catch {
    // ignore, try TE fallback
  }

  try {
    const items = await fetchTE(d1, d2);
    CACHE = { items, ts: now, source: "te" };
    return ok(items, "te", false);
  } catch (e) {
    LAST_FAIL = now;

    // If we still have something cached, serve stale
    if (CACHE) {
      return ok(CACHE.items, CACHE.source, true);
    }
    return err(
      "upstream_unavailable_or_rate_limited: Calendar feed temporarily unavailable. Please try again later.",
      503
    );
  }
}
