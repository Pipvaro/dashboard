/* eslint-disable @typescript-eslint/no-explicit-any */
import { masterFetch } from "@/lib/serverFetch";

export async function GET(_req: Request) {
  const url = new URL(_req.url);
  const q = url.searchParams.get("q");
  const r = await masterFetch(
    `/admin/receivers${q ? `?q=${encodeURIComponent(q)}` : ""}`
  );
  const body = await r.text();
  return new Response(body, {
    status: r.status,
    headers: { "Content-Type": "application/json" },
  });
}
