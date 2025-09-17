/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Upstream-URL (kannst du per ENV überschreiben)
const FF_URL =
  process.env.FF_CALENDAR_URL ??
  "https://nfs.faireconomy.media/ff_calendar_thisweek.json";

// ForexFactory aktualisiert nur stündlich -> wir cachen 60min.
// Bei Rate-Limit liefern wir die letzte, evtl. „stale“ Kopie.
const TTL_MS = 60 * 60 * 1000;

// Simpler In-Memory-Cache (pro Server-Instance)
let CACHE: { ts: number; data: any } | null = null;

export async function GET() {
  const now = Date.now();

  // 1) Frischer Cache -> sofort liefern
  if (CACHE && now - CACHE.ts < TTL_MS) {
    return NextResponse.json(
      { ok: true, stale: false, items: CACHE.data },
      { headers: { "x-cache": "hit" } }
    );
  }

  // 2) Upstream abrufen
  try {
    // Hinweis: Bei Block/Fehler liefert FF HTML statt JSON.
    const r = await fetch(FF_URL, { cache: "no-store" });
    const text = await r.text();

    // Pragmatische Erkennung auf „sieht nach JSON aus“
    if (!r.ok || !text.trim().startsWith("{")) {
      throw new Error(`Upstream error or blocked (${r.status})`);
    }

    const json = JSON.parse(text);

    // Cache aktualisieren
    CACHE = { ts: now, data: json };

    return NextResponse.json(
      { ok: true, stale: false, items: json },
      { headers: { "x-cache": "miss" } }
    );
  } catch {
    // 3) Bei Fehler: Stale Cache zurückgeben, falls vorhanden
    if (CACHE) {
      return NextResponse.json(
        { ok: true, stale: true, items: CACHE.data },
        { headers: { "x-cache": "stale" } }
      );
    }

    // 4) Gar nichts im Cache -> 503
    return NextResponse.json(
      {
        ok: false,
        error: "upstream_unavailable_or_rate_limited",
        message:
          "Calendar feed temporarily unavailable (rate limited). Please try again in a few minutes.",
      },
      { status: 503 }
    );
  }
}
