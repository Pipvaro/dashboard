// app/api/receivers/[rid]/status/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API = (process.env.AUTH_API_BASE || "https://api.pipvaro.com").replace(
  /\/+$/,
  ""
);

type Body = { status?: string };

function normalizeStatus(v?: string): "ACTIVE" | "DISABLED" | null {
  const s = String(v ?? "")
    .trim()
    .toUpperCase();
  if (s === "ACTIVE") return "ACTIVE";
  // akzeptiere Synonyme
  if (["DISABLED", "DEACTIVATED", "INACTIVE", "OFF"].includes(s))
    return "DISABLED";
  return null;
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ rid: string }> }
) {
  try {
    const { rid } = await ctx.params;
    const { status } = (await req.json().catch(() => ({}))) as Body;

    const mapped = normalizeStatus(status);
    if (!mapped) {
      return NextResponse.json(
        { ok: false, message: "bad_status" },
        { status: 400 }
      );
    }

    // Access-Token (falls dein Backend Auth via Bearer erwartet)
    const at = (await cookies()).get("access_token")?.value;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(at ? { Authorization: `Bearer ${at}` } : {}),
    };

    const enc = encodeURIComponent(rid);

    // 1) Versuche dedizierte Admin-Route
    let r = await fetch(`${API}/admin/receivers/${enc}/status`, {
      method: "POST",
      headers,
      body: JSON.stringify({ status: mapped }),
    });

    // 2) Fallback: generisches PATCH auf Receiver (falls deine
    //    Server-Implementierung das unterstützt)
    if (r.status === 404) {
      r = await fetch(`${API}/admin/receivers/${enc}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status: mapped }),
      });
    }

    const data = await r.json().catch(() => ({}));
    return NextResponse.json(data, { status: r.status });
  } catch (e) {
    console.error("POST /api/receivers/[rid]/status", e);
    return NextResponse.json(
      { ok: false, message: "server_error" },
      { status: 500 }
    );
  }
}
