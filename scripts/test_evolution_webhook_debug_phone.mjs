// Validator for evolution-webhook with phone override and debug modes
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
    process.env.EVOLUTION_API_TOKEN ||
    ''
  );
}

function buildPayload({ phone, text = 'oi', fromMe = false } = {}) {
  const p = phone || process.argv[2] || process.env.TEST_PHONE || '5511999999999';
  return {
    event: 'messages.upsert',
    instance: process.env.EVOLUTION_INSTANCE_ID || process.env.EVOLUTION_INSTANCE_NAME || undefined,
    data: {
      key: {
        remoteJid: `${p}@s.whatsapp.net`,
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
  if (!supabaseUrl) throw new Error('Missing SUPABASE_URL in .env.local');
  if (!secret) throw new Error('Missing Evolution webhook secret in .env.local');

  const base = `${supabaseUrl.replace(/\/?$/, '')}/functions/v1/evolution-webhook`;
  const body = buildPayload();

  const gen = await post(`${base}?debug=1`, secret, body);
  console.log('debug=1  ->', { status: gen.status, ok: gen.ok, matchedUser: !!gen.json?.matchedUser, phone: gen.json?.phoneNumber, iaDebug: gen.json?.iaDebug, snippet: (gen.json?.responseMessage || '').slice(0, 200) });

  if (process.argv.includes('--send')) {
    const send = await post(`${base}?debug=send`, secret, body);
    console.log('debug=send->', { status: send.status, ok: send.ok, body: send.json?.body?.slice?.(0, 200) ?? send.json?.body });
  }
}

main().catch(err => { console.error('failed:', err); process.exit(1); });
