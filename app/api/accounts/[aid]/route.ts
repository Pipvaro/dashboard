/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/accounts/[aid]/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API = (process.env.AUTH_API_BASE || "https://api.pipvaro.com").replace(
  /\/+$/,
  ""
);

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ aid: string }> }
) {
  try {
    const { aid } = await ctx.params;
    const at = (await cookies()).get("access_token")?.value || "";

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(at ? { Authorization: `Bearer ${at}` } : {}),
    };

    // 1) Direkt versuchen
    try {
      const r = await fetch(`${API}/accounts/${encodeURIComponent(aid)}`, {
        headers,
        cache: "no-store",
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok) return NextResponse.json(d, { status: 200 });
      // bei 401/404 -> Fallback probieren
      if (![401, 404].includes(r.status)) {
        return NextResponse.json(d, { status: r.status || 500 });
      }
    } catch {
      // still -> fallback
    }

    // 2) Fallback: /accounts/my und lokal suchen
    const r2 = await fetch(`${API}/accounts/my`, {
      headers,
      cache: "no-store",
    });
    const d2 = await r2.json().catch(() => ({}));
    if (!r2.ok) {
      return NextResponse.json(d2, { status: r2.status || 500 });
    }

    const needle = String(aid);
    const item = (d2.accounts || []).find((x: any) => {
      const a = x?.account || {};
      return (
        String(a.id ?? "") === needle ||
        String(a.login ?? "") === needle ||
        String(x.receiver_id ?? "") === needle
      );
    });

    if (!item) {
      return NextResponse.json(
        { ok: false, message: "not_found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, item }, { status: 200 });
  } catch (e) {
    console.error("API /api/accounts/[aid] error", e);
    return NextResponse.json(
      { ok: false, message: "server_error" },
      { status: 500 }
    );
  }
}
