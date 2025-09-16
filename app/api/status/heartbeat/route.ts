import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const limit = new URL(req.url).searchParams.get("limit") ?? "20";
  const base = process.env.NEXT_PUBLIC_STATUS_BASE!.replace(/\/+$/, "");
  const slug = process.env.STATUS_SLUG!;
  const r = await fetch(
    `${base}/api/status-page/heartbeat/${slug}?limit=${limit}`,
    { cache: "no-store" }
  );
  const d = await r.json().catch(() => ({}));
  return NextResponse.json(d, { status: r.status || 200 });
}
