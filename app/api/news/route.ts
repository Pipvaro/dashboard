// app/api/news/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { client } from "@/sanity/lib/client";
import { groq } from "next-sanity";
import {
  RELEASE_ITEMS_QUERY,
  TAGS_QUERY,
  CHANGELOGS_QUERY,
} from "@/sanity/lib/queries";

export const dynamic = "force-dynamic";

type UiItem = {
  id: string;
  type: "news" | "changelog";
  version?: string;
  date: string;
  title: string;
  body?: string;
  tags: string[];
  highlights?: string[];
};

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limit = Math.max(
      1,
      Math.min(parseInt(url.searchParams.get("limit") || "100", 10), 500)
    );

    const [rawItems, tags, changelogs] = await Promise.all([
      client.fetch(groq`${RELEASE_ITEMS_QUERY}[0...$limit]`, { limit }),
      client.fetch(TAGS_QUERY),
      client.fetch(CHANGELOGS_QUERY),
    ]);

    // -> In das von der UI erwartete Shape mappen (type statt _type, id, etc.)
    const items: UiItem[] = (Array.isArray(rawItems) ? rawItems : []).map(
      (d: any) => ({
        id: String(d.id || d._id),
        type: (d._type === "news" ? "news" : "changelog") as UiItem["type"],
        version: d.version || undefined,
        date: d.date || d._createdAt,
        title: d.title || "",
        body: d.body || "",
        tags: Array.isArray(d.tags) ? d.tags : [],
        highlights: Array.isArray(d.highlights) ? d.highlights : [],
      })
    );

    // Eindeutige Versionsliste für Timeline
    const versions: string[] = Array.from(
      new Set(
        (Array.isArray(changelogs) ? changelogs : [])
          .map((c: any) => c?.version)
          .filter(Boolean)
      )
    ).sort((a, b) => (a < b ? 1 : -1)); // neueste zuerst

    return NextResponse.json(
      { ok: true, items, tags: Array.isArray(tags) ? tags : [], versions },
      { status: 200 }
    );
  } catch (err) {
    console.error("GET /api/news failed:", err);
    return NextResponse.json(
      { ok: false, items: [], tags: [], versions: [] },
      { status: 500 }
    );
  }
}
