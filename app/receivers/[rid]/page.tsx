// app/receivers/[rid]/page.tsx
import Sidebar from "@/components/Sidebar";
import Card from "@/components/packs/Card";
import Link from "next/link";
import { absoluteUrl } from "@/lib/absolute-url";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Image from "next/image";
import { Menu } from "lucide-react";
import SettingsPanel from "./settings-panel";

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
  const data = await res.json();
  const r = data.receiver;
  const snap = data.account || {};
  const acc = snap.account || {};
  const trd = snap.trading || {};

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

          {/* Account Card -> Link zu Accounts/ID */}
          <Link
            href={acc?.id ? `/accounts/${acc.id}` : "/accounts"}
            className="block"
          >
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-medium">
                    {acc?.name ?? "—"}
                  </div>
                  <div className="text-xs text-gray-400">
                    {acc?.company ?? "—"} {acc?.server ? `• ${acc.server}` : ""}{" "}
                    {acc?.leverage ? `• 1:${acc.leverage}` : ""}
                  </div>
                </div>
                <div className="text-right text-sm text-gray-300">
                  <div>Equity: {trd?.equity ?? "—"}</div>
                  <div>Balance: {trd?.balance ?? "—"}</div>
                </div>
              </div>
            </Card>
          </Link>

          {/* Settings & Actions */}
          <SettingsPanel receiver={r} />
        </div>
      </main>
    </div>
  );
}
