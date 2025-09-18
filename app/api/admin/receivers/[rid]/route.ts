/* eslint-disable @typescript-eslint/no-explicit-any */
import { masterFetch } from "@/lib/serverFetch";

export async function GET(_req: Request, context: any) {
  const { rid } = context?.params ?? {};
  const r = await masterFetch(`/admin/receivers/${rid}`);
  return new Response(await r.text(), {
    status: r.status,
    headers: { "Content-Type": "application/json" },
  });
}
