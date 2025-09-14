/* eslint-disable @typescript-eslint/no-explicit-any */
import Card from "@/components/packs/Card";
import Sidebar from "@/components/Sidebar";
import NewReceiverDrawer from "@/components/Receivers/CreateReceiverDialog"; // ggf. Pfad anpassen
import { cn } from "@/lib/utils";
import { absoluteUrl } from "@/lib/absolute-url";
import { fmtMoney, timeAgo } from "@/lib/format";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Image from "next/image";
import { Menu } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  // <-- Next 15: searchParams ist async!
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  // ---- Query-Params korrekt lesen
  const sp = await searchParams;
  const rid = typeof sp?.rid === "string" ? sp.rid : undefined;
  const lic = typeof sp?.lic === "string" ? sp.lic : undefined;
  const key = typeof sp?.key === "string" ? sp.key : undefined;
  const master = typeof sp?.master === "string" ? sp.master : undefined;

  // ---- API call mit Cookie-Header (cookies() ist async)
  const url = await absoluteUrl("/api/my-receivers");
  const store = await cookies();
  const cookieHeader = store
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const res = await fetch(url, {
    headers: { cookie: cookieHeader },
    cache: "no-store",
  });
  if (res.status === 401) redirect(`/login?next=/receivers`);

  const data = await res.json().catch(() => ({}));
  const receivers: any[] = Array.isArray(data?.receivers) ? data.receivers : [];

  return (
    <div className="w-full h-screen flex">
      <Sidebar />
      <main className="w-full max-w-full md:max-w-4/5">
        <div className="h-20 border-b md:hidden border-gray-700/50 flex justify-between items-center px-4">
          <Image
            src={"/assets/Transparent/logo-dash.png"}
            alt="logo"
            height={100}
            width={250}
            className="w-32 md:hidden block"
          />
          <Menu className="text-[#d3d5f0] hover:bg-gray-700/30 rounded-full block md:hidden" />
        </div>

        <div className="px-6 pt-6 flex items-center justify-between">
          <div>
            <h1 className={cn("text-3xl font-bold text-white")}>Receivers</h1>
            <p className="text-sm text-gray-500">
              View and manage all your MetaTrader 5 receivers here.
            </p>
          </div>
          {/* Drawer-Button */}
          <NewReceiverDrawer />
        </div>

        <div className="px-6 space-y-3 mt-6">
          {/* Optionaler Success-Hinweis, falls du weiterhin via Query-Params anzeigen willst */}
          {rid && lic && key && (
            <Card>
              <div className="text-white font-medium mb-1">
                Receiver created
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="text-gray-400">Receiver ID</div>
                  <div className="text-white">{rid}</div>
                </div>
                <div>
                  <div className="text-gray-400">License ID</div>
                  <div className="text-white">{lic}</div>
                </div>
                <div className="md:col-span-2">
                  <div className="text-gray-400">Key</div>
                  <div className="text-white break-all">{key}</div>
                </div>
                <div className="md:col-span-2">
                  <div className="text-gray-400">Master URL</div>
                  <div className="text-white break-all">
                    {master || "https://api.pipvaro.com"}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Liste */}
          {receivers.length === 0 ? (
            <Card>No receivers found.</Card>
          ) : (
            receivers.map((r) => {
              // seit /receivers/my liefern wir den Snapshot unter account_snapshot
              const snap = r.account_snapshot || {};
              const acc = snap.account || {};
              const trd = snap.trading || {};
              const ccy = acc.currency || "USD";
              const balance =
                typeof trd.balance === "number" ? trd.balance : undefined;
              const equity =
                typeof trd.equity === "number" ? trd.equity : undefined;

              return (
                <Card key={r.receiver_id}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-white font-medium truncate">
                        {r.name ?? r.receiver_id}
                      </div>
                      <div className="text-xs text-gray-400 truncate">
                        ID: {r.receiver_id} • Status: {r.status ?? "—"} • v
                        {r.settings_version ?? "—"}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 truncate">
                        {acc.company ?? "—"}
                        {acc.server ? ` • ${acc.server}` : ""}
                        {acc.leverage ? ` • 1:${acc.leverage}` : ""}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-medium">
                        {balance != null ? `${fmtMoney(balance, ccy)}` : "—"}
                      </div>
                      <div className="text-xs text-gray-400">
                        {equity != null
                          ? `${fmtMoney(equity, ccy)} equity`
                          : "—"}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-1">
                        {snap.snapshot_at || snap.ts
                          ? `Updated ${timeAgo(snap.snapshot_at ?? snap.ts)}`
                          : r.last_seen
                          ? `Last seen ${timeAgo(r.last_seen)}`
                          : "—"}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
