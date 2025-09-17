/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API = (process.env.AUTH_API_BASE || "https://api.pipvaro.com").replace(
  /\/+$/,
  ""
);

export async function GET(
  req: Request,
  ctx: { params: Promise<{ aid: string }> }
) {
  const { aid } = await ctx.params;
  try {
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit") || 150);
    const at = (await cookies()).get("access_token")?.value || "";

    const hdr: Record<string, string> = {
      "Content-Type": "application/json",
      ...(at ? { Authorization: `Bearer ${at}` } : {}),
    };

    // Map account.id → receiver_id
    const list = await fetch(`${API}/accounts/my`, {
      headers: hdr,
      cache: "no-store",
    }).then((r) => r.json());
    const needle = String(aid);
    const row = (list.accounts || []).find((x: any) => {
      const a = x?.account || {};
      return (
        String(a.id ?? "") === needle ||
        String(a.login ?? "") === needle ||
        String(x.receiver_id ?? "") === needle
      );
    });
    if (!row)
      return NextResponse.json({ ok: true, items: [] }, { status: 200 });

    const rid = row.receiver_id;

    const r2 = await fetch(
      `${API}/admin/receivers/${encodeURIComponent(
        rid
      )}/account/history?limit=${encodeURIComponent(String(limit))}`,
      { headers: hdr, cache: "no-store" }
    );
    const d2 = await r2.json().catch(() => ({}));
    if (!r2.ok) return NextResponse.json(d2, { status: r2.status || 500 });

    return NextResponse.json(
      { ok: true, items: Array.isArray(d2.items) ? d2.items : [] },
      { status: 200 }
    );
  } catch (e) {
    console.error("GET /api/accounts/[aid]/history", e);
    return NextResponse.json(
      { ok: false, message: "server_error" },
      { status: 500 }
    );
  }
}
