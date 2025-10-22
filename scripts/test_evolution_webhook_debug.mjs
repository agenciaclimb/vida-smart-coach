// Quick validator for the deployed evolution-webhook debug modes
// - Loads SUPABASE_URL and EVOLUTION webhook secret from .env.local (without printing them)
// - Sends a minimal messages.upsert payload with a test number
// - Runs three checks: debug=env, debug=1 (no send), and optionally debug=send

import fs from 'node:fs';
import path from 'node:path';

function loadDotenvLocal() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.trim().startsWith('#') || !line.includes('=')) continue;
    const idx = line.indexOf('=');
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim();
    if (!(key in process.env)) process.env[key] = val;
  }
}

function pickWebhookSecret() {
  return (
    process.env.EVOLUTION_API_SECRET ||
    process.env.EVOLUTION_WEBHOOK_TOKEN ||
    process.env.EVOLUTION_WEBHOOK_SECRET ||
    process.env.EVOLUTION_API_TOKEN || // fallback legacy
    ''
  );
}

function buildPayload({ phone = '5511999999999', text = 'oi', fromMe = false } = {}) {
  // Minimal shape compatible with index.ts expectations
  return {
    event: 'messages.upsert',
    instance: process.env.EVOLUTION_INSTANCE_ID || process.env.EVOLUTION_INSTANCE_NAME || undefined,
    data: {
      key: {
        remoteJid: `${phone}@s.whatsapp.net`,
        id: `dbg-${Date.now()}`,
        fromMe,
      },
      message: {
        conversation: text,
      },
    },
  };
}

async function post(url, apikey, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { status: res.status, ok: res.ok, json };
}

async function main() {
  loadDotenvLocal();
  const supabaseUrl = process.env.SUPABASE_URL;
  const secret = pickWebhookSecret();
  if (!supabaseUrl) {
    console.error('Missing SUPABASE_URL in .env.local');
    process.exit(2);
  }
  if (!secret) {
    console.error('Missing Evolution webhook secret (EVOLUTION_API_SECRET/EVOLUTION_WEBHOOK_TOKEN/EVOLUTION_WEBHOOK_SECRET) in .env.local');
    process.exit(3);
  }

  const base = `${supabaseUrl.replace(/\/?$/, '')}/functions/v1/evolution-webhook`;
  const body = buildPayload();

  // 1) debug=env: presence of required envs in function runtime
  const envCheck = await post(`${base}?debug=env`, secret, body);
  console.log('debug=env ->', { status: envCheck.status, ok: envCheck.ok, present: envCheck.json?.present });

  // 2) debug=1: generate response without sending via Evolution
  const genCheck = await post(`${base}?debug=1`, secret, body);
  console.log('debug=1  ->', { status: genCheck.status, ok: genCheck.ok, snippet: (genCheck.json?.responseMessage || '').slice(0, 120) });

  // 3) Optional send check
  if (process.argv.includes('--send')) {
    const sendCheck = await post(`${base}?debug=send`, secret, body);
    console.log('debug=send->', { status: sendCheck.status, ok: sendCheck.ok, body: sendCheck.json?.body?.slice?.(0, 200) ?? sendCheck.json?.body });
  }
}

main().catch((err) => {
  console.error('test_evolution_webhook_debug failed:', err);
  process.exit(1);
});
