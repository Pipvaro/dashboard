import Sidebar from "@/components/Sidebar";
import { absoluteUrl } from "@/lib/absolute-url";
import { cookies } from "next/headers";
import SettingsPanel from "./settings-panel";

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
        <div className="bg-[#3f4bf2] w-full py-2 px-4 text-white">
          <p className="text-sm">
            🚀 Welcome to Pipvaro! Your trading automation starts here.{" "}
            <strong>
              Since we are currently in beta phase some features may not be
              available.
            </strong>{" "}
            We are currently on <strong>Version 0.0.5</strong>
          </p>
        </div>
        {/* mobile topbar könnte hier verbleiben */}
        <div className="max-w-6xl mx-auto m-6">
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
