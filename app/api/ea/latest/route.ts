// app/api/ea/latest/route.ts
import { NextResponse } from "next/server";
import { client } from "@/sanity/lib/client";
import { EA_LATEST_QUERY } from "@/sanity/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await client.fetch<{
      assetUrl?: string | null;
      filename?: string | null;
      version?: string | null;
    } | null>(EA_LATEST_QUERY);

    if (!data?.assetUrl) {
      return NextResponse.json(
        { ok: false, message: "No active EA release found." },
        { status: 404 }
      );
    }

    const filename =
      data.filename?.trim() ||
      (data.version ? `PipvaroEA-v${data.version}.ex5` : "PipvaroEA.ex5");

    // Sanity unterstützt ?dl= für einen sauberen Download-Dateinamen
    const url = `${data.assetUrl}?dl=${encodeURIComponent(filename)}`;

    return NextResponse.json(
      {
        ok: true,
        url,
        version: data.version || undefined,
        filename,
      },
      {
        status: 200,
        headers: {
          // kurze Cachezeit – Release-Wechsel werden schnell sichtbar
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (e) {
    console.error("EA latest API error:", e);
    return NextResponse.json(
      { ok: false, message: "Failed to resolve EA release." },
      { status: 500 }
    );
  }
}
