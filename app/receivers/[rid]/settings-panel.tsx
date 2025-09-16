/* eslint-disable @typescript-eslint/no-explicit-any */
// app/receivers/[rid]/settings-panel.tsx
"use client";

import Card from "@/components/packs/Card";
import { useRouter, useParams } from "next/navigation";
import { useState } from "react";

type Receiver = {
  receiver_id: string;
  name: string;
  status: "ACTIVE" | "DISABLED";
  settings_version: number;
  settings: any;
  license?: { license_id: string; status: string };
};

export default function SettingsPanel({ receiver }: { receiver: Receiver }) {
  const router = useRouter();
  const { rid } = useParams<{ rid: string }>();

  const [name, setName] = useState(receiver?.name ?? "");
  const [savingName, setSavingName] = useState(false);

  // settings form state (einfach & robust – comma Inputs für Arrays)
  const s = receiver.settings || {};
  const [newsMode, setNewsMode] = useState(s?.news_policy?.mode ?? "window");
  const [newsBefore, setNewsBefore] = useState<number>(
    s?.news_policy?.before_sec ?? 300
  );
  const [newsAfter, setNewsAfter] = useState<number>(
    s?.news_policy?.after_sec ?? 300
  );

  const [maxTotal, setMaxTotal] = useState<number>(
    s?.position_limits?.max_open_total ?? 5
  );
  const [maxPer, setMaxPer] = useState<number>(
    s?.position_limits?.max_open_per_symbol ?? 2
  );
  const [posEnabled, setPosEnabled] = useState<boolean>(
    !!s?.position_limits?.enabled
  );

  const [symbols, setSymbols] = useState<string>(
    (s?.allowed?.symbols || []).join(",")
  );
  const [sources, setSources] = useState<string>(
    (s?.allowed?.signal_sources || []).join(",")
  );

  const [units, setUnits] = useState<string>(s?.trade_rules?.units ?? "pips");
  const [slMode, setSlMode] = useState<string>(
    s?.trade_rules?.sl?.mode ?? "from_signal"
  );
  const [slPips, setSlPips] = useState<number>(
    s?.trade_rules?.sl?.fixed_pips ?? 20
  );
  const [tpMode, setTpMode] = useState<string>(
    s?.trade_rules?.tp?.mode ?? "fixed_single"
  );
  const [tpCount, setTpCount] = useState<number>(
    s?.trade_rules?.tp?.count ?? 1
  );
  const [tpPips, setTpPips] = useState<number>(
    s?.trade_rules?.tp?.fixed_pips ?? 10
  );
  const [beMode, setBeMode] = useState<string>(
    s?.trade_rules?.breakeven?.mode ?? "on_tp_hit"
  );
  const [beIndex, setBeIndex] = useState<number>(
    s?.trade_rules?.breakeven?.trigger_tp_index ?? 1
  );
  const [trailingMode, setTrailingMode] = useState<string>(
    s?.trade_rules?.trailing?.mode ?? "disabled"
  );
  const [perTp, setPerTp] = useState<number>(
    s?.trade_rules?.volume?.per_tp ?? 0.01
  );

  const [savingSettings, setSavingSettings] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetKey, setResetKey] = useState<string | null>(null);

  const [deleting, setDeleting] = useState(false);
  const [confirm, setConfirm] = useState("");

  async function postJSON(url: string, body?: any, method = "POST") {
    const r = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d?.message || d?.error || "Request failed");
    return d;
  }

  async function saveName() {
    setSavingName(true);
    try {
      await postJSON(`/api/receivers/${rid}/rename`, { name });
      router.refresh();
    } catch (e) {
      alert(String(e));
    } finally {
      setSavingName(false);
    }
  }

  async function saveSettings() {
    setSavingSettings(true);
    try {
      const patch = {
        news_policy: {
          mode: newsMode,
          before_sec: Number(newsBefore),
          after_sec: Number(newsAfter),
        },
        position_limits: {
          max_open_total: Number(maxTotal),
          max_open_per_symbol: Number(maxPer),
          enabled: !!posEnabled,
        },
        allowed: {
          symbols: symbols
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          signal_sources: sources
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        },
        trade_rules: {
          units,
          sl: { mode: slMode, fixed_pips: Number(slPips) },
          tp: {
            mode: tpMode,
            count: Number(tpCount),
            fixed_pips: Number(tpPips),
          },
          breakeven: { mode: beMode, trigger_tp_index: Number(beIndex) },
          trailing: { mode: trailingMode },
          volume: { per_tp: Number(perTp) },
        },
      };
      await postJSON(`/api/receivers/${rid}/settings`, patch, "PATCH");
      router.refresh();
    } catch (e) {
      alert(String(e));
    } finally {
      setSavingSettings(false);
    }
  }

  async function toggleActive() {
    setToggling(true);
    try {
      const next = receiver.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
      await postJSON(`/api/receivers/${rid}/license-status`, { status: next });
      router.refresh();
    } catch (e) {
      alert(String(e));
    } finally {
      setToggling(false);
    }
  }

  async function resetLicense() {
    setResetting(true);
    try {
      const d = await postJSON(`/api/receivers/${rid}/license/reset`);
      setResetKey(d?.license?.key || null);
    } catch (e) {
      alert(String(e));
    } finally {
      setResetting(false);
    }
  }

  async function deleteReceiver() {
    if (confirm !== receiver.receiver_id) {
      alert("Type the exact Receiver ID to confirm.");
      return;
    }
    setDeleting(true);
    try {
      await fetch(`/api/receivers/${rid}`, { method: "DELETE" });
      // Zurück zur Übersicht
      router.push("/receivers");
    } catch (e) {
      alert(String(e));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* General */}
      <Card>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <div className="text-white font-medium mb-2">General</div>
            <div className="space-y-2">
              <label className="block text-sm text-gray-400">Name</label>
              <input
                className="w-full rounded bg-gray-900 border border-gray-700 px-3 py-2 text-white"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Receiver name"
              />
            </div>
          </div>
          <div className="flex items-end">
            <button
              onClick={saveName}
              disabled={savingName || !name.trim()}
              className="w-full md:w-auto bg-[#3f4bf2] hover:bg-[#3f4bf2]/80 text-white rounded px-4 py-2"
            >
              {savingName ? "Saving..." : "Save name"}
            </button>
          </div>
        </div>
      </Card>

      {/* Settings */}
      <Card>
        <div className="text-white font-medium mb-4">Settings</div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* News policy */}
          <div>
            <div className="text-sm text-gray-400 mb-2">News filter</div>
            <div className="grid grid-cols-3 gap-2">
              <select
                value={newsMode}
                onChange={(e) => setNewsMode(e.target.value)}
                className="col-span-3 md:col-span-1 rounded bg-gray-900 border border-gray-700 px-3 py-2 text-white"
              >
                <option value="window">window</option>
                <option value="off">off</option>
              </select>
              <input
                type="number"
                value={newsBefore}
                onChange={(e) => setNewsBefore(Number(e.target.value))}
                className="rounded bg-gray-900 border border-gray-700 px-3 py-2 text-white"
                placeholder="before (s)"
              />
              <input
                type="number"
                value={newsAfter}
                onChange={(e) => setNewsAfter(Number(e.target.value))}
                className="rounded bg-gray-900 border border-gray-700 px-3 py-2 text-white"
                placeholder="after (s)"
              />
            </div>
          </div>

          {/* Position limits */}
          <div>
            <div className="text-sm text-gray-400 mb-2">Position limits</div>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                value={maxTotal}
                onChange={(e) => setMaxTotal(Number(e.target.value))}
                className="rounded bg-gray-900 border border-gray-700 px-3 py-2 text-white"
                placeholder="max total"
              />
              <input
                type="number"
                value={maxPer}
                onChange={(e) => setMaxPer(Number(e.target.value))}
                className="rounded bg-gray-900 border border-gray-700 px-3 py-2 text-white"
                placeholder="max per symbol"
              />
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={posEnabled}
                  onChange={(e) => setPosEnabled(e.target.checked)}
                />
                enabled
              </label>
            </div>
          </div>

          {/* Allowed */}
          <div>
            <div className="text-sm text-gray-400 mb-2">Allowed</div>
            <div className="space-y-2">
              <input
                value={symbols}
                onChange={(e) => setSymbols(e.target.value)}
                className="w-full rounded bg-gray-900 border border-gray-700 px-3 py-2 text-white"
                placeholder="Symbols (comma separated)"
              />
              <input
                value={sources}
                onChange={(e) => setSources(e.target.value)}
                className="w-full rounded bg-gray-900 border border-gray-700 px-3 py-2 text-white"
                placeholder="Signal sources (comma separated)"
              />
            </div>
          </div>

          {/* Trade rules */}
          <div>
            <div className="text-sm text-gray-400 mb-2">Trade rules</div>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={units}
                onChange={(e) => setUnits(e.target.value)}
                className="rounded bg-gray-900 border border-gray-700 px-3 py-2 text-white col-span-2"
              >
                <option value="pips">units: pips</option>
                <option value="points">units: points</option>
              </select>

              <select
                value={slMode}
                onChange={(e) => setSlMode(e.target.value)}
                className="rounded bg-gray-900 border border-gray-700 px-3 py-2 text-white"
              >
                <option value="from_signal">SL: from_signal</option>
                <option value="fixed">SL: fixed</option>
              </select>
              <input
                type="number"
                value={slPips}
                onChange={(e) => setSlPips(Number(e.target.value))}
                className="rounded bg-gray-900 border border-gray-700 px-3 py-2 text-white"
                placeholder="SL pips"
              />

              <select
                value={tpMode}
                onChange={(e) => setTpMode(e.target.value)}
                className="rounded bg-gray-900 border border-gray-700 px-3 py-2 text-white"
              >
                <option value="fixed_single">TP: fixed_single</option>
                <option value="from_signal">TP: from_signal</option>
              </select>
              <input
                type="number"
                value={tpCount}
                onChange={(e) => setTpCount(Number(e.target.value))}
                className="rounded bg-gray-900 border border-gray-700 px-3 py-2 text-white"
                placeholder="TP count"
              />

              <input
                type="number"
                value={tpPips}
                onChange={(e) => setTpPips(Number(e.target.value))}
                className="rounded bg-gray-900 border border-gray-700 px-3 py-2 text-white"
                placeholder="TP pips"
              />

              <select
                value={beMode}
                onChange={(e) => setBeMode(e.target.value)}
                className="rounded bg-gray-900 border border-gray-700 px-3 py-2 text-white"
              >
                <option value="on_tp_hit">BE: on_tp_hit</option>
                <option value="disabled">BE: disabled</option>
              </select>
              <input
                type="number"
                value={beIndex}
                onChange={(e) => setBeIndex(Number(e.target.value))}
                className="rounded bg-gray-900 border border-gray-700 px-3 py-2 text-white"
                placeholder="BE index"
              />

              <select
                value={trailingMode}
                onChange={(e) => setTrailingMode(e.target.value)}
                className="rounded bg-gray-900 border border-gray-700 px-3 py-2 text-white col-span-2"
              >
                <option value="disabled">Trailing: disabled</option>
                <option value="from_signal">Trailing: from_signal</option>
              </select>

              <input
                type="number"
                step="0.01"
                value={perTp}
                onChange={(e) => setPerTp(Number(e.target.value))}
                className="rounded bg-gray-900 border border-gray-700 px-3 py-2 text-white col-span-2"
                placeholder="volume per TP"
              />
            </div>
          </div>
        </div>

        <div className="pt-4">
          <button
            onClick={saveSettings}
            disabled={savingSettings}
            className="bg-[#3f4bf2] hover:bg-[#3f4bf2]/80 text-white rounded px-4 py-2"
          >
            {savingSettings ? "Saving..." : "Save settings"}
          </button>
        </div>
      </Card>

      {/* Actions */}
      <Card>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <div className="text-white font-medium mb-2">Status</div>
            <button
              onClick={toggleActive}
              disabled={toggling}
              className="bg-gray-700 hover:bg-gray-600 text-white rounded px-4 py-2"
            >
              {toggling
                ? "Working..."
                : receiver.status === "ACTIVE"
                ? "Disable receiver"
                : "Enable receiver"}
            </button>
          </div>

          <div>
            <div className="text-white font-medium mb-2">License key</div>
            <button
              onClick={resetLicense}
              disabled={resetting}
              className="bg-gray-700 hover:bg-gray-600 text-white rounded px-4 py-2"
            >
              {resetting ? "Resetting..." : "Reset license key"}
            </button>
            {resetKey && (
              <div className="mt-2 text-sm text-gray-300 break-all">
                New key: <span className="font-mono">{resetKey}</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card>
        <div className="text-white font-medium mb-2">Danger zone</div>
        <p className="text-sm text-gray-400 mb-3">
          To delete this receiver and all related data, type the receiver ID{" "}
          <b>{receiver.receiver_id}</b> below:
        </p>
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full rounded bg-gray-900 border border-gray-700 px-3 py-2 text-white"
            placeholder={receiver.receiver_id}
          />
          <button
            onClick={deleteReceiver}
            disabled={deleting || confirm !== receiver.receiver_id}
            className="bg-red-600 hover:bg-red-700 text-white rounded px-4 py-2"
          >
            {deleting ? "Deleting..." : "Delete receiver"}
          </button>
        </div>
      </Card>
    </div>
  );
}
