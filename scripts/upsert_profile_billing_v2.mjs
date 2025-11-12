// Upsert direto em user_profiles para testes de webhook (não cria auth user)
// Uso:
//   node scripts/upsert_profile_billing_v2.mjs --phone 5511999999999 --status active --name "Cliente Ativo Teste" [--id <uuid>] [--trialDays 5] [--stage seller]

import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';

function loadDotenvLocal() {
  const candidates = ['.env.local', '.env.development.local', '.env'];
  for (const fname of candidates) {
    const envPath = path.resolve(process.cwd(), fname);
    if (!fs.existsSync(envPath)) continue;
    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      if (!line || line.trim().startsWith('#') || !line.includes('=')) continue;
      const idx = line.indexOf('=');
      const key = line.slice(0, idx).trim();
      let val = line.slice(idx + 1).trim();
      // Expandir ${VAR} simples
      val = val.replace(/\$\{([^}]+)\}/g, (_, varName) => process.env[varName] || '');
      if (!(key in process.env)) process.env[key] = val;
    }
  }
}

function parseArgs() {
  const out = { status: 'active' };
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--')) {
      const key = a.replace(/^--/, '');
      const val = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : 'true';
      out[key] = val;
    }
  }
  return out;
}

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function main() {
  loadDotenvLocal();
  const { url, phone, status, name = 'Cliente Teste', id, trialDays, stage } = parseArgs();

  const ENV_URL = process.env.SUPABASE_URL;
  const ENV_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const TARGET_URL = url || ENV_URL;
  
  console.log('📡 Conectando em:', TARGET_URL);
  console.log('🔑 Service role key:', ENV_KEY ? `presente (${ENV_KEY.length} chars)` : 'ausente');
  
  if (!TARGET_URL || !ENV_KEY) {
    console.error('❌ SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes no .env.local');
    process.exit(2);
  }
  if (!phone) {
    console.error('Uso: --phone 5511999999999 --status active|trialing|past_due|canceled [--name "Nome"] [--id <uuid>] [--trialDays 5] [--stage seller]');
    process.exit(3);
  }

  const supabase = createClient(TARGET_URL, ENV_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

  const user_id = id || uuidv4();

  let trial_expires_at = null;
  if (trialDays && !isNaN(Number(trialDays))) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + Number(trialDays));
    trial_expires_at = d.toISOString();
  }

  const payload = {
    id: user_id,
    full_name: name,
    name,
    email: `${user_id.slice(0,8)}@example.com`,
    phone: String(phone).replace(/\D/g, ''),
    billing_status: status,
    trial_expires_at,
  };

  if (stage) {
    payload.ia_stage = String(stage);
  }

  console.log('📤 Upsert payload:', { ...payload, id: payload.id.slice(0,8) + '...' });

  const { data, error } = await supabase
    .from('user_profiles')
    .upsert(payload, { onConflict: 'id' })
    .select('id, phone, billing_status, trial_expires_at, ia_stage')
    .single();

  if (error) {
    console.error('❌ Erro no upsert user_profiles:', error);
    process.exit(1);
  }

  console.log('✅ user_profiles pronto para teste:', data);
}

main().catch((e) => { console.error(e); process.exit(1); });
