import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const access = (await cookies()).get("access_token")?.value;
  if (!access) return NextResponse.json({ ok: false }, { status: 401 });

  const api = await fetch(
    `${process.env.AUTH_API_BASE}/accounts/my?limit=100`,
    {
      headers: { Authorization: `Bearer ${access}` },
      cache: "no-store",
    }
  );

  const data = await api.json().catch(() => ({}));
  return NextResponse.json(data, { status: api.status });
}
