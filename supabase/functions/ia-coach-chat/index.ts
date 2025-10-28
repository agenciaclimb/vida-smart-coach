import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { cors } from "../_shared/cors.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.3';

type StageRuntimeConfig = {
  enableStageHeuristics: boolean;
  debugStageMetrics: boolean;
};

function getEnvFlag(name: string, defaultValue: boolean): boolean {
  const raw = (Deno.env.get(name) || '').trim().toLowerCase();
  if (['1', 'true', 'on', 'yes'].includes(raw)) return true;
  if (['0', 'false', 'off', 'no'].includes(raw)) return false;
  return defaultValue;
}

function resolveStageRuntimeConfig(): StageRuntimeConfig {
  return {
    enableStageHeuristics: getEnvFlag('ENABLE_STAGE_HEURISTICS_V2', true),
    debugStageMetrics: getEnvFlag('DEBUG_STAGE_METRICS', false),
  };
}

const DEFAULT_STAGE_RUNTIME_CONFIG: StageRuntimeConfig = {
  enableStageHeuristics: true,
  debugStageMetrics: false,
};

// ============================================
// 🧠 IA COACH VIDA SMART - SISTEMA ESTRATÉGICO
// 4 Estágios: SDR → Especialista → Vendedor → Parceiro
// ============================================

serve(async (req) => {
  const headers = cors(req.headers.get('origin'));
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers });
  }

  try {
    const url = new URL(req.url);
    const debugStage = url.searchParams.get('debugStage') === '1' || (req.headers.get('x-debug-stage') === '1');
    
    // 🔐 Validação de chamada: aceita chamadas internas (webhook) com secret OU chamadas autenticadas do frontend
    const configuredSecret = Deno.env.get('INTERNAL_FUNCTION_SECRET') || '';
    const callerSecret = req.headers.get('x-internal-secret') || '';
    const authHeader = req.headers.get('authorization') || '';
    
    // Se há secret configurado e a chamada NÃO tem secret válido, verifica se tem auth token
    if (configuredSecret && callerSecret !== configuredSecret) {
      // Permite se vier com Authorization header (chamadas do frontend autenticado)
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.warn('Unauthorized call to ia-coach-chat: missing auth or secret');
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...headers, 'Content-Type': 'application/json' }
        });
      }
    }

    const { messageContent, userProfile, chatHistory } = await req.json();
    
    if (!messageContent || !userProfile) {
      throw new Error('Mensagem e perfil do usuário são obrigatórios');
    }

    // Inicializar Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      throw new Error('OpenAI API key não configurada');
    }

  // 🎯 Determinar estágio do cliente (inclui fallback para client_stages)
  const clientStage = await getCurrentStage(userProfile.id, supabase);

    // 📚 Carregar contexto operacional do cliente
    const contextData = await fetchUserContext(userProfile.id, supabase);
    
    const stageConfig = resolveStageRuntimeConfig();

    // 🎁 Verificar oportunidade de oferecer recompensas
    const rewardOffer = await checkRewardOpportunity(
      userProfile.id,
      messageContent,
      contextData,
      supabase
    );

    // 🚨 PRIORIDADE ABSOLUTA: Se há feedback pendente, força estágio Specialist
    const hasPendingFeedback = contextData?.pendingFeedback && contextData.pendingFeedback.length > 0;
    
    // 🧠 Detectar estágio automaticamente baseado em sinais da conversa
    const detectedStage = hasPendingFeedback ? 'specialist' : detectStageFromSignals(
      messageContent,
      chatHistory,
      userProfile,
      clientStage,
      stageConfig
    );
    const activeStage = detectedStage || clientStage.current_stage;
    let contextPrompt = buildContextPrompt(userProfile, contextData, activeStage) || undefined;

    // 🎁 Adicionar prompt de recompensa se aplicável
    if (rewardOffer.shouldOffer) {
      const firstName = extractFirstName(userProfile?.full_name || userProfile?.name);
      const rewardPrompt = buildRewardOfferPrompt(rewardOffer, firstName);
      contextPrompt = contextPrompt 
        ? `${contextPrompt}\n\n${rewardPrompt}`
        : rewardPrompt;
    }

    // 🧠 Processar mensagem com base no estágio detectado
    const response = await processMessageByStage(
      messageContent,
      userProfile,
      { ...clientStage, current_stage: activeStage },
      supabase,
      openaiKey,
      chatHistory,
      contextPrompt,
      contextData,
      stageConfig
    );

    const automation = await handleAutomations(response.text, {
      userId: userProfile.id,
      stage: activeStage,
      supabase,
      userProfile,
      contextData,
      originalMessage: messageContent
    });

    const metadataWithAutomation = {
      ...(response.metadata || {}),
      automations: automation.executions
    };

    const finalReply = automation.text || response.text;

    await saveInteraction(userProfile.id, activeStage, messageContent, finalReply, metadataWithAutomation, supabase);

    if (response.shouldUpdateStage && response.newStage) {
      await updateClientStage(userProfile.id, response.newStage, supabase);
    }

    return new Response(JSON.stringify({
      reply: finalReply,
      stage: activeStage,
      ...(debugStage ? { debugStage: { detectedStage, persistedStage: clientStage.current_stage } } : {}),
      timestamp: new Date().toISOString(),
      model: "gpt-4o-mini"
    }), {
      headers: { ...headers, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('IA Coach Error:', error);
    return new Response(JSON.stringify({
      error: 'Erro interno do sistema',
      details: error?.message || String(error)
    }), {
      status: 500,
      headers: { ...headers, 'Content-Type': 'application/json' }
    });
  }
});

// ============================================
// 🎯 DETECÇÃO AUTOMÁTICA DE ESTÁGIO
// ============================================

