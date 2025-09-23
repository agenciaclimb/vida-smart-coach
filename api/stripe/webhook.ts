import Stripe from "stripe";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

export const config = { api: { bodyParser: false } };

async function buffer(readable: AsyncIterable<Uint8Array> | NodeJS.ReadableStream) {
  const chunks: Uint8Array[] = [];
  for await (const chunk of readable as AsyncIterable<Uint8Array>) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const rawBody = await buffer(req);
  const signature = req.headers["stripe-signature"] as string | undefined;
  if (!signature) {
    return res.status(400).send("Missing stripe-signature header");
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!webhookSecret || !secretKey) {
    return res.status(500).send("Missing Stripe credentials");
  }

  const stripe = new Stripe(secretKey, { apiVersion: "2024-06-20" });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error: any) {
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({ error: "Missing Supabase server credentials" });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
  });

  const persist = async (
    userId: string | undefined,
    fields: Partial<{
      stripe_customer_id: string;
      stripe_subscription_id: string;
      plan_id: string;
      status: string;
      current_period_end: string | number;
      trial_start: string;
    }>
  ) => {
    if (!userId) return;
    await supabase
      .from("subscriptions")
      .upsert({ user_id: userId, ...fields, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  };

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        await persist(userId, {
          stripe_customer_id: session.customer ? String(session.customer) : undefined,
          stripe_subscription_id: session.subscription ? String(session.subscription) : undefined,
          status: "incomplete",
          trial_start: new Date().toISOString()
        });
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = (subscription.metadata as Record<string, string> | undefined)?.user_id;
        const price = subscription.items.data[0]?.price;
        const plan = price?.nickname || price?.id || "premium";
        await persist(userId, {
          stripe_customer_id: subscription.customer ? String(subscription.customer) : undefined,
          stripe_subscription_id: subscription.id,
          status: subscription.status,
          current_period_end: subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : undefined,
          plan_id: plan.toLowerCase()
        });
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await supabase
          .from("subscriptions")
          .update({ status: "canceled", updated_at: new Date().toISOString() })
          .eq("stripe_subscription_id", subscription.id);
        break;
      }
      default:
        // ignore other events for now
        break;
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error("Stripe webhook handler error", error);
    return res.status(500).json({ error: error.message });
  }
}
