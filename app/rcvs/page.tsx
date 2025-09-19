import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import SiteBanner from "@/components/SiteBanner";
import { headers } from "next/headers";
import ReceiversTable from "./receivers-table";
import { InboxIcon } from "@heroicons/react/24/outline";
import Image from "next/image";

export const dynamic = "force-dynamic";

async function getBaseUrl() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto =
    h.get("x-forwarded-proto") ??
    (host?.startsWith("localhost") || host === "127.0.0.1" ? "http" : "https");
  if (!host) throw new Error("Missing host header");
  return `${proto}://${host}`;
}

export default async function ReceiversPage() {
  const base = await getBaseUrl();
  const res = await fetch(`${base}/api/admin/receivers`, { cache: "no-store" });
  const data = await res.json().catch(() => ({ ok: false, receivers: [] }));
  const receivers = data?.receivers ?? [];

  return (
    <div className="min-h-screen bg-[#0b0f1a] text-[#d3d5f0]">
      <div className="flex flex-col">
        <Sidebar />
        <main className="flex-1 md:ml-72">
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
          <div className="mx-auto w-full max-w-screen-2xl px-4 md:px-8 py-8">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
                <InboxIcon className="size-5 text-indigo-400" />
                All Receivers
              </h1>
              <p className="text-sm text-gray-400">
                Manage all API receivers and their linked accounts.
              </p>
            </div>
            <ReceiversTable initialItems={receivers} />
          </div>
        </main>
      </div>
    </div>
  );
}
