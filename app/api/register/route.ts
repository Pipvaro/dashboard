// app/api/register/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  const api = await fetch(`${process.env.AUTH_API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = await api.json().catch(() => ({}));

  if (!api.ok) {
    // direkt durchreichen (z.B. { message: "missing_fields" })
    return NextResponse.json(data, { status: api.status || 400 });
  }

  // Tokens setzen (lokal nicht "secure")
  const res = NextResponse.json({ ok: true, user: data.user });
  const isProd = process.env.NODE_ENV === "production";

  res.cookies.set("access_token", data.access_token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: isProd,
    maxAge: 60 * 60, // 1h
  });
  res.cookies.set("refresh_token", data.refresh_token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: isProd,
    maxAge: 60 * 60 * 24 * 30, // 30d
  });

  return res;
}
