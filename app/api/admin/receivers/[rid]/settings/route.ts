/* eslint-disable @typescript-eslint/no-explicit-any */
import { masterFetch } from "@/lib/serverFetch";

export async function POST(req: Request, context: any) {
  const { rid } = context?.params ?? {};
  const body = await req.text();
  const r = await masterFetch(`/admin/receivers/${rid}/settings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  return new Response(await r.text(), {
    status: r.status,
    headers: { "Content-Type": "application/json" },
  });
}
