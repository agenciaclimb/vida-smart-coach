#!/usr/bin/env node
/**
 * Script de validação do sistema de recompensas
 * Verifica views, tables, functions e RLS policies
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar .env.local
config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: VITE_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontrados em .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function validateRewardsSystem() {
  console.log('🔍 Iniciando validação do sistema de recompensas...\n');

  let hasErrors = false;

  // 1. Verificar views
  console.log('📊 Verificando VIEWS...');
  const expectedViews = ['v_user_xp_totals', 'v_weekly_ranking', 'v_rewards_catalog'];
  
  for (const viewName of expectedViews) {
    const { data, error } = await supabase
      .from(viewName)
      .select('*')
      .limit(1);
    
    if (error) {
      console.error(`❌ View ${viewName}: ERRO - ${error.message}`);
      hasErrors = true;
    } else {
      console.log(`✅ View ${viewName}: OK`);
    }
  }

  // 2. Verificar tabelas
  console.log('\n📋 Verificando TABELAS...');
  const expectedTables = ['rewards', 'reward_redemptions', 'reward_coupons'];
  
  for (const tableName of expectedTables) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      console.error(`❌ Tabela ${tableName}: ERRO - ${error.message}`);
      hasErrors = true;
    } else {
      console.log(`✅ Tabela ${tableName}: OK`);
    }
  }

  // 3. Verificar funções RPC
  console.log('\n⚙️  Verificando FUNÇÕES...');
  
  // Testar validate_reward_redemption (deve falhar por falta de dados, mas função existe)
  const { error: validateError } = await supabase
    .rpc('validate_reward_redemption', {
      p_user_id: '00000000-0000-0000-0000-000000000000',
      p_reward_id: '00000000-0000-0000-0000-000000000000'
    });
  
  if (validateError && !validateError.message.includes('não encontrado')) {
    console.error(`❌ Função validate_reward_redemption: ERRO - ${validateError.message}`);
    hasErrors = true;
  } else {
    console.log(`✅ Função validate_reward_redemption: OK`);
  }

  // Testar debit_user_xp (deve falhar por falta de dados, mas função existe)
  const { error: debitError } = await supabase
    .rpc('debit_user_xp', {
      p_user_id: '00000000-0000-0000-0000-000000000000',
      p_amount: 100
    });
  
  if (debitError && !debitError.message.includes('não encontrado')) {
    console.error(`❌ Função debit_user_xp: ERRO - ${debitError.message}`);
    hasErrors = true;
  } else {
    console.log(`✅ Função debit_user_xp: OK`);
  }

  // 4. Verificar catálogo de recompensas
  console.log('\n🎁 Verificando CATÁLOGO DE RECOMPENSAS...');
  const { data: rewards, error: rewardsError } = await supabase
    .from('v_rewards_catalog')
    .select('*')
    .eq('is_active', true);
  
  if (rewardsError) {
    console.error(`❌ Erro ao buscar catálogo: ${rewardsError.message}`);
    hasErrors = true;
  } else {
    console.log(`✅ Catálogo carregado: ${rewards?.length || 0} recompensas ativas`);
    if (rewards && rewards.length > 0) {
      console.log('\n📦 Top 5 recompensas:');
      rewards.slice(0, 5).forEach((r, idx) => {
        console.log(`   ${idx + 1}. ${r.title} - ${r.xp_cost} XP (estoque: ${r.available_stock})`);
      });
    }
  }

  // 5. Verificar XP de usuários
  console.log('\n👥 Verificando XP DE USUÁRIOS...');
  const { data: users, error: usersError } = await supabase
    .from('v_user_xp_totals')
    .select('*')
    .order('xp_total', { ascending: false })
    .limit(5);
  
  if (usersError) {
    console.error(`❌ Erro ao buscar XP: ${usersError.message}`);
    hasErrors = true;
  } else {
    console.log(`✅ XP carregado: ${users?.length || 0} usuários encontrados`);
    if (users && users.length > 0) {
      console.log('\n🏆 Top 5 usuários por XP:');
      users.forEach((u, idx) => {
        console.log(`   ${idx + 1}. User ${u.user_id.substring(0, 8)}... - ${u.xp_total} XP (Nível ${u.level})`);
      });
    }
  }

  // 6. Verificar Edge Functions (apenas status de deploy)
  console.log('\n🚀 Edge Functions (verificar manualmente no dashboard):');
  console.log('   - ia-coach-chat (deve ter checkRewardOpportunity)');
  console.log('   - reward-redeem (nova função)');
  console.log('   - generate-plan (deve ter feedback loop)');

  // Resultado final
  console.log('\n' + '='.repeat(50));
  if (hasErrors) {
    console.error('❌ VALIDAÇÃO FALHOU - Verifique os erros acima');
    process.exit(1);
  } else {
    console.log('✅ VALIDAÇÃO COMPLETA - Sistema de recompensas operacional!');
    console.log('\n📋 Próximos passos:');
    console.log('   1. Testar ofertas no WhatsApp (5 gatilhos)');
    console.log('   2. Testar resgate via RewardsPage');
    console.log('   3. Validar débito de XP e geração de cupom');
    console.log('   4. Monitorar logs das Edge Functions');
  }
}

// Executar
validateRewardsSystem().catch(err => {
  console.error('❌ Erro fatal:', err);
  process.exit(1);
});
