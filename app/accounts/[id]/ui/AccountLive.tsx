"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useRef, useState } from "react";
import Card from "@/components/packs/Card";
import { fmtMoney, timeAgo } from "@/lib/format";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { cn } from "@/lib/utils";

type Props = {
  aid: string;
  receiverId: string | null;
  currency: string;
};

type HistRow = {
  ts: string;
  trading?: {
    equity?: number | null;
    balance?: number | null;
    margin_level?: number | null;
    positions_total?: number | null;
    margin_free?: number | null;
    margin?: number | null;
  };
};

function useAutoJSON<T = any>(url: string, intervalMs = 5000) {
  const [data, setData] = useState<T | null>(null);
  const timer = useRef<any>(null);

  const load = async () => {
    try {
      const r = await fetch(url, { cache: "no-store" });
      const d = await r.json();
      setData(d);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    load();
    timer.current = setInterval(load, intervalMs);
    return () => clearInterval(timer.current);
  }, [url, intervalMs]);

  return data;
}

type RangeMode = "live" | "1h" | "4h" | "1d";

export default function AccountLive({ aid, receiverId, currency }: Props) {
  const [mode, setMode] = useState<RangeMode>("live");

  const { histUrl, pollMs, subtitle } = useMemo(() => {
    const now = new Date();
    const to = encodeURIComponent(now.toISOString());

    if (mode === "live") {
      return {
        histUrl: `/api/accounts/${encodeURIComponent(aid)}/history?limit=240`,
        pollMs: 5000,
        subtitle: "Live view (auto-refresh)",
      };
    }

    const hours = mode === "1h" ? 1 : mode === "4h" ? 4 : 24;
    const from = new Date(now.getTime() - hours * 60 * 60 * 1000);
    const qs = `from=${encodeURIComponent(from.toISOString())}&to=${to}&limit=2000`;

    return {
      histUrl: `/api/accounts/${encodeURIComponent(aid)}/history?${qs}`,
      pollMs: mode === "1d" ? 60000 : 30000,
      subtitle:
        mode === "1h"
          ? "Last 1 hour"
          : mode === "4h"
            ? "Last 4 hours"
            : "Last 24 hours",
    };
  }, [aid, mode]);

  const hist = useAutoJSON<{ ok: boolean; items: HistRow[] }>(histUrl, pollMs);

  // Open + Closed getrennt abfragen (5s)
  const open = useAutoJSON<{ ok: boolean; items: any[] }>(
    `/api/accounts/${encodeURIComponent(aid)}/trades/open?limit=50`,
    5000
  );
  const closed = useAutoJSON<{ ok: boolean; items: any[] }>(
    `/api/accounts/${encodeURIComponent(aid)}/trades?limit=50`,
    5000
  );

  const series = useMemo(() => {
    const items = hist?.items ?? [];
    const mapped = items
      .map((x) => ({
        ts: x.ts,
        t: new Date(x.ts).getTime(),
        equity: toNum(x.trading?.equity),
        balance: toNum(x.trading?.balance),
        ml: toNum(x.trading?.margin_level),
        pos: toNum(x.trading?.positions_total),
      }))
      .sort((a, b) => a.t - b.t);
    return mapped;
  }, [hist]);

  const deltas = useMemo(() => {
    if (!series.length) return { equity: 0, balance: 0, ml: 0, pos: 0 };
    const last = series[series.length - 1];
    const prev = series[series.length - 2] ?? last;
    return {
      equity: (last.equity ?? 0) - (prev.equity ?? 0),
      balance: (last.balance ?? 0) - (prev.balance ?? 0),
      ml: (last.ml ?? 0) - (prev.ml ?? 0),
      pos: (last.pos ?? 0) - (prev.pos ?? 0),
    };
  }, [series]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-white font-medium">Analytics</div>
        <div className="text-xs text-gray-300 flex items-center gap-2">
          <label className="text-gray-400">Range</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as RangeMode)}
            className="bg-[#0d1217] border border-gray-700/70 rounded-md px-2 py-1 text-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-600"
          >
            <option value="live">Live</option>
            <option value="1h">1h</option>
            <option value="4h">4h</option>
            <option value="1d">1d</option>
          </select>
        </div>
      </div>

      {/* KPIs */}
      <Card>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          <KpiBox
            label="Equity"
            value={
              series.length
                ? fmtMoney(series.at(-1)!.equity ?? 0, currency)
                : "—"
            }
            delta={deltas.equity}
          />
          <KpiBox
            label="Balance"
            value={
              series.length
                ? fmtMoney(series.at(-1)!.balance ?? 0, currency)
                : "—"
            }
            delta={deltas.balance}
          />
          <KpiBox
            label="Margin level (%)"
            value={series.length ? String(series.at(-1)!.ml ?? "—") : "—"}
            delta={deltas.ml}
          />
          <KpiBox
            label="Open positions"
            value={series.length ? String(series.at(-1)!.pos ?? "—") : "—"}
            delta={deltas.pos}
          />
        </div>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <SectionTitle title="Equity" subtitle={subtitle} />
          <ChartLine data={series} dataKey="equity" />
        </Card>
        <Card>
          <SectionTitle title="Balance" subtitle={subtitle} />
          <ChartLine data={series} dataKey="balance" />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <SectionTitle title="Margin level (%)" subtitle={subtitle} />
          <ChartLine data={series} dataKey="ml" />
        </Card>
        <Card>
          <SectionTitle title="Open positions" subtitle={subtitle} />
          <ChartLine data={series} dataKey="pos" />
        </Card>
      </div>

      {/* Trade history (CLOSED only, zeigt ursprüngliche Richtung) */}
      <Card>
        <SectionTitle
          title="Trade history"
          subtitle="Closed trades (auto-refresh every 5s)"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[12px] text-gray-400">
              <tr className="[&>th]:py-2 [&>th]:text-left">
                <th className="w-44">Close time</th>
                <th>Symbol</th>
                <th>Side</th>
                <th className="text-right">Volume</th>
                <th className="text-right">Close price</th>
                <th className="text-right">P/L</th>
                <th className="text-right">Swap</th>
                <th className="text-right">Commission</th>
                <th className="text-right">Deal #</th>
                <th>Comment</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              {(closed?.items ?? []).length ? (
                closed!.items
                  .filter((r: any) => r.state === "CLOSED")
                  .map((r: any, i: number) => {
                    const side = displaySide(r); // ggf. invertiert bei CLOSED
                    return (
                      <tr
                        key={`${r._id || i}`}
                        className="[&>td]:py-2 border-t border-gray-800/60"
                      >
                        <td className="text-gray-400">
                          {r.close_time ? timeAgo(r.close_time) : "—"}
                        </td>
                        <td>{r.symbol ?? "—"}</td>
                        <td>
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded text-[11px]",
                              side === "BUY"
                                ? "bg-emerald-500/10 text-emerald-300"
                                : "bg-sky-500/10 text-sky-300"
                            )}
                          >
                            {side}
                          </span>
                        </td>
                        <td className="text-right">{r.volume ?? "—"}</td>
                        <td className="text-right">
                          {numOrDash(r.close_price)}
                        </td>
                        <td
                          className={cn(
                            "text-right",
                            (r.profit ?? 0) >= 0
                              ? "text-emerald-400"
                              : "text-rose-400"
                          )}
                        >
                          {typeof r.profit === "number"
                            ? `${r.profit.toFixed(2)} ${currency}`
                            : "—"}
                        </td>
                        <td className="text-right">{numOrDash(r.swap)}</td>
                        <td className="text-right">
                          {numOrDash(r.commission)}
                        </td>
                        <td className="text-right">{r.deal_ticket ?? "—"}</td>
                        <td className="text-gray-400">{r.comment ?? "—"}</td>
                      </tr>
                    );
                  })
              ) : (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-gray-500">
                    No closed trades yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function toNum(v: any): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function numOrDash(v: any) {
  return typeof v === "number" ? v.toFixed(2) : "—";
}

function fmtMaybeMoney(v: any, ccy: string) {
  return typeof v === "number" ? fmtMoney(v, ccy) : "—";
}

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-3">
      <div className="text-white font-medium">{title}</div>
      {subtitle ? (
        <div className="text-xs text-gray-500">{subtitle}</div>
      ) : null}
    </div>
  );
}

