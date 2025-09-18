/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";

type ReceiverRow = {
  receiver_id: string;
  name?: string;
  status?: string;
  created_at?: string;
  last_seen?: string;
  user: {
    user_id: string;
    email: string;
    first_name?: string;
    last_name?: string;
  };
  account?: any;
  trading?: any;
};

function isOnline(ts?: string | null) {
  if (!ts) return false;
  const t = new Date(ts).getTime();
  return Number.isFinite(t) && Date.now() - t <= 30_000;
}

export default function ReceiversTable({
  initialItems,
}: {
  initialItems: ReceiverRow[];
}) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ReceiverRow[]>(initialItems || []);

  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState<ReceiverRow | null>(null);
  const [acc, setAcc] = useState<any>(null);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    if (!q.trim()) return items;
    const s = q.toLowerCase();
    return items.filter((r) =>
      [
        r.receiver_id,
        r.name,
        r.status,
        r.user?.email,
        r.user?.first_name,
        r.user?.last_name,
        r.account?.name,
        r.account?.company,
        r.account?.server,
        r.account?.currency,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(s))
    );
  }, [items, q]);

  async function reload(query?: string) {
    setLoading(true);
    try {
      const url = `/api/admin/receivers${query ? `?q=${encodeURIComponent(query)}` : ""}`;
      const r = await fetch(url, { cache: "no-store" });
      const j = await r.json();
      if (j?.ok) setItems(j.receivers || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(() => reload(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  async function openDrawer(row: ReceiverRow) {
    setSel(row);
    setNewName(row.name || "");
    setOpen(true);
    const r = await fetch(`/api/admin/receivers/${row.receiver_id}/account`, {
      cache: "no-store",
    });
    const j = await r.json().catch(() => null);
    setAcc(j?.account || null);
  }

  // keep online badge fresh
  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => setSel((s) => (s ? { ...s } : s)), 10_000);
    return () => clearInterval(id);
  }, [open]);

  async function saveName() {
    if (!sel) return;
    setSaving(true);
    try {
      const r = await fetch(`/api/admin/receivers/${sel.receiver_id}/rename`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      const j = await r.json().catch(() => null);
      if (j?.ok) {
        setItems((prev) =>
          prev.map((x) =>
            x.receiver_id === sel.receiver_id ? { ...x, name: newName } : x
          )
        );
        setSel((s) => (s ? { ...s, name: newName } : s));
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative">
      <div className="mb-4 flex items-center gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by receiver, user, account…"
          className="w-full md:w-96 bg-gray-900/60 border-gray-800 text-[#d3d5f0] placeholder:text-gray-500 focus-visible:ring-[#3f4bf2]/40"
        />
        {loading && <span className="text-xs text-gray-400">Loading…</span>}
      </div>

      <div className="w-full overflow-x-auto rounded-2xl border border-gray-800 bg-[#0e1430]/30 shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#0e1430]/60 text-gray-300">
            <tr>
              <th className="px-4 py-3">Receiver</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Account</th>
              <th className="px-4 py-3">Last Seen</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr
                key={r.receiver_id}
                className="border-t border-gray-800 hover:bg-gray-900/30"
              >
                <td className="px-4 py-3">
                  <div className="text-white font-medium">{r.name || "—"}</div>
                  <div className="font-mono text-xs text-gray-400">
                    {r.receiver_id}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div>{r.user?.email}</div>
                  <div className="text-xs text-gray-400">
                    {(r.user?.first_name || "—") +
                      " " +
                      (r.user?.last_name || "")}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div>{r.account?.name || "—"}</div>
                  <div className="text-xs text-gray-400">
                    {[
                      r.account?.company,
                      r.account?.server,
                      r.account?.currency,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {r.last_seen ? new Date(r.last_seen).toLocaleString() : "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs border ${
                      isOnline(r.last_seen)
                        ? "border-emerald-500/30"
                        : "border-gray-700"
                    }`}
                  >
                    <span
                      className={`mr-1 h-2 w-2 rounded-full ${
                        isOnline(r.last_seen) ? "bg-emerald-500" : "bg-gray-600"
                      }`}
                    />
                    {isOnline(r.last_seen) ? "Online" : "Offline"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Button
                      className="bg-[#3f4bf2] hover:bg-[#3f4bf2]/80 text-white"
                      size="sm"
                      onClick={() => openDrawer(r)}
                    >
                      Details
                    </Button>
                  </div>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                  No receivers.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Drawer */}
      <Sheet
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setAcc(null);
        }}
      >
        <SheetContent
          side="right"
          className="w-full sm:max-w-xl p-0 bg-[#0b0f1a] text-[#d3d5f0] border-l border-gray-800"
        >
          <div className="border-b border-gray-800 bg-gradient-to-b from-[#0e1430]/40 to-transparent">
            <SheetHeader className="px-6 py-5">
              <SheetTitle className="flex items-center gap-2 text-white">
                {sel?.name || "Receiver"}{" "}
                <span className="font-mono text-xs text-gray-400">
                  {sel?.receiver_id}
                </span>
              </SheetTitle>
              <p className="text-sm text-gray-400">
                Owner: {sel?.user?.email} ·{" "}
                {(sel?.user?.first_name || "—") +
                  " " +
                  (sel?.user?.last_name || "")}
              </p>
            </SheetHeader>
          </div>

          <div className="p-6 space-y-6">
            {/* Rename */}
            <div>
              <Label htmlFor="rname" className="text-gray-300">
                Name
              </Label>
              <div className="mt-1 flex gap-2">
                <Input
                  id="rname"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="bg-gray-900/60 border-gray-800 text-[#d3d5f0] placeholder:text-gray-500 focus-visible:ring-[#3f4bf2]/40"
                />
                <Button
                  className="bg-[#3f4bf2] hover:bg-[#3f4bf2]/80 text-white"
                  onClick={saveName}
                  disabled={saving || !newName.trim()}
                >
                  {saving ? "Saving…" : "Save"}
                </Button>
              </div>
            </div>

            {/* Account Snapshot */}
            <div>
              <div className="font-medium mb-2 text-white">Account</div>
              <div className="rounded-xl border border-gray-800 overflow-hidden">
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b border-gray-800">
                      <td className="px-3 py-2 text-gray-300">Name</td>
                      <td className="px-3 py-2">{acc?.account?.name || "—"}</td>
                    </tr>
                    <tr className="border-b border-gray-800">
                      <td className="px-3 py-2 text-gray-300">Company</td>
                      <td className="px-3 py-2">
                        {acc?.account?.company || "—"}
                      </td>
                    </tr>
                    <tr className="border-b border-gray-800">
                      <td className="px-3 py-2 text-gray-300">Server</td>
                      <td className="px-3 py-2">
                        {acc?.account?.server || "—"}
                      </td>
                    </tr>
                    <tr className="border-b border-gray-800">
                      <td className="px-3 py-2 text-gray-300">Currency</td>
                      <td className="px-3 py-2">
                        {acc?.account?.currency || "—"}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 text-gray-300">
                        Equity / Balance
                      </td>
                      <td className="px-3 py-2">
                        {(acc?.trading?.equity ??
                          acc?.balances?.equity ??
                          "—") +
                          " / " +
                          (acc?.trading?.balance ??
                            acc?.balances?.balance ??
                            "—")}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <SheetFooter className="px-6 pb-6">
            <SheetClose asChild>
              <Button className="w-full bg-[#3f4bf2] hover:bg-[#3f4bf2]/80 text-white">
                Close
              </Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
