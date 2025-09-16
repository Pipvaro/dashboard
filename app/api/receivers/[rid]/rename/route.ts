// app/api/receivers/[rid]/rename/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API = (process.env.AUTH_API_BASE || "https://api.pipvaro.com").replace(
  /\/+$/,
  ""
);

export async function POST(
  req: Request,
  ctx: { params: Promise<{ rid: string }> }
) {
  try {
    const { rid } = await ctx.params;
    const body = await req.json().catch(() => ({}));
    const name = String(body?.name || "").trim();
    if (!name) {
      return NextResponse.json(
        { ok: false, message: "missing_name" },
        { status: 400 }
      );
    }

    const at = (await cookies()).get("access_token")?.value;
    const r = await fetch(
      `${API}/admin/receivers/${encodeURIComponent(rid)}/rename`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(at ? { Authorization: `Bearer ${at}` } : {}),
        },
        body: JSON.stringify({ name }),
      }
    );
    const data = await r.json().catch(() => ({}));
    return NextResponse.json(data, { status: r.status });
  } catch (e) {
    console.error("POST /api/receivers/[rid]/rename", e);
    return NextResponse.json(
      { ok: false, message: "server_error" },
      { status: 500 }
    );
  }
}
