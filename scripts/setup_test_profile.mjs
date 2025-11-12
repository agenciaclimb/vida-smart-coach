// Busca um user_id existente pelo email ou cria via auth.admin
// Depois upsert em user_profiles com billing_status e stage
// Uso:
//   node scripts/setup_test_profile.mjs --phone 5516981459950 --email seu@email.com --status active --name "Seu Nome" [--stage seller]

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
      val = val.replace(/\$\{([^}]+)\}/g, (_, varName) => process.env[varName] || '');
      if (!(key in process.env)) process.env[key] = val;
    }
  }
}

function parseArgs() {
  const out = { status: 'active', password: 'Teste@12345' };
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

async function main() {
  loadDotenvLocal();
  const { phone, email, status, name = 'Cliente Teste', trialDays, stage, password } = parseArgs();

  const ENV_URL = process.env.SUPABASE_URL;
  const ENV_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!ENV_URL || !ENV_KEY) {
    console.error('❌ SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes');
    process.exit(2);
  }
  if (!phone || !email) {
    console.error('Uso: --phone 5516981459950 --email seu@email.com --status active [--name "Nome"] [--trialDays 5] [--stage seller]');
    process.exit(3);
  }

  const supabase = createClient(ENV_URL, ENV_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

  let userId;
  
  // 1. Tentar criar auth user
  const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authErr) {
    if (String(authErr.message).includes('already')) {
      console.log('ℹ️ Usuário já existe, buscando...');
      const { data: list } = await supabase.auth.admin.listUsers();
      const found = list?.users?.find(u => u.email === email);
      if (!found) {
        console.error('❌ Email já registrado mas não encontrado na lista');
        process.exit(1);
      }
      userId = found.id;
      console.log('✅ User ID encontrado:', userId);
    } else {
      console.error('❌ Erro ao criar auth user:', authErr);
      process.exit(1);
    }
  } else {
    userId = authUser.user.id;
    console.log('✅ Auth user criado:', userId);
  }

  // 2. Upsert em user_profiles
  let trial_expires_at = null;
  if (trialDays && !isNaN(Number(trialDays))) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + Number(trialDays));
    trial_expires_at = d.toISOString();
  }

  const payload = {
    id: userId,
    full_name: name,
    name,
    email,
    phone: String(phone).replace(/\D/g, ''),
    billing_status: status,
    trial_expires_at,
  };

  if (stage) {
    payload.ia_stage = String(stage);
  }

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
  console.log('🎯 Dispare o webhook com: node scripts/call_webhook_debug.mjs --phone', phone, '--text "Sim"');
}

main().catch((e) => { console.error(e); process.exit(1); });
