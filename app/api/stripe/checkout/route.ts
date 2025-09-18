/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/stripe/checkout/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Hilfsfunktion: aktuellen User über dein eigenes /api/me holen
async function getCurrentUser(req: Request) {
  // gleiche Origin wie der Request (bewahrt Cookies/Session)
  const meUrl = new URL("/api/me", req.url);
  const r = await fetch(meUrl, {
    headers: {
      // Cookies aus dem eingehenden Request weiterreichen
      cookie: req.headers.get("cookie") ?? "",
    },
    cache: "no-store",
  });
  if (!r.ok) return null;
  const d = await r.json().catch(() => null);
  return d?.user ?? null; // { user_id, email, subscription, ... }
}

function planToPriceId(plan?: string) {
  if (!plan) return null;
  const p = String(plan).toLowerCase();
  if (p === "nova") return process.env.STRIPE_PRICE_NOVA!;
  if (p === "lunar") return process.env.STRIPE_PRICE_LUNAR!;
  return null; // fusion hat keinen Stripe-Preis (free)
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
    // Entweder { plan: "lunar"|"nova" } ODER { priceId: "price_..." }
    const priceId = body?.priceId ?? planToPriceId(body?.plan);

    if (!priceId) {
      return NextResponse.json(
        { ok: false, message: "missing_or_invalid_price" },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?canceled=1`,

      // 🔑 wichtig, damit dein Webhook den User zuordnen kann
      client_reference_id: me.user_id,
      metadata: { userId: me.user_id },
      subscription_data: {
        metadata: { userId: me.user_id },
      },

      // wir kennen (vermutlich) die stripe_customer_id noch nicht → Customer anlegen
      customer_creation: "always",
      customer_email: me.email,

      allow_promotion_codes: true,
    });

    return NextResponse.json({ ok: true, url: session.url, id: session.id });
  } catch (e: any) {
    console.error("checkout create failed:", e?.message || e);
    return NextResponse.json(
      { ok: false, message: "server_error" },
      { status: 500 }
    );
  }
}