function detectStageFromSignals(
  message: string,
  chatHistory: any[],
  userProfile: any,
  currentStage: any,
  config: StageRuntimeConfig = DEFAULT_STAGE_RUNTIME_CONFIG,
): string | null {
  const msgLower = message.toLowerCase();

  // 🔍 SINAIS PARA CADA ESTÁGIO

  // PARTNER: Cliente já ativo, fazendo check-ins ou acompanhamento
  const partnerSignals = [
    msgLower.includes('check-in'),
    msgLower.includes('como foi'),
    msgLower.includes('consegui'),
    msgLower.includes('fiz o treino'),
    msgLower.includes('bebi água'),
    msgLower.includes('segui o plano'),
    msgLower.includes('como estou'),
    chatHistory && chatHistory.length >= 5
  ];

  // SELLER: Cliente mostra interesse direto, quer testar ou comprar
  const sellerSignals = [
    msgLower.includes('quero testar'),
    msgLower.includes('teste grátis'),
    msgLower.includes('como funciona'),
    msgLower.includes('quanto custa'),
    msgLower.includes('preço'),
    msgLower.includes('assinar'),
    msgLower.includes('começar'),
    msgLower.includes('cadastro'),
    msgLower.includes('quero começar'),
  ];

  // SPECIALIST: Cliente expressou dor/problema específico e quer solução
  const specialistSignals = [
    msgLower.includes('preciso de ajuda'),
    msgLower.includes('estou com dificuldade'),
    msgLower.includes('não consigo'),
    msgLower.includes('problema com'),
    msgLower.includes('tenho lutado'),
    msgLower.includes('ansiedade'),
    msgLower.includes('depressão'),
    msgLower.includes('peso'),
    msgLower.includes('alimentação'),
    msgLower.includes('físico'),
    msgLower.includes('emocional'),
    extractPainLevel(message) >= 7,
  ];

  // SDR: Cliente inicial, ainda explorando ou fazendo perguntas genéricas
  const sdrSignals = [
    msgLower.includes('oi'),
    msgLower.includes('olá'),
    msgLower.includes('bom dia'),
    msgLower.includes('boa tarde'),
    msgLower.includes('boa noite'),
    msgLower.includes('o que é'),
    msgLower.includes('me fale sobre'),
    message.length < 50 && !msgLower.includes('não'),
  ];

  const partnerCount = partnerSignals.filter(Boolean).length;
  const sellerCount = sellerSignals.filter(Boolean).length;
  const specialistCount = specialistSignals.filter(Boolean).length;
  const sdrCount = sdrSignals.filter(Boolean).length;

  const interestKeywords = /(quero|preciso|ajuda|ajudar|melhorar|arrumar|corrigir)/.test(msgLower);
  const planKeywords = /(plano|treino|dieta|rotina|cardapio)/.test(msgLower);
  const planAdjustmentIntent = (/\b(ajustar|ajuste|mudar|alterar|regenerar|refazer|recriar)\b/.test(msgLower) && planKeywords) || /\bnovo\s+plano\b/.test(msgLower);

  if (config.debugStageMetrics) {
    const preview = message.replace(/\s+/g, ' ').slice(0, 120);
    console.log(JSON.stringify({
      stage_metrics: {
        preview,
        counts: { partner: partnerCount, seller: sellerCount, specialist: specialistCount, sdr: sdrCount },
        planAdjustmentIntent,
        interestKeywords,
        planKeywords,
        enableStageHeuristicsV2: config.enableStageHeuristics,
      },
    }));
  }

  if (partnerCount >= 2) return 'partner';
  if (sellerCount >= 2) return 'seller';
  if (specialistCount >= 2) return 'specialist';

  if (config.enableStageHeuristics) {
    if (planAdjustmentIntent) {
      return 'specialist';
    }

    if (specialistCount >= 1 && interestKeywords && planKeywords) {
      return 'specialist';
    }
  }

  if (sdrCount >= 2) return 'sdr';

  return null;
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

async function getCurrentStage(userId: string, supabase: any) {
  try {
    // 1) Preferir estágio persistido em user_profiles (novo modelo)
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('ia_stage, stage_metadata')
      .eq('id', userId)
      .maybeSingle();

    if (profile?.ia_stage) {
      return { current_stage: profile.ia_stage, stage_metadata: profile.stage_metadata || {} };
    }

    // 2) Fallback para client_stages (histórico legado)
    const { data } = await supabase
      .from('client_stages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!data) {
      // Criar estágio inicial SDR
      const newStage = {
        user_id: userId,
        current_stage: 'sdr',
        stage_metadata: { first_interaction: true }
      };
      
      // Criar valor inicial em user_profiles para padronizar
      await supabase.from('user_profiles').update({ ia_stage: 'sdr', stage_metadata: newStage.stage_metadata }).eq('id', userId);
      await supabase.from('client_stages').insert(newStage);
      return { current_stage: 'sdr' };
    }

    return data;
  } catch (error) {
    console.log('Erro ao buscar estágio, usando SDR como padrão:', error);
    return { current_stage: 'sdr' };
  }
}

async function processMessageByStage(
  message: string,
  profile: any,
  stage: any,
  supabase: any,
  openaiKey: string,
  chatHistory?: any[],
  contextPrompt?: string,
  contextData?: UserContextData,
  config: StageRuntimeConfig = DEFAULT_STAGE_RUNTIME_CONFIG,
) {
  switch (stage.current_stage) {
    case 'sdr':
      return await processSDRStage(message, profile, openaiKey, chatHistory, contextPrompt, contextData, config);
    case 'specialist':
      return await processSpecialistStage(message, profile, openaiKey, chatHistory, contextPrompt, contextData, config);
    case 'seller':
      return await processSellerStage(message, profile, openaiKey, chatHistory, contextPrompt, contextData, config);
    case 'partner':
      return await processPartnerStage(message, profile, openaiKey, chatHistory, contextPrompt, contextData, config);
    default:
      return await processSDRStage(message, profile, openaiKey, chatHistory, contextPrompt, contextData, config);
  }
}

// ============================================
// 🎯 ESTÁGIO 1: SDR
// ============================================

async function processSDRStage(
  message: string,
  profile: any,
  openaiKey: string,
  chatHistory?: any[],
  contextPrompt?: string,
  contextData?: UserContextData,
  config: StageRuntimeConfig = DEFAULT_STAGE_RUNTIME_CONFIG,
) {
  // Contar quantas perguntas já foram feitas
  const assistantMessages = chatHistory?.filter(m => m.role === 'assistant') || [];
  const questionCount = assistantMessages.length;
  const lastAssistantMsg = assistantMessages.slice(-1)[0]?.content || '';
  
  const systemPrompt = `Você é a Vida, a IA SDR do Vida Smart Coach. Usa metodologia SPIN Selling de forma conversacional e gradual.

NOME DO LEAD: ${profile.full_name || 'Lead'}

MISSÃO: Acolher o cliente com empatia, criar rapport genuíno, entender sua realidade ANTES de oferecer qualquer solução.

ESTRUTURA SPIN (seguir NESTA ORDEM):
${questionCount === 0 ? `
1️⃣ SITUAÇÃO: Descobrir contexto atual
  → "Oi ${profile.full_name || ''}, tudo bem? Eu sou a Vida 🙋🏽‍♀️, sua coach por aqui. Como você tem se sentido ultimamente em relação à sua saúde?"
  → Adapte ao linguajar do cliente (formal/informal)
  → Seja acolhedora e genuína
` : questionCount === 1 ? `
2️⃣ PROBLEMA: Identificar dor específica
   → Foque na resposta anterior e pergunte sobre UM desafio específico
   → "E como está sendo isso no dia a dia? Tem algo que te incomoda mais?"
   → NÃO faça lista de perguntas, apenas UMA
   → Demonstre interesse genuíno
` : questionCount === 2 ? `
3️⃣ IMPLICAÇÃO: Amplificar consequências
   → "E isso tem afetado outras áreas da sua vida também?"
   → Foque no impacto emocional/prático
   → Seja empática
` : questionCount === 3 ? `
🔄 EXPLORAÇÃO: Continue aprofundando
   → Faça mais 1-2 perguntas para entender melhor o contexto
   → "Me conta mais sobre isso" / "Há quanto tempo você sente isso?"
   → Construa rapport ANTES de oferecer solução
` : `
4️⃣ NECESSIDADE: Apresentar diagnóstico (NÃO venda ainda)
  → "Olha, eu poderia te ajudar a entender melhor o que está acontecendo com um diagnóstico personalizado. Topa?"
  → Se aceitar claramente → Avançar para ESPECIALISTA (apenas para diagnosticar)
  → NÃO mencione "teste grátis" ou "7 dias" ainda
`}

REGRAS CRÍTICAS ANTI-LOOP:
1. LEIA todo o histórico antes de responder
2. Se o usuário RESPONDEU sua última pergunta, RECONHEÇA a resposta primeiro
3. NUNCA repita perguntas já feitas
4. UMA pergunta curta (máx 15-20 palavras)
5. Progredir LINEARMENTE: Situação → Problema → Implicação → Necessidade
6. Tom informal WhatsApp (sem excessos)
7. Se a sua ÚLTIMA mensagem foi "${lastAssistantMsg}" NÃO repita. Mude o foco.

❌ NÃO FAÇA:
- Listas de perguntas múltiplas
- Repetir perguntas do histórico
- Mencionar "teste grátis", "7 dias", "4 pilares" ou links prematuramente
- Vender planos (isso é trabalho da VENDEDORA)
- Ignorar respostas do cliente
- Ser direta demais ou comercial no início

✅ FAÇA:
- Uma pergunta focada por vez
- Reconheça a resposta do cliente com empatia
- Adapte ao tom dele (formal/informal)
- Construa conexão genuína antes de avançar
- Seja conversacional, não robótica
- Aprofunde em 4-5 mensagens ANTES de oferecer diagnóstico

Responda com a próxima pergunta do SPIN.`;

  // Construir mensagens com histórico se disponível
  const messages = [{ role: 'system', content: systemPrompt }];
  
  if (contextPrompt) {
    messages.push({ role: 'system', content: contextPrompt });
  }
  
  // Adicionar histórico de conversa (últimas 5 mensagens para contexto leve)
  if (chatHistory && chatHistory.length > 0) {
    messages.push(...chatHistory.slice(-5));
  }
  
  // Adicionar mensagem atual
  messages.push({ role: 'user', content: message });

  const aiResponse = await callOpenAI(messages, openaiKey);

  // Analisar se deve avançar
  const shouldAdvance = analyzeAdvancementSDR(message, config);

  const metadata = buildInteractionMetadata('sdr', message, aiResponse, contextData, {
    shouldAdvance,
    keywords: {
      timeline: message.toLowerCase().includes('dias') || message.toLowerCase().includes('meses') || message.toLowerCase().includes('seman'),
      interest: message.toLowerCase().includes('quero') || message.toLowerCase().includes('ajuda')
    }
  });

  return {
    text: aiResponse,
    shouldUpdateStage: shouldAdvance,
    newStage: shouldAdvance ? 'specialist' : null,
    metadata
  };
}

// ============================================
// 🎓 ESTÁGIO 2: ESPECIALISTA
// ============================================

async function processSpecialistStage(
  message: string,
  profile: any,
  openaiKey: string,
  chatHistory?: any[],
  contextPrompt?: string,
  contextData?: UserContextData,
  config: StageRuntimeConfig = DEFAULT_STAGE_RUNTIME_CONFIG,
) {
  // Extrair última mensagem do assistente para evitar repetição
  const lastAssistantMsg = chatHistory?.filter(m => m.role === 'assistant').slice(-1)[0]?.content || '';
  
  // Contar quantas perguntas já foram feitas pela IA
  const assistantMessages = chatHistory?.filter(m => m.role === 'assistant') || [];
  const questionsAsked = assistantMessages.length;
  
  // Detectar quais áreas já foram perguntadas
  const fullHistory = chatHistory?.map(m => m.content).join(' ').toLowerCase() || '';
  const askedPhysical = /\b(treino|exercício|físic|ativi|movimento)\b/.test(fullHistory);
  const askedFood = /\b(aliment|comida|dieta|nutri|refeição)\b/.test(fullHistory);
  const askedEmotional = /\b(emocional|ansiedade|estresse|humor|sentindo)\b/.test(fullHistory);
  const askedSpiritual = /\b(espiritual|propósito|meditação|gratidão)\b/.test(fullHistory);
  
  // Verificar se há feedback pendente
  const hasFeedback = contextData?.pendingFeedback && contextData.pendingFeedback.length > 0;
  // const feedbackInfo = hasFeedback 
  //   ? contextData.pendingFeedback.map(f => `${f.plan_type}: "${f.feedback_text}"`).join(' | ')
  //   : '';
  
  const systemPrompt = `Você é a Vida, ESPECIALISTA do Vida Smart Coach.

PERSONALIDADE: Empática, focada, técnica e solucionadora

NOME: ${profile.full_name || 'querido(a)'}

${hasFeedback ? `
AUTOMAÇÕES PARA AJUSTE DE PLANO (feedback pendente):
1. Agradeça e cite o feedback recebido (ex: "Entendi que você quer ajustar o plano nutricional...").
2. Faça no máximo 2 perguntas objetivas para confirmar preferências, restrições ou horários.
3. Quando o cliente confirmar o que deseja, responda dizendo que vai ajustar agora e finalize a mensagem com:
   [[ACTION:REGENERATE_PLAN{"plan_type":"nutritional","overrides":{"goal":"...", "preferences":"...", "restrictions":"...", "schedule":"..."}, "summary":"Resumo curto do pedido"}]]
   - Use somente os campos relevantes. Use aspas duplas válidas no JSON.
   - Se envolver múltiplas áreas, use "plan_type":"all" ou uma lista ["physical","nutritional"].
4. Informe que o plano foi regenerado automaticamente e peça para conferir na aba "Meu Plano".

` : `
MISSÃO: Criar plano 100% personalizado fazendo diagnóstico técnico detalhado
? NÃO mencionar cadastro (trabalho do SDR)
? NÃO mencionar teste grátis (trabalho da VENDEDORA)
? FOCAR em diagnóstico técnico e construção de plano

AUTOMAÇÕES DISPONÍVEIS:
- Depois de coletar informações suficientes e o cliente pedir para ajustar/regenerar, finalize a resposta com:
  [[ACTION:REGENERATE_PLAN{"plan_type":"physical","overrides":{"goal":"ganho de massa","experience":"intermediate","preferences":"cetogênica sem glúten","schedule":"Academia às 20h, 4x/semana"}, "summary":"Cliente quer foco em definição com cetogênica sem glúten."}]]
  * Adapte "plan_type" e "overrides" aos dados fornecidos (goal, experience, restrictions, preferences, schedule, custom_notes).
- Se o cliente pedir para registrar um check-in durante a conversa, responda e acrescente:
  [[ACTION:REGISTER_CHECKIN{"period":"manual","note":"Check-in relatado pelo cliente: ..."}]]
- Sempre coloque a tag ACTION no final da resposta e sem texto extra dentro da tag.
`}

ÁREAS PARA DIAGNÓSTICO (perguntar UMA por vez):
${!askedPhysical ? '🏋️‍♂️ FÍSICA (próxima)' : '✅ FÍSICA (já diagnosticada)'}
${!askedFood ? '🥗 ALIMENTAR (próxima)' : '✅ ALIMENTAR (já diagnosticada)'}  
${!askedEmotional ? '🧠 EMOCIONAL (próxima)' : '✅ EMOCIONAL (já diagnosticada)'}
${!askedSpiritual ? '✨ ESPIRITUAL (próxima)' : '✅ ESPIRITUAL (já diagnosticada)'}

${lastAssistantMsg ? `
🚫 SUA ÚLTIMA MENSAGEM FOI: "${lastAssistantMsg}"
NUNCA REPITA! Já perguntou isso. RECONHEÇA a resposta e MUDE DE ÁREA.
` : ''}

REGRAS CRÍTICAS ANTI-LOOP:
1. LEIA todo o histórico antes de responder
2. Se o usuário RESPONDEU (sim/não/qualquer coisa), RECONHEÇA e MUDE DE ÁREA
3. Progrida entre áreas: Física → Alimentar → Emocional → Espiritual
4. NUNCA volte em área já diagnosticada
5. Uma pergunta CURTA e ESPECÍFICA (máximo 20 palavras)
6. Se já perguntou 3-4 áreas, está na hora de GERAR PLANO e avançar

❌ NÃO FAÇA:
- Listas de perguntas múltiplas
- Repetir áreas já diagnosticadas
- Mencionar cadastro ou teste grátis
- Ignorar respostas do cliente

✅ FAÇA:
- Uma pergunta técnica por vez
- Reconheça a resposta do cliente
- Mude de área após cada resposta
- Seja específica e motivadora

UMA PERGUNTA POR VEZ!`;

  // Construir mensagens com histórico se disponível
  const messages = [{ role: 'system', content: systemPrompt }];
  
  // Adicionar histórico COMPLETO para IA entender contexto
  if (chatHistory && chatHistory.length > 0) {
    messages.push(...chatHistory);
  }
  
  // Adicionar mensagem atual
  messages.push({ role: 'user', content: message });

  const aiResponse = await callOpenAI(messages, openaiKey);

  // Avançar para Seller após 3-4 perguntas OU se o usuário demonstrar interesse direto
  const wantsToAdvance = /\b(quero\s+testar|quero\s+assinar|aceito|sim|vamos|pode ser|topo)\b/i.test(message);
  const askedCount = [askedPhysical, askedFood, askedEmotional, askedSpiritual].filter(Boolean).length;
  // Só avança após diagnosticar pelo menos 3 áreas, ou se o cliente pedir para testar/assinar
  const shouldAdvance = askedCount >= 3 || wantsToAdvance;

  if (config.debugStageMetrics) {
    console.log(JSON.stringify({
      stage_metrics: {
        specialist: {
          askedPhysical,
          askedFood,
          askedEmotional,
          askedSpiritual,
          askedCount,
          wantsToAdvance,
        },
      },
    }));
  }

  const metadata = buildInteractionMetadata('specialist', message, aiResponse, contextData, {
    shouldAdvance,
    questionsAsked,
    wantsToAdvance
  });

  return {
    text: aiResponse,
    shouldUpdateStage: shouldAdvance,
    newStage: shouldAdvance ? 'seller' : null,
    metadata
  };
}

// ============================================
// 💰 ESTÁGIO 3: VENDEDOR
// ============================================

async function processSellerStage(
  message: string,
  profile: any,
  openaiKey: string,
  chatHistory?: any[],
  contextPrompt?: string,
  contextData?: UserContextData,
  config: StageRuntimeConfig = DEFAULT_STAGE_RUNTIME_CONFIG,
) {
  const wantsLink = message.toLowerCase().includes('sim') || 
                    message.toLowerCase().includes('quero') || 
                    message.toLowerCase().includes('gostaria') ||
                    message.toLowerCase().includes('testar');
  
  const systemPrompt = `Você é uma VENDEDORA CONSULTIVA do Vida Smart Coach.

PERSONALIDADE: Direta, confiante, consultiva

MISSÃO CRÍTICA: CONVERTER para plano pago
❌ NÃO fazer perguntas de diagnóstico (trabalho do ESPECIALISTA)  
❌ NÃO perguntar sobre rotina/peso/saúde (já foi feito)
✅ FOCAR em OFERTA, benefícios e link de cadastro

NOME: ${profile.full_name || 'querido(a)'}

${wantsLink ? `
✅ CLIENTE ACEITOU! Envie o link AGORA:

"Perfeito! 🎉 Aqui está seu link de cadastro:

🔗 https://www.appvidasmart.com/login?tab=register

Clica e faz o cadastro rapidinho. Depois disso, seguimos juntos nas suas metas! Qualquer dúvida, tô aqui! 😊"
` : `
OFERTA: 🆓 Teste grátis 7 dias, acesso completo aos 4 pilares!

GATILHOS MENTAIS:
- **Autoridade**: "Baseado no que conversamos..."
- **Escassez**: "Restam poucas horas para aproveitar"
- **Reciprocidade**: "Você compartilhou muito comigo, quero te ajudar"

ESTRATÉGIA:
1. Ser DIRETA: "Quer testar grátis por 7 dias?"
2. Se aceitar → envie o link https://www.appvidasmart.com/login?tab=register IMEDIATAMENTE
3. Se hesitar → "O que te faz hesitar?" (máximo 1 vez)

REGRAS:
- Máximo 2-3 mensagens para fechar
- NÃO ficar enrolando com perguntas sobre saúde
- Se cliente aceitou, ENVIAR LINK na mesma mensagem
`}

❌ NÃO FAÇA:
- Perguntas sobre diagnóstico
- Enrolar para enviar o link
- Fazer listas de perguntas

✅ FAÇA:
- Seja direta e confiante
- Use informações já coletadas
- Envie link imediatamente se aceitar

Seja natural e breve.`;

  // Construir mensagens com histórico se disponível
  const messages = [{ role: 'system', content: systemPrompt }];
  
  if (contextPrompt) {
    messages.push({ role: 'system', content: contextPrompt });
  }
  
  // Adicionar histórico de conversa (últimas 4 mensagens para contexto)
  if (chatHistory && chatHistory.length > 0) {
    messages.push(...chatHistory.slice(-4));
  }
  
  // Adicionar mensagem atual
  messages.push({ role: 'user', content: message });

  const aiResponse = await callOpenAI(messages, openaiKey);

  const shouldAdvance = message.toLowerCase().includes('cadastro') || 
                       message.toLowerCase().includes('teste') ||
                       message.toLowerCase().includes('quero começar');

  const metadata = buildInteractionMetadata('seller', message, aiResponse, undefined, {
    shouldAdvance
  });

  return {
    text: aiResponse,
    shouldUpdateStage: shouldAdvance,
    newStage: shouldAdvance ? 'partner' : null,
    metadata
  };
}

// ============================================
// 🤝 ESTÁGIO 4: PARCEIRO
// ============================================

async function processPartnerStage(
  message: string,
  profile: any,
  openaiKey: string,
  chatHistory?: any[],
  contextPrompt?: string,
  contextData?: UserContextData,
  config: StageRuntimeConfig = DEFAULT_STAGE_RUNTIME_CONFIG,
) {
  const currentHour = new Date().getHours();
  const isCheckInTime = (currentHour >= 7 && currentHour <= 9) || (currentHour >= 20 && currentHour <= 22);
  
  const systemPrompt = `Você é uma PARCEIRA DE TRANSFORMAÇÃO do Vida Smart Coach.

PERSONALIDADE: Amiga próxima, motivadora, proativa mas natural

MISSÃO: Acompanhar diariamente com foco simples e sugerir ações específicas dos planos quando apropriado.

NOME: ${profile.full_name}

${isCheckInTime ? `
É HORÁRIO DE CHECK-IN! ${currentHour >= 20 ? 'NOTURNO 🌙' : 'MATINAL ☀️'}

${currentHour >= 20 ? 
  'Como foi seu dia? Conseguiu seguir o plano?' :
  'Bom dia! Como está se sentindo hoje?'
}
` : 'Conversa natural como amiga, uma pergunta por vez.'}

💡 SUGESTÕES PROATIVAS:
- Se o contexto mencionar "Sugestões proativas para agora", use-as naturalmente na conversa
- Exemplo: "Já que estamos no meio do dia, que tal fazer aquela prática de respiração do seu plano emocional?"
- NÃO force sugestões se não fizer sentido no contexto da conversa
- Seja sutil e motivadora, não robótica

REGRAS:
- Uma pergunta ou sugestão por vez
- Tom de amiga próxima, não de coach formal
- Se sugerir algo do plano, seja específica (nome do exercício/prática)`;

  // Construir mensagens com histórico se disponível
  const messages = [{ role: 'system', content: systemPrompt }];
  
  if (contextPrompt) {
    messages.push({ role: 'system', content: contextPrompt });
  }
  
  // Adicionar histórico de conversa (últimas 4 mensagens para contexto)
  if (chatHistory && chatHistory.length > 0) {
    messages.push(...chatHistory.slice(-4));
  }
  
  // Adicionar mensagem atual
  messages.push({ role: 'user', content: message });

  const aiResponse = await callOpenAI(messages, openaiKey);

  const metadata = buildInteractionMetadata('partner', message, aiResponse, undefined, {
    shouldAdvance: false
  });

  return {
    text: aiResponse,
    shouldUpdateStage: false,
    newStage: null,
    metadata
  };
}


// (função buildInteractionMetadata tipada é definida após fetchUserContext)

// ============================================
// FUNÇÕES DE SUPORTE
// ============================================

async function callOpenAI(messages: any[], openaiKey: string) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: 'POST',
    headers: { 
      Authorization: `Bearer ${openaiKey}`, 
      "Content-Type": "application/json" 
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      top_p: 0.9,
      frequency_penalty: 0.7,
      presence_penalty: 0.3,
      max_tokens: 800,
      messages: messages
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "Desculpe, tive um problema técnico. Pode tentar novamente?";
}

type AutomationAction = {
  type: string;
  payload: Record<string, any>;
};

type AutomationExecutionResult = {
  type: string;
  payload: Record<string, any>;
  success: boolean;
  message?: string;
  error?: string;
};

type AutomationContext = {
  userId: string;
  stage: string;
  supabase: any;
  userProfile: any;
  contextData?: UserContextData | null;
  originalMessage: string;
};

function extractAutomationActions(text: string): { cleanedText: string; actions: AutomationAction[] } {
  if (!text) return { cleanedText: text, actions: [] };

  const actionRegex = /\[\[ACTION:([A-Z_]+)\s*(\{[\s\S]*?\})?\s*\]\]/g;
  const actions: AutomationAction[] = [];
  let cleanedText = text;
  let match: RegExpExecArray | null;

  while ((match = actionRegex.exec(text)) !== null) {
    const [, actionType, rawPayload] = match;
    let payload: Record<string, any> = {};

    if (rawPayload) {
      try {
        payload = JSON.parse(rawPayload);
      } catch (error) {
        console.error('[Automation] Falha ao interpretar payload', rawPayload, error);
      }
    }

    actions.push({
      type: actionType.trim().toUpperCase(),
      payload,
    });

    cleanedText = cleanedText.replace(match[0], '').trim();
  }

  return { cleanedText, actions };
}

function detectHeuristicCheckin(context: AutomationContext): AutomationAction | null {
  const original = context.originalMessage || '';
  const message = original.toLowerCase();
  if (!message) return null;

  const hasCheckinWord = /(check[\s-]?in|checkin)/.test(message);
  const hasRegisterIntent = /(registr|anot|marc|lanc|fazer|faca|realizar|dar|marque|quero|preciso)/.test(message);
  const hasNegation = /(nao\s+(registr|fazer|marque|fa[cz])|não\s+(registr|fazer|marque|fa[cz]))/.test(message);

  if (!hasCheckinWord || !hasRegisterIntent || hasNegation) {
    return null;
  }

  let period: string = 'manual';
  if (/(manha|manhã|cedo|acordei|pela manha|pela manhã|ao acordar|morning)/.test(message)) {
    period = 'morning';
  } else if (/(noite|noturno|antes de dormir|fim do dia|night)/.test(message)) {
    period = 'night';
  }

  return {
    type: 'REGISTER_CHECKIN',
    payload: {
      period,
      note: original.trim(),
    },
  };
}

function detectHeuristicPlanRegeneration(context: AutomationContext): AutomationAction | null {
  const original = context.originalMessage || '';
  const message = original.toLowerCase();
  if (!message) return null;

  const hasPlanWord = /(plano|treino|dieta|rotina)/.test(message);
  const hasRegenerateIntent = /(regener|refaz|recria|ajustar|alterar|novo plano|gerar novo|atualizar plano|refazer)/.test(message);
  const hasNegation = /(nao\s+(quero|preciso|faça|fazer)|não\s+(quero|preciso|faça|fazer))/.test(message);

  if (!hasPlanWord || !hasRegenerateIntent || hasNegation) {
    return null;
  }

  const planTypes: string[] = [];
  if (/(físic|treino|academia|muscul)/.test(message)) planTypes.push('physical');
  if (/(nutri|dieta|refeição|aliment)/.test(message)) planTypes.push('nutritional');
  if (/(emoc|humor|ansiedade|terapia)/.test(message)) planTypes.push('emotional');
  if (/(espirit|propósito|medita|espiritual)/.test(message)) planTypes.push('spiritual');

  const payload: any = {
    plan_type: planTypes.length === 0 ? 'all' : planTypes,
    summary: original.trim(),
    overrides: {
      custom_notes: original.trim(),
    },
  };

  return {
    type: 'REGENERATE_PLAN',
    payload,
  };
}

async function handleAutomations(aiResponse: string, context: AutomationContext): Promise<{ text: string; executions: AutomationExecutionResult[] }> {
  const { cleanedText, actions } = extractAutomationActions(aiResponse);
  const actionQueue: AutomationAction[] = [...actions];

  if (actionQueue.length === 0) {
    const heuristicCheckin = detectHeuristicCheckin(context);
    if (heuristicCheckin) {
      actionQueue.push(heuristicCheckin);
    }
  }

  if (actionQueue.length === 0) {
    const heuristicRegenerate = detectHeuristicPlanRegeneration(context);
    if (heuristicRegenerate) {
      actionQueue.push(heuristicRegenerate);
    }
  }

  if (actionQueue.length === 0) {
    return { text: cleanedText.trim(), executions: [] };
  }

  const executions: AutomationExecutionResult[] = [];
  const messages: string[] = [];

  for (const action of actionQueue) {
    try {
      const result = await executeAutomationAction(action, context);
      executions.push(result);
      if (result.message) {
        messages.push(result.message);
      }
    } catch (err) {
      const error = err as { message?: string };
      const errMessage = error?.message || String(err);
      console.error('[Automation] Erro ao executar ação', action.type, errMessage);
      executions.push({
        type: action.type,
        payload: action.payload,
        success: false,
        error: errMessage,
      });
      messages.push('Não consegui concluir "' + action.type + '". Vou encaminhar para nossa equipe revisar.');
    }
  }

  const finalText = messages.length > 0
    ? messages.join('\n\n')
    : cleanedText.trim();

  return { text: finalText.trim(), executions };
}

async function executeAutomationAction(action: AutomationAction, context: AutomationContext): Promise<AutomationExecutionResult> {
  switch (action.type) {
    case 'REGISTER_CHECKIN':
      return await runRegisterCheckinAction(action, context);
    case 'REGENERATE_PLAN':
      return await runRegeneratePlanAction(action, context);
    default:
      console.warn('[Automation] Ação desconhecida recebida:', action.type);
      return {
        type: action.type,
        payload: action.payload,
        success: false,
        error: `Ação desconhecida: ${action.type}`,
      };
  }
}

async function runRegisterCheckinAction(action: AutomationAction, context: AutomationContext): Promise<AutomationExecutionResult> {
  const period = (action.payload?.period || 'manual').toString().toLowerCase();
  const note = (action.payload?.note || '').toString().trim();
  const mood = action.payload?.mood ? String(action.payload.mood) : undefined;

  const interactionTypeMap: Record<string, { type: string; label: string; points: number }> = {
    morning: { type: 'morning_checkin', label: 'Check-in da manhã', points: 20 },
    night: { type: 'night_checkin', label: 'Check-in da noite', points: 20 },
  };
  const defaultConfig = { type: 'manual_checkin', label: 'Check-in manual', points: 20 };
  const config = interactionTypeMap[period] || defaultConfig;

  const today = new Date();
  const dateKey = today.toISOString().split('T')[0];
  const activityKey = `ia-checkin-${config.type}`;

  // Evitar duplicidade de check-ins diários
  try {
    const { data: existing } = await context.supabase
      .from('daily_activities')
      .select('id')
      .eq('user_id', context.userId)
      .eq('activity_date', dateKey)
      .eq('activity_key', activityKey)
      .maybeSingle();

    if (existing) {
      return {
        type: action.type,
        payload: action.payload,
        success: true,
        message: `ℹ️ ${config.label} já estava registrado hoje. Mantive como concluído.`,
      };
    }
  } catch (error) {
    console.error('[Automation] Falha ao verificar check-in existente', error);
  }

  // Registrar interação
  try {
    await context.supabase.from('interactions').insert({
      user_id: context.userId,
      interaction_type: config.type,
      stage: context.stage || 'partner',
      content: note || context.originalMessage,
      ai_response: 'Check-in registrado automaticamente pela IA Coach.',
      metadata: {
        source: 'ia-coach-chat',
        channel: 'whatsapp',
        period,
        mood: mood || null,
        received_at: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return {
      type: action.type,
      payload: action.payload,
      success: false,
      error: `Falha ao registrar interação de check-in: ${error?.message || error}`,
    };
  }

  // Registrar atividade diária com pontuação
  try {
    await context.supabase.from('daily_activities').insert({
      user_id: context.userId,
      activity_date: dateKey,
      activity_type: 'emotional',
      activity_name: config.label,
      points_earned: config.points,
      is_bonus: false,
      activity_key: activityKey,
      description: 'Check-in registrado automaticamente via IA Coach',
      metadata: {
        source: 'ia-coach-chat',
        period,
        mood: mood || null,
        note: note || null,
      },
    });
  } catch (error: any) {
    // Se ocorrer erro de duplicidade, tratar como sucesso informativo
    if (error?.code === '23505') {
      return {
        type: action.type,
        payload: action.payload,
        success: true,
        message: `ℹ️ ${config.label} já estava registrado e validado para hoje.`,
      };
    }

    console.error('[Automation] Falha ao inserir daily activity', error);
    return {
      type: action.type,
      payload: action.payload,
      success: false,
      error: `Erro ao registrar pontos do check-in: ${error?.message || error}`,
    };
  }

  return {
    type: action.type,
    payload: action.payload,
    success: true,
    message: `✅ ${config.label} registrado! +${config.points} XP garantidos.`,
  };
}

async function runRegeneratePlanAction(action: AutomationAction, context: AutomationContext): Promise<AutomationExecutionResult> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceKey) {
    return {
      type: action.type,
      payload: action.payload,
      success: false,
      error: 'Configuração Supabase incompleta para regenerar planos (URL ou chave ausente).',
    };
  }

  const rawPlanType = action.payload?.plan_type;
  let planTypes: string[];

  if (Array.isArray(rawPlanType)) {
    planTypes = rawPlanType.map((p: any) => String(p).toLowerCase());
  } else if (typeof rawPlanType === 'string') {
    const normalized = rawPlanType.toLowerCase();
    planTypes = normalized === 'all'
      ? ['physical', 'nutritional', 'emotional', 'spiritual']
      : [normalized];
  } else {
    planTypes = ['physical', 'nutritional', 'emotional', 'spiritual'];
  }

  const validPlanTypes = ['physical', 'nutritional', 'emotional', 'spiritual'];
  planTypes = planTypes.filter((type) => validPlanTypes.includes(type));
  if (planTypes.length === 0) {
    planTypes = ['physical', 'nutritional', 'emotional', 'spiritual'];
  }

  const overrides = action.payload?.overrides && typeof action.payload.overrides === 'object'
    ? action.payload.overrides
    : {};

  const profileSnapshot = applyProfileOverrides(context.userProfile || {}, overrides);
  const results: string[] = [];

  for (const planType of planTypes) {
    try {
      // Desativar plano atual
      await context.supabase
        .from('user_training_plans')
        .update({ is_active: false })
        .eq('user_id', context.userId)
        .eq('plan_type', planType);

      const response = await fetch(`${supabaseUrl}/functions/v1/generate-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
          userId: context.userId,
          planType,
          userProfile: profileSnapshot,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Falha ao gerar plano ${planType}: ${errorBody}`);
      }

      const payloadSummary = typeof action.payload?.summary === 'string'
        ? action.payload.summary
        : null;

      if (payloadSummary) {
        await context.supabase.from('plan_feedback').insert({
          user_id: context.userId,
          plan_type: planType,
          feedback_text: payloadSummary,
          status: 'processed',
          processed_at: new Date().toISOString(),
          ai_response: 'Regenerado automaticamente pela IA Coach',
          plan_updated: true,
        });
      }

      results.push(planType);
    } catch (error: any) {
      console.error(`[Automation] Erro ao regenerar plano ${planType}`, error);
      return {
        type: action.type,
        payload: action.payload,
        success: false,
        error: `Erro ao regenerar plano ${planType}: ${error?.message || error}`,
      };
    }
  }

  const label = results.length === 4
    ? 'todos os seus planos'
    : results.length === 1
      ? `o plano ${results[0]}`
      : `os planos ${results.join(', ')}`;

  return {
    type: action.type,
    payload: action.payload,
    success: true,
    message: `✅ Pronto! Regerei automaticamente ${label}. Confere na aba "Meu Plano".`,
  };
}

function applyProfileOverrides(profile: any, overrides: Record<string, any>) {
  const clone = JSON.parse(JSON.stringify(profile || {}));
  const normalized = overrides || {};

  if (normalized.goal) {
    clone.goal = normalized.goal;
    clone.goal_type = normalized.goal;
  }
  if (normalized.experience) {
    clone.experience = normalized.experience;
    clone.activity_level = normalized.experience;
  }
  if (normalized.limitations) {
    clone.limitations = normalized.limitations;
  }
  if (normalized.restrictions) {
    clone.restrictions = normalized.restrictions;
  }
  if (normalized.preferences) {
    clone.preferences = normalized.preferences;
  }
  if (normalized.schedule) {
    clone.time = normalized.schedule;
  }
  if (normalized.focus) {
    clone.focus = normalized.focus;
  }
  if (normalized.custom_notes) {
    clone.extra_notes = normalized.custom_notes;
  }

  clone.last_ai_override = normalized;
  return clone;
}

function analyzeAdvancementSDR(
  message: string,
  config: StageRuntimeConfig = DEFAULT_STAGE_RUNTIME_CONFIG,
): boolean {
  const text = message.toLowerCase();
  const explicitConsent = /(quero\s+começar|quero começar|vamos|bora|topo|pode ser|aceito|sim|iniciar|começar|testar)/.test(text);
  const interest = /(ajuda|quero|preciso|me\s+ajuda|interesse)/.test(text);

  if (config.enableStageHeuristics) {
    const softConsent = /(quero ajuda|preciso de ajuda|me ajuda|quero ajustar|quero melhorar)/.test(text);
    const planIntent = /(plano|treino|dieta|rotina|cardapio)/.test(text);
    const adjustmentIntent = /(ajustar|ajuste|mudar|alterar|regenerar|refazer|recriar|novo plano)/.test(text);

    if (adjustmentIntent && planIntent) {
      return true;
    }

    if (softConsent && planIntent) {
      return true;
    }
  }

  return explicitConsent && interest;
}

function extractPainLevel(message: string): number {
  const match = message.match(/(\d+)\/10|(\d+) de 10|nível (\d+)/i);
  if (match) {
    return parseInt(match[1] || match[2] || match[3]);
  }
  
  if (message.toLowerCase().includes('muito') || message.toLowerCase().includes('demais')) return 8;
  if (message.toLowerCase().includes('bastante') || message.toLowerCase().includes('bem')) return 7;
  if (message.toLowerCase().includes('um pouco') || message.toLowerCase().includes('às vezes')) return 4;
  
  return 5;
}

// Função auxiliar para detectar objeções (atualmente não utilizada)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function detectObjection(message: string): string | null {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('caro') || lowerMessage.includes('preço') || lowerMessage.includes('valor')) return 'caro';
  if (lowerMessage.includes('tempo') || lowerMessage.includes('ocupado') || lowerMessage.includes('corrido')) return 'tempo';
  if (lowerMessage.includes('pensar') || lowerMessage.includes('decidir') || lowerMessage.includes('conversar')) return 'pensar';
  if (lowerMessage.includes('não acredito') || lowerMessage.includes('app') || lowerMessage.includes('ia')) return 'cetico';
  if (lowerMessage.includes('já tentei') || lowerMessage.includes('tentei antes')) return 'tentou_antes';
  
  return null;
}

