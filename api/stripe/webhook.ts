import type { VercelRequest, VercelResponse } from "@vercel/node";
import { buffer } from "micro";
import Stripe from "stripe";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

export const config = { api: { bodyParser: false } };

const API_VERSION: Stripe.LatestApiVersion = "2023-10-16";

function getEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Env ausente: ${name}`);
  return v;
}

function getStripe(): Stripe {
  const key = getEnv("STRIPE_SECRET_KEY");
  return new Stripe(key, { apiVersion: API_VERSION });
}

function maybeSupabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function log(level: "info" | "warn" | "error", message: string, meta?: any) {
  const line = JSON.stringify({ level, message, meta, ts: new Date().toISOString() });
  // eslint-disable-next-line no-console
  console[level === "error" ? "error" : level === "warn" ? "warn" : "log"](line);
}

async function registerEventOnce(sb: SupabaseClient | null, eventId: string): Promise<boolean> {
  if (!sb) return true;
  const { error } = await sb.from("stripe_events").insert({ event_id: eventId }).select().single();
  if (!error) return true;
  if ((error as any)?.code === "23505") {
    log("info", "Evento já processado (idempotência)", { eventId });
    return false;
  }
  throw error;
}

type Handler = (stripe: Stripe, event: Stripe.Event) => Promise<void>;
const handlers: Record<string, Handler> = {
  "checkout.session.completed": async (stripe, event) => {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.client_reference_id;
    const subscriptionId = session.subscription;

    if (!userId) {
      log("error", "checkout.session.completed sem client_reference_id (userId)", { sessionId: session.id });
      return; // Não é possível prosseguir sem o ID do usuário
    }

    if (typeof subscriptionId !== 'string') {
      log("error", "checkout.session.completed sem ID de assinatura", { sessionId: session.id });
      return; // Ou lidar com pagamentos únicos
    }

    log("info", "checkout.session.completed", { sessionId: session.id, userId, subscriptionId });

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const sb = maybeSupabase();
    if (!sb) {
      log("error", "Cliente Supabase não pôde ser inicializado no handler.");
      throw new Error("Supabase client not available");
    }

    const profileData = {
      stripe_customer_id: subscription.customer,
      stripe_subscription_id: subscription.id,
      stripe_subscription_status: subscription.status,
      stripe_price_id: subscription.items.data[0]?.price.id,
      stripe_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    };

    const { error } = await sb
      .from("user_profiles")
      .update(profileData)
      .eq("id", userId);

    if (error) {
      log("error", "Falha ao atualizar perfil do usuário com dados da assinatura", { userId, error });
      throw new Error(`Failed to update user profile: ${error.message}`);
    }

    log("info", "Perfil do usuário atualizado com sucesso após checkout.", { userId });
  },
  "customer.subscription.created": async (_stripe, event) => {
    const sub = event.data.object as Stripe.Subscription;
    log("info", "subscription.created", { subscriptionId: sub.id, status: sub.status });
  },
              case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;
                const supabase = createClient(
                  process.env.SUPABASE_URL!,
                  process.env.SUPABASE_SERVICE_ROLE_KEY!
                );

                const { error } = await supabase
                  .from('user_profiles')
                  .update({
                    stripe_subscription_id: subscription.id,
                    stripe_subscription_status: subscription.status,
                    stripe_price_id: subscription.items.data[0].price.id,
                    stripe_current_period_end: new Date(
                      subscription.current_period_end * 1000
                    ).toISOString(),
                  })
                  .eq('stripe_customer_id', subscription.customer);

                if (error) {
                  console.error('Supabase error during subscription update:', error);
                  return new Response(JSON.stringify({ error: 'Supabase update failed' }), { status: 500 });
                }

                console.log(`Subscription updated for customer: ${subscription.customer}`);
                break;
              }
              case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                const supabase = createClient(
                  process.env.SUPABASE_URL!,
                  process.env.SUPABASE_SERVICE_ROLE_KEY!
                );

                const { error } = await supabase
                  .from('user_profiles')
                  .update({
                    stripe_subscription_status: subscription.status,
                    stripe_subscription_id: null,
                    stripe_price_id: null,
                    stripe_current_period_end: null,
                  })
                  .eq('stripe_customer_id', subscription.customer);

                if (error) {
                  console.error('Supabase error during subscription deletion:', error);
                  return new Response(JSON.stringify({ error: 'Supabase update failed' }), { status: 500 });
                }

                console.log(`Subscription deleted for customer: ${subscription.customer}`);
                break;
              }
  "invoice.payment_succeeded": async (_stripe, event) => {
    const inv = event.data.object as Stripe.Invoice;
    log("info", "invoice.payment_succeeded", { invoiceId: inv.id, amount_paid: inv.amount_paid });
  },
  "invoice.payment_failed": async (_stripe, event) => {
    const inv = event.data.object as Stripe.Invoice;
    log("warn", "invoice.payment_failed", { invoiceId: inv.id });
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
    log("error", "Env faltante para Stripe", { error: err?.message });
    return res.status(500).json({ error: err?.message ?? "Config error" });
  }

  const signature = req.headers["stripe-signature"] as string | undefined;
  if (!signature) {
    log("warn", "Header Stripe-Signature ausente");
    return res.status(400).json({ error: "Missing Stripe-Signature" });
  }

  const rawBody = await buffer(req);

  let event: Stripe.Event;
  try {
    const webhookSecret = getEnv("STRIPE_WEBHOOK_SECRET");
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: any) {
    log("error", "Falha na verificação de assinatura do webhook", { error: err?.message });
    return res.status(400).json({ error: `Webhook signature verification failed: ${err?.message}` });
  }

  const sb = maybeSupabase();

  try {
    const shouldProcess = await registerEventOnce(sb, event.id);
    if (!shouldProcess) return res.status(200).json({ ok: true, skipped: true });

    const handler = handlers[event.type];
    if (handler) {
      await handler(stripe, event);
      log("info", "Evento processado", { type: event.type, id: event.id });
      return res.status(200).json({ ok: true });
    }

    log("info", "Evento não tratado (ignorando)", { type: event.type, id: event.id });
    return res.status(200).json({ ok: true, ignored: true });
  } catch (err: any) {
    log("error", "Falha no processamento do webhook", { error: err?.message, type: event?.type, id: event?.id });
    return res.status(500).json({ error: "Internal webhook error" });
  }
}