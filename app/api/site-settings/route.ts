// app/api/site-settings/route.ts
import { NextResponse } from "next/server";
import { client } from "@/sanity/lib/client";
import { SITE_SETTINGS_QUERY } from "@/sanity/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const item = await client.fetch(SITE_SETTINGS_QUERY);

    // Prefer exact boolean if present; otherwise fall back to the other key; default = true
    const allow =
      typeof item?.allowRegistration === "boolean"
        ? item.allowRegistration
        : typeof item?.allowNewRegistrations === "boolean"
          ? item.allowNewRegistrations
          : true;

    // keep all banner fields intact and add a normalized flag
    const payload = {
      ...item,
      allowRegistration: allow,
      // keep legacy key too if you need it on the FE:
      allowNewRegistrations:
        typeof item?.allowNewRegistrations === "boolean"
          ? item.allowNewRegistrations
          : undefined,
    };

    return NextResponse.json(
      { ok: true, item: payload },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "sanity_fetch_failed" },
      { status: 500 }
    );
  }
}
