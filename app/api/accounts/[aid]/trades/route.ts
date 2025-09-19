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
  ctx: { params: Promise<{ aid: string }> } // keep your original signature
) {
  const { aid } = await ctx.params;

  try {
    const url = new URL(req.url);

    const limit = Math.min(
      200,
      Math.max(1, Number(url.searchParams.get("limit") || 20))
    );

    // NEW: support OPEN | CLOSED (default CLOSED for history views)
    const state = String(
      url.searchParams.get("state") || "CLOSED"
    ).toUpperCase();

    const at = (await cookies()).get("access_token")?.value || "";
    const hdrs: Record<string, string> = {
      "Content-Type": "application/json",
      ...(at ? { Authorization: `Bearer ${at}` } : {}),
    };

    // 1) Primary: new master endpoint (doesn't need receiver_id)
    const primary = `${API}/accounts/${encodeURIComponent(
      aid
    )}/trades?state=${encodeURIComponent(state)}&limit=${encodeURIComponent(
      String(limit)
    )}`;

    try {
      const r = await fetch(primary, { headers: hdrs, cache: "no-store" });
      const d = await r.json().catch(() => ({}));
      if (r.ok && d && Array.isArray(d.items)) {
        return NextResponse.json({ ok: true, items: d.items }, { status: 200 });
      }
    } catch {
      // fall through to legacy candidates
    }

    // 2) Legacy fallback (only makes sense for CLOSED history via order reports)
    const origin = `${url.protocol}//${url.host}`;
    const item = await getAccountLocal(aid, origin);
    const rid = item?.receiver_id;

    // if no receiver or we're asking for OPEN (no legacy source), just return empty
    if (!rid || state === "OPEN") {
      return NextResponse.json({ ok: true, items: [] }, { status: 200 });
    }

    // Try both historical order-report endpoints you used before
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
        // try next
      }
    }

    // nothing found
    return NextResponse.json({ ok: true, items: [] }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: true, items: [] }, { status: 200 });
  }
}
