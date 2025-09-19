"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { JSX, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Summary = {
  ok: boolean;
  kpis: {
    receivers_total: number;
    receivers_online: number;
    queue: { QUEUED: number; ACKED: number; SENT: number };
    reports_24h: { FILLED: number; REJECTED: number; CLOSED: number };
    trades: { open: number; closed_24h: number };
    users_total: number;
  };
  latest: {
    receivers: any[];
    queue: any[];
    reports: any[];
    trades_closed: any[];
    telegram: any[];
    users: any[];
    updates: any[];
  };
  generated_at: string;
};

type Pve = {
  ok: boolean;
  items: {
    node: string;
    status: string;
    cpu: number;
    mem_used: number;
    mem_total: number;
    uptime: number;
  }[];
};

function useAutoJSON<T = any>(url: string, ms = 5000) {
  const [data, setData] = useState<T | null>(null);
  const t = useRef<any>(null);
  const load = async () => {
    try {
      const r = await fetch(url, { cache: "no-store" });
      setData(await r.json());
    } catch {}
  };
  useEffect(() => {
    load();
    t.current = setInterval(load, ms);
    return () => clearInterval(t.current);
  }, [url, ms]);
  return data;
}

export default function CommandCenter() {
  const sum = useAutoJSON<Summary>("/api/dashboard/summary", 5000);
  const pve = useAutoJSON<Pve>("/api/proxmox/summary", 10000);

  return (
    <div className="p-6 space-y-6 bg-[#0b0f14] min-h-screen">
      <div className="text-white text-xl font-semibold">
        Pipvaro Command Center
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
        <Kpi
          title="Receivers online"
          value={sum?.kpis?.receivers_online}
          sub={`/ ${sum?.kpis?.receivers_total ?? 0}`}
          hue="emerald"
        />
        <Kpi title="Queue: QUEUED" value={sum?.kpis?.queue?.QUEUED} hue="sky" />
        <Kpi title="Queue: ACKED" value={sum?.kpis?.queue?.ACKED} hue="amber" />
        <Kpi
          title="Reports 24h: FILLED"
          value={sum?.kpis?.reports_24h?.FILLED}
          hue="emerald"
        />
        <Kpi
          title="Reports 24h: CLOSED"
          value={sum?.kpis?.reports_24h?.CLOSED}
          hue="cyan"
        />
        <Kpi title="Users total" value={sum?.kpis?.users_total} hue="violet" />
      </div>

      {/* 2 Spalten: Queue + Reports */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Panel title="Latest Queue (10)" sub="auto-refresh 5s">
          <Table
            cols={["Time", "Receiver", "Action", "Symbol", "Vol", "Status"]}
            rows={(sum?.latest?.queue ?? []).map((q) => [
              timeAgo(q.created_at),
              q.receiver_id,
              q.action,
              q.symbol,
              num(q.volume),
              q.status,
            ])}
          />
        </Panel>
        <Panel title="Latest Reports (10)" sub="auto-refresh 5s">
          <Table
            cols={["Time", "State", "Symbol", "Price", "Vol", "Msg"]}
            rows={(sum?.latest?.reports ?? []).map((r) => [
              timeAgo(r.ts),
              r.state,
              r.symbol_local || r.symbol,
              num(r.price, 2),
              num(r.volume),
              r.message || "—",
            ])}
          />
        </Panel>
      </div>

      {/* 2 Spalten: Telegram + Receivers */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Panel title="Telegram (latest 10)">
          <Table
            cols={["Time", "From", "Text"]}
            rows={(sum?.latest?.telegram ?? []).map((m) => [
              timeAgo(m.inserted_at),
              m.chat.name || m.chat?.title || "—",
              truncate(m.text, 80),
            ])}
          />
        </Panel>
        <Panel title="Receivers (latest activity)">
          <Table
            cols={["Receiver", "Name", "Last seen", "Status"]}
            rows={(sum?.latest?.receivers ?? []).map((r) => [
              r.receiver_id,
              r.name || "—",
              timeAgo(r.last_seen),
              Badge(r.status),
            ])}
          />
        </Panel>
      </div>

      {/* Trades Closed + Updates + Users */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Panel title="Closed trades (latest 10)">
          <Table
            cols={["Time", "Symbol", "Side", "Vol", "Price", "P/L", "Comment"]}
            rows={(sum?.latest?.trades_closed ?? []).map((t) => [
              timeAgo(t.updated_at || t.close_time),
              t.symbol,
              t.side,
              num(t.volume),
              num(t.close_price || t.price, 2),
              num(t.profit, 2),
              t.comment || "—",
            ])}
          />
        </Panel>
        <Panel title="Receiver updates (latest 10)">
          <Table
            cols={["Time", "Receiver", "Type"]}
            rows={(sum?.latest?.updates ?? []).map((u) => [
              timeAgo(u.ts),
              u.receiver_id,
              u.type,
            ])}
          />
        </Panel>
        <Panel title="Newest users">
          <Table
            cols={["Time", "User", "Email"]}
            rows={(sum?.latest?.users ?? []).map((u) => [
              timeAgo(u.created_at),
              u.user_id,
              u.email,
            ])}
          />
        </Panel>
      </div>

      {/* Optional: Proxmox */}
      <Panel title="Proxmox nodes" sub="optional">
        <Table
          cols={["Node", "Status", "CPU %", "Mem %", "Uptime"]}
          rows={(pve?.items ?? []).map((n) => {
            const cpu = Math.round((n.cpu || 0) * 100);
            const mem = n.mem_total
              ? Math.round((n.mem_used / n.mem_total) * 100)
              : 0;
            return [
              n.node,
              Badge(n.status),
              `${cpu}%`,
              `${mem}%`,
              humanUptime(n.uptime),
            ];
          })}
        />
      </Panel>

      <div className="text-xs text-gray-500">
        Generated:{" "}
        {sum?.generated_at ? new Date(sum.generated_at).toLocaleString() : "—"}
      </div>
    </div>
  );
}

function Kpi({
  title,
  value,
  sub,
  hue = "gray",
}: {
  title: string;
  value?: number;
  sub?: string;
  hue?: "emerald" | "sky" | "amber" | "cyan" | "violet" | "gray";
}) {
  const ring = {
    emerald: "ring-emerald-500/30",
    sky: "ring-sky-500/30",
    amber: "ring-amber-500/30",
    cyan: "ring-cyan-500/30",
    violet: "ring-violet-500/30",
    gray: "ring-gray-500/30",
  }[hue];
  return (
    <div
      className={cn(
        "rounded-lg border border-gray-800 bg-[#0f141b] p-4 ring-1",
        ring
      )}
    >
      <div className="text-[12px] text-gray-400">{title}</div>
      <div className="text-white text-2xl mt-1">
        {value ?? "—"}
        {sub ? <span className="text-gray-400 text-sm ml-1">{sub}</span> : null}
      </div>
    </div>
  );
}

function Panel({
  title,
  sub,
  children,
}: {
  title: string;
  sub?: string;
  children: any;
}) {
  return (
    <div className="rounded-lg border border-gray-800 bg-[#0f141b] p-4">
      <div className="mb-3">
        <div className="text-white font-medium">{title}</div>
        {sub ? <div className="text-xs text-gray-500">{sub}</div> : null}
      </div>
      {children}
    </div>
  );
}

function Table({
  cols,
  rows,
}: {
  cols: string[];
  rows: (string | number | JSX.Element)[][];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-[12px] text-gray-400">
          <tr className="[&>th]:py-2 [&>th]:text-left">
            {cols.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody className="text-gray-300">
          {rows.length ? (
            rows.map((r, i) => (
              <tr key={i} className="[&>td]:py-2 border-t border-gray-800/60">
                {r.map((c, j) => (
                  <td key={j}>{c as any}</td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={cols.length}
                className="py-8 text-center text-gray-500"
              >
                No data.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// helpers
function num(v: any, d = 2) {
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(d) : "—";
}
function truncate(s?: string, n = 80) {
  if (!s) return "—";
  return s.length > n ? s.slice(0, n) + "…" : s;
}
function timeAgo(ts?: string) {
  if (!ts) return "—";
  const t = new Date(ts).getTime(),
    d = Date.now() - t;
  const m = Math.floor(d / 60000),
    h = Math.floor(m / 60);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return new Date(ts).toLocaleString();
}
function Badge(s?: string) {
  const x = String(s || "").toUpperCase();
  const cls =
    x === "ONLINE" || x === "OK" || x === "ACTIVE" || x === "RUNNING"
      ? "bg-emerald-500/10 text-emerald-300"
      : x === "ERROR" || x === "FAILED" || x === "STOPPED" || x === "REJECTED"
        ? "bg-rose-500/10 text-rose-300"
        : "bg-gray-600/20 text-gray-300";
  return (
    <span className={cn("px-2 py-0.5 rounded text-[11px]", cls)}>
      {s || "—"}
    </span>
  );
}
function humanUptime(sec?: number) {
  if (!sec) return "—";
  const d = Math.floor(sec / 86400),
    h = Math.floor((sec % 86400) / 3600);
  return d ? `${d}d ${h}h` : `${h}h`;
}
