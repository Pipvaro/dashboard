/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";

/**
 * ENV expected (your names):
 *  PVE_HOST         e.g. https://proxmox.axsuro.com
 *  PVE_TOKEN_ID     e.g. root@pam!Coco
 *  PVE_TOKEN        token secret (GUID-like)
 * Optional:
 *  PVE_NODE         default node name if you want to pin (else we list all)
 *  PVE_FILTER_IDS   "103,105,106"  -> show only these guests in vms/lxc
 */
const PVE_HOST = (process.env.PVE_HOST || "").replace(/\/+$/, "");
const PVE_TOKEN_ID = process.env.PVE_TOKEN_ID || "";
const PVE_TOKEN = process.env.PVE_TOKEN || "";
const PVE_NODE = process.env.PVE_NODE || ""; // optional
const FILTER_IDS = (process.env.PVE_FILTER_IDS || "")
  .split(",")
  .map((s) => Number(s.trim()))
  .filter((n) => Number.isFinite(n));

function authHeader() {
  // exact header the API expects
  return {
    Authorization: `PVEAPIToken=${PVE_TOKEN_ID}=${PVE_TOKEN}`,
  };
}

async function pve(path: string) {
  const r = await fetch(`${PVE_HOST}/api2/json${path}`, {
    headers: authHeader(),
    cache: "no-store",
  });
  if (!r.ok) {
    throw new Error(`PVE request failed: ${path} -> ${r.status}`);
  }
  const d = await r.json().catch(() => ({}));
  return d?.data ?? d;
}

function guestPick(x: any) {
  return {
    id: Number(x.vmid),
    name: x.name || x.hostname || String(x.vmid),
    status: x.status || x.lock || "unknown",
    cpu: typeof x.cpu === "number" ? x.cpu : undefined, // 0..1
    mem: x.mem,
    maxmem: x.maxmem,
    uptime: x.uptime,
    node: x.node,
    type: x.type || (x.hasOwnProperty("disk") ? "qemu" : "lxc"),
  };
}

export async function GET() {
  try {
    if (!PVE_HOST || !PVE_TOKEN_ID || !PVE_TOKEN) {
      return NextResponse.json(
        { ok: false, error: "Missing PVE_HOST/PVE_TOKEN_ID/PVE_TOKEN" },
        { status: 500 }
      );
    }

    // 1) nodes
    const nodeNames: string[] = PVE_NODE
      ? [PVE_NODE]
      : (await pve("/nodes")).map((n: any) => n.node);

    // 2) per node: status + (best effort) inventories
    const items: any[] = [];
    const allLxc: any[] = [];
    const allVms: any[] = [];
    const allStorage: any[] = [];

    for (const n of nodeNames) {
      // node status
      const st = await pve(`/nodes/${encodeURIComponent(n)}/status`);
      items.push({
        node: n,
        status: st?.status ?? "unknown",
        cpu: st?.cpu ?? 0,
        mem_used: st?.memory?.used ?? 0,
        mem_total: st?.memory?.total ?? 0,
        uptime: st?.uptime ?? 0,
      });

      // optional: these may fail if token has narrow permissions; keep wallboard alive
      try {
        const lxc = await pve(`/nodes/${encodeURIComponent(n)}/lxc`);
        const lxcSel = (Array.isArray(lxc) ? lxc : [])
          .filter((x: any) =>
            FILTER_IDS.length ? FILTER_IDS.includes(Number(x.vmid)) : true
          )
          .map((x: any) => guestPick({ ...x, node: n, type: "lxc" }));
        allLxc.push(...lxcSel);
      } catch {}

      try {
        const vms = await pve(`/nodes/${encodeURIComponent(n)}/qemu`);
        const vmSel = (Array.isArray(vms) ? vms : [])
          .filter((x: any) =>
            FILTER_IDS.length ? FILTER_IDS.includes(Number(x.vmid)) : true
          )
          .map((x: any) => guestPick({ ...x, node: n, type: "qemu" }));
        allVms.push(...vmSel);
      } catch {}

      try {
        const storage = await pve(`/nodes/${encodeURIComponent(n)}/storage`);
        const stor = (Array.isArray(storage) ? storage : []).map((s: any) => ({
          node: n,
          storage: s.storage,
          type: s.type,
          active: s.active,
          total: s.total,
          used: s.used,
        }));
        allStorage.push(...stor);
      } catch {}
    }

    return NextResponse.json({
      ok: true,
      items, // backward-compatible for your current table
      vms: allVms,
      lxc: allLxc,
      storage: allStorage,
      ts: new Date().toISOString(),
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: String(e?.message || e || "pve_error") },
      { status: 500 }
    );
  }
}
