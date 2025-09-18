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
import { Check } from "lucide-react";

type User = {
  user_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  created_at?: string;
  receivers_count?: number;
};

type Receiver = {
  receiver_id: string;
  name?: string;
  version?: string;
  first_seen?: string;
  last_seen?: string;
  // 'online' wird clientseitig aus last_seen berechnet
  online?: boolean;
  status?: string;
};

// helper: online wenn last_seen innerhalb der letzten 30s
function isOnline(last_seen?: string | null) {
  if (!last_seen) return false;
  const t = new Date(last_seen).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t <= 30_000;
}

export default function UsersTable({ initialUsers }: { initialUsers: User[] }) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>(initialUsers || []);

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<User | null>(null);
  const [receivers, setReceivers] = useState<Receiver[]>([]);
  const [editField, setEditField] = useState<
    "email" | "first_name" | "last_name" | null
  >(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);

  const filtered = useMemo(() => {
    if (!q.trim()) return users;
    const s = q.toLowerCase();
    return users.filter(
      (u) =>
        (u.email || "").toLowerCase().includes(s) ||
        (u.first_name || "").toLowerCase().includes(s) ||
        (u.last_name || "").toLowerCase().includes(s)
    );
  }, [users, q]);

  async function reload(query?: string) {
    setLoading(true);
    try {
      const url = `/api/admin/users${query ? `?q=${encodeURIComponent(query)}` : ""}`;
      const r = await fetch(url, { cache: "no-store" });
      const j = await r.json();
      if (j?.ok) setUsers(j.users || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(() => reload(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  async function openDrawer(u: User) {
    setSelected(u);
    setOpen(true);
    setSavedOk(false);
    setEditField(null);
    setEditValue("");
    const r = await fetch(`/api/admin/users/${u.user_id}/receivers`, {
      cache: "no-store",
    });
    const j = await r.json().catch(() => null);
    const items: Receiver[] = (j?.receivers || []).map((rec: Receiver) => ({
      ...rec,
      online: isOnline(rec.last_seen),
    }));
    setReceivers(items);
  }

  // während der Drawer offen ist, alle 10s den Online-Status aus last_seen neu berechnen
  useEffect(() => {
    if (!open || receivers.length === 0) return;
    const id = setInterval(() => {
      setReceivers((prev) =>
        prev.map((r) => ({ ...r, online: isOnline(r.last_seen) }))
      );
    }, 10_000);
    return () => clearInterval(id);
  }, [open, receivers.length]);

  // frisch vom Server den aktuell ausgewählten User laden
  async function refetchSelectedUser(uid: string) {
    const r = await fetch(`/api/admin/users/${uid}`, { cache: "no-store" });
    const j = await r.json().catch(() => null);
    const fresh: User | null = j?.ok && j.user ? j.user : null;
    if (fresh) {
      // Tabelle updaten
      setUsers((prev) =>
        prev.map((x) => (x.user_id === uid ? { ...x, ...fresh } : x))
      );
      // Drawer updaten
      setSelected((s) => (s ? { ...s, ...fresh } : s));
    }
  }

  async function saveField() {
    if (!selected || !editField) return;
    setSaving(true);
    setSavedOk(false);
    try {
      const body: any = { [editField]: editValue };
      const r = await fetch(`/api/admin/users/${selected.user_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await r.json();
      if (j?.ok) {
        // Hol den User direkt frisch vom Server (saubere Normalisierung/Validierung)
        await refetchSelectedUser(selected.user_id);
        // Optional: Liste basierend auf Suchfilter neu laden (falls Sortierung/Filter betroffen)
        await reload(q);
        setSavedOk(true);
        setTimeout(() => setSavedOk(false), 1500);
      }
    } finally {
      setSaving(false);
      setEditField(null);
      setEditValue("");
    }
  }

  return (
    <div className="relative">
      {/* Search */}
      <div className="mb-4 flex items-center gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by email, first/last name..."
          className="w-full md:w-96 bg-gray-900/60 border-gray-800 text-[#d3d5f0] placeholder:text-gray-500 focus-visible:ring-[#3f4bf2]/40"
        />
        {loading && <span className="text-xs text-gray-400">Loading…</span>}
      </div>

      {/* Table */}
      <div className="w-full overflow-x-auto rounded-2xl border border-gray-800 bg-[#0e1430]/30 shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#0e1430]/60 text-gray-300">
            <tr>
              <th className="px-4 py-3">E-Mail</th>
              <th className="px-4 py-3">Firstname</th>
              <th className="px-4 py-3">Lastname</th>
              <th className="px-4 py-3">Receivers</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr
                key={u.user_id}
                className="border-t border-gray-800 hover:bg-gray-900/30"
              >
                <td className="px-4 py-3 font-medium text-white">{u.email}</td>
                <td className="px-4 py-3">{u.first_name || "—"}</td>
                <td className="px-4 py-3">{u.last_name || "—"}</td>
                <td className="px-4 py-3">{u.receivers_count ?? 0}</td>
                <td className="px-4 py-3">
                  {u.created_at ? new Date(u.created_at).toLocaleString() : "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Button
                      size="sm"
                      className="bg-[#3f4bf2] hover:bg-[#3f4bf2]/80 text-white"
                      onClick={() => {
                        setSelected(u);
                        setEditField("email");
                        setEditValue(u.email || "");
                        setOpen(true);
                      }}
                    >
                      Change E-Mail
                    </Button>
                    <Button
                      size="sm"
                      className="bg-gray-800 hover:bg-gray-700 text-gray-100 border border-gray-700"
                      onClick={() => {
                        setSelected(u);
                        setEditField("first_name");
                        setEditValue(u.first_name || "");
                        setOpen(true);
                      }}
                    >
                      Edit Firstname
                    </Button>
                    <Button
                      size="sm"
                      className="bg-gray-800 hover:bg-gray-700 text-gray-100 border border-gray-700"
                      onClick={() => {
                        setSelected(u);
                        setEditField("last_name");
                        setEditValue(u.last_name || "");
                        setOpen(true);
                      }}
                    >
                      Edit Lastname
                    </Button>
                    <Button
                      size="sm"
                      className="bg-[#3f4bf2] hover:bg-[#3f4bf2]/80 text-white"
                      onClick={() => openDrawer(u)}
                    >
                      Show Receivers
                    </Button>
                  </div>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                  No users found.
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
          if (!v) {
            setEditField(null);
            setEditValue("");
            setSavedOk(false);
          }
        }}
      >
        <SheetContent
          side="right"
          className="w-full sm:max-w-xl p-0 bg-[#0b0f1a] text-[#d3d5f0] border-l border-gray-800"
        >
          <div className="border-b border-gray-800 bg-gradient-to-b from-[#0e1430]/40 to-transparent">
            <SheetHeader className="px-6 py-5">
              <SheetTitle className="flex items-center gap-2 text-white">
                {selected ? selected.email : "User"}
              </SheetTitle>
              <p className="text-sm text-gray-400">
                Edit profile fields & view receivers.
              </p>
            </SheetHeader>
          </div>

          <div className="p-6 space-y-6">
            {/* Edit Felder */}
            {selected && (
              <div className="space-y-4">
                {/* Vorname */}
                <div>
                  <Label htmlFor="ufirst" className="text-gray-300">
                    Vorname
                  </Label>
                  <div className="mt-1 flex gap-2">
                    <Input
                      id="ufirst"
                      value={
                        editField === "first_name"
                          ? editValue
                          : selected.first_name || ""
                      }
                      onChange={(e) =>
                        editField === "first_name" &&
                        setEditValue(e.target.value)
                      }
                      disabled={editField !== "first_name"}
                      className="bg-gray-900/60 border-gray-800 text-[#d3d5f0] placeholder:text-gray-500 focus-visible:ring-[#3f4bf2]/40"
                    />
                    {editField === "first_name" ? (
                      <Button
                        className="bg-[#3f4bf2] hover:bg-[#3f4bf2]/80 text-white"
                        disabled={saving}
                        onClick={saveField}
                      >
                        {saving ? "Saving…" : "Save"}
                      </Button>
                    ) : (
                      <Button
                        className="bg-gray-800 hover:bg-gray-700 text-gray-100 border border-gray-700"
                        onClick={() => {
                          setEditField("first_name");
                          setEditValue(selected.first_name || "");
                        }}
                      >
                        Edit
                      </Button>
                    )}
                  </div>
                </div>

                {/* Nachname */}
                <div>
                  <Label htmlFor="ulast" className="text-gray-300">
                    Nachname
                  </Label>
                  <div className="mt-1 flex gap-2">
                    <Input
                      id="ulast"
                      value={
                        editField === "last_name"
                          ? editValue
                          : selected.last_name || ""
                      }
                      onChange={(e) =>
                        editField === "last_name" &&
                        setEditValue(e.target.value)
                      }
                      disabled={editField !== "last_name"}
                      className="bg-gray-900/60 border-gray-800 text-[#d3d5f0] placeholder:text-gray-500 focus-visible:ring-[#3f4bf2]/40"
                    />
                    {editField === "last_name" ? (
                      <Button
                        className="bg-[#3f4bf2] hover:bg-[#3f4bf2]/80 text-white"
                        disabled={saving}
                        onClick={saveField}
                      >
                        {saving ? "Saving…" : "Save"}
                      </Button>
                    ) : (
                      <Button
                        className="bg-gray-800 hover:bg-gray-700 text-gray-100 border border-gray-700"
                        onClick={() => {
                          setEditField("last_name");
                          setEditValue(selected.last_name || "");
                        }}
                      >
                        Edit
                      </Button>
                    )}
                  </div>
                </div>

                {/* E-Mail */}
                <div>
                  <Label htmlFor="uemail" className="text-gray-300">
                    E-Mail
                  </Label>
                  <div className="mt-1 flex gap-2">
                    <Input
                      id="uemail"
                      value={
                        editField === "email" ? editValue : selected.email || ""
                      }
                      onChange={(e) =>
                        editField === "email" && setEditValue(e.target.value)
                      }
                      disabled={editField !== "email"}
                      className="bg-gray-900/60 border-gray-800 text-[#d3d5f0] placeholder:text-gray-500 focus-visible:ring-[#3f4bf2]/40"
                    />
                    {editField === "email" ? (
                      <Button
                        className="bg-[#3f4bf2] hover:bg-[#3f4bf2]/80 text-white"
                        disabled={saving}
                        onClick={saveField}
                      >
                        {saving ? "Saving…" : "Save"}
                      </Button>
                    ) : (
                      <Button
                        className="bg-gray-800 hover:bg-gray-700 text-gray-100 border border-gray-700"
                        onClick={() => {
                          setEditField("email");
                          setEditValue(selected.email || "");
                        }}
                      >
                        Edit
                      </Button>
                    )}
                  </div>
                </div>

                {savedOk && (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300 flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    Changes saved.
                  </div>
                )}
              </div>
            )}

            {/* Receivers */}
            <div>
              <div className="font-medium mb-2 text-white">
                Receivers ({receivers.length})
              </div>
              <div className="rounded-xl border border-gray-800 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-[#0e1430]/60 text-gray-300">
                    <tr>
                      <th className="px-3 py-2 text-left">Receiver ID</th>
                      <th className="px-3 py-2 text-left">Name</th>
                      <th className="px-3 py-2 text-left">Version</th>
                      <th className="px-3 py-2 text-left">Last Seen</th>
                      <th className="px-3 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receivers.map((r) => (
                      <tr
                        key={r.receiver_id}
                        className="border-t border-gray-800"
                      >
                        <td className="px-3 py-2 font-mono text-xs text-white">
                          {r.receiver_id}
                        </td>
                        <td className="px-3 py-2">{r.name || "—"}</td>
                        <td className="px-3 py-2">{r.version || "—"}</td>
                        <td className="px-3 py-2">
                          {r.last_seen
                            ? new Date(r.last_seen).toLocaleString()
                            : "—"}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs border ${
                              r.online
                                ? "border-emerald-500/30"
                                : "border-gray-700"
                            }`}
                          >
                            <span
                              className={`mr-1 h-2 w-2 rounded-full ${
                                r.online ? "bg-emerald-500" : "bg-gray-600"
                              }`}
                            />
                            {r.online ? "Online" : "Offline"}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {receivers.length === 0 && (
                      <tr>
                        <td className="px-3 py-3 text-gray-400" colSpan={5}>
                          No receivers.
                        </td>
                      </tr>
                    )}
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
