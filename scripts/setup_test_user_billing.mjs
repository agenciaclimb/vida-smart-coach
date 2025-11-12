// Cria/atualiza um usuário de teste com phone e billing_status para validar o fluxo do WhatsApp
// Uso:
//   node scripts/setup_test_user_billing.mjs --phone 5511999999999 --status active --name "Cliente Ativo Teste" --email test+ativo@exemplo.com

import { createClient } from '@supabase/supabase-js';
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
  const args = process.argv.slice(2);
  const out = {};
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
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes no .env.local');
    process.exit(2);
  }

  const { phone, status = 'active', name = 'Cliente Teste', email, trialDays } = parseArgs();
  if (!phone) {
    console.error('Uso: --phone 5511999999999 [--status active|trialing|past_due|canceled] [--name "Nome"] [--email email@exemplo.com] [--trialDays 7]');
    process.exit(3);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  let userId;
  try {
    // Tenta encontrar por email (se fornecido) ou cria um novo
    let targetEmail = email || `test+${status}.${phone}@example.com`;
    // Cria usuário auth admin
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email: targetEmail,
      password: 'Teste@12345',
      email_confirm: true
    });
    if (createErr && !String(createErr.message).includes('already registered')) {
      throw createErr;
    }

    if (created?.user?.id) {
      userId = created.user.id;
      console.log('✅ Usuário criado:', userId);
    } else {
      // Buscar usuário existente por e-mail
      const { data: list, error: listErr } = await supabase.auth.admin.listUsers();
      if (listErr) throw listErr;
      const found = list.users.find(u => u.email === targetEmail);
      if (!found) throw new Error('Não foi possível obter o usuário');
      userId = found.id;
      console.log('ℹ️ Usuário existente:', userId);
    }

    // trial_expires_at opcional
    let trial_expires_at = null;
    if (trialDays && !isNaN(Number(trialDays))) {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() + Number(trialDays));
      trial_expires_at = d.toISOString();
    }

    // Upsert no user_profiles
    const { data: up, error: upErr } = await supabase
      .from('user_profiles')
      .upsert({
        id: userId,
        full_name: name,
        name,
        email: email || targetEmail,
        phone: String(phone).replace(/\D/g, ''),
        billing_status: status,
        trial_expires_at: trial_expires_at,
      }, { onConflict: 'id' })
      .select('id, phone, billing_status, trial_expires_at')
      .single();

    if (upErr) throw upErr;
    console.log('✅ user_profiles atualizado:', up);
    console.log('🎯 Pronto para testar pelo webhook com o telefone:', up.phone);
  } catch (err) {
    console.error('❌ Falha ao configurar usuário de teste:', err);
    process.exit(1);
  }
}

main();
