/* eslint-disable @typescript-eslint/no-explicit-any */
import Stripe from "stripe";
import { NextResponse } from "next/server";
import { cookies } from "next/headers"; // if you read user from cookie/jwt

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Map plan key -> Stripe price id
const priceMap: Record<string, string> = {
  lunar: process.env.STRIPE_PRICE_LUNAR!,
  nova: process.env.STRIPE_PRICE_NOVA!,
};

export async function POST(req: Request) {
  try {
    const { plan } = (await req.json()) as { plan: "lunar" | "nova" };

    // You already know who is logged in; make sure you have their id:
    // Example: you might read it from your auth cookie/jwt.
    // Here just a placeholder:
    const userId = (await cookies()).get("uid")?.value || "unknown-user";

    const price = priceMap[plan];
    if (!price) {
      return NextResponse.json(
        { ok: false, message: "Unknown plan" },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price, quantity: 1 }],
      subscription_data: { metadata: { userId } }, // <— WICHTIG
      client_reference_id: userId,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?canceled=1`,
    });

    return NextResponse.json({ ok: true, url: session.url });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, message: e.message },
      { status: 500 }
    );
  }
}
