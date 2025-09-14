import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const access = (await cookies()).get("access_token")?.value;
  if (!access) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  const api = await fetch(`${process.env.AUTH_API_BASE}/receivers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${access}`,
    },
    body: JSON.stringify({ name: body?.name }),
    cache: "no-store",
  });

  const data = await api.json().catch(() => ({}));
  return NextResponse.json(data, { status: api.status });
}
