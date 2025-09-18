/* eslint-disable @typescript-eslint/no-explicit-any */
import { masterFetch } from "@/lib/serverFetch";

export async function GET(_req: Request, context: any) {
  const { uid } = context?.params ?? {};

  const r = await masterFetch(`/admin/users/${uid}/receivers`);
  const body = await r.text();

  return new Response(body, {
    status: r.status,
    headers: { "Content-Type": "application/json" },
  });
}
