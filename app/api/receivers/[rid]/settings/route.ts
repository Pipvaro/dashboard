import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API = (process.env.AUTH_API_BASE || "https://api.pipvaro.com").replace(
  /\/+$/,
  ""
);

async function saveSettings(
  req: Request,
  ctx: { params: Promise<{ rid: string }> }
) {
  try {
    const { rid } = await ctx.params;
    const jar = await cookies();
    const at = jar.get("access_token")?.value;
    const body = await req.json().catch(() => ({}));

    // ---- NEW: Status separat zum Master schicken ----
    if (typeof body?.status === "string") {
      const r = await fetch(
        `${API}/admin/receivers/${encodeURIComponent(rid)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(at ? { Authorization: `Bearer ${at}` } : {}),
          },
          body: JSON.stringify({ status: body.status }),
          cache: "no-store",
        }
      );

      const data = await r.json().catch(() => ({}));
      return NextResponse.json(data, { status: r.status });
    }

    // ---- Sonst: normale Settings an /settings ----
    const r = await fetch(
      `${API}/admin/receivers/${encodeURIComponent(rid)}/settings`,
      {
        method: "POST", // Master erwartet POST für Settings
        headers: {
          "Content-Type": "application/json",
          ...(at ? { Authorization: `Bearer ${at}` } : {}),
        },
        body: JSON.stringify(body),
        cache: "no-store",
      }
    );

    const data = await r.json().catch(() => ({}));
    return NextResponse.json(data, { status: r.status });
  } catch (e) {
    console.error("SETTINGS", e);
    return NextResponse.json(
      { ok: false, message: "server_error" },
      { status: 500 }
    );
  }
}

export const POST = saveSettings; // akzeptiert POST
export const PATCH = saveSettings; // und PATCH vom Frontend
