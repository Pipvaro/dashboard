/* eslint-disable @typescript-eslint/no-explicit-any */
import Card from "@/components/packs/Card";
import { fmtMoney, timeAgo } from "@/lib/format";
import AccountLive from "./ui/AccountLive";
import { cookies, headers } from "next/headers";
import Sidebar from "@/components/Sidebar";

async function getAccount(id: string) {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") || "http";
  const host = h.get("host") || "localhost:3000";
  const origin =
    (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/+$/, "") ||
    `${proto}://${host}`;

  const jar = await cookies();
  const cookieHeader = jar
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const res = await fetch(`${origin}/api/accounts/${encodeURIComponent(id)}`, {
    cache: "no-store",
    headers: cookieHeader ? { cookie: cookieHeader } : {},
  }).catch(() => null);

  const data = await res?.json().catch(() => null);
  return data?.item ?? null;
}
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params; // await also works if it's not a real Promise
  const safeId = decodeURIComponent(id);
  const item = await getAccount(safeId);

  return (
    <div className="w-full h-screen flex">
      <Sidebar />
      <div className="w-full max-w-full md:ml-80 mx-8 md:mx-0 md:mr-8 space-y-6">
        <div className="mt-8">
          <div className="text-2xl font-semibold text-white">
            {item?.account?.id
              ? `${item.account.id} | ${item.account.name ?? "Account"}`
              : `Account #${id}`}
          </div>
          <div className="text-sm text-gray-400">
            Basic information & snapshot for this MetaTrader account.
          </div>
        </div>

        <Card>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <div className="text-white font-medium mb-3">Account</div>
              <dl className="text-sm text-gray-300 grid grid-cols-2 gap-y-2">
                <dt className="text-gray-400">Company</dt>
                <dd>{item?.account?.company ?? "—"}</dd>

                <dt className="text-gray-400">Server</dt>
                <dd>{item?.account?.server ?? "—"}</dd>

                <dt className="text-gray-400">Type</dt>
                <dd>{item?.account?.type ?? "—"}</dd>

                <dt className="text-gray-400">Currency</dt>
                <dd>{item?.account?.currency ?? "—"}</dd>

                <dt className="text-gray-400">Leverage</dt>
                <dd>
                  {item?.account?.leverage ? `1:${item.account.leverage}` : "—"}
                </dd>

                <dt className="text-gray-400">Last snapshot</dt>
                <dd>{item?.ts ? timeAgo(item.ts) : "—"}</dd>
              </dl>
            </div>

            <div>
              <div className="text-white font-medium mb-3">Balances</div>
              <div className="grid grid-cols-2 gap-3">
                <MiniStat
                  title="Balance"
                  value={money(item?.trading?.balance, item?.account?.currency)}
                />
                <MiniStat
                  title="Equity"
                  value={money(item?.trading?.equity, item?.account?.currency)}
                />
                <MiniStat
                  title="Free margin"
                  value={money(
                    item?.trading?.margin_free,
                    item?.account?.currency
                  )}
                />
                <MiniStat
                  title="Margin used"
                  value={money(item?.trading?.margin, item?.account?.currency)}
                />
              </div>
            </div>

            <div>
              <div className="text-white font-medium mb-3">Status</div>
              <div className="grid grid-cols-2 gap-3">
                <MiniStat
                  title="Margin level (%)"
                  value={pct(item?.trading?.margin_level)}
                />
                <MiniStat
                  title="Open positions"
                  value={num(item?.trading?.positions_total)}
                />
              </div>
            </div>
          </div>
        </Card>

        <AccountLive
          aid={id}
          receiverId={item?.receiver_id ?? null}
          currency={item?.account?.currency ?? "USD"}
        />
      </div>
    </div>
  );
}

function money(v?: number | null, ccy?: string) {
  return typeof v === "number" ? fmtMoney(v, ccy || "USD") : "—";
}
function pct(v?: number | null) {
  return typeof v === "number" ? `${v}` : "—";
}
function num(v?: number | null) {
  return typeof v === "number" ? `${v}` : "—";
}

function MiniStat({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-md bg-[#0f1419] border border-gray-800 p-3">
      <div className="text-[11px] text-gray-400">{title}</div>
      <div className="text-white text-sm mt-0.5">{value}</div>
    </div>
  );
}
