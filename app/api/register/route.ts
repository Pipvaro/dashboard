// app/api/register/route.ts
import { NextResponse } from "next/server";

const ALLOWED_PLANS = new Set(["fusion", "lunar", "nova"]);

// entfernt führende/abschließende Quotes + trimmt
const strip = (v?: string) =>
  String(v ?? "")
    .trim()
    .replace(/^['"]|['"]$/g, "");

// BASE + PATHs aus ENV lesen
const AUTH_API_BASE = strip(process.env.AUTH_API_BASE);
const REGISTER_PATH = strip(process.env.AUTH_REGISTER_PATH || "/auth/register");

// sauber joinen (ohne doppelte Slashes)
function joinUrl(base: string, path: string) {
  const b = base.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

export async function POST(req: Request) {
  try {
    if (!AUTH_API_BASE) {
      console.error("AUTH_API_BASE env missing");
      return NextResponse.json(
        { ok: false, message: "server_misconfigured: AUTH_API_BASE missing" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const first_name = String(body.first_name || body.firstName || "").trim();
    const last_name = String(body.last_name || body.lastName || "").trim();
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const password = String(body.password || "");
    const planRaw = String(
      body.subscription || body.plan || "fusion"
    ).toLowerCase();
    const subscription = ALLOWED_PLANS.has(planRaw) ? planRaw : "fusion";

    if (!first_name || !last_name || !email || !password) {
      return NextResponse.json(
        { ok: false, message: "missing_fields" },
        { status: 400 }
      );
    }

    const url = joinUrl(AUTH_API_BASE, REGISTER_PATH);

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        first_name,
        last_name,
        email,
        password,
        subscription,
      }),
    });

    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      return NextResponse.json(data, { status: r.status });
    }

    // Tokens als Cookies setzen
    const res = NextResponse.json({ ok: true, ...data });
    if (data?.access_token) {
      res.cookies.set("access_token", data.access_token, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
        maxAge: 60 * 60, // 1h
      });
    }
    if (data?.refresh_token) {
      res.cookies.set("refresh_token", data.refresh_token, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
        maxAge: 60 * 60 * 24 * 30, // 30d
      });
    }
    return res;
  } catch (e) {
    console.error("POST /api/register", e);
    return NextResponse.json(
      { ok: false, message: "server_error" },
      { status: 500 }
    );
  }
}
