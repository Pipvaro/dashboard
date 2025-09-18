/* eslint-disable @typescript-eslint/no-explicit-any */
/* app/api/stripe/portal/route.ts */
import Stripe from "stripe";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Hilfsfunktion: aktuellen User holen (Cookies durchreichen)
async function getCurrentUser(req: Request) {
  const meUrl = new URL("/api/me", req.url);
  const r = await fetch(meUrl, {
    headers: { cookie: req.headers.get("cookie") ?? "" },
    cache: "no-store",
  });
  if (!r.ok) return null;
  const d = await r.json().catch(() => null);
  return d?.user ?? null; // { user_id, email, stripe_customer_id, ... }
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

    let customerId: string | null = me.stripe_customer_id || null;

    // 1) Falls keine customerId am User: versuchen, in Stripe zu finden
    if (!customerId) {
      try {
        const found = await stripe.customers.search({
          query: `email:"${me.email}" AND metadata["userId"]:"${me.user_id}"`,
          limit: 1,
        });
        if (found.data[0]) customerId = found.data[0].id;
      } catch {
        // fallback ignorieren, wir erstellen unten ggf. einen neuen Customer
      }
    }

    // 2) Wenn immer noch kein Customer: neu anlegen
    if (!customerId) {
      const c = await stripe.customers.create({
        email: me.email,
        metadata: { userId: me.user_id },
      });
      customerId = c.id;

      // optional im Backend speichern, falls ENV vorhanden
      const base = process.env.BACKEND_BASE_URL;
      const token = process.env.STRIPE_WEBHOOK_TOKEN;
      if (base && token) {
        fetch(`${base}/internal/stripe/user-subscription`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId: me.user_id,
            stripeCustomerId: customerId,
          }),
        }).catch(() => {});
      }
    }

    // 3) Portal-Session erstellen (WICHTIG: nur "customer" setzen, NICHT customer_email)
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId!,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
    });

    return NextResponse.json({ ok: true, url: session.url });
  } catch (e: any) {
    // Zeig die Stripe-Fehlermeldung, wenn vorhanden
    const msg = e?.raw?.message || e?.message || "server_error";
    console.error("portal create failed:", msg);
    return NextResponse.json({ ok: false, message: msg }, { status: 500 });
  }
}
