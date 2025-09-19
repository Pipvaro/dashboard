import Sidebar from "@/components/Sidebar";
import { absoluteUrl } from "@/lib/absolute-url";
import { cookies } from "next/headers";
import SettingsPanel from "./settings-panel";
import SiteBanner from "@/components/SiteBanner";
import Image from "next/image";
import MobileNav from "@/components/MobileNav";

export default async function Page({
  params,
}: {
  params: Promise<{ rid: string }>;
}) {
  const { rid } = await params;

  const jar = await cookies();
  const cookie = jar
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  // Receiver + Account
  const rx = await fetch(
    await absoluteUrl(`/api/receivers/${encodeURIComponent(rid)}`),
    {
      headers: { cookie },
      cache: "no-store",
    }
  );
  const { receiver, account } = await rx.json();

  // Me → subscription
  const me = await fetch(await absoluteUrl("/api/me"), {
    headers: { cookie },
    cache: "no-store",
  });
  const meData = await me.json();
  const subscription = (meData?.user?.subscription || "fusion") as
    | "fusion"
    | "lunar"
    | "nova";

  return (
    <div className="flex">
      <Sidebar />
      <main className="min-h-screen md:ml-72 w-full">
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
        {/* mobile topbar könnte hier verbleiben */}
        <div className="max-w-6xl m-6 mx-8 w-full mx-auto">
          <h1 className="text-2xl font-semibold text-white mb-4">
            {receiver?.name ?? rid}
          </h1>
          <SettingsPanel
            rid={rid}
            receiver={receiver}
            account={account}
            subscription={subscription}
          />
        </div>
      </main>
    </div>
  );
}
