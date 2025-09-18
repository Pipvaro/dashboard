import { NextRequest } from "next/server";
import { masterFetch } from "@/lib/serverFetch";

export async function GET(
  _: NextRequest,
  { params }: { params: { uid: string } }
) {
  const r = await masterFetch(`/admin/users/${params.uid}`);
  return new Response(await r.text(), {
    status: r.status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { uid: string } }
) {
  const body = await req.text();
  const r = await masterFetch(`/admin/users/${params.uid}`, {
    method: "PATCH",
    body,
  });
  return new Response(await r.text(), {
    status: r.status,
    headers: { "Content-Type": "application/json" },
  });
}
