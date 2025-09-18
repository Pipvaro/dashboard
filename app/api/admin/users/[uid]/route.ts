/* eslint-disable @typescript-eslint/no-explicit-any */
import { masterFetch } from "@/lib/serverFetch";

export async function GET(_req: Request, context: any) {
  const { uid } = context?.params ?? {};

  const r = await masterFetch(`/admin/users/${uid}`);
  const body = await r.text();

  return new Response(body, {
    status: r.status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function PATCH(req: Request, context: any) {
  const { uid } = context?.params ?? {};
  const payload = await req.text(); // Body unverändert weiterreichen

  const r = await masterFetch(`/admin/users/${uid}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: payload,
  });
  const body = await r.text();

  return new Response(body, {
    status: r.status,
    headers: { "Content-Type": "application/json" },
  });
}
