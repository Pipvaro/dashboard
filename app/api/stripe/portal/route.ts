/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs"; // keine Edge-Funktion
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// holt deinen eingeloggten User (inkl. stripe_customer_id) von /api/me
async function getCurrentUser(req: Request) {
  const meUrl = new URL("/api/me", req.url);
  const r = await fetch(meUrl, {
    headers: { cookie: req.headers.get("cookie") ?? "" },
    cache: "no-store",
  });
  if (!r.ok) return null;
  const d = await r.json().catch(() => null);
  return d?.user ?? null;
}

export async function POST(req: Request) {
  try {
    const me = await getCurrentUser(req);
    if (!me?.user_id) {
      return NextResponse.json(
        { ok: false, message: "unauthorized" },
        { status: 401 }
      );
    }

    // Customer-Portal akzeptiert *nur* das Feld 'customer' (nicht 'customer_email')
    // => wir brauchen eine gespeicherte stripe_customer_id
    const customerId = me.stripe_customer_id as string | undefined;
    if (!customerId) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "No Stripe customer found. Please start a plan upgrade first so we can create one for you.",
        },
        { status: 400 }
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId, // WICHTIG: KEIN customer_email hier übergeben!
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
    });

    return NextResponse.json({ ok: true, url: session.url });
  } catch (e: any) {
    console.error("portal create failed:", e?.message || e);
    return NextResponse.json(
      { ok: false, message: "server_error" },
      { status: 500 }
    );
  }
}
