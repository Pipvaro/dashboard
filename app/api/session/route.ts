import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const access = (await cookies()).get("access_token")?.value;
  if (!access) return NextResponse.json({ authenticated: false });

  // If you need user info, call your backend /me endpoint with the token
  const me = await fetch(`${process.env.AUTH_API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${access}` },
    cache: "no-store",
  })
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);

  return NextResponse.json({
    authenticated: !!me,
    user: me ?? null,
  });
}
