/* eslint-disable @typescript-eslint/no-explicit-any */
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import SiteBanner from "@/components/SiteBanner";
import UsersTable from "./users-table";
import { headers } from "next/headers";
import { UserGroupIcon } from "@heroicons/react/24/outline";

export const dynamic = "force-dynamic";

// ⬇️ async + await headers()
async function getBaseUrl() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto =
    h.get("x-forwarded-proto") ??
    (host?.startsWith("localhost") || host === "127.0.0.1" ? "http" : "https");
  if (!host) throw new Error("Missing host header");
  return `${proto}://${host}`;
}

export default async function UsersPage() {
  // ⬇️ hier auch await
  const base = await getBaseUrl();
  const res = await fetch(`${base}/api/admin/users`, { cache: "no-store" });
  const data = await res.json().catch(() => ({ ok: false, users: [] }));
  const users = data?.users ?? [];

  return (
    <div className="min-h-screen bg-[#0b0f1a] text-[#d3d5f0]">
      <div className="flex">
        <Sidebar />
        <main className="flex-1 md:ml-72">
      <SiteBanner />
          <MobileNav />
          {/* >>> vorher: max-w-6xl  → jetzt volle Breite mit großzügigem max */}
          <div className="mx-auto w-full max-w-screen-2xl px-4 md:px-8 py-8">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
                <UserGroupIcon className="size-5 text-indigo-400" />
                All Users
              </h1>
              <p className="text-sm text-gray-400">
                Manage all registered users and their API receivers.
              </p>
            </div>
            <UsersTable initialUsers={users} />
          </div>
        </main>
      </div>
    </div>
  );
}
