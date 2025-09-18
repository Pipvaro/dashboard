/* eslint-disable @typescript-eslint/no-explicit-any */
import Card from "@/components/packs/Card";
import Sidebar from "@/components/Sidebar";
import NewReceiverDrawer from "@/components/Receivers/CreateReceiverDialog";
import { cn } from "@/lib/utils";
import { absoluteUrl } from "@/lib/absolute-url";
import { timeAgo } from "@/lib/format";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Image from "next/image";
import { Menu } from "lucide-react";
import MobileNav from "@/components/MobileNav";
import Link from "next/link";
import SiteBanner from "@/components/SiteBanner";

export const dynamic = "force-dynamic";

/* ---------- compact UI helpers ---------- */
function Pill({
  children,
  color = "gray",
}: {
  children: React.ReactNode;
  color?: "green" | "red" | "gray" | "blue" | "amber";
}) {
  const map: Record<string, string> = {
    green: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    red: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    gray: "bg-zinc-700/20 text-zinc-300 border-zinc-600/30",
    blue: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    amber: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  };
  return (
    <span
      className={`px-1.5 py-[1px] rounded-full text-[10px] leading-4 border ${map[color]} whitespace-nowrap`}
    >
      {children}
    </span>
  );
}
function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center flex-wrap gap-1">
      <span className="text-[10px] text-gray-400 mr-1">{label}:</span>
      {children}
    </div>
  );
}

