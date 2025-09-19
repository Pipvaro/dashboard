import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const c = await cookies();
  const refresh = c.get("refresh_token")?.value;

  if (!refresh) {
    return NextResponse.json(
      { ok: false, reason: "no-refresh" },
      { status: 401 }
    );
  }

  // Call your AUTH API refresh endpoint
  const apiUrl = `${process.env.AUTH_API_BASE}${process.env.AUTH_REFRESH_PATH || "/auth/refresh"}`;
  const r = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refresh }),
    cache: "no-store",
  });

  const data = await r.json().catch(() => ({}));
  if (!r.ok || !data?.access_token) {
    // wipe broken cookies
    const res = NextResponse.json({ ok: false }, { status: 401 });
    res.cookies.set("access_token", "", { path: "/", maxAge: 0 });
    // keep refresh if your API might still accept it later — or also clear here
    return res;
  }

  const isProd = process.env.NODE_ENV === "production";
  const sameSite =
    (process.env.AUTH_SAMESITE as "lax" | "none" | "strict") || "lax";

  const res = NextResponse.json({ ok: true });

  // Rewrite access cookie (short)
  res.cookies.set("access_token", data.access_token, {
    httpOnly: true,
    secure: isProd,
    sameSite,
    path: "/",
    maxAge: Number(process.env.ACCESS_MAXAGE || 60 * 60),
  });

  // Rolling refresh: if API returned a new refresh token, set it; otherwise extend ours a bit
  const newRefresh = data.refresh_token ?? refresh;
  res.cookies.set("refresh_token", newRefresh, {
    httpOnly: true,
    secure: isProd,
    sameSite,
    path: "/",
    maxAge: Number(process.env.REFRESH_MAXAGE || 60 * 60 * 24 * 60),
  });

  return res;
}
