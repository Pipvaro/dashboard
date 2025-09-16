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
    const { status } = await req.json(); // "ACTIVE" | "DISABLED"
    const at = (await cookies()).get("access_token")?.value;

    const r = await fetch(
      `${API}/admin/receivers/${encodeURIComponent(rid)}/license/status`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(at ? { Authorization: `Bearer ${at}` } : {}),
        },
        body: JSON.stringify({ status }),
      }
    );

    const data = await r.json().catch(() => ({}));
    return NextResponse.json(data, { status: r.status });
  } catch (e) {
    console.error("LICENSE STATUS", e);
    return NextResponse.json(
      { ok: false, message: "server_error" },
      { status: 500 }
    );
  }
}