// saveInteraction(userId, stage, content, aiResponse, metadata?, supabase)
async function saveInteraction(userId: string, stage: string, content: string, aiResponse: string, metadataOrSupabase?: any, maybeSupabase?: any) {
  let metadata: any = { stage, timestamp: new Date().toISOString() };
  let supabase: any = maybeSupabase;

  if (maybeSupabase) {
    metadata = metadataOrSupabase;
  } else {
    supabase = metadataOrSupabase;
  }
  try {
    await supabase.from('interactions').insert({
      user_id: userId,
      interaction_type: 'message',
      stage: stage,
      content: content,
      ai_response: aiResponse,
      metadata
    });
  } catch (error) {
    console.log('Erro ao salvar interação:', error);
  }
}

async function updateClientStage(userId: string, newStage: string, supabase: any) {
  try {
    if (!newStage) return;
    // descobrir estágio anterior
    const { data: prev } = await supabase
      .from('user_profiles')
      .select('ia_stage, stage_metadata')
      .eq('id', userId)
      .maybeSingle();

    const fromStage = prev?.ia_stage || 'sdr';
    const newMeta = { ...(prev?.stage_metadata || {}), transitioned_at: new Date().toISOString() };

    // 1) Atualizar user_profiles (fonte de verdade)
    await supabase.from('user_profiles').update({ ia_stage: newStage, stage_metadata: newMeta }).eq('id', userId);

    // 2) Registrar em client_stages (histórico compatível)
    await supabase.from('client_stages').insert({
      user_id: userId,
      current_stage: newStage,
      stage_metadata: { transitioned_at: new Date().toISOString() }
    });

    // 3) Auditar transição
    await supabase.from('stage_transitions').insert({
      user_id: userId,
      from_stage: fromStage,
      to_stage: newStage,
      reason: 'auto',
      signals: null
    });
  } catch (error) {
    console.log('Erro ao atualizar estágio:', error);
  }
}

