import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  // forward to your backend
  const apiRes = await fetch(
    `${process.env.AUTH_API_BASE}${process.env.AUTH_REGISTER_PATH}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        first_name: body.firstName,
        last_name: body.lastName,
        email: body.email,
        password: body.password,
      }),
      // Important for Vercel edge -> node: ensure no cookie leakage
      cache: "no-store",
    }
  );

  const data = await apiRes.json();

  if (!apiRes.ok || !data?.access_token) {
    return NextResponse.json(
      { ok: false, message: data?.message ?? "Registration failed" },
      { status: apiRes.status || 400 }
    );
  }

  const res = NextResponse.json({ ok: true, user: data.user ?? null });

  // set httpOnly cookies
  const sec = process.env.NODE_ENV === "production";
  res.cookies.set("access_token", data.access_token, {
    httpOnly: true,
    secure: sec,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60, // 1h
  });
  if (data.refresh_token) {
    res.cookies.set("refresh_token", data.refresh_token, {
      httpOnly: true,
      secure: sec,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30d
    });
  }

  return res;
}
