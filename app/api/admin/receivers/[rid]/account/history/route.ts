/* eslint-disable @typescript-eslint/no-explicit-any */
import { masterFetch } from "@/lib/serverFetch";

export async function GET(req: Request, context: any) {
  const { rid } = context?.params ?? {};
  const url = new URL(req.url);
  const qs = url.search;
  const r = await masterFetch(`/admin/receivers/${rid}/account/history${qs}`);
  return new Response(await r.text(), {
    status: r.status,
    headers: { "Content-Type": "application/json" },
  });
}
