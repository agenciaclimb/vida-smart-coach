#!/usr/bin/env node

/**
 * Script de teste para verificar se o webhook do Stripe está funcionando
 * Execute: node test-webhook.js
 */

const https = require('https');
const crypto = require('crypto');

// Configuração de teste
const WEBHOOK_URL = 'http://localhost:3000/api/stripe/webhook';
const WEBHOOK_SECRET = 'whsec_test_secret'; // Use o real se tiver

// Evento de teste do Stripe
const testEvent = {
  id: 'evt_test_webhook',
  object: 'event',
  api_version: '2023-10-16',
  created: Math.floor(Date.now() / 1000),
  data: {
    object: {
      id: 'cs_test_checkout_session',
      object: 'checkout.session',
      client_reference_id: 'user_123',
      customer: 'cus_test_customer',
      subscription: 'sub_test_subscription'
    }
  },
  type: 'checkout.session.completed',
  livemode: false,
  pending_webhooks: 1,
  request: { id: null, idempotency_key: null }
};

function generateSignature(payload, secret) {
  const timestamp = Math.floor(Date.now() / 1000);
  const payloadString = `${timestamp}.${payload}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadString, 'utf8')
    .digest('hex');
  
  return `t=${timestamp},v1=${signature}`;
}

async function testWebhook() {
  const payload = JSON.stringify(testEvent);
  const signature = generateSignature(payload, WEBHOOK_SECRET);
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/stripe/webhook',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
      'stripe-signature': signature
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${data}`);
        resolve({ status: res.statusCode, data });
      });
    });

    req.on('error', (err) => {
      console.error('Request failed:', err.message);
      reject(err);
    });

    req.write(payload);
    req.end();
  });
}

if (require.main === module) {
  console.log('🧪 Testando webhook do Stripe...');
  testWebhook()
    .then(() => console.log('✅ Teste concluído'))
    .catch((err) => console.error('❌ Teste falhou:', err.message));
}

module.exports = { testWebhook };