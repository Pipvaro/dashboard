// /lib/stripe.ts
import Stripe from "stripe";

const apiVersion: Stripe.StripeConfig["apiVersion"] = "2025-08-27.basil";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion,
});

// Our canonical plan keys in-app
export type PlanKey = "fusion" | "lunar" | "nova";

// Price IDs from env (Stripe Dashboard → Products → Price ID)
export const priceMap: Record<Exclude<PlanKey, "fusion">, string> = {
  lunar: process.env.STRIPE_PRICE_LUNAR!,
  nova: process.env.STRIPE_PRICE_NOVA!,
};

// translate price → plan
export function planFromPrice(priceId?: string | null): PlanKey | undefined {
  if (!priceId) return undefined;
  if (priceId === priceMap.lunar) return "lunar";
  if (priceId === priceMap.nova) return "nova";
  return undefined;
}

// helper to build a good origin (prod + localhost)
export function getOriginFromHeaders(h: Headers) {
  const xfProto = h.get("x-forwarded-proto");
  const xfHost = h.get("x-forwarded-host") || h.get("host");
  const byHeader = xfProto && xfHost ? `${xfProto}://${xfHost}` : undefined;
  return (
    byHeader ||
    (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/+$/, "") ||
    "http://localhost:3000"
  );
}
