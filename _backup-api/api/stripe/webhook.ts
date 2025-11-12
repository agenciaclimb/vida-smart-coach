import type { VercelRequest, VercelResponse } from "@vercel/node";
import { buffer } from "micro";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const config = { api: { bodyParser: false } };

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function log(level: string, message: string, meta?: any) {
  const logData = { level, message, meta, timestamp: new Date().toISOString() };
  console[level === "error" ? "error" : "log"](JSON.stringify(logData));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // Initialize Stripe
    const stripeSecretKey = requireEnv("STRIPE_SECRET_KEY");
    const webhookSecret = requireEnv("STRIPE_WEBHOOK_SECRET");
    
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    // Get signature
    const signature = req.headers["stripe-signature"] as string;
    if (!signature) {
      log("warn", "Missing Stripe signature header");
      return res.status(400).json({ error: "Missing Stripe signature" });
    }

    // Parse webhook body
    const rawBody = await buffer(req);
    
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err: any) {
      log("error", "Webhook signature verification failed", { error: err.message });
      return res.status(400).json({ error: "Invalid signature" });
    }

    log("info", "Received Stripe webhook", { type: event.type, id: event.id });

    // Initialize Supabase (optional)
    let supabase = null;
    try {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (supabaseUrl && supabaseKey) {
        supabase = createClient(supabaseUrl, supabaseKey, {
          auth: { persistSession: false }
        });
      }
    } catch (err: any) {
      log("warn", "Supabase initialization failed", { error: err.message });
    }

    const registrationResult = await registerStripeEvent(event.id, supabase);
    if (!registrationResult.shouldProcess) {
      return res.status(200).json({ ok: true, skipped: true });
    }

    // Process event
    try {
      switch (event.type) {
        case "checkout.session.completed":
          await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session, stripe, supabase);
          break;
        case "customer.subscription.updated":
        case "customer.subscription.deleted":
          await handleSubscriptionChange(event.data.object as Stripe.Subscription, supabase);
          break;
        case "invoice.payment_succeeded":
          log("info", "Payment succeeded", { invoiceId: (event.data.object as Stripe.Invoice).id });
          break;
        case "invoice.payment_failed":
          log("warn", "Payment failed", { invoiceId: (event.data.object as Stripe.Invoice).id });
          break;
        default:
          log("info", "Unhandled event type", { type: event.type });
      }

      return res.status(200).json({ ok: true });
    } catch (processingError: any) {
      log("error", "Error processing webhook", {
        type: event.type,
        error: processingError.message,
        stack: processingError.stack
      });
      return res.status(500).json({ error: "Processing failed" });
    }
  } catch (error: any) {
    log("error", "Webhook handler error", { 
      error: error.message, 
      stack: error.stack 
    });
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  stripe: Stripe,
  supabase: any
) {
  const userId = session.client_reference_id;
  const subscriptionId = session.subscription;

  if (!userId || !subscriptionId) {
    log("warn", "Missing required data in checkout session", { 
      sessionId: session.id, 
      userId, 
      subscriptionId 
    });
    return;
  }

  if (!supabase) {
    log("warn", "Supabase not available for checkout processing");
    return;
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId as string);
    const customerId = subscription.customer as string;
    const priceId = subscription.items.data[0]?.price.id;
    const periodEnd = subscription.current_period_end 
      ? new Date(subscription.current_period_end * 1000).toISOString() 
      : null;

    const { error } = await supabase
      .from("user_profiles")
      .update({
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        stripe_subscription_status: subscription.status,
        stripe_price_id: priceId,
        stripe_current_period_end: periodEnd,
      })
      .eq("id", userId);

    if (error) {
      throw new Error(`Failed to update user profile: ${error.message}`);
    }

    log("info", "Successfully processed checkout completion", { userId, subscriptionId });
  } catch (error: any) {
    log("error", "Failed to process checkout completion", {
      userId,
      subscriptionId,
      error: error.message
    });
    throw error;
  }
}

async function handleSubscriptionChange(
  subscription: Stripe.Subscription,
  supabase: any
) {
  if (!supabase) {
    log("warn", "Supabase not available for subscription processing");
    return;
  }

  try {
    const customerId = subscription.customer as string;
    const priceId = subscription.items.data[0]?.price.id;
    const periodEnd = subscription.current_period_end 
      ? new Date(subscription.current_period_end * 1000).toISOString() 
      : null;

    const { error } = await supabase
      .from("user_profiles")
      .update({
        stripe_subscription_id: subscription.id,
        stripe_subscription_status: subscription.status,
        stripe_price_id: priceId,
        stripe_current_period_end: periodEnd,
      })
      .eq("stripe_customer_id", customerId);

    if (error) {
      throw new Error(`Failed to update subscription: ${error.message}`);
    }

    log("info", "Successfully processed subscription change", { 
      subscriptionId: subscription.id,
      status: subscription.status
    });
  } catch (error: any) {
    log("error", "Failed to process subscription change", {
      subscriptionId: subscription.id,
      error: error.message
    });
    throw error;
  }
}

async function registerStripeEvent(
  eventId: string,
  supabase: any
): Promise<{ shouldProcess: boolean }> {
  if (!supabase) {
    return { shouldProcess: true };
  }

  const { error } = await supabase
    .from("stripe_events")
    .insert({ event_id: eventId });

  if (!error) {
    return { shouldProcess: true };
  }

  if (error.code === "23505") {
    log("info", "Stripe event already processed", { eventId });
    return { shouldProcess: false };
  }

  log("error", "Failed to register Stripe event", { eventId, error: error.message });
  throw error;
}