function ChartLine({ data, dataKey }: { data: any[]; dataKey: string }) {
  if (!data?.length) {
    return (
      <div className="h-56 flex items-center justify-center text-gray-500">
        No data.
      </div>
    );
  }
  const dd = data.map((d) => ({ ...d, x: new Date(d.t).toLocaleTimeString() }));
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={dd} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
          <CartesianGrid strokeOpacity={0.1} vertical={false} />
          <XAxis dataKey="x" tick={{ fill: "#9ca3af", fontSize: 11 }} />
          <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              background: "#0b0f14",
              border: "1px solid #1f2937",
              borderRadius: 8,
            }}
            labelStyle={{ color: "#e5e7eb" }}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke="#60a5fa"
            dot={false}
            strokeWidth={1.8}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function KpiBox({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta: number;
}) {
  const up = delta > 0;
  const down = delta < 0;
  return (
    <div className="rounded-lg border border-gray-800 bg-[#0d1217] p-4">
      <div className="flex items-center justify-between">
        <div className="text-[12px] text-gray-400">{label}</div>
        <span
          className={cn(
            "inline-block h-2 w-2 rounded-full",
            up ? "bg-emerald-500" : down ? "bg-rose-500" : "bg-gray-500/60"
          )}
        />
      </div>
      <div className="text-white mt-1">{value}</div>
      <div
        className={cn(
          "text-[11px] mt-0.5",
          up ? "text-emerald-400" : down ? "text-rose-400" : "text-gray-500"
        )}
      >
        {delta === 0
          ? "—"
          : up
            ? `▲ ${delta.toFixed(2)}`
            : `▼ ${Math.abs(delta).toFixed(2)}`}
      </div>
    </div>
  );
}

/** Zeigt bei CLOSED die ursprüngliche Positionsrichtung (BUY, wenn mit SELL geschlossen wurde) */
function displaySide(r: any) {
  const s = String(r?.side || "").toUpperCase();
  if (String(r?.state || "").toUpperCase() !== "CLOSED") return s || "—";
  if (s === "SELL") return "BUY";
  if (s === "BUY") return "SELL";
  return s || "—";
}
