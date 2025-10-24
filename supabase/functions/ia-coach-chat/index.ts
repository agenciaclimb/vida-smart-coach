import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { cors } from "../_shared/cors.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.3';

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
    
    // 🚨 PRIORIDADE ABSOLUTA: Se há feedback pendente, força estágio Specialist
    const hasPendingFeedback = contextData?.pendingFeedback && contextData.pendingFeedback.length > 0;
    
    // 🧠 Detectar estágio automaticamente baseado em sinais da conversa
    const detectedStage = hasPendingFeedback ? 'specialist' : detectStageFromSignals(messageContent, chatHistory, userProfile, clientStage);
    const activeStage = detectedStage || clientStage.current_stage;
    const contextPrompt = buildContextPrompt(userProfile, contextData, activeStage) || undefined;

    // 🧠 Processar mensagem com base no estágio detectado
    const response = await processMessageByStage(
      messageContent,
      userProfile,
      { ...clientStage, current_stage: activeStage },
      supabase,
      openaiKey,
      chatHistory,
      contextPrompt,
      contextData
    );

// 💾 Salvar interação
  await saveInteraction(userProfile.id, activeStage, messageContent, response.text, response.metadata, supabase);

    // 🔄 Atualizar estágio se necessário
    if (response.shouldUpdateStage && response.newStage) {
      await updateClientStage(userProfile.id, response.newStage, supabase);
    }

    return new Response(JSON.stringify({
      reply: response.text,
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

function detectStageFromSignals(message: string, chatHistory: any[], userProfile: any, currentStage: any): string | null {
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
    // Histórico mostra engajamento constante
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
    msgLower.includes('quero começar')
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
    extractPainLevel(message) >= 7
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
    message.length < 50 && !msgLower.includes('não')
  ];
  
  // 📊 CONTAGEM DE SINAIS
  const partnerCount = partnerSignals.filter(Boolean).length;
  const sellerCount = sellerSignals.filter(Boolean).length;
  const specialistCount = specialistSignals.filter(Boolean).length;
  const sdrCount = sdrSignals.filter(Boolean).length;
  
  // 🎯 DECISÃO: Prioridade Partner > Seller > Specialist > SDR
  if (partnerCount >= 2) return 'partner';
  if (sellerCount >= 2) return 'seller';
  if (specialistCount >= 2) return 'specialist';
  if (sdrCount >= 2) return 'sdr';
  
  // 🔄 FALLBACK: Manter estágio atual se sinais forem ambíguos
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
  contextData?: UserContextData
) {
  switch (stage.current_stage) {
    case 'sdr':
      return await processSDRStage(message, profile, openaiKey, chatHistory, contextPrompt, contextData);
    case 'specialist':
      return await processSpecialistStage(message, profile, openaiKey, chatHistory, contextPrompt, contextData);
    case 'seller':
      return await processSellerStage(message, profile, openaiKey, chatHistory, contextPrompt, contextData);
    case 'partner':
      return await processPartnerStage(message, profile, openaiKey, chatHistory, contextPrompt, contextData);
    default:
      return await processSDRStage(message, profile, openaiKey, chatHistory, contextPrompt, contextData);
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
  contextData?: UserContextData
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
  const shouldAdvance = analyzeAdvancementSDR(message);

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

async function processSpecialistStage(message: string, profile: any, openaiKey: string, chatHistory?: any[], contextPrompt?: string, contextData?: UserContextData) {
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
AÇÃO IMEDIATA:
1. RECONHEÇA o feedback: "Oi ${profile.full_name || ''}! Entendi que você quer ajustar seu plano [área]."
2. Pergunte 1-2 questões CURTAS: "O que especificamente você quer mudar? Está muito difícil? Falta algo?"
3. Após a resposta do usuário, INSTRUA: "Perfeito! Para regenerar seu plano com esses ajustes, vá em 'Meu Plano' → clique no botão 'Gerar Novo Plano' e responda as perguntas considerando o que conversamos aqui. Ok?"

REGRAS CRÍTICAS:
❌ NÃO gere plano aqui no chat (não tem interface para isso)
❌ NÃO faça perguntas de diagnóstico geral
✅ Entenda o ajuste desejado em 1-2 mensagens
✅ Direcione para regenerar o plano na aba correta

` : `
MISSÃO: Criar plano 100% personalizado fazendo diagnóstico técnico detalhado
❌ NÃO mencionar cadastro (trabalho do SDR)
❌ NÃO mencionar teste grátis (trabalho da VENDEDORA)
✅ FOCAR em diagnóstico técnico e construção de plano
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

async function processSellerStage(message: string, profile: any, openaiKey: string, chatHistory?: any[], contextPrompt?: string, contextData?: UserContextData) {
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

async function processPartnerStage(message: string, profile: any, openaiKey: string, chatHistory?: any[], contextPrompt?: string, contextData?: UserContextData) {
  const currentHour = new Date().getHours();
  const isCheckInTime = (currentHour >= 7 && currentHour <= 9) || (currentHour >= 20 && currentHour <= 22);
  
  const systemPrompt = `Você é uma PARCEIRA DE TRANSFORMAÇÃO do Vida Smart Coach.

PERSONALIDADE: Amiga próxima, motivadora, uma pergunta por vez

MISSÃO: Acompanhar diariamente com foco simples.

NOME: ${profile.full_name}

${isCheckInTime ? `
É HORÁRIO DE CHECK-IN! ${currentHour >= 20 ? 'NOTURNO 🌙' : 'MATINAL ☀️'}

${currentHour >= 20 ? 
  'Como foi seu dia? Conseguiu seguir o plano?' :
  'Bom dia! Como está se sentindo hoje?'
}
` : 'Conversa natural como amiga, uma pergunta por vez.'}

Sempre uma pergunta focada por resposta!`;

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

function analyzeAdvancementSDR(message: string): boolean {
  const text = message.toLowerCase();
  const explicitConsent = /(quero\s+começar|quero começar|vamos|bora|topo|pode ser|aceito|sim|iniciar|começar|testar)/.test(text);
  const interest = /(ajuda|quero|preciso|me\s+ajuda|interesse)/.test(text);
  // SDR só avança com aceite explícito + interesse; não avança apenas por timeline/dor
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
    feedback
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
    pendingFeedback: (feedback || []).slice(0, 3)
  };
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
