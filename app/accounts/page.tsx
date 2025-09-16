/* eslint-disable @typescript-eslint/no-explicit-any */
import Card from "@/components/packs/Card";
import Sidebar from "@/components/Sidebar";
import { cn } from "@/lib/utils";
import { absoluteUrl } from "@/lib/absolute-url";
import { Menu } from "lucide-react";
import Image from "next/image";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fmtMoney, fmtNumber, timeAgo } from "@/lib/format";
import MobileNav from "@/components/MobileNav";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Home() {
  const url = await absoluteUrl("/api/my-accounts");

  const cookieStore = await cookies(); // <-- await!
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");

  const res = await fetch(url, {
    cache: "no-store",
    headers: { cookie: cookieHeader }, // <-- Cookies weiterreichen
  });

  const { accounts } = await res.json();

  return (
    <div className="w-full h-screen flex">
      <Sidebar />
      <main className="w-full max-w-full md:ml-72">
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
        <div className="h-20 border-b md:hidden border-gray-700/50 flex justify-between items-center px-4">
          <Image
            src={"/assets/Transparent/logo-dash.png"}
            alt="logo"
            height={100}
            width={250}
            className="w-32 md:hidden block"
          />
          <MobileNav />
        </div>

        <h1 className={cn("text-3xl font-bold px-6 pt-6 text-white")}>
          Accounts
        </h1>
        <p className="px-6 text-sm text-gray-500 pb-6">
          Accounts will be automatically imported and detected by using our
          receiver.
        </p>

        <div className="px-6 space-y-3">
          {accounts.length === 0 ? (
            <Card>
              <p className="text-gray-500">
                No accounts found. Start now by linking your receiver to your
                MetaTrader Terminal.
              </p>
            </Card>
          ) : (
            [...accounts]
              .sort(
                (a: any, b: any) =>
                  new Date(b.snapshot_at ?? b.ts ?? 0).getTime() -
                  new Date(a.snapshot_at ?? a.ts ?? 0).getTime()
              )
              .map((a: any) => {
                const acc = a.account ?? {};
                const trd = a.trading ?? {};
                const ccy = acc.currency ?? "USD";
                const equity =
                  typeof trd.equity === "number" ? trd.equity : undefined;
                const balance =
                  typeof trd.balance === "number" ? trd.balance : undefined;
                const ratio =
                  balance && equity
                    ? Math.max(0, Math.min(1, equity / balance))
                    : undefined;
                const isLive = (acc.type || "").toUpperCase() === "LIVE";

                return (
                  <Link href={`/accounts/${acc.id}`} key={a.receiver_id}>
                    <Card>
                      <div className="flex items-center justify-between gap-4">
                        {/* left */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="text-white font-medium truncate">
                              {acc.id ?? a.receiver_id}{" "}
                              {acc.name ? `| ${acc.name}` : ""}
                            </div>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full border ${
                                isLive
                                  ? "border-emerald-500 text-emerald-400"
                                  : "border-yellow-500 text-yellow-400"
                              }`}
                            >
                              {isLive ? "LIVE" : "DEMO"}
                            </span>
                          </div>
                          <div className="text-xs text-gray-400 truncate">
                            {acc.company ?? "—"}{" "}
                            {acc.server ? `• ${acc.server}` : ""}{" "}
                            {acc.leverage ? `• 1:${acc.leverage}` : ""}
                          </div>

                          {/* mini equity/balance bar */}
                          {ratio !== undefined && (
                            <div className="mt-2">
                              <div className="h-2 w-40 bg-gray-700/40 rounded">
                                <div
                                  className="h-2 rounded"
                                  style={{
                                    width: `${Math.round(ratio * 100)}%`,
                                    background: "rgba(63,75,242,.9)",
                                  }}
                                />
                              </div>
                              <div className="text-[10px] text-gray-500 mt-1">
                                Equity/Balance: {Math.round((ratio || 0) * 100)}
                                %
                              </div>
                            </div>
                          )}
                        </div>

                        {/* right */}
                        <div className="text-right">
                          <div className="text-white font-medium">
                            {fmtMoney(balance, ccy)}
                          </div>
                          <div className="text-xs text-gray-400">
                            {fmtMoney(equity, ccy)} equity
                          </div>
                          <div className="text-[10px] text-gray-500 mt-1">
                            {typeof trd.positions_total === "number" && (
                              <span className="mr-2">
                                Pos: {fmtNumber(trd.positions_total)}
                              </span>
                            )}
                            {a.snapshot_at || a.ts
                              ? `Updated ${timeAgo(a.ts ?? a.ts)}`
                              : ""}
                          </div>
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
