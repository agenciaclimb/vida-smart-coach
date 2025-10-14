<<<<<<< HEAD
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { Buffer } from 'buffer';

// Configuração do Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
  typescript: true,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Configuração da Vercel Edge Function
export const config = {
  runtime: 'edge',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Allow': 'POST' },
    });
  }

  const sig = req.headers.get('stripe-signature');
  if (!sig) {
    return new Response(JSON.stringify({ error: 'No stripe-signature header' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const reqBuffer = Buffer.from(await req.arrayBuffer());

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(reqBuffer, sig, webhookSecret);
  } catch (err: any) {
    console.error(`Stripe webhook signature error: ${err.message}`);
    return new Response(JSON.stringify({ error: `Webhook Error: ${err.message}` }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  console.log(`Received Stripe event: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await handleSubscriptionChange(event.data.object as Stripe.Subscription);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error(`Error processing webhook ${event.type}:`, error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

const handleCheckoutCompleted = async (session: Stripe.Checkout.Session) => {
  const { client_reference_id: userId, customer, subscription } = session;

  if (!userId) {
    throw new Error('Missing client_reference_id (user_id) in checkout session');
  }

  const subscriptionData = await stripe.subscriptions.retrieve(subscription as string);

  const { error } = await supabase
    .from('user_profiles')
    .update({
      stripe_customer_id: customer as string,
      stripe_subscription_id: subscription as string,
      stripe_price_id: subscriptionData.items.data[0]?.price.id,
      stripe_subscription_status: subscriptionData.status,
      billing_status: 'active', // User is now active
      trial_expires_at: null, // Clear trial expiration
    })
    .eq('id', userId);

  if (error) {
    throw new Error(`Supabase error updating profile for user ${userId}: ${error.message}`);
  }

  console.log(`Successfully activated subscription for user: ${userId}`);
};

const handleSubscriptionChange = async (subscription: Stripe.Subscription) => {
  const { customer } = subscription;

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('stripe_customer_id', customer)
    .single();

  if (profileError || !profile) {
    throw new Error(`Could not find user profile for stripe_customer_id: ${customer}`);
  }

  const { id: userId } = profile;

  const newStatus = subscription.status === 'active' ? 'active' : subscription.status;

  const { error } = await supabase
    .from('user_profiles')
    .update({
      stripe_subscription_id: subscription.id,
      stripe_price_id: subscription.items.data[0]?.price.id,
      stripe_subscription_status: subscription.status,
      billing_status: newStatus,
      stripe_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq('id', userId);

  if (error) {
    throw new Error(`Supabase error updating subscription for user ${userId}: ${error.message}`);
  }

  console.log(`Successfully updated subscription status to "${newStatus}" for user: ${userId}`);
};

export default handler;
=======
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { buffer } from "micro";
import Stripe from "stripe";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

export const config = { api: { bodyParser: false } };

const API_VERSION: Stripe.LatestApiVersion = "2023-10-16";

type LogLevel = "info" | "warn" | "error";

type HandlerContext = {
  stripe: Stripe;
  event: Stripe.Event;
  supabase: SupabaseClient | null;
};

type Handler = (ctx: HandlerContext) => Promise<void>;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }
  return value;
}

function getStripe(): Stripe {
  const key = requireEnv("STRIPE_SECRET_KEY");
  return new Stripe(key, { apiVersion: API_VERSION });
}

function maybeSupabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return null;
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

function log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  const payload = JSON.stringify({ level, message, meta, ts: new Date().toISOString() });
  const consoleMethod = level === "error" ? "error" : level === "warn" ? "warn" : "log";
  // eslint-disable-next-line no-console
  console[consoleMethod](payload);
}

async function registerEventOnce(client: SupabaseClient | null, eventId: string): Promise<boolean> {
  if (!client) {
    return true;
  }
  const { error } = await client
    .from("stripe_events")
    .insert({ event_id: eventId })
    .select("id")
    .maybeSingle();

  if (!error) {
    return true;
  }

  if (error.code === "23505") {
    log("info", "Stripe event already processed", { eventId });
    return false;
  }

  throw error;
}

async function upsertProfileFromSubscription(client: SupabaseClient, subscription: Stripe.Subscription) {
  const customerId = String(subscription.customer);
  const price = subscription.items?.data?.[0]?.price?.id ?? null;
  const periodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000).toISOString()
    : null;

  const { error } = await client
    .from("user_profiles")
    .update({
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      stripe_subscription_status: subscription.status,
      stripe_price_id: price,
      stripe_current_period_end: periodEnd,
    })
    .eq("stripe_customer_id", customerId);

  if (error) {
    throw new Error(`Failed to sync subscription for customer ${customerId}: ${error.message}`);
  }
}

const handlers: Record<string, Handler> = {
  "checkout.session.completed": async ({ stripe, event, supabase }) => {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.client_reference_id;
    const subscriptionId = session.subscription;

    if (!userId) {
      log("error", "checkout.session.completed missing client_reference_id", { sessionId: session.id });
      return;
    }

    if (typeof subscriptionId !== "string") {
      log("error", "checkout.session.completed without subscription id", { sessionId: session.id });
      return;
    }

    log("info", "checkout.session.completed", { sessionId: session.id, userId, subscriptionId });

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    if (!supabase) {
      throw new Error("Supabase client not available");
    }

    const price = subscription.items?.data?.[0]?.price?.id ?? null;
    const periodEnd = subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null;

    const { error } = await supabase
      .from("user_profiles")
      .update({
        stripe_customer_id: String(subscription.customer),
        stripe_subscription_id: subscription.id,
        stripe_subscription_status: subscription.status,
        stripe_price_id: price,
        stripe_current_period_end: periodEnd,
      })
      .eq("id", userId);

    if (error) {
      throw new Error(`Failed to update user profile ${userId}: ${error.message}`);
    }

    log("info", "User profile updated after checkout", { userId });
  },

  "customer.subscription.created": async ({ event }) => {
    const sub = event.data.object as Stripe.Subscription;
    log("info", "customer.subscription.created", { subscriptionId: sub.id, status: sub.status });
  },

  "customer.subscription.updated": async ({ event, supabase }) => {
    if (!supabase) {
      throw new Error("Supabase client not available");
    }
    const sub = event.data.object as Stripe.Subscription;
    await upsertProfileFromSubscription(supabase, sub);
    log("info", "customer.subscription.updated", { subscriptionId: sub.id });
  },

  "customer.subscription.deleted": async ({ event, supabase }) => {
    if (!supabase) {
      throw new Error("Supabase client not available");
    }
    const sub = event.data.object as Stripe.Subscription;
    const customerId = String(sub.customer);
    const { error } = await supabase
      .from("user_profiles")
      .update({
        stripe_subscription_id: null,
        stripe_subscription_status: sub.status ?? "canceled",
        stripe_price_id: null,
        stripe_current_period_end: null,
      })
      .eq("stripe_customer_id", customerId);

    if (error) {
      throw new Error(`Failed to clear subscription for customer ${customerId}: ${error.message}`);
    }

    log("info", "customer.subscription.deleted", { subscriptionId: sub.id, customerId });
  },

  "invoice.payment_succeeded": async ({ event }) => {
    const invoice = event.data.object as Stripe.Invoice;
    log("info", "invoice.payment_succeeded", { invoiceId: invoice.id, amountPaid: invoice.amount_paid });
  },

  "invoice.payment_failed": async ({ event }) => {
    const invoice = event.data.object as Stripe.Invoice;
    log("warn", "invoice.payment_failed", { invoiceId: invoice.id });
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  let stripe: Stripe;
  try {
    stripe = getStripe();
  } catch (err: any) {
    log("error", "Stripe environment configuration error", { error: err?.message });
    return res.status(500).json({ error: err?.message ?? "Configuration error" });
  }

  const signature = req.headers["stripe-signature"] as string | undefined;
  if (!signature) {
    log("warn", "Missing Stripe-Signature header");
    return res.status(400).json({ error: "Missing Stripe-Signature" });
  }

  const rawBody = await buffer(req);

  let event: Stripe.Event;
  try {
    const webhookSecret = requireEnv("STRIPE_WEBHOOK_SECRET");
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: any) {
    log("error", "Webhook signature verification failed", { error: err?.message });
    return res.status(400).json({ error: `Webhook signature verification failed: ${err?.message}` });
  }

  const supabase = maybeSupabase();

  try {
    const shouldProcess = await registerEventOnce(supabase, event.id);
    if (!shouldProcess) {
      return res.status(200).json({ ok: true, skipped: true });
    }

    const handlerFn = handlers[event.type];
    if (handlerFn) {
      await handlerFn({ stripe, event, supabase });
      log("info", "Stripe event processed", { type: event.type, id: event.id });
      return res.status(200).json({ ok: true });
    }

    log("info", "Unhandled Stripe event type", { type: event.type, id: event.id });
    return res.status(200).json({ ok: true, ignored: true });
  } catch (err: any) {
    log("error", "Stripe webhook handler failure", {
      error: err?.message,
      type: event?.type,
      id: event?.id,
    });
    return res.status(500).json({ error: "Internal webhook error" });
  }
}
>>>>>>> origin/main
