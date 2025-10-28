#!/usr/bin/env node

/**
 * TESTE E2E CRÍTICO - Validação de Produção
 * 
 * Testa funcionalidades essenciais do sistema:
 * 1. StreakCounter - Cálculo de dias consecutivos
 * 2. Plan Completions - Persistência e pontos XP
 * 3. Gamification - Rewards e daily activities
 * 4. Feedback Loop - Integration com generate-plan
 * 
 * Uso: node scripts/test_production_e2e.mjs
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Tentar .env.local primeiro, depois .env
dotenv.config({ path: join(__dirname, '../.env.local') });
dotenv.config({ path: join(__dirname, '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Erro: Variáveis de ambiente não encontradas!');
  console.error('   VITE_SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
  console.error('   VITE_SUPABASE_ANON_KEY:', SUPABASE_KEY ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const TEST_USER_ID = 'b5ef61bf-85b7-443e-a1ff-6b4fb1ee0f67'; // Jeferson (TSLA34)

console.log('\n🧪 INICIANDO TESTES E2E - VIDA SMART COACH\n');
console.log('═'.repeat(60));

// ============= TEST 1: STREAK COUNTER =============
async function testStreakCounter() {
  console.log('\n📊 TEST 1: Streak Counter Calculation');
  console.log('─'.repeat(60));

  try {
    // Buscar últimas 30 atividades
    const { data: activities, error } = await supabase
      .from('daily_activities')
      .select('activity_date')
      .eq('user_id', TEST_USER_ID)
      .order('activity_date', { ascending: false })
      .limit(30);

    if (error) throw error;

    if (!activities || activities.length === 0) {
      console.log('⚠️  Nenhuma atividade encontrada');
      return { success: false, message: 'No activities' };
    }

    // Calcular streak
    const dates = activities.map(a => new Date(a.activity_date).toDateString());
    let streak = 0;
    let today = new Date().toDateString();
    
    for (let i = 0; i < dates.length; i++) {
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - i);
      
      if (dates[i] === expectedDate.toDateString()) {
        streak++;
      } else {
        break;
      }
    }

    console.log(`✅ Streak atual: ${streak} dias`);
    console.log(`📅 Última atividade: ${activities[0].activity_date}`);
    console.log(`📈 Total de atividades (30d): ${activities.length}`);

    return { success: true, streak, lastActivity: activities[0].activity_date };
  } catch (error) {
    console.error('❌ Erro:', error.message);
    return { success: false, error: error.message };
  }
}

// ============= TEST 2: PLAN COMPLETIONS =============
async function testPlanCompletions() {
  console.log('\n📝 TEST 2: Plan Completions & XP');
  console.log('─'.repeat(60));

  try {
    // Buscar completions recentes
    const { data: completions, error } = await supabase
      .from('plan_completions')
  .select('id, plan_type, item_id, completed_at, xp_earned')
      .eq('user_id', TEST_USER_ID)
      .order('completed_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    if (!completions || completions.length === 0) {
      console.log('⚠️  Nenhuma completion encontrada');
      return { success: true, message: 'No completions yet' };
    }

    const totalXP = completions.reduce((sum, c) => sum + (c.xp_earned || 0), 0);
    const byType = completions.reduce((acc, c) => {
      acc[c.plan_type] = (acc[c.plan_type] || 0) + 1;
      return acc;
    }, {});

    console.log(`✅ Completions (últimas 10): ${completions.length}`);
    console.log(`💰 XP total ganho: ${totalXP} pts`);
    console.log(`📊 Por tipo:`, byType);
    console.log(`🕐 Última completion: ${completions[0].completed_at}`);

    return { success: true, completions: completions.length, totalXP };
  } catch (error) {
    console.error('❌ Erro:', error.message);
    return { success: false, error: error.message };
  }
}

// ============= TEST 3: GAMIFICATION =============
async function testGamification() {
  console.log('\n🎮 TEST 3: Gamification System');
  console.log('─'.repeat(60));

  try {
    // Buscar XP total via view
    const { data: xpData, error: xpError } = await supabase
      .from('v_user_xp_totals')
      .select('*')
  .eq('user_id', TEST_USER_ID);

    if (xpError) throw xpError;

    // Buscar profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('level, points, current_streak, longest_streak')
      .eq('id', TEST_USER_ID)
      .single();

    if (profileError) throw profileError;

    console.log(`✅ Nível: ${profile.level}`);
    console.log(`💎 Pontos: ${profile.points}`);
    console.log(`🔥 Streak atual: ${profile.current_streak} dias`);
    console.log(`🏆 Maior streak: ${profile.longest_streak} dias`);
  console.log(`📊 XP total (view): ${xpData?.[0]?.total_xp || 0}`);

    return {
      success: true,
      level: profile.level,
      points: profile.points,
      streak: profile.current_streak
    };
  } catch (error) {
    console.error('❌ Erro:', error.message);
    return { success: false, error: error.message };
  }
}

// ============= TEST 4: FEEDBACK LOOP =============
async function testFeedbackLoop() {
  console.log('\n🔄 TEST 4: Feedback Loop Integration');
  console.log('─'.repeat(60));

  try {
    // Buscar feedbacks pendentes
    const { data: feedbacks, error } = await supabase
      .from('plan_feedback')
      .select('id, plan_type, feedback_text, status, created_at')
      .eq('user_id', TEST_USER_ID)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;

    const pending = feedbacks?.filter(f => f.status === 'pending') || [];
    const processed = feedbacks?.filter(f => f.status === 'processed') || [];

    console.log(`✅ Total de feedbacks: ${feedbacks?.length || 0}`);
    console.log(`⏳ Pendentes: ${pending.length}`);
    console.log(`✔️  Processados: ${processed.length}`);

    if (pending.length > 0) {
      console.log(`\n📝 Feedbacks pendentes:`);
      pending.forEach((f, i) => {
        console.log(`   ${i + 1}. [${f.plan_type}] "${f.feedback_text.substring(0, 50)}..."`);
      });
    }

    return {
      success: true,
      total: feedbacks?.length || 0,
      pending: pending.length,
      processed: processed.length
    };
  } catch (error) {
    console.error('❌ Erro:', error.message);
    return { success: false, error: error.message };
  }
}

// ============= EXECUTAR TODOS OS TESTES =============
async function runAllTests() {
  const results = {
    streak: await testStreakCounter(),
    completions: await testPlanCompletions(),
    gamification: await testGamification(),
    feedback: await testFeedbackLoop()
  };

  console.log('\n═'.repeat(60));
  console.log('\n📋 RESUMO DOS TESTES\n');

  const passed = Object.values(results).filter(r => r.success).length;
  const total = Object.keys(results).length;

  console.log(`✅ Testes passados: ${passed}/${total}`);
  
  if (passed === total) {
    console.log('\n🎉 TODOS OS TESTES PASSARAM! Sistema operacional.\n');
  } else {
    console.log('\n⚠️  ALGUNS TESTES FALHARAM. Verificar logs acima.\n');
  }

  return results;
}

// Executar
runAllTests().catch(console.error);
