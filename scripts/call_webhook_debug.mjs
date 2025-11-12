// Envia um payload de teste para o evolution-webhook com debug=1 ou debug=send
// Uso:
//   node scripts/call_webhook_debug.mjs --phone 5511999999999 --text "Sim" [--send]

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

function parseArgs() {
  const out = { text: 'oi', phone: '5511999999999', send: false };
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--send') { out.send = true; continue; }
    if (a.startsWith('--')) {
      const key = a.replace(/^--/, '');
      const val = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : 'true';
      out[key] = val;
    }
  }
  return out;
}

function buildPayload({ phone, text, fromMe = false }) {
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
  let json; try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { status: res.status, ok: res.ok, json };
}

async function main() {
  loadDotenvLocal();
  const { phone, text, send } = parseArgs();
  const supabaseUrl = process.env.SUPABASE_URL;
  const secret = process.env.EVOLUTION_API_SECRET || process.env.EVOLUTION_WEBHOOK_TOKEN || process.env.EVOLUTION_WEBHOOK_SECRET || process.env.EVOLUTION_API_TOKEN || '';
  if (!supabaseUrl || !secret) {
    console.error('❌ SUPABASE_URL ou segredo do webhook ausente no .env.local');
    process.exit(2);
  }
  const base = `${supabaseUrl.replace(/\/?$/, '')}/functions/v1/evolution-webhook`;
  const url = `${base}?debug=${send ? 'send' : '1'}`;
  const payload = buildPayload({ phone, text });

  const res = await post(url, secret, payload);
  console.log('📡 webhook', send ? 'send' : 'debug', '->', { status: res.status, ok: res.ok });
  console.log('🧪 resposta:', JSON.stringify(res.json).slice(0, 500));
}

main().catch((e) => { console.error(e); process.exit(1); });
