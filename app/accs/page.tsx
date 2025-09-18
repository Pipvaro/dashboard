import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import SiteBanner from "@/components/SiteBanner";
import { headers } from "next/headers";
import AccountsTable from "./accounts-table";
import { BanknotesIcon } from "@heroicons/react/24/outline";

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

export default async function AdminAccountsPage() {
  const base = await getBaseUrl();
  const res = await fetch(`${base}/api/admin/accounts`, { cache: "no-store" });
  const data = await res.json().catch(() => ({ ok: false, accounts: [] }));
  const accounts = data?.accounts ?? [];

  return (
    <div className="min-h-screen bg-[#0b0f1a] text-[#d3d5f0]">
      <div className="flex">
        <Sidebar />
        <main className="flex-1 md:ml-72">
          <MobileNav />
          <SiteBanner />
          <div className="mx-auto w-full max-w-screen-2xl px-4 md:px-8 py-8">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
                <BanknotesIcon className="size-5 text-indigo-400" />
                All Accounts
              </h1>
              <p className="text-sm text-gray-400">
                Manage all accounts and their linked API receivers.
              </p>
            </div>
            <AccountsTable initialItems={accounts} />
          </div>
        </main>
      </div>
    </div>
  );
}
