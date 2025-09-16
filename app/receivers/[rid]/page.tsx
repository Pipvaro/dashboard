/* eslint-disable @typescript-eslint/no-explicit-any */
// app/receivers/[rid]/page.tsx
import Card from "@/components/packs/Card";
import Sidebar from "@/components/Sidebar";
import { absoluteUrl } from "@/lib/absolute-url";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Image from "next/image";
import { Menu } from "lucide-react";

export default async function ReceiverDetail({
  params,
}: {
  params: Promise<{ rid: string }>;
}) {
  const { rid } = await params;

  const url = await absoluteUrl(`/api/receivers/${encodeURIComponent(rid)}`);
  const cookieHeader = (await cookies())
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const res = await fetch(url, {
    headers: { cookie: cookieHeader },
    cache: "no-store",
  });

  if (res.status === 401) redirect(`/login?next=/receivers/${rid}`);
  if (res.status === 404) notFound();
  if (!res.ok) throw new Error("Failed to load receiver");

  const data = await res.json();
  const r = data.receiver;
  const snap = data.account || {};
  const acc = snap.account || {};
  const trd = snap.trading || {};
  const metrics = Array.isArray(data.metrics) ? data.metrics : [];

  return (
    <div className="w-full h-screen flex">
      <Sidebar />
      <main className="w-full max-w-full md:max-w-4/5">
        <div className="h-20 border-b md:hidden border-gray-700/50 flex justify-between items-center px-4">
          <Image
            src="/assets/Transparent/logo-dash.png"
            alt="logo"
            height={100}
            width={250}
            className="w-32 md:hidden block"
          />
          <Menu className="text-[#d3d5f0] hover:bg-gray-700/30 rounded-full block md:hidden" />
        </div>

        <div className="px-6 pt-6 space-y-4">
          <h1 className="text-3xl font-bold text-white">
            {r?.name ?? r?.receiver_id}
          </h1>
          <p className="text-sm text-gray-500">
            ID: {r?.receiver_id} • Status: {r?.status} • v{r?.settings_version}{" "}
            • IP: {r?.ip_current ?? "—"}
          </p>

          <Card>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-white font-medium mb-2">Account</div>
                <div className="text-sm text-gray-300">
                  <div>{acc?.name ?? "—"}</div>
                  <div className="text-gray-500">
                    {acc?.company ?? "—"} {acc?.server ? `• ${acc.server}` : ""}{" "}
                    {acc?.leverage ? `• 1:${acc.leverage}` : ""}
                  </div>
                </div>
              </div>
              <div>
                <div className="text-white font-medium mb-2">Trading</div>
                <div className="text-sm text-gray-300 grid grid-cols-2 gap-x-6">
                  <div>Equity: {trd?.equity ?? "—"}</div>
                  <div>Balance: {trd?.balance ?? "—"}</div>
                  <div>Margin: {trd?.margin ?? "—"}</div>
                  <div>Open pos.: {trd?.positions_total ?? "—"}</div>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="text-white font-medium mb-3">Settings</div>
            <div className="text-sm text-gray-300 flex flex-wrap gap-2">
              <span className="px-2 py-1 rounded bg-gray-700/60">
                Symbols:{" "}
                {Array.isArray(r?.settings?.allowed?.symbols)
                  ? r.settings.allowed.symbols.length
                  : 0}
              </span>
              <span className="px-2 py-1 rounded bg-gray-700/60">
                News: {r?.settings?.news_policy?.mode ?? "—"} (
                {r?.settings?.news_policy?.before_sec ?? 0}s/
                {r?.settings?.news_policy?.after_sec ?? 0}s)
              </span>
              <span className="px-2 py-1 rounded bg-gray-700/60">
                Position limit:{" "}
                {r?.settings?.position_limits?.max_open_total ?? "—"}/
                {r?.settings?.position_limits?.max_open_per_symbol ?? "—"}
              </span>
            </div>
          </Card>

          <Card>
            <div className="text-white font-medium mb-3">Recent metrics</div>
            <div className="text-sm text-gray-300">
              {metrics.length === 0 ? (
                <span className="text-gray-500">No metrics available.</span>
              ) : (
                <ul className="list-disc pl-5 space-y-1">
                  {metrics.slice(0, 10).map((m: any, i: number) => (
                    <li key={i}>
                      {new Date(m.ts).toLocaleString()} — equity{" "}
                      {m.equity ?? "—"}, balance {m.balance ?? "—"}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
