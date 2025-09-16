import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API = (process.env.AUTH_API_BASE || "https://api.pipvaro.com").replace(
  /\/+$/,
  ""
);

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ rid: string }> }
) {
  try {
    const { rid } = await ctx.params;
    const at = (await cookies()).get("access_token")?.value;

    const r = await fetch(
      `${API}/admin/receivers/${encodeURIComponent(rid)}/license/reset`,
      {
        method: "POST",
        headers: {
          ...(at ? { Authorization: `Bearer ${at}` } : {}),
        },
      }
    );

    const data = await r.json().catch(() => ({}));
    return NextResponse.json(data, { status: r.status });
  } catch (e) {
    console.error("LICENSE RESET", e);
    return NextResponse.json(
      { ok: false, message: "server_error" },
      { status: 500 }
    );
  }
}
