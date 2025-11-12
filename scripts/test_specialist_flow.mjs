import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local', override: false });
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Variaveis de ambiente faltando:');
  console.error('SUPABASE_URL:', supabaseUrl ? 'ok' : 'ausente');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'ok' : 'ausente');
  process.exit(1);
}

const defaultUserId = '45ba22ad-c44d-4825-a6e9-1658becdb7b4';
const defaultPhone = '5516981459950';
const userId = process.env.TEST_SPECIALIST_USER_ID || defaultUserId;
const phone = process.env.TEST_SPECIALIST_PHONE || defaultPhone;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

if (process.env.TEST_ENABLE_STAGE_HEURISTICS_V2) {
  console.warn('[Aviso] TEST_ENABLE_STAGE_HEURISTICS_V2 foi descontinuado; as heuristicas V2 estao ativadas por padrao.');
}

const debugStageResponse = process.env.TEST_DEBUG_STAGE_METRICS === '1';

async function setStage(targetUserId, newStage, metadata = {}) {
  const stageMetadata = {
    ...metadata,
    transitioned_at: new Date().toISOString()
  };

  const { data: profileData, error: profileSelectError } = await supabase
    .from('user_profiles')
    .select('id, full_name, role, phone')
    .eq('id', targetUserId)
    .maybeSingle();

  if (profileSelectError) {
    throw new Error(`Falha ao buscar user_profiles: ${profileSelectError.message}`);
  }

  if (!profileData) {
    throw new Error('Perfil nao encontrado. Configure TEST_SPECIALIST_USER_ID com um usuario valido existente.');
  }

  const { error: profileError } = await supabase
    .from('user_profiles')
    .update({ ia_stage: newStage, stage_metadata: stageMetadata })
    .eq('id', targetUserId);

  if (profileError) {
    throw new Error(`Falha ao atualizar user_profiles: ${profileError.message}`);
  }

  const { error: stageError } = await supabase
    .from('client_stages')
    .insert({
      user_id: targetUserId,
      current_stage: newStage,
      stage_metadata: stageMetadata
    });

  if (stageError && stageError.code !== '23505') {
    console.warn('Aviso: nao foi possivel registrar client_stages:', stageError.message);
  }
}

async function testSpecialistFlow() {
  console.log('[0] Teste SDR -> Specialist -> Seller');
  console.log('Usuario alvo:', userId);

  console.log('[1] Configurando stage specialist via update logic...');
  await setStage(userId, 'specialist', {
    transitioned_from: 'sdr',
    reason: 'automated_validation',
    phone
  });

  console.log('[2] Rodando perguntas do specialist...');

  const userPrompts = [
    'Como está sua área física? Tenho treinado pouco.',
    'Como posso ajustar minha alimentação para perder peso?',
    'Quero entender como melhorar meu emocional no dia a dia.',
    'E minha parte espiritual, o que você sugere?',
    'Quero ajustar meu plano agora para refletir tudo isso.',
    'Sim, pode gerar o plano atualizado com esses ajustes.'
  ];

  const chatHistory = [];

  for (const prompt of userPrompts) {
    console.log(`Usuario: "${prompt}"`);
    chatHistory.push({ role: 'user', content: prompt });

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'X-Internal-Secret': process.env.INTERNAL_FUNCTION_SECRET || ''
    };

    const endpoint = new URL(`${supabaseUrl}/functions/v1/ia-coach-chat`);
    if (debugStageResponse) {
      endpoint.searchParams.set('debugStage', '1');
    }

    const response = await fetch(endpoint.toString(), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        messageContent: prompt,
        userProfile: {
          id: userId,
          full_name: 'Teste Specialist'
        },
        chatHistory: chatHistory.slice()
      })
    });

    const data = await response.json();
    console.log(`IA (${data.stage}): "${data.reply}"`);
    console.log(`   Status: ${data.stage === 'seller' ? 'avancou para seller' : 'permanece no specialist'}`);

    chatHistory.push({ role: 'assistant', content: data.reply });

    if (data.stage === 'seller') {
      console.log('Teste passou: Specialist avancou para Seller.');
      break;
    }
  }

  const { data: finalStage } = await supabase
    .from('client_stages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  console.log('\nStage (client_stages):', finalStage?.current_stage);

  const { data: profileStage } = await supabase
    .from('user_profiles')
    .select('ia_stage')
    .eq('id', userId)
    .maybeSingle();

  console.log('Stage (user_profiles):', profileStage?.ia_stage);
}

testSpecialistFlow()
  .then(() => {
    console.log('\nTeste finalizado com sucesso.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Erro durante o teste:', err.message);
    process.exit(1);
  });
