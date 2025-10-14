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