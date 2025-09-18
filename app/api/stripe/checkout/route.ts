/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/stripe/checkout/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
export const runtime = "nodejs";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

async function getCurrentUser(req: Request) {
  const meUrl = new URL("/api/me", req.url);
  const r = await fetch(meUrl, {
    headers: { cookie: req.headers.get("cookie") ?? "" },
    cache: "no-store",
  });
  if (!r.ok) return null;
  return (await r.json())?.user ?? null;
}

function planToPriceId(plan?: string) {
  const p = String(plan || "").toLowerCase();
  if (p === "nova") return process.env.STRIPE_PRICE_NOVA!;
  if (p === "lunar") return process.env.STRIPE_PRICE_LUNAR!;
  return null;
}

export async function POST(req: Request) {
  try {
    const me = await getCurrentUser(req);
    if (!me?.user_id || !me?.email) {
      return NextResponse.json(
        { ok: false, message: "unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}) as any);
    const priceId = body?.priceId ?? planToPriceId(body?.plan);
    if (!priceId) {
      return NextResponse.json(
        { ok: false, message: "missing_or_invalid_price" },
        { status: 400 }
      );
    }

    const params: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?canceled=1`,
      client_reference_id: me.user_id,
      metadata: { userId: me.user_id },
      subscription_data: { metadata: { userId: me.user_id } },
      allow_promotion_codes: true,
    };

    if (me.stripe_customer_id) {
      params.customer = me.stripe_customer_id; // ✅ exakt einer der beiden
    } else {
      params.customer_email = me.email; // ✅
    }
    // KEIN customer_creation hier!

    const session = await stripe.checkout.sessions.create(params);
    return NextResponse.json({ ok: true, url: session.url, id: session.id });
  } catch (e: any) {
    console.error("checkout create failed:", e?.message || e);
    return NextResponse.json(
      { ok: false, message: "server_error" },
      { status: 500 }
    );
  }
}
