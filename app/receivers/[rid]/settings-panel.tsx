/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useTransition } from "react";
import {
  CheckIcon,
  TrashIcon,
  KeyIcon,
  PowerIcon,
} from "@heroicons/react/24/outline";
import Card from "@/components/packs/Card";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { fmtMoney, timeAgo } from "@/lib/format";
import { useRouter } from "next/navigation";

function Chip({
  children,
  color = "gray",
}: {
  children: React.ReactNode;
  color?: "gray" | "green" | "indigo" | "amber" | "rose";
}) {
  const map: Record<string, string> = {
    gray: "bg-gray-700/40 text-gray-300",
    green: "bg-emerald-500/10 text-emerald-400",
    indigo: "bg-indigo-500/10 text-indigo-300",
    amber: "bg-amber-500/10 text-amber-300",
    rose: "bg-rose-500/10 text-rose-300",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] ${map[color]}`}>
      {children}
    </span>
  );
}

type Receiver = any;
type Account = any;

type Props = {
  rid: string;
  receiver: Receiver;
  account: Account | null;
  subscription: "fusion" | "lunar" | "nova";
};

const GROUPS = [
  {
    key: "fusion",
    title: "Fusion",
    desc: "Free signals – suitable for getting started.",
    requires: null as null | "lunar" | "nova",
    // Gold Trader Viper
    ids: [-1002450182599],
    source: "Gold Trader Viper",
    badge: null,
  },
  {
    key: "lunar",
    title: "Lunar",
    desc: "Advanced strategies. Requires Lunar or Nova.",
    requires: "lunar" as const,
    ids: [-1002267488931], // Taurus
    source: "Taurus",
    badge: "Requires Lunar or Nova",
  },
  {
    key: "nova",
    title: "Nova",
    desc: "Pro signals for the highest performance tier.",
    requires: "nova" as const,
    ids: [-1002793584288], // Forexpert
    source: "Forexpert",
    badge: "Requires Nova",
  },
];

function canUse(
  plan: "fusion" | "lunar" | "nova",
  item: (typeof GROUPS)[number]
) {
  if (!item.requires) return true; // Fusion
  if (item.requires === "lunar") return plan === "lunar" || plan === "nova";
  if (item.requires === "nova") return plan === "nova";
  return false;
}

export default function SettingsPanel({
  rid,
  receiver,
  account,
  subscription,
}: Props) {
  const router = useRouter();

  const initial = receiver?.settings || {};
  const allowed = initial?.allowed || {};
  const pos = initial?.position_limits || {};
  const news = initial?.news_policy || {};
  const tr = initial?.trade_rules || {};
  const dd = initial?.drawdown || {};

  // form states
  const [name, setName] = useState<string>(receiver?.name ?? "");
  const [symbols, setSymbols] = useState<string>(
    (allowed?.symbols || []).join(",")
  );
  const [newsMode, setNewsMode] = useState<string>(news?.mode ?? "window");
  const [newsBefore, setNewsBefore] = useState<string>(
    String(news?.before_sec ?? 300)
  );
  const [newsAfter, setNewsAfter] = useState<string>(
    String(news?.after_sec ?? 300)
  );
  const [maxTotal, setMaxTotal] = useState<string>(
    String(pos?.max_open_total ?? 5)
  );
  const [maxPerSymbol, setMaxPerSymbol] = useState<string>(
    String(pos?.max_open_per_symbol ?? 2)
  );
  const [posEnabled, setPosEnabled] = useState<boolean>(!!pos?.enabled);

  // trade rules basics
  const [units, setUnits] = useState<string>(tr?.units ?? "pips");
  const [slMode, setSlMode] = useState<string>(tr?.sl?.mode ?? "from_signal");
  const [slPips, setSlPips] = useState<string>(
    String(tr?.sl?.fixed_pips ?? 20)
  );
  const [tpMode, setTpMode] = useState<string>(tr?.tp?.mode ?? "fixed_single");
  const [tpCount, setTpCount] = useState<string>(String(tr?.tp?.count ?? 1));
  const [tpPips, setTpPips] = useState<string>(
    String(tr?.tp?.fixed_pips ?? 10)
  );
  const [beMode, setBeMode] = useState<string>(
    tr?.breakeven?.mode ?? "on_tp_hit"
  );
  const [beIdx, setBeIdx] = useState<string>(
    String(tr?.breakeven?.trigger_tp_index ?? 1)
  );
  const [trailingMode, setTrailingMode] = useState<string>(
    tr?.trailing?.mode ?? "disabled"
  );
  const [perTp, setPerTp] = useState<string>(
    String(tr?.volume?.per_tp ?? 0.01)
  );

  const [dailyPct, setDailyPct] = useState<string>(String(dd?.daily?.pct ?? 5));
  const [maxPct, setMaxPct] = useState<string>(String(dd?.max?.pct ?? 20));

  // groups selection (map auf IDs)
  const initialIds = (allowed?.signal_sources || []).map((x: any) => String(x));
  const [selectedKeys, setSelectedKeys] = useState<string[]>(
    GROUPS.filter((g) =>
      g.ids.some((id) => initialIds.includes(String(id)))
    ).map((g) => g.key)
  );

  const plan = subscription; // "fusion" | "lunar" | "nova"
  const [saving, startSave] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  // danger zone states
  const [statusBusy, setStatusBusy] = useState(false);
  const [rxStatus, setRxStatus] = useState<"ACTIVE" | "DISABLED">(
    (receiver?.status || "ACTIVE") as "ACTIVE" | "DISABLED"
  );
  const [resetBusy, setResetBusy] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [deleteText, setDeleteText] = useState("");

  function toggleKey(key: string) {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  async function saveAll() {
    setMessage(null);
    startSave(async () => {
      try {
        // 1) rename via /rename
        if ((receiver?.name || "") !== name.trim()) {
          const r = await fetch(
            `/api/receivers/${encodeURIComponent(rid)}/rename`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: name.trim() }),
            }
          );
          if (!r.ok) throw new Error("rename_failed");
        }

        // 2) settings patch
        const syms = symbols
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

        // group-ids aus Auswahl
        const pickedIds = GROUPS.filter((g) =>
          selectedKeys.includes(g.key)
        ).flatMap((g) => g.ids);

        const patch = {
          news_policy: {
            mode: newsMode,
            before_sec: Number(newsBefore) || 0,
            after_sec: Number(newsAfter) || 0,
          },
          position_limits: {
            max_open_total: Number(maxTotal) || 0,
            max_open_per_symbol: Number(maxPerSymbol) || 0,
            enabled: posEnabled,
          },
          allowed: {
            symbols: syms,
            signal_sources: pickedIds,
          },
          trade_rules: {
            units,
            sl: { mode: slMode, fixed_pips: Number(slPips) || 0 },
            tp: {
              mode: tpMode,
              count: Number(tpCount) || 1,
              fixed_pips: Number(tpPips) || 0,
            },
            breakeven: { mode: beMode, trigger_tp_index: Number(beIdx) || 1 },
            trailing: { mode: trailingMode },
            volume: { per_tp: Number(perTp) || 0 },
          },
          drawdown: {
            daily: { pct: Number(dailyPct) || 0, value: null, enabled: true },
            max: { pct: Number(maxPct) || 0, value: null, enabled: true },
          },
        };

        const r2 = await fetch(
          `/api/receivers/${encodeURIComponent(rid)}/settings`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(patch),
          }
        );
        const d2 = await r2.json().catch(() => ({}));
        if (!r2.ok) throw new Error(d2?.message || "save_failed");

        setMessage("Saved successfully.");
        router.refresh();
      } catch (e: any) {
        setMessage(e?.message || "Error while saving settings.");
      }
    });
  }

  async function onToggleStatus() {
    try {
      setStatusBusy(true);
      const next = rxStatus === "ACTIVE" ? "DISABLED" : "ACTIVE";
      const r = await fetch(
        `/api/receivers/${encodeURIComponent(rid)}/status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: next }),
        }
      );
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d?.message || "status_failed");
      setRxStatus(next);
      router.refresh();
    } catch {
      // optional: toast
    } finally {
      setStatusBusy(false);
    }
  }

  async function onResetLicense() {
    try {
      setResetBusy(true);
      setNewKey(null);
      const r = await fetch(
        `/api/receivers/${encodeURIComponent(rid)}/license/reset`,
        { method: "POST" }
      );
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d?.message || "reset_failed");
      setNewKey(d?.license?.key || null);
      router.refresh();
    } catch {
      // optional: toast
    } finally {
      setResetBusy(false);
    }
  }

  async function onDelete() {
    try {
      if (deleteText !== rid) return;
      const r = await fetch(`/api/receivers/${encodeURIComponent(rid)}`, {
        method: "DELETE",
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d?.message || "delete_failed");
      router.push("/receivers");
    } catch {
      // optional: toast
    }
  }

  return (
    <div className="space-y-6">
      {/* Account-Info (oben links) */}
      <Card>
        {(() => {
          // Snapshot-Form robust auslesen
          const acc = (account as any)?.account ?? account ?? {};
          const trd = (account as any)?.trading ?? {};
          const ccy = acc?.currency;
          const balance = typeof trd?.balance === "number" ? trd.balance : null;
          const equity = typeof trd?.equity === "number" ? trd.equity : null;

          const lastSeen = receiver?.last_seen
            ? new Date(receiver.last_seen)
            : null;
          const online = lastSeen
            ? Date.now() - lastSeen.getTime() < 5 * 60_000
            : false;
          const licenseStatus = (
            receiver?.license?.status || ""
          ).toUpperCase() as "ACTIVE" | "DISABLED" | "EXPIRED" | "";
          const licenseChecked = receiver?.license?.last_check_at || null;

          const version =
            receiver?.settings_version ?? receiver?.version ?? null;
          const ip = receiver?.ip_current || "—";
          const accId = acc?.id;

          return (
            <div className="flex items-start justify-between gap-6">
              {/* left */}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-white font-semibold truncate">
                    {acc?.id ?? rid} | {acc?.name ?? rid}
                  </div>
                  <Chip color={online ? "green" : "gray"}>
                    {online ? "Online" : "Offline"}
                  </Chip>
                  {version != null && <Chip color="indigo">v{version}</Chip>}
                  {rxStatus && (
                    <Chip color={rxStatus === "ACTIVE" ? "green" : "rose"}>
                      {rxStatus}
                    </Chip>
                  )}
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-gray-400">
                  <span>
                    ID: <span className="text-white/80">{rid}</span>
                  </span>
                  <span>
                    IP: <span className="text-white/80">{ip}</span>
                  </span>
                  {lastSeen && (
                    <span>Last seen {timeAgo(receiver.last_seen)}</span>
                  )}
                  {accId ? (
                    <Link
                      href={`/accounts/${accId}`}
                      className="text-indigo-300 hover:text-indigo-200"
                    >
                      Open account →
                    </Link>
                  ) : null}
                </div>

                {(acc?.company ||
                  acc?.server ||
                  acc?.leverage ||
                  acc?.type) && (
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-gray-400">
                    {acc?.company && <span>{acc.company}</span>}
                    {acc?.server && <span>• {acc.server}</span>}
                    {acc?.leverage && <span>• 1:{acc.leverage}</span>}
                    {acc?.type && <Chip>{acc.type}</Chip>}
                  </div>
                )}
              </div>

              {/* right */}
              <div className="text-right">
                <div className="text-white font-medium">
                  {balance != null ? fmtMoney(balance, ccy || "USD") : "—"}
                </div>
                <div className="text-xs text-gray-400">
                  {equity != null
                    ? `${fmtMoney(equity, ccy || "USD")} equity`
                    : "—"}
                </div>

                <div className="mt-2 flex items-center justify-end gap-2">
                  {licenseStatus && (
                    <Chip
                      color={
                        licenseStatus === "ACTIVE"
                          ? "green"
                          : licenseStatus === "DISABLED"
                          ? "rose"
                          : "amber"
                      }
                    >
                      License {licenseStatus}
                    </Chip>
                  )}
                  {licenseChecked && (
                    <span className="text-[11px] text-gray-500">
                      Checked {timeAgo(licenseChecked)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      </Card>

      {/* General */}
      <Card>
        <SectionTitle
          title="General"
          description="Basic information about this receiver."
        />
        <label className="block text-xs text-gray-400 mb-1">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md bg-[#0f1115] border border-gray-700 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-indigo-500/40"
          placeholder="Receiver name"
        />
      </Card>

      {/* Settings */}
      <Card>
        <SectionTitle
          title="Settings"
          description="News filter, position limits and allowed symbols."
        />

        {/* News filter */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-1">
            <label className="block text-xs text-gray-400 mb-1">
              News filter
            </label>
            <select
              value={newsMode}
              onChange={(e) => setNewsMode(e.target.value)}
              className="w-full rounded-md bg-[#0f1115] border border-gray-700 px-3 py-2 text-white"
            >
              <option value="window">window</option>
              <option value="off">off</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Before (sec)
            </label>
            <input
              value={newsBefore}
              onChange={(e) => setNewsBefore(e.target.value)}
              className="w-full rounded-md bg-[#0f1115] border border-gray-700 px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              After (sec)
            </label>
            <input
              value={newsAfter}
              onChange={(e) => setNewsAfter(e.target.value)}
              className="w-full rounded-md bg-[#0f1115] border border-gray-700 px-3 py-2 text-white"
            />
          </div>
        </div>

        {/* Position limits */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div className="md:col-span-1">
            <label className="block text-xs text-gray-400 mb-1">
              Max open (total)
            </label>
            <input
              value={maxTotal}
              onChange={(e) => setMaxTotal(e.target.value)}
              className="w-full rounded-md bg-[#0f1115] border border-gray-700 px-3 py-2 text-white"
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs text-gray-400 mb-1">
              Max open / symbol
            </label>
            <input
              value={maxPerSymbol}
              onChange={(e) => setMaxPerSymbol(e.target.value)}
              className="w-full rounded-md bg-[#0f1115] border border-gray-700 px-3 py-2 text-white"
            />
          </div>
          <div className="md:col-span-2">
            <DarkCheckbox
              checked={posEnabled}
              onChange={setPosEnabled}
              label="Position limits enabled"
              subtitle="If disabled, the receiver will not restrict number of positions."
            />
          </div>
        </div>

        {/* Symbols */}
        <div className="mt-5">
          <label className="block text-xs text-gray-400 mb-1">
            Symbols (comma separated)
          </label>
          <input
            value={symbols}
            onChange={(e) => setSymbols(e.target.value)}
            className="w-full rounded-md bg-[#0f1115] border border-gray-700 px-3 py-2 text-white"
            placeholder="XAUUSD,EURUSD,BTCUSD"
          />
        </div>
      </Card>

      {/* Signal groups */}
      <Card>
        <SectionTitle
          title="Signal groups"
          description="Select the groups this receiver is allowed to follow."
        />
        <div className="space-y-3">
          {GROUPS.map((g) => {
            const allowed = canUse(plan, g);
            const checked = selectedKeys.includes(g.key);
            return (
              <label
                key={g.key}
                className={cn(
                  "flex items-start gap-3 rounded-md border px-3 py-3",
                  allowed
                    ? "border-gray-700 hover:border-gray-600 bg-[#0f1115]"
                    : "border-gray-800 bg-[#0b0d10] opacity-60 cursor-not-allowed"
                )}
              >
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={checked}
                  onChange={() => allowed && toggleKey(g.key)}
                  disabled={!allowed}
                />
                <span
                  className={cn(
                    "mt-1 h-4 w-4 rounded-md ring-1 ring-gray-600 bg-gray-800 flex items-center justify-center peer-checked:bg-indigo-500 peer-checked:ring-indigo-500"
                  )}
                >
                  <CheckIcon
                    className={cn(
                      "h-3.5 w-3.5 text-white transition-opacity",
                      checked ? "opacity-100" : "opacity-0"
                    )}
                  />
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="text-white font-medium">{g.title}</div>
                    {g.badge && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300">
                        {g.badge}
                      </span>
                    )}
                    {!allowed && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-700/50 text-gray-300">
                        Not available on your plan
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{g.desc}</div>
                  <div className="text-[11px] text-gray-500 mt-1">
                    Source: {g.source} · IDs: {g.ids.join(", ")}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </Card>

      {/* Trade rules */}
      <Card>
        <SectionTitle
          title="Trade rules"
          description="Order units, SL/TP behaviour, breakeven, trailing and volume."
        />
        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Units</label>
            <select
              value={units}
              onChange={(e) => setUnits(e.target.value)}
              className="w-full rounded-md bg-[#0f1115] border border-gray-700 px-3 py-2 text-white"
            >
              <option value="pips">pips</option>
              <option value="percent">percent</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">SL mode</label>
            <select
              value={slMode}
              onChange={(e) => setSlMode(e.target.value)}
              className="w-full rounded-md bg-[#0f1115] border border-gray-700 px-3 py-2 text-white"
            >
              <option value="from_signal">from_signal</option>
              <option value="fixed">fixed</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              SL fixed (pips)
            </label>
            <input
              value={slPips}
              onChange={(e) => setSlPips(e.target.value)}
              className="w-full rounded-md bg-[#0f1115] border border-gray-700 px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">TP mode</label>
            <select
              value={tpMode}
              onChange={(e) => setTpMode(e.target.value)}
              className="w-full rounded-md bg-[#0f1115] border border-gray-700 px-3 py-2 text-white"
            >
              <option value="fixed_single">fixed_single</option>
              <option value="from_signal">from_signal</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">TP count</label>
            <input
              value={tpCount}
              onChange={(e) => setTpCount(e.target.value)}
              className="w-full rounded-md bg-[#0f1115] border border-gray-700 px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              TP fixed (pips)
            </label>
            <input
              value={tpPips}
              onChange={(e) => setTpPips(e.target.value)}
              className="w-full rounded-md bg-[#0f1115] border border-gray-700 px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Breakeven
            </label>
            <select
              value={beMode}
              onChange={(e) => setBeMode(e.target.value)}
              className="w-full rounded-md bg-[#0f1115] border border-gray-700 px-3 py-2 text-white"
            >
              <option value="off">off</option>
              <option value="on_tp_hit">on_tp_hit</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Breakeven trigger TP#
            </label>
            <input
              value={beIdx}
              onChange={(e) => setBeIdx(e.target.value)}
              className="w-full rounded-md bg-[#0f1115] border border-gray-700 px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Trailing</label>
            <select
              value={trailingMode}
              onChange={(e) => setTrailingMode(e.target.value)}
              className="w-full rounded-md bg-[#0f1115] border border-gray-700 px-3 py-2 text-white"
            >
              <option value="disabled">disabled</option>
              <option value="on">on</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Volume per TP (lot)
            </label>
            <input
              value={perTp}
              onChange={(e) => setPerTp(e.target.value)}
              className="w-full rounded-md bg-[#0f1115] border border-gray-700 px-3 py-2 text-white"
            />
          </div>
        </div>
      </Card>

      {/* Risk */}
      <Card>
        <SectionTitle
          title="Risk limits"
          description="Daily and total (max) drawdown percentages."
        />
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Daily drawdown (%)
            </label>
            <input
              value={dailyPct}
              onChange={(e) => setDailyPct(e.target.value)}
              className="w-full rounded-md bg-[#0f1115] border border-gray-700 px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Max drawdown (%)
            </label>
            <input
              value={maxPct}
              onChange={(e) => setMaxPct(e.target.value)}
              className="w-full rounded-md bg-[#0f1115] border border-gray-700 px-3 py-2 text-white"
            />
          </div>
        </div>
      </Card>

      {/* Save button */}
      <div className="flex items-center gap-3">
        <button
          onClick={saveAll}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-md bg-indigo-500 hover:bg-indigo-500/90 px-4 py-2 text-sm font-medium text-white"
        >
          <CheckIcon className="h-4 w-4" />
          {saving ? "Saving..." : "Save settings"}
        </button>
        {message && <span className="text-sm text-gray-400">{message}</span>}
      </div>

      {/* Danger zone */}
      <Card className="bg-rose-900/10 border border-rose-800 hover:bg-rose-900/10">
        <SectionTitle
          title="Danger zone"
          description="Sensitive operations. Be careful!"
        />

        {/* Status toggle */}
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <div className="text-white font-medium">Receiver status</div>
            <div className="text-xs text-gray-500">
              Toggle between ACTIVE and DISABLED. The EA will not place or
              manage trades while disabled.
            </div>
          </div>
          <button
            onClick={onToggleStatus}
            disabled={statusBusy}
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
              rxStatus === "ACTIVE"
                ? "bg-rose-500/90 hover:bg-rose-500 text-white"
                : "bg-emerald-500/90 hover:bg-emerald-500 text-white"
            )}
          >
            <PowerIcon className="h-4 w-4" />
            {statusBusy
              ? "Working..."
              : rxStatus === "ACTIVE"
              ? "Disable receiver"
              : "Activate receiver"}
          </button>
        </div>

        {/* License reset */}
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <div className="text-white font-medium">License key</div>
            <div className="text-xs text-gray-500">
              Reset the license key. The EA must be updated with the new key.
            </div>
            {newKey && (
              <div className="mt-1 text-[11px] text-indigo-300 break-all">
                New key: <span className="text-white/90">{newKey}</span>
              </div>
            )}
          </div>
          <button
            onClick={onResetLicense}
            disabled={resetBusy}
            className="inline-flex items-center gap-2 rounded-md bg-slate-600/60 hover:bg-slate-600 px-3 py-2 text-sm font-medium text-white"
          >
            <KeyIcon className="h-4 w-4" />
            {resetBusy ? "Resetting..." : "Reset license key"}
          </button>
        </div>

        {/* Delete */}
        <div className="mt-6">
          <div className="text-white font-medium mb-1">Delete receiver</div>
          <div className="text-xs text-gray-500 mb-2">
            To delete this receiver and <strong>all related data</strong>, type
            the receiver ID <span className="text-gray-300">{rid}</span> below:
          </div>
          <div className="flex items-center gap-3">
            <input
              value={deleteText}
              onChange={(e) => setDeleteText(e.target.value)}
              className="w-full rounded-md bg-[#0f1115] border border-gray-700 px-3 py-2 text-white"
              placeholder={rid}
            />
            <button
              onClick={onDelete}
              disabled={deleteText !== rid}
              className={cn(
                "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
                deleteText === rid
                  ? "bg-rose-600 hover:bg-rose-600/90 text-white"
                  : "bg-rose-900/40 text-rose-300 cursor-not-allowed"
              )}
            >
              <TrashIcon className="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function SectionTitle({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-4">
      <div className="text-white font-semibold">{title}</div>
      {description && (
        <div className="text-xs text-gray-500 mt-0.5">{description}</div>
      )}
    </div>
  );
}

function DarkCheckbox({
  checked,
  onChange,
  label,
  subtitle,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  subtitle?: string;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="mt-1 h-4 w-4 rounded-md ring-1 ring-gray-600 bg-gray-800 flex items-center justify-center peer-checked:bg-indigo-500 peer-checked:ring-indigo-500">
        <CheckIcon
          className={cn(
            "h-3.5 w-3.5 text-white transition-opacity",
            checked ? "opacity-100" : "opacity-0"
          )}
        />
      </span>
      <span>
        <span className="text-white text-sm">{label}</span>
        {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
      </span>
    </label>
  );
}
