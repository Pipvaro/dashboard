/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/stripe/portal/route.ts
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
  const d = await r.json().catch(() => null);
  return d?.user ?? null;
}

export async function POST(req: Request) {
  try {
    const me = await getCurrentUser(req);
    if (!me?.stripe_customer_id) {
      return NextResponse.json(
        { ok: false, message: "no_customer" },
        { status: 400 }
      );
    }

    const cfg = process.env.STRIPE_PORTAL_CONFIGURATION_ID; // optional
    const session = await stripe.billingPortal.sessions.create({
      customer: me.stripe_customer_id, // NUR das!
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
      ...(cfg ? { configuration: cfg } : {}),
    });

    return NextResponse.json({ ok: true, url: session.url });
  } catch (e: any) {
    console.error("portal create failed:", e?.message || e);
    return NextResponse.json(
      { ok: false, message: e?.raw?.message || "server_error" },
      { status: 500 }
    );
  }
}
