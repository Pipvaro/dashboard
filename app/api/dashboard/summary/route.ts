/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API = (process.env.AUTH_API_BASE || "https://api.pipvaro.com").replace(
  /\/+$/,
  ""
);

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const at = (await cookies()).get("access_token")?.value || "";
    const r = await fetch(`${API}/admin/summary`, {
      headers: {
        "Content-Type": "application/json",
        ...(at ? { Authorization: `Bearer ${at}` } : {}),
      },
      cache: "no-store",
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok)
      return NextResponse.json(
        { ok: false, error: d?.error || "bad_response" },
        { status: r.status }
      );
    return NextResponse.json(d, { status: 200 });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: "network_error" },
      { status: 500 }
    );
  }
}