type UserContextData = {
  recentActivities: any[];
  todaysMissions: any[];
  activeGoals: any[];
  pendingActions: any[];
  activePlans: any[];
  gamification: any | null;
  memorySnippets: any[];
  pendingFeedback?: Array<{ id: string; plan_type: string; feedback_text: string; created_at: string }>;
  planCompletions?: Array<{ plan_type: string; item_identifier: string; completed_at: string }>;
};

async function fetchUserContext(userId: string, supabase: any): Promise<UserContextData> {
  const today = new Date().toISOString().split('T')[0];

  const runQuery = async (queryFactory: () => Promise<{ data: any; error: any }>, fallback: any) => {
    try {
      const { data, error } = await queryFactory();
      if (error) throw error;
      return data ?? fallback;
    } catch (err) {
      console.error('IA Coach context fetch error:', err);
      return fallback;
    }
  };

  const [
    activities,
    missions,
    goals,
    actions,
    plans,
    gamification,
    memories,
    feedback,
    completions
  ] = await Promise.all([
    runQuery(
      () => supabase
        .from('daily_activities')
        .select('activity_date, activity_type, activity_name, points_earned, is_bonus, description')
        .eq('user_id', userId)
        .order('activity_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(5),
      []
    ),
    runQuery(
      () => supabase
        .from('daily_missions')
        .select('mission_date, mission_type, title, category, points_reward, is_completed')
        .eq('user_id', userId)
        .order('mission_date', { ascending: true })
        .limit(5),
      []
    ),
    runQuery(
      () => supabase
        .from('client_goals')
        .select('area, goal_type, description, current_status, target_value, current_value, unit, deadline')
        .eq('user_id', userId)
        .order('priority', { ascending: true })
        .limit(5),
      []
    ),
    runQuery(
      () => supabase
        .from('client_actions')
        .select('title, description, area, status, scheduled_for, points_reward')
        .eq('user_id', userId)
        .in('status', ['pending', 'in_progress'])
        .order('scheduled_for', { ascending: true })
        .limit(5),
      []
    ),
    runQuery(
      () => supabase
        .from('user_training_plans')
        .select('plan_type, experience_level, duration_weeks, plan_data')
        .eq('user_id', userId)
        .eq('is_active', true)
        .limit(3),
      []
    ),
    runQuery(
      () => supabase
        .from('user_gamification_summary')
        .select('total_points, level, current_streak, physical_points, nutrition_points, emotional_points, spiritual_points')
        .eq('user_id', userId)
        .maybeSingle(),
      null
    ),
    runQuery(
      () => supabase
        .from('conversation_memory')
        .select('memory_type, content, importance, last_referenced')
        .eq('user_id', userId)
        .order('importance', { ascending: false })
        .order('last_referenced', { ascending: false })
        .limit(5),
      []
    ),
    runQuery(
      () => supabase
        .from('plan_feedback')
        .select('id, plan_type, feedback_text, created_at')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(3),
      []
    ),
    runQuery(
      () => supabase
        .from('plan_completions')
        .select('plan_type, item_identifier, completed_at')
        .eq('user_id', userId)
        .gte('completed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('completed_at', { ascending: false })
        .limit(50),
      []
    )
  ]);

  const todaysMissions = missions.filter((mission: any) => mission?.mission_date === today);

  return {
    recentActivities: activities.slice(0, 5),
    todaysMissions: todaysMissions.slice(0, 3),
    activeGoals: goals.slice(0, 3),
    pendingActions: actions.slice(0, 3),
    activePlans: plans.slice(0, 2),
    gamification,
    memorySnippets: memories.slice(0, 3),
    pendingFeedback: (feedback || []).slice(0, 3),
    planCompletions: (completions || []).slice(0, 50)
  };
}

/**
 * Seleciona sugestões proativas baseadas nos planos ativos e completions
 * Aplica lógica de horário do dia para priorizar tipos de planos
 */
function selectProactiveSuggestions(context: UserContextData): Array<{ plan_type: string; item: string; reason: string }> {
  const { activePlans, planCompletions } = context;
  
  if (!activePlans || activePlans.length === 0) return [];

  const now = new Date();
  const hour = now.getHours();
  
  // Lógica de horário: manhã (5-12) = físico/nutricional, tarde (12-18) = emocional, noite (18-23) = espiritual
  let priorityTypes: string[] = [];
  if (hour >= 5 && hour < 12) {
    priorityTypes = ['physical', 'nutritional'];
  } else if (hour >= 12 && hour < 18) {
    priorityTypes = ['emotional'];
  } else {
    priorityTypes = ['spiritual'];
  }

  const completedIdentifiers = new Set(
    (planCompletions || [])
      .filter(c => {
        const completedDate = new Date(c.completed_at);
        const today = new Date();
        return completedDate.toDateString() === today.toDateString();
      })
      .map(c => c.item_identifier)
  );

  const suggestions: Array<{ plan_type: string; item: string; reason: string }> = [];

  // Primeiro tenta planos prioritários por horário
  for (const plan of activePlans) {
    if (priorityTypes.includes(plan.plan_type) && suggestions.length < 2) {
      const items = extractPlanItems(plan.plan_data, plan.plan_type);
      const incompleteItems = items.filter(item => !completedIdentifiers.has(item.identifier));
      
      if (incompleteItems.length > 0) {
        const selectedItem = incompleteItems[0];
        suggestions.push({
          plan_type: plan.plan_type,
          item: selectedItem.description,
          reason: getTimeBasedReason(hour, plan.plan_type)
        });
      }
    }
  }

  // Se não tiver sugestões suficientes, pega de outros planos
  if (suggestions.length < 2) {
    for (const plan of activePlans) {
      if (!priorityTypes.includes(plan.plan_type) && suggestions.length < 2) {
        const items = extractPlanItems(plan.plan_data, plan.plan_type);
        const incompleteItems = items.filter(item => !completedIdentifiers.has(item.identifier));
        
        if (incompleteItems.length > 0) {
          const selectedItem = incompleteItems[0];
          suggestions.push({
            plan_type: plan.plan_type,
            item: selectedItem.description,
            reason: 'Item pendente do seu plano'
          });
        }
      }
    }
  }

  return suggestions;
}

function extractPlanItems(planData: any, planType: string): Array<{ identifier: string; description: string }> {
  if (!planData) return [];

  const items: Array<{ identifier: string; description: string }> = [];

  try {
    const data = typeof planData === 'string' ? JSON.parse(planData) : planData;

    if (planType === 'physical') {
      // Treinos por dia da semana
      const workouts = data.workouts || data.weekly_workouts || [];
      workouts.forEach((workout: any, idx: number) => {
        const day = workout.day || workout.dayOfWeek || `Dia ${idx + 1}`;
        const exercises = workout.exercises || [];
        exercises.forEach((ex: any) => {
          const exName = ex.name || ex.exercise;
          if (exName) {
            items.push({
              identifier: `${planType}:${day}:${exName}`,
              description: `${exName} (${day})`
            });
          }
        });
      });
    } else if (planType === 'nutritional') {
      // Refeições
      const meals = data.meals || data.daily_meals || [];
      meals.forEach((meal: any) => {
        const mealName = meal.name || meal.meal_type;
        if (mealName) {
          items.push({
            identifier: `${planType}:${mealName}`,
            description: meal.description || mealName
          });
        }
      });
    } else if (planType === 'emotional') {
      // Práticas emocionais
      const practices = data.practices || data.daily_practices || [];
      practices.forEach((practice: any) => {
        const practiceName = practice.name || practice.title;
        if (practiceName) {
          items.push({
            identifier: `${planType}:${practiceName}`,
            description: practice.description || practiceName
          });
        }
      });
    } else if (planType === 'spiritual') {
      // Práticas espirituais
      const practices = data.practices || data.daily_practices || [];
      practices.forEach((practice: any) => {
        const practiceName = practice.name || practice.title;
        if (practiceName) {
          items.push({
            identifier: `${planType}:${practiceName}`,
            description: practice.description || practiceName
          });
        }
      });
    }
  } catch (err) {
    console.error('Erro ao extrair itens do plano:', err);
  }

  return items;
}

function getTimeBasedReason(hour: number, planType: string): string {
  if (hour >= 5 && hour < 12) {
    if (planType === 'physical') return 'Ótimo horário para treinar pela manhã';
    if (planType === 'nutritional') return 'Momento ideal para um café da manhã nutritivo';
  } else if (hour >= 12 && hour < 18) {
    if (planType === 'emotional') return 'Que tal uma pausa para cuidar das emoções?';
  } else {
    if (planType === 'spiritual') return 'Hora perfeita para uma prática espiritual';
  }
  return 'Item do seu plano ativo';
}

// Fora de fetchUserContext: helper de metadados
function buildInteractionMetadata(
  stage: string,
  message: string,
  aiResponse: string,
  contextData?: UserContextData,
  custom: Record<string, any> = {}
): Record<string, any> {
  return {
    stage,
    message,
    ai_response: aiResponse,
    context: contextData ? {
      recentActivities: contextData.recentActivities?.length,
      todaysMissions: contextData.todaysMissions?.length,
      activeGoals: contextData.activeGoals?.length,
      pendingActions: contextData.pendingActions?.length,
      activePlans: contextData.activePlans?.length,
      gamification: contextData.gamification ? {
        total_points: contextData.gamification.total_points,
        level: contextData.gamification.level,
        current_streak: contextData.gamification.current_streak
      } : null,
      memorySnippets: contextData.memorySnippets?.length
    } : null,
    ...custom,
    timestamp: new Date().toISOString()
  };
}

function buildContextPrompt(userProfile: any, context: UserContextData, stage: string): string | null {
  if (!context) return null;

  const lines: string[] = [];
  const today = new Date().toISOString().split('T')[0];
  const firstName = extractFirstName(userProfile?.full_name || userProfile?.name);

  if (stage) {
    lines.push(`Estágio atual previsto: ${stage}.`);
  }

  if (context.gamification) {
    const g = context.gamification;
    lines.push(
      `Gamificação: ${g.total_points ?? 0} pontos totais, nível ${g.level ?? 1}, sequência atual ${g.current_streak ?? 0} dias.`
    );
  }

  if (context.recentActivities.length > 0) {
    const todaysActivities = context.recentActivities
      .filter((activity: any) => activity.activity_date === today)
      .slice(0, 2)
      .map((activity: any) => `${activity.activity_name} (+${activity.points_earned ?? 0} pts)`);

    const latestActivity = context.recentActivities[0];
    const recentSummary = `${latestActivity.activity_name} em ${formatIsoDate(latestActivity.activity_date)} (+${latestActivity.points_earned ?? 0} pts)`;

    if (todaysActivities.length > 0) {
      lines.push(`Atividades de hoje: ${todaysActivities.join(', ')}.`);
    } else {
      lines.push(`Atividade mais recente registrada: ${recentSummary}.`);
    }
  }

  if (context.todaysMissions.length > 0) {
    const missionSummary = context.todaysMissions
      .map((mission: any) => `${mission.title} (${mission.points_reward ?? 0} pts)`)
      .join(', ');
    lines.push(`Missões do dia em aberto: ${missionSummary}.`);
  }

  if (context.activeGoals.length > 0) {
    const goalSummary = context.activeGoals
      .map((goal: any) => `${goal.area}: ${limitText(goal.description || goal.goal_type, 80)}`)
      .join(' | ');
    lines.push(`Metas ativas: ${goalSummary}.`);
  }

  if (context.pendingActions.length > 0) {
    const actionSummary = context.pendingActions
      .map((action: any) => {
        const dateInfo = action.scheduled_for ? ` para ${formatIsoDate(action.scheduled_for)}` : '';
        return `${action.title}${dateInfo}`;
      })
      .join(' | ');
    lines.push(`Próximas ações sugeridas: ${actionSummary}.`);
  }

  if (context.activePlans.length > 0) {
    const planSummary = context.activePlans
      .map((plan: any) => {
        const planName = plan.plan_data?.title || plan.plan_type;
        return `${planName} (${plan.experience_level ?? 'geral'})`;
      })
      .join(' | ');
    lines.push(`Planos ativos: ${planSummary}.`);
    
    // Adicionar sugestões proativas
    const suggestions = selectProactiveSuggestions(context);
    if (suggestions.length > 0) {
      const suggestionText = suggestions
        .map(s => `"${s.item}" (${s.plan_type}) - ${s.reason}`)
        .join(' | ');
      lines.push(`💡 Sugestões proativas para agora: ${suggestionText}.`);
      lines.push(`INSTRUÇÃO: Mencione naturalmente uma dessas sugestões na conversa quando apropriado, sem forçar.`);
    }
  }

  if (context.memorySnippets.length > 0) {
    const memories = context.memorySnippets
      .map((memory: any) => `${memory.memory_type}: ${limitText(memory.content, 80)}`)
      .join(' | ');
    lines.push(`Notas importantes: ${memories}.`);
  }
  
  if (context.pendingFeedback && context.pendingFeedback.length > 0) {
    const fb = context.pendingFeedback
      .slice(0, 2)
      .map((f: any) => `${f.plan_type}: "${limitText(f.feedback_text, 80)}"`)
      .join(' | ');
    lines.push(`Feedback pendente do usuário: ${fb}.`);
    lines.push(`Ação sugerida: reconheça o feedback e ofereça ajustar/regenerar o plano correspondente, confirmando preferências em 1 pergunta curta.`);
  }

  if (lines.length === 0) {
    return null;
  }

  const header = firstName
    ? `Contexto operacional de ${firstName}:`
    : 'Contexto operacional do cliente:';

  return `${header}\n${lines.join('\n')}\nUse esses dados para personalizar a resposta, oferecendo próximos passos concretos e confirmando informações com o cliente.`;
}

function extractFirstName(fullName?: string): string {
  if (!fullName || typeof fullName !== 'string') return '';
  const parts = fullName.trim().split(/\s+/);
  return parts.length > 0 ? parts[0] : fullName;
}

function formatIsoDate(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
}

function limitText(value: string, maxLength = 120): string {
  if (!value) return '';
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 3)}...`;
}

// ============================================
// 🎁 SISTEMA DE OFERTAS DE RECOMPENSAS
// ============================================

interface RewardOffer {
  shouldOffer: boolean;
  trigger: string;
  xpEarned: number;
  userXP: number;
  level: number;
  suggestedRewards?: Array<{
    id: string;
    title: string;
    xp_cost: number;
    category: string;
  }>;
}

async function checkRewardOpportunity(
  userId: string,
  message: string,
  contextData: UserContextData | null,
  supabase: any
): Promise<RewardOffer> {
  const defaultResponse: RewardOffer = {
    shouldOffer: false,
    trigger: '',
    xpEarned: 0,
    userXP: 0,
    level: 0,
  };

  if (!contextData?.gamification) return defaultResponse;

  const userXP = contextData.gamification.total_points || 0;
  const level = contextData.gamification.level || 0;
  
  // Verificar se usuário tem XP suficiente para resgatar algo (mínimo 1000 XP)
  if (userXP < 1000) return defaultResponse;

  const msgLower = message.toLowerCase();
  
  // Gatilhos para oferecer recompensas
  const triggers = {
    completedActivity: /\b(conclu[íi]|fiz|terminei|acabei|completei)\b/.test(msgLower),
    milestone: /\b(conquist|meta|objetivo|atingi)\b/.test(msgLower),
    streak: contextData.gamification.current_streak >= 7, // 7 dias consecutivos
    levelUp: level > 0 && level % 5 === 0, // A cada 5 níveis
    highXP: userXP >= 5000 && Math.random() < 0.3, // 30% chance se tem muito XP
  };

  const triggered = Object.entries(triggers).find(([_, value]) => value);
  if (!triggered) return defaultResponse;

  // Buscar recompensas disponíveis que o usuário pode resgatar
  const { data: rewards, error } = await supabase
    .from('v_rewards_catalog')
    .select('id, title, xp_cost, category, available_stock')
    .lte('xp_cost', userXP) // Apenas recompensas que o usuário pode pagar
    .gt('available_stock', 0) // Com estoque
    .order('xp_cost', { ascending: true })
    .limit(3);

  if (error || !rewards || rewards.length === 0) {
    return defaultResponse;
  }

  // Calcular XP ganho recentemente (últimas 24h)
  const recentXP = contextData.recentActivities
    ?.filter((a: any) => {
      const activityDate = new Date(a.activity_date);
      const now = new Date();
      const diffHours = (now.getTime() - activityDate.getTime()) / (1000 * 60 * 60);
      return diffHours <= 24;
    })
    .reduce((sum: number, a: any) => sum + (a.points_earned || 0), 0) || 0;

  return {
    shouldOffer: true,
    trigger: triggered[0],
    xpEarned: recentXP,
    userXP,
    level,
    suggestedRewards: rewards,
  };
}

function buildRewardOfferPrompt(offer: RewardOffer, firstName: string): string {
  if (!offer.shouldOffer || !offer.suggestedRewards) return '';

  const rewardsList = offer.suggestedRewards
    .map(r => `• ${r.title} (${r.xp_cost} XP)`)
    .join('\n');

  return `
🎁 OPORTUNIDADE DE RECOMPENSA DETECTADA!

${firstName} tem ${offer.userXP} XP disponíveis (Nível ${offer.level}).
Motivo: ${getTriggerMessage(offer.trigger)}.

Recompensas disponíveis:
${rewardsList}

INSTRUÇÃO DE RESPOSTA:
1. Parabenize ${firstName} de forma genuína pelo progresso
2. Mencione naturalmente que ele(a) acumulou XP suficiente para resgatar recompensas
3. Sugira 1-2 recompensas relevantes do contexto
4. Informe: "Você pode ver todas as opções e resgatar na aba 'Recompensas' do painel, ou me pergunte mais sobre alguma!"

Tom: EMPOLGADA, mas não forçada. Integre naturalmente na conversa.
❌ NÃO pareça um vendedor
✅ Seja uma amiga celebrando conquistas
`;
}

function getTriggerMessage(trigger: string): string {
  const messages: Record<string, string> = {
    completedActivity: 'Completou uma atividade importante',
    milestone: 'Atingiu uma meta ou objetivo',
    streak: 'Mantém sequência de 7+ dias',
    levelUp: 'Subiu de nível (múltiplo de 5)',
    highXP: 'Acumulou XP significativo',
  };
  return messages[trigger] || 'Progresso consistente';
}

