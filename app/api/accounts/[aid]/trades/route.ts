/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API = (process.env.AUTH_API_BASE || "https://api.pipvaro.com").replace(
  /\/+$/,
  ""
);

async function getAccountLocal(aid: string, origin: string) {
  const r = await fetch(`${origin}/api/accounts/${encodeURIComponent(aid)}`, {
    cache: "no-store",
  });
  const d = await r.json().catch(() => ({}));
  return d?.item ?? null;
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ aid: string }> }
) {
  const { aid } = await ctx.params;
  try {
    const url = new URL(req.url);
    const limit = Math.min(
      200,
      Math.max(1, Number(url.searchParams.get("limit") || 20))
    );

    const at = (await cookies()).get("access_token")?.value || "";
    const hdrs: Record<string, string> = {
      "Content-Type": "application/json",
      ...(at ? { Authorization: `Bearer ${at}` } : {}),
    };

    const origin = `${url.protocol}//${url.host}`;
    const item = await getAccountLocal(aid, origin);
    const rid = item?.receiver_id;
    if (!rid)
      return NextResponse.json({ ok: true, items: [] }, { status: 200 });

    const candidates = [
      `${API}/admin/receivers/${encodeURIComponent(
        rid
      )}/order-reports?limit=${limit}`,
      `${API}/admin/receivers/${encodeURIComponent(
        rid
      )}/orders/reports?limit=${limit}`,
    ];

    for (const endpoint of candidates) {
      try {
        const r = await fetch(endpoint, { headers: hdrs, cache: "no-store" });
        const d = await r.json().catch(() => ({}));
        if (r.ok && (Array.isArray(d?.items) || Array.isArray(d))) {
          const items = Array.isArray(d?.items) ? d.items : d;
          return NextResponse.json({ ok: true, items }, { status: 200 });
        }
      } catch {
        // next candidate
      }
    }

    // Kein bekannter Endpoint vorhanden -> leer zurück
    return NextResponse.json({ ok: true, items: [] }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ ok: true, items: [] }, { status: 200 });
  }
}
