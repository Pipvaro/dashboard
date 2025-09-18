import { NextRequest } from "next/server";
import { masterFetch } from "@/lib/serverFetch";

export async function GET(req: NextRequest) {
  const qs = req.nextUrl.searchParams.toString();
  const r = await masterFetch(`/admin/users${qs ? `?${qs}` : ""}`);
  return new Response(await r.text(), {
    status: r.status,
    headers: { "Content-Type": "application/json" },
  });
}
