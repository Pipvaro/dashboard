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

  const data = await apiRes.json();

  if (!apiRes.ok || !data?.access_token) {
    return NextResponse.json(
      { ok: false, message: data?.message ?? "Invalid credentials" },
      { status: apiRes.status || 401 }
    );
  }

  const res = NextResponse.json({ ok: true, user: data.user ?? null });

  const sec = process.env.NODE_ENV === "production";
  res.cookies.set("access_token", data.access_token, {
    httpOnly: true,
    secure: sec,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60,
  });
  if (data.refresh_token) {
    res.cookies.set("refresh_token", data.refresh_token, {
      httpOnly: true,
      secure: sec,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  return res;
}
