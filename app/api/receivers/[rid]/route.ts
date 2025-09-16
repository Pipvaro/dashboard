// app/api/receivers/[rid]/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const strip = (v?: string) =>
  String(v ?? "")
    .trim()
    .replace(/^['"]|['"]$/g, "");
const API = strip(process.env.AUTH_API_BASE) || "https://api.pipvaro.com";

async function api(path: string, init?: RequestInit) {
  const res = await fetch(`${API}${path}`, init);
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ rid: string }> }
) {
  try {
    const { rid } = await ctx.params;
    const jar = await cookies();
    const at = jar.get("access_token")?.value;
    if (!at)
      return NextResponse.json(
        { ok: false, message: "unauthorized" },
        { status: 401 }
      );

    // 1) Who am I?
    const { res: meRes, data: me } = await api("/auth/me", {
      headers: { Authorization: `Bearer ${at}` },
      cache: "no-store",
    });
    if (!meRes.ok) return NextResponse.json(me, { status: meRes.status });

    // 2) Receiver lesen
    const { res: rxRes, data: rxWrap } = await api(
      `/admin/receivers/${encodeURIComponent(rid)}`,
      {
        cache: "no-store",
      }
    );
    if (rxRes.status === 404)
      return NextResponse.json(
        { ok: false, message: "not_found" },
        { status: 404 }
      );
    if (!rxRes.ok) return NextResponse.json(rxWrap, { status: rxRes.status });

    const receiver = rxWrap?.receiver || rxWrap;
    if (!receiver || receiver.user_id !== me?.user?.user_id) {
      return NextResponse.json(
        { ok: false, message: "forbidden" },
        { status: 403 }
      );
    }

    // 3) Snapshot + 4) Metrics (optional)
    const [acc, met] = await Promise.all([
      api(`/admin/receivers/${encodeURIComponent(rid)}/account?`),
      api(`/admin/receivers/${encodeURIComponent(rid)}/metrics?limit=100`),
    ]);

    const account = acc.data?.account ?? null;
    const metrics = Array.isArray(met.data?.items) ? met.data.items : [];

    return NextResponse.json({ ok: true, receiver, account, metrics });
  } catch (e) {
    console.error("GET /api/receivers/[rid]", e);
    return NextResponse.json(
      { ok: false, message: "server_error" },
      { status: 500 }
    );
  }
}
