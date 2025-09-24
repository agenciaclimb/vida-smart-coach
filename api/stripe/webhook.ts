import type { VercelRequest, VercelResponse } from "@vercel/node";
import { buffer } from "micro";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const config = {
  api: {
    bodyParser: false,
  },
};

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY não definida");
  }
  return new Stripe(secretKey, {
    apiVersion: "2023-10-16",
  });
}

function getSupabase() {
  const url =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !key) {
    throw new Error("SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes");
  }
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

async function upsertSubscription(payload: {
  user_id?: string | null;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  status: string;
  current_period_end?: number | null;
}) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("subscriptions")
    .upsert(
      {
        user_id: payload.user_id ?? null,
        stripe_customer_id: payload.stripe_customer_id,
        stripe_subscription_id: payload.stripe_subscription_id,
        status: payload.status,
        current_period_end: payload.current_period_end
          ? new Date(payload.current_period_end * 1000).toISOString()
          : null,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "stripe_subscription_id",
      }
    );

  if (error) {
    throw error;
  }
}

function extractUserId(metadata: Stripe.Metadata | null | undefined) {
  if (!metadata) return null;
  const possibleKeys = [
    "user_id",
    "userId",
    "supabase_user_id",
    "supabaseUserId",
  ];
  for (const key of possibleKeys) {
    const value = metadata[key];
    if (value) return value as string;
  }
  return null;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  const signature = req.headers["stripe-signature"];
  if (!signature) {
    return res.status(400).send("Missing stripe signature");
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return res.status(500).send("STRIPE_WEBHOOK_SECRET not set");
  }

  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    const rawBody = await buffer(req);
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature as string,
      webhookSecret
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed", err);
    return res.status(400).send(`Webhook Error: ${err?.message ?? err}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const subscriptionId = (session.subscription as string) || "";
        const customerId = (session.customer as string) || "";
        const userId = extractUserId(session.metadata);

        if (subscriptionId && customerId) {
          const subscription = await stripe.subscriptions.retrieve(
            subscriptionId
          );
          await upsertSubscription({
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscription.id,
            status: subscription.status,
            current_period_end: subscription.current_period_end ?? null,
          });
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const status =
          event.type === "customer.subscription.deleted"
            ? "canceled"
            : subscription.status;
        await upsertSubscription({
          user_id: extractUserId(subscription.metadata),
          stripe_customer_id: subscription.customer as string,
          stripe_subscription_id: subscription.id,
          status,
          current_period_end: subscription.current_period_end ?? null,
        });
        break;
      }
      default: {
        // outros eventos ignorados
        break;
      }
    }

    return res.json({ received: true });
  } catch (err: any) {
    console.error("Webhook handler error", err);
    return res.status(500).send(`Handler error: ${err?.message ?? err}`);
  }
}
