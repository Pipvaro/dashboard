/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";

const PVE = (process.env.PVE_HOST || "").replace(/\/+$/, "");
const TOKEN_ID = process.env.PVE_TOKEN_ID || "";
const TOKEN = process.env.PVE_TOKEN || "";

export async function GET() {
  if (!PVE || !TOKEN || !TOKEN_ID)
    return NextResponse.json({ ok: false, items: [] }, { status: 200 });
  try {
    const r = await fetch(`${PVE}/api2/json/nodes`, {
      headers: { Authorization: `PVEAPIToken=${TOKEN_ID}=${TOKEN}` },
      // Wenn dein PVE ein Self-Signed Zert hat: setz NODE_TLS_REJECT_UNAUTHORIZED=0 in der Runtime
    });
    const d = await r.json().catch(() => ({}));
    const items = Array.isArray(d?.data) ? d.data : [];
    const mapped = items.map((n: any) => ({
      node: n.node,
      status: n.status,
      cpu: n.cpu, // 0..1
      mem_used: n.mem, // bytes
      mem_total: n.maxmem, // bytes
      uptime: n.uptime, // sec
    }));
    return NextResponse.json({ ok: true, items: mapped }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, items: [] }, { status: 200 });
  }
}
