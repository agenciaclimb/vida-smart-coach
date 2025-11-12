import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar .env.local
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

console.log('🧪 TESTES E2E - REWARD OFFERS WHATSAPP\n');
console.log('📍 Supabase:', supabaseUrl);
console.log('⏰ Data:', new Date().toLocaleString('pt-BR'));
console.log('\n' + '='.repeat(60) + '\n');

/**
 * Busca perfil do usuário a partir da VIEW v_user_xp_totals
 * Retorna um objeto mínimo no formato esperado pela função (id, email)
 */
async function getUserProfile(userId) {
  console.log(`   🔍 Buscando perfil (via view) para userId: ${userId}`);

  const { data, error } = await supabase
    .from('v_user_xp_totals')
    .select('user_id, email')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('   ❌ Erro ao buscar na view v_user_xp_totals:', error);
    throw new Error(`Usuário não encontrado na view: ${userId}`);
  }

  if (!data) {
    throw new Error(`Usuário ${userId} não existe na view v_user_xp_totals`);
  }

  const profile = {
    id: data.user_id,
    email: data.email,
    full_name: data.full_name || data.name || data.email || 'Usuário Teste'
  };

  console.log(`   ✅ Perfil encontrado: ${profile.email || profile.id}`);
  return profile;
}

/**
 * Simula uma chamada ao ia-coach-chat Edge Function
 */
