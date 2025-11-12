#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
// Load .env.local first (like other project scripts), fallback to default .env
try {
  const localEnv = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(localEnv)) {
    dotenv.config({ path: localEnv });
  } else {
    dotenv.config();
  }
} catch {}
import { createClient } from '@supabase/supabase-js';

// Safe E2E redemption test using service role (no secrets printed)
// Steps:
// 1) Find user by email or phone (user_profiles)
// 2) Ensure enough XP (update/insert gamification)
// 3) Pick an active, affordable reward
// 4) Validate via validate_reward_redemption
// 5) Insert redemption + generate coupon + debit XP
// 6) Insert coupon record and print a safe summary

function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Variáveis de ambiente ausentes: SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const TARGET_EMAIL = process.argv[2] || 'jeferson@jccempresas.com.br';
const TARGET_PHONE = process.argv[3] || '16981459950';

function generateCouponCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sem I,O,1,0
  let code = '';
  for (let i = 0; i < 12; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${code.slice(0,4)}-${code.slice(4,8)}-${code.slice(8,12)}`;
}

async function getUserByEmailOrPhone(email, phone) {
  // Primeiro tenta pelo email em user_profiles
  let { data, error } = await supabase
    .from('user_profiles')
    .select('user_id, email, phone')
    .eq('email', email)
    .maybeSingle();
  if (error) throw error;
  if (data) return data;

  // Tenta por telefone aproximado (termina com)
  const phoneSuffix = phone.replace(/\D/g, '').slice(-8); // últimos 8 dígitos
  const { data: list2, error: err2 } = await supabase
    .from('user_profiles')
    .select('user_id, email, phone')
    .ilike('phone', `%${phoneSuffix}`)
    .limit(5);
  if (err2) throw err2;
  return list2 && list2[0] ? list2[0] : null;
}

async function ensureUserXP(userId, minXP = 6000) {
  // Busca gamification
  const { data: g, error: gErr } = await supabase
    .from('gamification')
    .select('user_id, total_points')
    .eq('user_id', userId)
    .maybeSingle();
  if (gErr) throw gErr;
  if (!g) {
    const { error: insErr } = await supabase
      .from('gamification')
      .insert({ user_id: userId, total_points: minXP });
    if (insErr) throw insErr;
    return minXP;
  }
  if ((g.total_points || 0) < minXP) {
    const { error: upErr } = await supabase
      .from('gamification')
      .update({ total_points: minXP })
      .eq('user_id', userId);
    if (upErr) throw upErr;
    return minXP;
  }
  return g.total_points;
}

async function pickReward(maxXP) {
  // Usa a view se existir; fallback para tabela rewards
  let reward = null;
  let { data, error } = await supabase
    .from('v_rewards_catalog')
    .select('*')
    .lte('xp_cost', maxXP)
    .eq('is_active', true)
    .order('xp_cost', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!error && data) reward = data;
  if (!reward) {
    const resp = await supabase
      .from('rewards')
      .select('*')
      .lte('xp_cost', maxXP)
      .eq('is_active', true)
      .order('xp_cost', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (!resp.error) reward = resp.data;
  }
  return reward;
}

async function validateRedemption(userId, rewardId) {
  const { data, error } = await supabase
    .rpc('validate_reward_redemption', { p_user_id: userId, p_reward_id: rewardId });
  if (error) throw error;
  const v = Array.isArray(data) ? data[0] : data;
  if (!v?.is_valid) throw new Error(v?.error_message || 'Validação retornou inválido');
  return v;
}

async function performRedemption(userId, reward) {
  const couponCode = generateCouponCode();
  // 1) Cria redemption
  const { data: redemption, error: redErr } = await supabase
    .from('reward_redemptions')
    .insert({
      user_id: userId,
      reward_id: reward.id,
      xp_spent: reward.xp_cost,
      status: 'pending',
      coupon_code: couponCode,
    })
    .select('*')
    .single();
  if (redErr) throw redErr;

  // 2) Debita XP
  const { error: debitErr } = await supabase
    .rpc('debit_user_xp', { p_user_id: userId, p_amount: reward.xp_cost });
  if (debitErr) {
    // rollback simples: cancela redemption
    await supabase
      .from('reward_redemptions')
      .update({ status: 'cancelled' })
      .eq('id', redemption.id);
    throw debitErr;
  }

  // 3) Cria coupon record (se tabela existir)
  await supabase
    .from('reward_coupons')
    .insert({
      code: couponCode,
      redemption_id: redemption.id,
      is_used: false,
      expires_at: new Date(Date.now() + 30*24*60*60*1000).toISOString(),
    });

  return { redemption, couponCode };
}

async function getUserXP(userId){
  const { data, error } = await supabase
    .from('v_user_xp_totals')
    .select('xp_total, level')
    .eq('user_id', userId)
    .maybeSingle();
  return { xp: data?.xp_total ?? null, level: data?.level ?? null, error };
}

(async () => {
  try {
    console.log('🔎 Procurando usuário alvo...');
    const user = await getUserByEmailOrPhone(TARGET_EMAIL, TARGET_PHONE);
    if (!user) {
      console.error('❌ Usuário não encontrado por email ou telefone');
      process.exit(2);
    }
    console.log('👤 User localizado:', { email: user.email, phone: user.phone });

    console.log('🪙 Garantindo XP mínimo...');
    const xpBefore = await ensureUserXP(user.user_id, 6000);

    const { xp: xpViewBefore } = await getUserXP(user.user_id);
    console.log('📊 XP antes:', xpViewBefore ?? xpBefore);

    console.log('🎁 Selecionando recompensa disponível...');
    const reward = await pickReward(6000);
    if (!reward) throw new Error('Nenhuma recompensa ativa e acessível encontrada');
    console.log('✅ Recompensa:', { id: reward.id, name: reward.name, cost: reward.xp_cost });

    console.log('🧪 Validando resgate...');
    await validateRedemption(user.user_id, reward.id);

    console.log('🏁 Executando resgate (DB E2E)...');
    const { redemption, couponCode } = await performRedemption(user.user_id, reward);

    // Pequeno delay para materializar views
    await sleep(500);

    const { xp: xpAfter } = await getUserXP(user.user_id);

    console.log('🎉 TESTE CONCLUÍDO COM SUCESSO');
    console.log('Resumo seguro:');
    console.log({
      user_id: user.user_id,
      reward_id: reward.id,
      reward_name: reward.name,
      coupon_code: couponCode,
      xp_before: xpViewBefore ?? xpBefore,
      xp_after: xpAfter,
      redemption_id: redemption.id,
      status: redemption.status,
    });
    process.exit(0);
  } catch (e) {
    console.error('❌ Falha no teste:', e.message || e);
    process.exit(1);
  }
})();
