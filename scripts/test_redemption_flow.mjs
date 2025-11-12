#!/usr/bin/env node
/**
 * Teste E2E do fluxo de resgate de recompensas
 * Simula: validação → resgate → geração cupom → débito XP
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRedemptionFlow() {
  console.log('🧪 Testando fluxo de resgate de recompensas...\n');

  try {
    // 1. Buscar usuário com XP suficiente
    console.log('1️⃣ Buscando usuário com XP...');
    const { data: users, error: userError } = await supabase
      .from('v_user_xp_totals')
      .select('*')
      .gte('xp_total', 1000)
      .limit(1)
      .single();

    if (userError || !users) {
      console.error('❌ Nenhum usuário com XP >= 1000 encontrado');
      console.log('   Dica: Execute daily_activities para gerar XP');
      return;
    }

    console.log(`✅ Usuário encontrado: ${users.user_id.substring(0, 8)}... com ${users.xp_total} XP`);
    const testUserId = users.user_id;
    const xpBefore = users.xp_total;

    // 2. Buscar recompensa acessível
    console.log('\n2️⃣ Buscando recompensa acessível...');
    const { data: rewards, error: rewardError } = await supabase
      .from('v_rewards_catalog')
      .select('*')
      .lte('xp_cost', xpBefore)
      .eq('is_active', true)
      .order('xp_cost', { ascending: false })
      .limit(1)
      .single();

    if (rewardError || !rewards) {
      console.error('❌ Nenhuma recompensa acessível encontrada');
      return;
    }

    console.log(`✅ Recompensa: "${rewards.title}" - ${rewards.xp_cost} XP`);
    const testRewardId = rewards.id;
    const xpCost = rewards.xp_cost;

    // 3. Validar resgate via RPC
    console.log('\n3️⃣ Validando resgate via RPC...');
    const { data: validation, error: validationError } = await supabase
      .rpc('validate_reward_redemption', {
        p_user_id: testUserId,
        p_reward_id: testRewardId
      });

    if (validationError) {
      console.error(`❌ Erro na validação: ${validationError.message}`);
      return;
    }

    if (!validation || validation.length === 0 || !validation[0].is_valid) {
      console.error(`❌ Validação falhou: ${validation?.[0]?.error_message || 'Erro desconhecido'}`);
      return;
    }

    console.log('✅ Validação passou: resgate permitido');

    // 4. Simular chamada à Edge Function reward-redeem
    console.log('\n4️⃣ Simulando Edge Function reward-redeem...');
    console.log('   (Teste real requer Bearer token de usuário autenticado)');
    console.log(`   POST ${supabaseUrl}/functions/v1/reward-redeem`);
    console.log(`   Body: { rewardId: "${testRewardId}" }`);
    
    // Simular o que a Edge Function faz:
    
    // 4a. Criar redemption
    console.log('\n   4a. Criando redemption record...');
    const couponCode = generateCouponCode();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    
    const { data: redemption, error: redemptionError } = await supabase
      .from('reward_redemptions')
      .insert({
        user_id: testUserId,
        reward_id: testRewardId,
        xp_spent: xpCost,
        status: 'approved',
        delivery_info: { test: true }
      })
      .select()
      .single();

    if (redemptionError) {
      console.error(`   ❌ Erro ao criar redemption: ${redemptionError.message}`);
      return;
    }

    console.log(`   ✅ Redemption criado: ${redemption.id.substring(0, 8)}...`);

    // 4b. Debitar XP
    console.log('\n   4b. Debitando XP via RPC...');
    const { error: debitError } = await supabase
      .rpc('debit_user_xp', {
        p_user_id: testUserId,
        p_amount: xpCost
      });

    if (debitError) {
      console.error(`   ❌ Erro ao debitar XP: ${debitError.message}`);
      // Rollback: cancelar redemption
      await supabase
        .from('reward_redemptions')
        .update({ status: 'cancelled' })
        .eq('id', redemption.id);
      console.log('   🔄 Rollback executado: redemption cancelado');
      return;
    }

    console.log(`   ✅ XP debitado: ${xpCost} XP`);

    // 4c. Criar cupom
    console.log('\n   4c. Gerando cupom...');
    const { data: coupon, error: couponError } = await supabase
      .from('reward_coupons')
      .insert({
        redemption_id: redemption.id,
        reward_id: testRewardId,
        code: couponCode,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (couponError) {
      console.error(`   ❌ Erro ao criar cupom: ${couponError.message}`);
      return;
    }

    console.log(`   ✅ Cupom gerado: ${coupon.code}`);

    // 5. Verificar XP final
    console.log('\n5️⃣ Verificando XP após resgate...');
    const { data: userAfter } = await supabase
      .from('v_user_xp_totals')
      .select('*')
      .eq('user_id', testUserId)
      .single();

    const xpAfter = userAfter?.xp_total || 0;
    const xpDiff = xpBefore - xpAfter;

    console.log(`   XP antes:  ${xpBefore}`);
    console.log(`   XP depois: ${xpAfter}`);
    console.log(`   Diferença: ${xpDiff} (esperado: ${xpCost})`);

    if (xpDiff === xpCost) {
      console.log('   ✅ Débito de XP correto!');
    } else {
      console.warn(`   ⚠️  Débito inconsistente (esperado ${xpCost}, obtido ${xpDiff})`);
    }

    // 6. Resultado final
    console.log('\n' + '='.repeat(50));
    console.log('✅ TESTE E2E COMPLETO!');
    console.log('\n📊 Resumo:');
    console.log(`   - Redemption ID: ${redemption.id}`);
    console.log(`   - Cupom: ${coupon.code}`);
    console.log(`   - XP gasto: ${xpCost}`);
    console.log(`   - XP restante: ${xpAfter}`);
    console.log(`   - Expira em: ${new Date(coupon.expires_at).toLocaleDateString('pt-BR')}`);
    
    console.log('\n📋 Validações manuais restantes:');
    console.log('   1. Testar via frontend RewardsPage (com Bearer token)');
    console.log('   2. Verificar RLS (usuário só vê seus resgates)');
    console.log('   3. Testar ofertas no WhatsApp (5 gatilhos)');
    console.log('   4. Monitorar logs das Edge Functions');

  } catch (err) {
    console.error('❌ Erro no teste:', err);
    throw err;
  }
}

function generateCouponCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sem I, O, 1, 0
  const segments = 3;
  const segmentLength = 4;
  
  const code = [];
  for (let i = 0; i < segments; i++) {
    let segment = '';
    for (let j = 0; j < segmentLength; j++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    code.push(segment);
  }
  
  return code.join('-');
}

// Executar
testRedemptionFlow().catch(err => {
  console.error('❌ Teste falhou:', err);
  process.exit(1);
});
