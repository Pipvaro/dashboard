"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import SiteBanner from "@/components/SiteBanner";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

/* ----------------------------- Types & helpers ---------------------------- */

type Plan = {
  _id: string;
  title: string;
  slug?: string | null;
  priceMonthly: number; // e.g. 69
  currency?: string; // e.g. "$"
  priceSuffix?: string; // e.g. "/ month"
  badge?: string | null; // e.g. "Free · XAUUSD only"
  subtitle?: string | null; // e.g. "Beta · Hosting included"
  popular?: boolean;
  order?: number | null;
  features: string[];
};

function fmtPrice(n: number, currency = "$") {
  // Prices are integers in the designs; keep it clean
  return `${currency}${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

/* ------------------------------ Fallback data ----------------------------- */

const FALLBACK_PLANS: Plan[] = [
  {
    _id: "plan-fusion",
    title: "Pipvaro Fusion",
    slug: "fusion",
    priceMonthly: 0,
    currency: "$",
    priceSuffix: " / month",
    badge: "Free · XAUUSD only",
    subtitle: null,
    popular: false,
    order: 1,
    features: [
      "Prebuilt bot preset for XAUUSD",
      "Limited daily bot executions",
      "Core dashboard & live reporting",
      "SL/TP, breakeven & trailing controls",
      "Community support",
    ],
  },
  {
    _id: "plan-nova",
    title: "Pipvaro Nova",
    slug: "nova",
    priceMonthly: 69,
    currency: "$",
    priceSuffix: " / month",
    badge: null,
    subtitle: "Beta · Hosting included · Priority support",
    popular: true,
    order: 2,
    features: [
      "All markets: FX, metals & indices",
      "Highest frequency bots with pro filters & regime switching",
      "Detailed reporting",
      "Hosting included: Windows VPS (24/7, RDP; multi-instance on request)",
      "Full setup included",
      "Priority support (≤24h)",
    ],
  },
  {
    _id: "plan-lunar",
    title: "Pipvaro Lunar",
    slug: "lunar",
    priceMonthly: 39,
    currency: "$",
    priceSuffix: " / month",
    badge: null,
    subtitle: "Beta · Hosting included",
    popular: false,
    order: 3,
    features: [
      "FX majors & metals",
      "Increased daily bot executions",
      "Adaptive risk management",
      "Hosting included: Windows VPS (24/7, RDP)",
      "Standard support (24–48h)",
    ],
  },
];

/* --------------------------------- Page ---------------------------------- */

export default function BillingPage() {
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const r = await fetch("/api/plans", { cache: "no-store" });
        const d = await r.json();
        const items = Array.isArray(d?.items) ? (d.items as Plan[]) : [];
        if (!cancelled) {
          setPlans(items.length ? items : FALLBACK_PLANS);
        }
      } catch {
        if (!cancelled) setPlans(FALLBACK_PLANS);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const ordered = useMemo(
    () =>
      (plans ?? FALLBACK_PLANS)
        .slice()
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [plans]
  );

  return (
    <div className="min-h-screen bg-[#0b0f14]">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Mobile header */}
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

      {/* Global banner (Sanity-controlled) */}

      <main className="md:ml-72">
        <SiteBanner />
        <div className="px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-white">Plans & Billing</h1>
          <p className="text-sm text-gray-400">
            Choose the plan that fits your trading. Upgrade or downgrade
            anytime.
          </p>
        </div>

        {/* Pricing grid */}
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-3">
          {(loading ? FALLBACK_PLANS : ordered).map((p) => (
            <PlanCard key={p._id} plan={p} />
          ))}
        </div>

        </div>
      </main>
    </div>
  );
}

/* ------------------------------- Components ------------------------------ */

function PlanCard({ plan }: { plan: Plan }) {
  const isPopular = !!plan.popular;

  return (
    <div
      className={cn(
        "relative rounded-3xl border p-8",
        isPopular
          ? "bg-[#3f4bf2] border-[#3f4bf2] text-white"
          : "bg-[#14181f] border-gray-800 text-white/95"
      )}
    >
      {/* Price */}
      <div className="text-5xl font-semibold tracking-tight">
        {fmtPrice(plan.priceMonthly, plan.currency || "$")}{" "}
        <span
          className={cn(
            "text-2xl font-medium",
            isPopular ? "text-white/90" : "text-gray-300"
          )}
        >
          {plan.priceSuffix || " / month"}
        </span>
      </div>

      {/* Title / subtitle / badge */}
      <div className="mt-6">
        <div className="text-xl font-semibold">{plan.title}</div>

        {plan.subtitle ? (
          <div
            className={cn(
              "mt-1 text-sm",
              isPopular ? "text-white/90" : "text-gray-300"
            )}
          >
            {plan.subtitle}
          </div>
        ) : null}

        {plan.badge ? (
          <div
            className={cn(
              "mt-2 inline-flex items-center rounded-full px-2.5 py-1 text-xs",
              isPopular ? "bg-white/15 text-white" : "bg-white/10 text-gray-200"
            )}
          >
            {plan.badge}
          </div>
        ) : null}
      </div>

      {/* CTA */}
      <button
        className={cn(
          "mt-6 w-full rounded-full py-3 text-sm font-semibold transition focus:outline-none",
          isPopular
            ? "bg-white text-[#1b1d2a] hover:bg-white/90"
            : "bg-transparent text-white border border-gray-700 hover:bg-white/10"
        )}
        // TODO: wire this to your checkout/upgrade flow
        onClick={() => {
          // placeholder
        }}
      >
        Get started
      </button>

      {/* Feature list */}
      <ul
        className={cn(
          "mt-6 space-y-3",
          isPopular ? "text-white/95" : "text-gray-200"
        )}
      >
        {plan.features?.map((f, i) => (
          <li key={i} className="flex items-start gap-3">
            <span
              className={cn(
                "mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full",
                isPopular
                  ? "bg-white/15 text-white"
                  : "bg-white/10 text-gray-200"
              )}
            >
              <Check className="h-4 w-4" />
            </span>
            <span className="text-sm leading-6">{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
