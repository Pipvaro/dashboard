/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Check, Copy, KeyRound } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";

function CopyLine({ label, value }: { label: string; value?: string }) {
  const [copied, setCopied] = useState(false);
  async function onCopy() {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  }
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-800 bg-gray-900/50 px-3 py-2">
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wide text-gray-400">
          {label}
        </div>
        <div className="font-mono text-sm text-white truncate">
          {value || "—"}
        </div>
      </div>
      <Button
        variant="secondary"
        size="sm"
        className="shrink-0"
        onClick={onCopy}
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
}

type EaLatest = {
  url: string;
  version?: string;
  filename?: string;
};

export default function NewReceiverDrawer() {
  const params = useSearchParams();
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [resp, setResp] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // EA (aus Sanity via interner API)
  const [ea, setEa] = useState<EaLatest | null>(null);
  const [eaLoading, setEaLoading] = useState(false);

  function refreshPage() {
    startTransition(() => router.refresh()); // re-render der Server-Seite
  }

  const openFromQuery = params.get("open") === "create";

  // assume you already have internal state `open` and setter `setOpen`
  // open drawer when arriving with ?open=create
  useEffect(() => {
    if (openFromQuery) {
      setOpen(true);
    }
  }, [openFromQuery]);

  async function create() {
    setLoading(true);
    setErr(null);
    setResp(null);
    try {
      const r = await fetch("/api/receivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) setErr(d?.message ?? "Failed to create receiver");
      else setResp(d);
    } finally {
      setLoading(false);
    }
  }

  // Wenn der Drawer offen ist und ein Receiver erstellt wurde,
  // lade die aktuell aktive EA aus Sanity (über /api/ea/latest).
  useEffect(() => {
    let cancelled = false;

    async function loadEa() {
      if (!open || !resp) return;
      setEaLoading(true);
      try {
        const r = await fetch("/api/ea/latest", { cache: "no-store" });
        const d = await r.json().catch(() => null);
        if (!cancelled && d?.ok && d?.url) {
          setEa({
            url: String(d.url),
            version: d.version ? String(d.version) : undefined,
            filename: d.filename ? String(d.filename) : undefined,
          });
        } else if (!cancelled) {
          setEa(null);
        }
      } catch {
        if (!cancelled) setEa(null);
      } finally {
        if (!cancelled) setEaLoading(false);
      }
    }

    loadEa();
    return () => {
      cancelled = true;
    };
  }, [open, resp]);

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        // Wenn der Drawer geschlossen wird und wir einen neuen Receiver erstellt haben,
        // Seite neu laden & lokalen State zurücksetzen.
        if (!v && resp) {
          refreshPage();
          setResp(null);
          setName("");
          setEa(null);
          setEaLoading(false);
          const sp = new URLSearchParams(Array.from(params.entries()));
          sp.delete("open");
          router.replace(`/receivers?${sp.toString()}`, { scroll: false });
        }
      }}
    >
      <SheetTrigger asChild>
        <Button className="bg-[#3f4bf2] hover:bg-[#3f4bf2]/80">
          New Receiver
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 bg-[#0b0f1a] text-[#d3d5f0] border-l border-gray-800"
      >
        {/* Header */}
        <div className="border-b border-gray-800 bg-gradient-to-b from-[#0e1430]/40 to-transparent">
          <SheetHeader className="px-6 py-5">
            <SheetTitle className="flex items-center gap-2 text-white">
              <KeyRound className="h-5 w-5 text-[#3f4bf2]" />
              Create Receiver
            </SheetTitle>
            <p className="text-sm text-gray-400">
              Generate a license and connect your MetaTrader 5 EA.
            </p>
          </SheetHeader>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {!resp ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="receiver-name" className="text-gray-300">
                  Name
                </Label>
                <Input
                  id="receiver-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My MT5 Account"
                  className="bg-gray-900/60 border-gray-800 text-[#d3d5f0] placeholder:text-gray-500 focus-visible:ring-[#3f4bf2]/40"
                />
                {err && <p className="text-sm text-red-400">{err}</p>}
              </div>
            </>
          ) : (
            <>
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300 flex items-center gap-2">
                <Check className="h-4 w-4" />
                Receiver created successfully.
              </div>
              <div className="grid grid-cols-1 gap-3">
                <CopyLine
                  label="Receiver ID"
                  value={resp.license?.receiver_id}
                />
                <CopyLine label="License ID" value={resp.license?.license_id} />
                <CopyLine label="Key" value={resp.license?.key} />
                <CopyLine
                  label="Master URL"
                  value={resp.license?.master_url || "https://api.pipvaro.com"}
                />

                {/* Download EA – aktiviert sobald /api/ea/latest eine URL liefert */}
                {ea?.url ? (
                  <a
                    href={ea.url}
                    download={ea.filename || "PipvaroEA.ex5"}
                    className="w-full"
                  >
                    <Button className="w-full bg-[#3f4bf2] hover:bg-[#3f4bf2]/80">
                      {`Download EA${ea.version ? ` v${ea.version}` : ""}`}
                    </Button>
                  </a>
                ) : (
                  <Button
                    className="w-full bg-[#3f4bf2] hover:bg-[#3f4bf2]/80"
                    disabled
                    title={eaLoading ? "Loading EA…" : "EA not available"}
                  >
                    {eaLoading ? "Loading EA…" : "Download EA"}
                  </Button>
                )}
              </div>
              <p className="text-xs text-gray-500">
                Enter those values in to MT5 EA: <i>InpMasterUrl</i>,{" "}
                <i>InpReceiverId</i>, <i>InpLicenseId</i>, <i>InpKey</i>.
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        <SheetFooter className="px-6 pb-6">
          {!resp ? (
            <Button
              className="w-full bg-[#3f4bf2] hover:bg-[#3f4bf2]/80"
              onClick={create}
              disabled={loading || !name.trim()}
            >
              {loading ? "Creating..." : "Create"}
            </Button>
          ) : (
            <SheetClose asChild>
              <Button
                className="w-full bg-[#3f4bf2] hover:bg-[#3f4bf2]/80"
                onClick={() => {
                  refreshPage(); // auch beim Done-Button refresht die Seite
                  setResp(null);
                  setName("");
                  setEa(null);
                  setEaLoading(false);
                }}
              >
                Done
              </Button>
            </SheetClose>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
