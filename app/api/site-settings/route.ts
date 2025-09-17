// app/api/site-settings/route.ts
import { NextResponse } from "next/server";
import { client } from "@/sanity/lib/client";
import { SITE_SETTINGS_QUERY } from "@/sanity/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const item = await client.fetch(SITE_SETTINGS_QUERY);
    return NextResponse.json({ ok: true, item });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: "sanity_fetch_failed" },
      { status: 500 }
    );
  }
}
