#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load .env.local first
try {
  const localEnv = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(localEnv)) dotenv.config({ path: localEnv }); else dotenv.config();
} catch {}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !ANON_KEY || !SERVICE_KEY) {
  console.error('❌ Variáveis ausentes: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
const anon = createClient(SUPABASE_URL, ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

const TARGET_EMAIL = process.argv[2] || 'redeem-e2e@vidasmart.com';
const TARGET_PASSWORD = process.argv[3] || 'RedeemE2E!123';

async function ensureUser(email, password) {
  // Try sign in first
  let user = null;
  let accessToken = null;

  const signIn = async () => {
    const { data, error } = await anon.auth.signInWithPassword({ email, password });
    if (error) return null;
    accessToken = data.session?.access_token || null;
    return data.user || null;
  };

  user = await signIn();
  if (user && accessToken) return { user, accessToken };

  // Create user via admin (confirmed)
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: 'Redeem E2E' },
  });
  if (createErr && createErr.name !== 'AuthApiError') {
    console.error('❌ Erro criando usuário admin:', createErr);
  }

  // Retry sign in
  user = await signIn();
  if (!user || !accessToken) throw new Error('Falha ao autenticar usuário E2E');

  // Ensure profile row exists
  await admin
    .from('user_profiles')
    .upsert({ user_id: user.id, email, name: 'Redeem', full_name: 'Redeem E2E', updated_at: new Date().toISOString() })
    .select('*');

  return { user, accessToken };
}

async function ensureUserXP(userId, minXP = 6000) {
  const { data, error } = await admin.from('gamification').select('user_id,total_points').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  if (!data) {
    const { error: insErr } = await admin.from('gamification').insert({ user_id: userId, total_points: minXP });
    if (insErr) throw insErr;
    return minXP;
  }
  if ((data.total_points || 0) < minXP) {
    const { error: upErr } = await admin.from('gamification').update({ total_points: minXP }).eq('user_id', userId);
    if (upErr) throw upErr;
    return minXP;
  }
  return data.total_points;
}

async function getXP(userId) {
  const { data } = await admin.from('v_user_xp_totals').select('xp_total').eq('user_id', userId).maybeSingle();
  return data?.xp_total ?? null;
}

async function pickReward(maxXP) {
  // Prefer view
  let reward = null;
  const { data: viaView } = await admin
    .from('v_rewards_catalog')
    .select('id, title, xp_cost, is_active, available_stock, stock_quantity')
    .eq('is_active', true)
    .lte('xp_cost', maxXP)
    .order('xp_cost', { ascending: true })
    .limit(1)
    .maybeSingle();
  reward = viaView || null;

  if (!reward) {
    const { data: viaTable } = await admin
      .from('rewards')
      .select('id, title, xp_cost, is_active')
      .eq('is_active', true)
      .lte('xp_cost', maxXP)
      .order('xp_cost', { ascending: true })
      .limit(1)
      .maybeSingle();
    reward = viaTable || null;
  }
  return reward;
}

async function callRedeem(accessToken, rewardId) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/reward-redeem`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ rewardId }),
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  if (!res.ok) throw new Error(`Redeem HTTP ${res.status}: ${json?.error || text}`);
  return json;
}

(async () => {
  try {
    console.log('👤 Garantindo usuário E2E...');
    const { user, accessToken } = await ensureUser(TARGET_EMAIL, TARGET_PASSWORD);
    console.log('   user:', user.id, user.email);

    console.log('🪙 Garantindo XP mínimo (6000)...');
    const xpBefore = await ensureUserXP(user.id, 6000);
    const viewXPBefore = await getXP(user.id);
    console.log('   XP antes:', viewXPBefore ?? xpBefore);

    console.log('🎁 Selecionando recompensa ativa/viável...');
    const reward = await pickReward(viewXPBefore ?? xpBefore);
    if (!reward) throw new Error('Nenhuma recompensa ativa disponível dentro do XP atual');
    console.log('   Recompensa:', { id: reward.id, title: reward.title, cost: reward.xp_cost });

    console.log('🚀 Chamando função reward-redeem...');
    const result = await callRedeem(accessToken, reward.id);
    console.log('   Resposta:', {
      success: result?.success,
      redemption: {
        id: result?.redemption?.id,
        couponCode: result?.redemption?.couponCode,
        status: result?.redemption?.status,
        expiresAt: result?.redemption?.expiresAt,
        reward: result?.redemption?.reward?.title,
      },
      userXPAfter: result?.userXPAfter,
    });

    console.log('⏳ Aguardando materialização de views...');
    await new Promise(r => setTimeout(r, 700));

    const viewXPAfter = await getXP(user.id);
    console.log('✅ XP após resgate (view):', viewXPAfter);

    if (typeof result?.userXPAfter === 'number') {
      if (viewXPAfter !== null && Math.abs(viewXPAfter - result.userXPAfter) > 1) {
        console.warn('⚠️ Divergência pequena de XP (view vs retornado). View pode ter pequeno atraso.');
      }
    }

    console.log('🎉 E2E (função reward-redeem) concluído com sucesso');
    process.exit(0);
  } catch (e) {
    console.error('❌ Falha no E2E reward-redeem:', e.message || e);
    process.exit(1);
  }
})();
