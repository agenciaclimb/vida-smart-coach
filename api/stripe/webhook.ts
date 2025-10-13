import { SupabaseClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { Readable } from 'node:stream';

// Função para ler o corpo da requisição como um buffer
async function buffer(readable: Readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

// Inicializa o cliente Stripe com a chave secreta e a versão da API
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

// Segredo do endpoint do webhook, usado para verificar a assinatura do evento
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Handler principal da função Edge
export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(null, { status: 405, headers: { 'Allow': 'POST' } });
  }

  const sig = req.headers.get('stripe-signature');
  if (!sig) {
    console.error('Missing stripe-signature header');
    return new Response('Webhook Error: Missing stripe-signature header', { status: 400 });
  }

  let event: Stripe.Event;
  const body = await buffer(req.body as any);

  try {
    // Verifica a assinatura do webhook para garantir que o evento veio do Stripe
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) { // 'any' para capturar a propriedade 'message'
    console.error(`Webhook signature verification failed: ${err.message}`);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Inicializa o cliente Supabase para interagir com o banco de dados
  const supabase = new SupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Trata os diferentes tipos de eventos do Stripe
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await supabase
          .from('billing_subscriptions')
          .update({
            stripe_subscription_status: subscription.status,
            stripe_price_id: subscription.items.data[0]?.price.id,
            stripe_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);
        break;
      }
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === 'subscription' && session.customer) {
          await supabase
            .from('billing_subscriptions')
            .update({
              billing_status: 'active', // Marca a assinatura como ativa
              stripe_customer_id: session.customer.toString(),
              stripe_subscription_id: session.subscription!.toString(),
              stripe_price_id: session.line_items?.data[0]?.price?.id,
              trial_expires_at: null, // Finaliza o período de trial
            })
            .eq('user_id', session.client_reference_id);
        }
        break;
      }
      default:
        // Log para eventos não tratados
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Retorna uma resposta de sucesso
    return new Response(JSON.stringify({ received: true }), { status: 200 });

  } catch (error: any) {
    console.error('Error processing webhook event:', error.message);
    return new Response(`Webhook handler failed: ${error.message}`, { status: 500 });
  }
}
