import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  const apiRes = await fetch(
    `${process.env.AUTH_API_BASE}${process.env.AUTH_LOGIN_PATH}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    }
  );

  const data = await apiRes.json().catch(() => ({}));

  if (!apiRes.ok || !data?.access_token) {
    return NextResponse.json(
      { ok: false, message: data?.message ?? "Invalid credentials" },
      { status: apiRes.status || 401 }
    );
  }

  const res = NextResponse.json({ ok: true, user: data.user ?? null });

  const isProd = process.env.NODE_ENV === "production";
  const baseCookie = {
    httpOnly: true,
    secure: isProd,
    sameSite: (process.env.AUTH_SAMESITE as "lax" | "none" | "strict") || "lax",
    path: "/",
  } as const;

  // Access token: keep short (e.g. 15–60 min)
  res.cookies.set("access_token", data.access_token, {
    ...baseCookie,
    maxAge: Number(process.env.ACCESS_MAXAGE || 60 * 60), // seconds
  });

  // Refresh token: long lived (e.g. 30–90 days)
  if (data.refresh_token) {
    res.cookies.set("refresh_token", data.refresh_token, {
      ...baseCookie,
      // if your app and API are on different domains, set sameSite=none and ensure HTTPS
      maxAge: Number(process.env.REFRESH_MAXAGE || 60 * 60 * 24 * 60),
    });
  }

  return res;
}
