import { NextResponse } from "next/server";
import { client } from "@/sanity/lib/client";
import { PLANS_QUERY } from "@/sanity/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const items = await client.fetch(PLANS_QUERY);
    return NextResponse.json({ ok: true, items });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: "sanity_fetch_failed" },
      { status: 500 }
    );
  }
}
