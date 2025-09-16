import { NextRequest, NextResponse } from "next/server";
const BASE =
  process.env.MASTER_URL ||
  process.env.AUTH_API_BASE ||
  "http://localhost:3000";

export async function POST(
  req: NextRequest,
  { params }: { params: { rid: string } }
) {
  const body = await req.json(); // { name: "Neuer Name" }
  const r = await fetch(`${BASE}/admin/receivers/${params.rid}/rename`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const d = await r.json().catch(() => ({}));
  return NextResponse.json(d, { status: r.status });
}