/* ---------- page ---------- */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const rid = typeof sp?.rid === "string" ? sp.rid : undefined;
  const lic = typeof sp?.lic === "string" ? sp.lic : undefined;
  const key = typeof sp?.key === "string" ? sp.key : undefined;
  const master = typeof sp?.master === "string" ? sp.master : undefined;

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
      <main className="w-full max-w-full md:ml-72">
        <SiteBanner />
        <div className="h-20 border-b md:hidden border-gray-700/50 flex justify-between items-center px-4">
          <Image
            src={"/assets/Transparent/logo-beta.svg"}
            alt="logo"
            height={100}
            width={250}
            className="w-32 md:hidden block"
          />
          <MobileNav />
        </div>

        <div className="px-6 pt-6 flex items-center justify-between">
          <div>
            <h1 className={cn("text-3xl font-bold text-white")}>Receivers</h1>
            <p className="text-sm text-gray-500">
              View and manage all your MetaTrader 5 receivers here.
            </p>
          </div>
          <NewReceiverDrawer />
        </div>

        <div className="px-6 space-y-3 mt-6">
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

          {receivers.length === 0 ? (
            <Card>
              <p className="text-gray-500">
                No receivers found. Create one now to start automating your
                trading experience.
              </p>
            </Card>
          ) : (
            receivers.map((r) => {
              const snap = r.account_snapshot || {};
              const acc = snap.account || {};
              const st = r.settings || {};
              const policy = st.news_policy || {};
              const limits = st.position_limits || {};
              const allowed = st.allowed || {};
              const dd = st.drawdown || {};
              const rules = st.trade_rules || {};
              const licInfo = r.license || {};
              const symbols: string[] = Array.isArray(allowed.symbols)
                ? allowed.symbols
                : [];
              const srcs: string[] = Array.isArray(allowed.signal_sources)
                ? allowed.signal_sources
                : [];

              const last = r.last_seen ? new Date(r.last_seen).getTime() : 0;
              const online = Date.now() - last < 90_000;

              return (
                <Link
                  href={`/receivers/${r.receiver_id}`}
                  key={r.receiver_id}
                  className="block"
                >
                  <Card>
                    {/* Header (kompakt) */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="text-white font-medium truncate">
                            {r.name ?? r.receiver_id}
                          </div>
                          <Pill color={online ? "green" : "red"}>
                            {online ? "Online" : "Offline"}
                          </Pill>
                          <Pill color="blue">v{r.settings_version ?? "—"}</Pill>
                          <Pill color={r.status === "ACTIVE" ? "green" : "red"}>
                            {r.status ?? "UNKNOWN"}
                          </Pill>
                        </div>
                        <div className="text-[11px] text-gray-400 truncate mt-0.5">
                          ID: {r.receiver_id} • IP: {r.ip_current ?? "—"}
                          {r.ip_last && r.ip_last !== r.ip_current
                            ? ` (prev ${r.ip_last})`
                            : ""}{" "}
                          • {last ? `Last seen ${timeAgo(r.last_seen)}` : "—"}
                        </div>
                        {(acc?.company || acc?.server || acc?.leverage) && (
                          <div className="text-[11px] text-gray-500 truncate">
                            {acc.company ?? "—"}
                            {acc.server ? ` • ${acc.server}` : ""}
                            {acc.leverage ? ` • 1:${acc.leverage}` : ""}
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <Pill
                          color={licInfo.status === "ACTIVE" ? "green" : "red"}
                        >
                          License {licInfo.status ?? "UNKNOWN"}
                        </Pill>
                        <div className="text-[10px] text-gray-500 mt-0.5">
                          {licInfo.last_check_at
                            ? `Checked ${timeAgo(licInfo.last_check_at)}`
                            : "No license check"}
                        </div>
                      </div>
                    </div>

                    {/* Meta rows (kompakt, geringe Gaps) */}
                    <div className="mt-2 grid grid-cols-1 xl:grid-cols-3 gap-2">
                      <div className="space-y-1.5">
                        <Row label="Allowed">
                          <Pill color="gray">Symbols: {symbols.length}</Pill>
                          {symbols.slice(0, 2).map((s) => (
                            <Pill key={s}>{s}</Pill>
                          ))}
                          {symbols.length > 2 && (
                            <Pill>+{symbols.length - 2}</Pill>
                          )}
                          <Pill color="gray">Sources: {srcs.length}</Pill>
                        </Row>
                        <Row label="Position">
                          <Pill>
                            Max open: {limits.max_open_total ?? "—"}/
                            {limits.max_open_per_symbol ?? "—"}
                          </Pill>
                          <Pill color={limits.enabled ? "green" : "red"}>
                            {limits.enabled ? "enabled" : "disabled"}
                          </Pill>
                        </Row>
                      </div>

                      <div className="space-y-1.5">
                        <Row label="Trade">
                          <Pill>Units: {rules.units ?? "pips"}</Pill>
                          <Pill>
                            SL: {rules?.sl?.mode ?? "—"}
                            {rules?.sl?.fixed_pips
                              ? ` (${rules.sl.fixed_pips})`
                              : ""}
                          </Pill>
                          <Pill>
                            TP: {rules?.tp?.mode ?? "—"}
                            {rules?.tp?.count ? ` x${rules.tp.count}` : ""}
                            {rules?.tp?.fixed_pips
                              ? ` (${rules.tp.fixed_pips})`
                              : ""}
                          </Pill>
                          <Pill>
                            BE: {rules?.breakeven?.mode ?? "—"}
                            {rules?.breakeven?.trigger_tp_index
                              ? ` (#${rules.breakeven.trigger_tp_index})`
                              : ""}
                          </Pill>
                          <Pill>
                            Trailing: {rules?.trailing?.mode ?? "disabled"}
                          </Pill>
                          {rules?.volume?.per_tp != null && (
                            <Pill>per TP: {rules.volume.per_tp}</Pill>
                          )}
                        </Row>
                        <Row label="News">
                          <Pill>
                            {policy.mode ?? "—"}{" "}
                            {policy.before_sec != null
                              ? `(${policy.before_sec}s`
                              : ""}
                            {policy.after_sec != null
                              ? `/${policy.after_sec}s)`
                              : policy.before_sec != null
                                ? ")"
                                : ""}
                          </Pill>
                        </Row>
                      </div>

                      <div className="space-y-1.5">
                        <Row label="Drawdown">
                          <Pill color="amber">
                            Daily: {dd?.daily?.pct ?? "—"}%
                          </Pill>
                          <Pill color="amber">Max: {dd?.max?.pct ?? "—"}%</Pill>
                          <Pill color={dd?.locked_until ? "red" : "gray"}>
                            {dd?.locked_until
                              ? `Locked until ${timeAgo(dd.locked_until)}`
                              : "Unlocked"}
                          </Pill>
                        </Row>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
