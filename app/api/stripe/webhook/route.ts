/* eslint-disable @typescript-eslint/no-explicit-any */
import Stripe from "stripe";
import { NextResponse } from "next/server";

export const runtime = "nodejs"; // wichtig: keine Edge-Function
export const dynamic = "force-dynamic"; // kein Caching

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

function priceToPlan(priceId?: string): "fusion" | "lunar" | "nova" {
  if (!priceId) return "fusion";
  if (priceId === process.env.STRIPE_PRICE_NOVA) return "nova";
  if (priceId === process.env.STRIPE_PRICE_LUNAR) return "lunar";
  return "fusion";
}

async function notifyBackend(payload: any) {
  await fetch(`${process.env.BACKEND_BASE_URL}/stripe/webhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-webhook-token": process.env.STRIPE_WEBHOOK_TOKEN || "",
    },
    body: JSON.stringify(payload),
  });
}

export async function POST(req: Request) {
  try {
    // ⚠️ Unbedingt RAW body verwenden:
    const body = await req.text();
    const sig = req.headers.get("stripe-signature")!;
    const secret = process.env.STRIPE_WEBHOOK_SECRET!; // Dashboard-Endpoint-Secret!

    const event = await stripe.webhooks.constructEventAsync(body, sig, secret);
    console.log("▶ webhook:", event.type);

    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        const userId =
          (s.client_reference_id as string | undefined) ||
          (s.metadata?.userId as string | undefined);
        const customerId = s.customer as string | undefined;

        if (userId && customerId) {
          await notifyBackend({
            type: "link_customer",
            userId,
            stripeCustomerId: customerId,
          });
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = (sub.metadata?.userId as string | undefined) || "";
        const priceId = sub.items?.data?.[0]?.price?.id;
        const plan =
          event.type === "customer.subscription.deleted"
            ? "fusion"
            : priceToPlan(priceId);

        await notifyBackend({
          type: "update_subscription",
          userId,
          plan,
          stripeCustomerId: sub.customer as string,
          stripeSubscriptionId: sub.id,
          status: sub.status,
        });
        break;
      }
    }

    return new NextResponse("ok", { status: 200 });
  } catch (e: any) {
    console.error("webhook error:", e?.message || e);
    // Kommt die Anfrage hier an, siehst du 400 (nicht 405)
    return new NextResponse("bad", { status: 400 });
  }
}