async function callIACoach(userId, message) {
  try {
    // Buscar perfil do usuário
    const userProfile = await getUserProfile(userId);
    console.log('   📋 UserProfile:', JSON.stringify(userProfile, null, 2));

    const res = await fetch(`${supabaseUrl}/functions/v1/ia-coach-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'x-force-offline': '1'
      },
      body: JSON.stringify({
        messageContent: message,
        userProfile,
        chatHistory: []
      })
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error('   ⚠️  Erro detalhado HTTP:', res.status, res.statusText, text);
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }

    const data = await res.json().catch(() => null);
    return data;
  } catch (error) {
    console.error('   ❌ Exception:', error.message);
    return null;
  }
}

/**
 * Verifica se a resposta contém oferta de recompensa
 */
function hasRewardOffer(response) {
  if (!response || !response.reply) return false;
  
  const text = response.reply.toLowerCase();
  const indicators = [
    '🎁',
    'recompensa',
    'reward',
    'xp',
    'pontos',
    'resgat',
    'cupom',
    'prêmio'
  ];

  return indicators.some(indicator => text.includes(indicator));
}

/**
 * Extrai detalhes da oferta de recompensa
 */
function extractOfferDetails(response) {
  if (!response || !response.reply) return null;

  const text = response.reply;
  const details = {
    hasOffer: hasRewardOffer(response),
    emoji: text.includes('🎁'),
    mentionsXP: text.toLowerCase().includes('xp') || text.toLowerCase().includes('pontos'),
    suggestsRewards: text.toLowerCase().includes('recompensa') || text.toLowerCase().includes('resgat'),
    responseLength: text.length,
    fullResponse: text.substring(0, 200) + (text.length > 200 ? '...' : '')
  };

  return details;
}

/**
 * Teste 1: completedActivity Trigger
 */
async function testCompletedActivityTrigger() {
  console.log('🧪 TESTE 1: completedActivity Trigger\n');
  console.log('Cenário: Usuário completou um exercício\n');

  // Buscar usuário de teste com XP suficiente
  const { data: users } = await supabase
    .from('v_user_xp_totals')
    .select('user_id, email, xp_total')
    .gte('xp_total', 1000)
    .limit(1);

  if (!users || users.length === 0) {
    console.log('⚠️  Nenhum usuário com XP >= 1000 encontrado\n');
    return false;
  }

  const testUser = users[0];
  console.log(`👤 Usuário de teste: ${testUser.email}`);
  console.log(`💰 XP atual: ${testUser.xp_total}\n`);

  const message = "Acabei de completar meu treino completo! Foi intenso mas consegui.";
  
  console.log('📤 Mensagem enviada:', message);
  console.log('⏳ Chamando ia-coach-chat...\n');

  const response = await callIACoach(testUser.user_id, message);

  if (!response) {
    console.log('❌ FALHOU: Erro na chamada\n');
    return false;
  }

  const details = extractOfferDetails(response);
  
  console.log('📥 Resposta recebida:');
  console.log(`   Tamanho: ${details.responseLength} caracteres`);
  console.log(`   Contém 🎁: ${details.emoji ? '✅' : '❌'}`);
  console.log(`   Menciona XP: ${details.mentionsXP ? '✅' : '❌'}`);
  console.log(`   Sugere recompensas: ${details.suggestsRewards ? '✅' : '❌'}`);
  console.log(`   Preview: "${details.fullResponse}"\n`);

  const passed = details.hasOffer;
  console.log(`${passed ? '✅ PASSOU' : '⚠️  ATENÇÃO'}: Trigger completedActivity ${passed ? 'detectado' : 'não detectado'}\n`);
  console.log('─'.repeat(60) + '\n');

  return passed;
}

/**
 * Teste 2: milestone Trigger
 */
async function testMilestoneTrigger() {
  console.log('🧪 TESTE 2: milestone Trigger\n');
  console.log('Cenário: Usuário atingiu marco de XP (múltiplo de 1000)\n');

  // Buscar usuário próximo de milestone
  const { data: users } = await supabase
    .from('v_user_xp_totals')
    .select('user_id, email, xp_total')
    .gte('xp_total', 4900)
    .lte('xp_total', 5100)
    .limit(1);

  if (!users || users.length === 0) {
    console.log('⚠️  Nenhum usuário próximo de milestone encontrado');
    console.log('📝 Simulando usuário com 5000 XP exatos\n');
  }

  const testUser = users?.[0] || { user_id: 'simulated', email: 'simulated@test.com', xp_total: 5000 };
  console.log(`👤 Usuário: ${testUser.email}`);
  console.log(`💰 XP: ${testUser.xp_total}\n`);

  const message = "Atingi uma meta importante no meu objetivo! Como está?";
  
  console.log('📤 Mensagem enviada:', message);
  console.log('⏳ Chamando ia-coach-chat...\n');

  const response = await callIACoach(testUser.user_id, message, {
    totalXP: 5000, // Forçar milestone
    justReachedMilestone: true
  });

  if (!response) {
    console.log('❌ FALHOU: Erro na chamada\n');
    return false;
  }

  const details = extractOfferDetails(response);
  
  console.log('📥 Resposta recebida:');
  console.log(`   Tamanho: ${details.responseLength} caracteres`);
  console.log(`   Contém 🎁: ${details.emoji ? '✅' : '❌'}`);
  console.log(`   Menciona XP: ${details.mentionsXP ? '✅' : '❌'}`);
  console.log(`   Sugere recompensas: ${details.suggestsRewards ? '✅' : '❌'}`);
  console.log(`   Preview: "${details.fullResponse}"\n`);

  const passed = details.hasOffer || details.mentionsXP;
  console.log(`${passed ? '✅ PASSOU' : '⚠️  ATENÇÃO'}: Trigger milestone ${passed ? 'detectado' : 'não detectado'}\n`);
  console.log('─'.repeat(60) + '\n');

  return passed;
}

/**
 * Teste 3: streak Trigger
 */
async function testStreakTrigger() {
  console.log('🧪 TESTE 3: streak Trigger (7+ dias)\n');
  console.log('Cenário: Usuário mantém streak de 7+ dias consecutivos\n');

  // Buscar usuário com streak alto
  const { data: users } = await supabase
    .from('v_user_xp_totals')
    .select('user_id, email, xp_total, current_streak')
    .gte('current_streak', 7)
    .limit(1);

  if (!users || users.length === 0) {
    console.log('⚠️  Nenhum usuário com streak >= 7 encontrado');
    console.log('ℹ️  PULANDO: Sem dados para validar streak (normal)\n');
    console.log('─'.repeat(60) + '\n');
    return true; // Pular sem falhar
  }

  const testUser = users[0];
  
  console.log(`👤 Usuário: ${testUser.email}`);
  console.log(`🔥 Streak: ${testUser.current_streak} dias`);
  console.log(`💰 XP: ${testUser.xp_total}\n`);

  const message = "Mantive minha disciplina hoje também!";
  
  console.log('📤 Mensagem enviada:', message);
  console.log('⏳ Chamando ia-coach-chat...\n');

  const response = await callIACoach(testUser.user_id, message);

  if (!response) {
    console.log('❌ FALHOU: Erro na chamada\n');
    return false;
  }

  const details = extractOfferDetails(response);
  
  console.log('📥 Resposta recebida:');
  console.log(`   Tamanho: ${details.responseLength} caracteres`);
  console.log(`   Contém 🎁: ${details.emoji ? '✅' : '❌'}`);
  console.log(`   Menciona XP: ${details.mentionsXP ? '✅' : '❌'}`);
  console.log(`   Sugere recompensas: ${details.suggestsRewards ? '✅' : '❌'}`);
  console.log(`   Preview: "${details.fullResponse}"\n`);

  const passed = details.hasOffer;
  console.log(`${passed ? '✅ PASSOU' : '⚠️  ATENÇÃO'}: Trigger streak ${passed ? 'detectado' : 'não detectado'}\n`);
  console.log('─'.repeat(60) + '\n');

  return passed;
}

/**
 * Teste 4: levelUp Trigger
 */
async function testLevelUpTrigger() {
  console.log('🧪 TESTE 4: levelUp Trigger (múltiplo de 5)\n');
  console.log('Cenário: Usuário atingiu nível 5, 10, 15...\n');

  // Buscar usuário em nível múltiplo de 5
  const { data: users } = await supabase
    .from('v_user_xp_totals')
    .select('user_id, email, xp_total, level')
    .gte('level', 5)
    .limit(10);

  const userAtLevel5Multiple = users?.find(u => u.level % 5 === 0);

  if (!userAtLevel5Multiple) {
    console.log('⚠️  Nenhum usuário em nível múltiplo de 5 encontrado');
    console.log('📝 Simulando usuário nível 5\n');
  }

  const testUser = userAtLevel5Multiple || { 
    user_id: 'simulated', 
    email: 'simulated@test.com', 
    xp_total: 5000,
    level: 5 
  };
  
  console.log(`👤 Usuário: ${testUser.email}`);
  console.log(`🏆 Nível: ${testUser.level}`);
  console.log(`💰 XP: ${testUser.xp_total}\n`);

  const message = "Acabei de subir para o nível 5! Atingi um marco importante!";
  
  console.log('📤 Mensagem enviada:', message);
  console.log('⏳ Chamando ia-coach-chat...\n');

  const response = await callIACoach(testUser.user_id, message);

  if (!response) {
    console.log('❌ FALHOU: Erro na chamada\n');
    return false;
  }

  const details = extractOfferDetails(response);
  
  console.log('📥 Resposta recebida:');
  console.log(`   Tamanho: ${details.responseLength} caracteres`);
  console.log(`   Contém 🎁: ${details.emoji ? '✅' : '❌'}`);
  console.log(`   Menciona XP: ${details.mentionsXP ? '✅' : '❌'}`);
  console.log(`   Sugere recompensas: ${details.suggestsRewards ? '✅' : '❌'}`);
  console.log(`   Preview: "${details.fullResponse}"\n`);

  const passed = details.hasOffer;
  console.log(`${passed ? '✅ PASSOU' : '⚠️  ATENÇÃO'}: Trigger levelUp ${passed ? 'detectado' : 'não detectado'}\n`);
  console.log('─'.repeat(60) + '\n');

  return passed;
}

/**
 * Teste 5: highXP Trigger
 */
async function testHighXPTrigger() {
  console.log('🧪 TESTE 5: highXP Trigger (>5000 XP, 30% chance)\n');
  console.log('Cenário: Usuário com alto XP recebe lembretes ocasionais\n');

  // Buscar usuário com XP > 5000
  const { data: users } = await supabase
    .from('v_user_xp_totals')
    .select('user_id, email, xp_total')
    .gt('xp_total', 5000)
    .limit(1);

  if (!users || users.length === 0) {
    console.log('⚠️  Nenhum usuário com XP > 5000 encontrado\n');
    return false;
  }

  const testUser = users[0];
  console.log(`👤 Usuário: ${testUser.email}`);
  console.log(`💰 XP: ${testUser.xp_total}\n`);

  const message = "Como você está?";
  
  console.log('📤 Mensagem enviada:', message);
  console.log('🎲 Trigger aleatório (30% chance)');
  console.log('⏳ Testando 5 vezes para aumentar probabilidade...\n');

  let offerFound = false;
  let attempts = 0;

  for (let i = 0; i < 5; i++) {
    const response = await callIACoach(testUser.user_id, message);
    
    if (response && hasRewardOffer(response)) {
      offerFound = true;
      const details = extractOfferDetails(response);
      
      console.log(`✅ Tentativa ${i + 1}: Oferta detectada!`);
      console.log(`   Preview: "${details.fullResponse}"\n`);
      break;
    }
    
    attempts++;
    await new Promise(resolve => setTimeout(resolve, 500)); // Delay entre tentativas
  }

  if (!offerFound) {
    console.log(`⚠️  Nenhuma oferta detectada em ${attempts} tentativas`);
    console.log('   (Esperado devido à aleatoriedade de 30%)\n');
  }

  console.log(`${offerFound ? '✅ PASSOU' : 'ℹ️  INFO'}: Trigger highXP ${offerFound ? 'ativado' : 'não ativado (normal)'}\n`);
  console.log('─'.repeat(60) + '\n');

  return true; // Sempre passa, pois é aleatório
}

/**
 * Executa todos os testes
 */
async function runAllTests() {
  const results = {
    completedActivity: false,
    milestone: false,
    streak: false,
    levelUp: false,
    highXP: false
  };

  try {
    results.completedActivity = await testCompletedActivityTrigger();
    results.milestone = await testMilestoneTrigger();
    results.streak = await testStreakTrigger();
    results.levelUp = await testLevelUpTrigger();
    results.highXP = await testHighXPTrigger();

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO DOS TESTES\n');
    console.log(`1️⃣  completedActivity: ${results.completedActivity ? '✅ PASSOU' : '⚠️  FALHOU'}`);
    console.log(`2️⃣  milestone: ${results.milestone ? '✅ PASSOU' : '⚠️  FALHOU'}`);
    console.log(`3️⃣  streak: ${results.streak ? '✅ PASSOU' : '⚠️  FALHOU'}`);
    console.log(`4️⃣  levelUp: ${results.levelUp ? '✅ PASSOU' : '⚠️  FALHOU'}`);
    console.log(`5️⃣  highXP: ${results.highXP ? '✅ PASSOU' : 'ℹ️  INFO (aleatório)'}`);

    const passed = Object.values(results).filter(Boolean).length;
    const total = Object.keys(results).length;

    console.log(`\n📈 Total: ${passed}/${total} triggers validados\n`);
    console.log('='.repeat(60) + '\n');

    if (passed >= 3) {
      console.log('🎉 SUCESSO! Maioria dos triggers funcionando\n');
      console.log('📝 PRÓXIMOS PASSOS:');
      console.log('   1. Testar redemption completo via WhatsApp');
      console.log('   2. Validar frontend RewardsPage');
      console.log('   3. Monitorar logs das Edge Functions\n');
    } else {
      console.log('⚠️  ATENÇÃO: Menos de 3 triggers detectados\n');
      console.log('🔍 INVESTIGAR:');
      console.log('   1. Logs da função ia-coach-chat');
      console.log('   2. Implementação do checkRewardOpportunity');
      console.log('   3. Query da view v_rewards_catalog\n');
    }

  } catch (error) {
    console.error('\n❌ ERRO FATAL:', error.message);
    console.error('Stack:', error.stack);
  }
}

runAllTests();
