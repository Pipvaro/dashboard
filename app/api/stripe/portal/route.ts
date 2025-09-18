/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { stripe, getOriginFromHeaders } from "@/lib/stripe";
import Stripe from "stripe";
import { headers } from "next/headers";

// (If you store the customer id you can fetch it here. For demo, we derive it
// from a session id that may be present on success redirect. Adjust as needed.)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const customerId: string | undefined = body.customerId;

    if (!customerId) {
      return NextResponse.json(
        { ok: false, message: "Missing customerId" },
        { status: 400 }
      );
    }

    const h = headers();
    const origin = getOriginFromHeaders(await h);
    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/billing`,
    });

    return NextResponse.json({ ok: true, url: portal.url });
  } catch (e: any) {
    return NextResponse.json(
      {
        ok: false,
        message: e?.message || "Failed to create billing portal session",
      },
      { status: 500 }
    );
  }
}
