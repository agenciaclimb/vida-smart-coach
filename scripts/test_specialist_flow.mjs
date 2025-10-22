import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente faltando:');
  console.error('SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const userId = '45ba22ad-4ba2-46a3-b827-ebe682a00e72'; // Jeferson
const phone = '5516981459950';

async function testSpecialistFlow() {
  console.log('🧪 Testando fluxo SDR → Specialist → Seller\n');

  // Simular histórico de conversa
  const testMessages = [
    { role: 'user', content: 'Oi, quero melhorar minha saúde' },
    { role: 'assistant', content: 'Oi Jeferson! Como está sua rotina de saúde hoje?' },
    { role: 'user', content: 'Está difícil, não consigo manter consistência' },
    { role: 'assistant', content: 'Qual é o maior desafio com sua rotina?' },
    { role: 'user', content: 'Falta de tempo e motivação' },
    { role: 'assistant', content: 'Como isso tem afetado seu dia a dia?' },
    { role: 'user', content: 'Me sinto cansado e sem energia' },
    { role: 'assistant', content: 'Quer conhecer uma solução personalizada para isso?' },
    { role: 'user', content: 'Sim, quero' }, // Deve avançar para Specialist
  ];

  // 1. Avançar para Specialist
  console.log('1️⃣ Avançando para SPECIALIST...');
  await supabase.from('client_stages').insert({
    user_id: userId,
    current_stage: 'specialist',
    stage_metadata: { transitioned_from_sdr: true }
  });

  // 2. Testar Specialist com poucas perguntas
  console.log('2️⃣ Testando SPECIALIST (deve fazer 3-4 perguntas)...\n');
  
  const specialistMessages = [
    'Como está sua área física?',
    'Me sinto sedentário',
    'E sua alimentação?',
    'Preciso melhorar muito',
    'Como está seu emocional?',
    'Um pouco estressado',
    'Quero ajuda com isso', // Deve avançar para Seller
  ];

  const chatHistory = [];
  
  for (let i = 0; i < specialistMessages.length; i++) {
    const isUser = i % 2 === 0;
    const message = specialistMessages[i];
    
    if (isUser) {
      console.log(`👤 Usuário: "${message}"`);
      chatHistory.push({ role: 'user', content: message });
      
      // Chamar IA Coach
      const response = await fetch(`${supabaseUrl}/functions/v1/ia-coach-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'X-Internal-Secret': process.env.INTERNAL_FUNCTION_SECRET || ''
        },
        body: JSON.stringify({
          messageContent: message,
          userProfile: { 
            id: userId, 
            full_name: 'Jeferson Costa' 
          },
          chatHistory: chatHistory.slice()
        })
      });

      const data = await response.json();
      console.log(`🤖 IA (${data.stage}): "${data.reply}"`);
      console.log(`   Status: ${data.stage === 'seller' ? '✅ AVANÇOU PARA SELLER!' : '⏳ Ainda no Specialist'}\n`);
      
      chatHistory.push({ role: 'assistant', content: data.reply });

      if (data.stage === 'seller') {
        console.log('✅ TESTE PASSOU! Specialist avançou corretamente para Seller após 3 perguntas.');
        break;
      }
    }
  }

  // Verificar estágio final
  const { data: finalStage } = await supabase
    .from('client_stages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  console.log('\n📊 Estágio final:', finalStage?.current_stage);
}

testSpecialistFlow().catch(console.error);
