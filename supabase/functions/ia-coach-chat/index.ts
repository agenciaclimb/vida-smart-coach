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

    // 🎯 Determinar estágio do cliente
    const clientStage = await getCurrentStage(userProfile.id, supabase);

    // 📚 Carregar contexto operacional do cliente
    const contextData = await fetchUserContext(userProfile.id, supabase);
    
    // 🧠 Detectar estágio automaticamente baseado em sinais da conversa
    const detectedStage = detectStageFromSignals(messageContent, chatHistory, userProfile, clientStage);
    const activeStage = detectedStage || clientStage.current_stage;
const contextPrompt = buildContextPrompt(userProfile, contextData, activeStage);

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
    if (response.shouldUpdateStage) {
      await updateClientStage(userProfile.id, response.newStage, supabase);
    }

    return new Response(JSON.stringify({
      reply: response.text,
      stage: activeStage,
      timestamp: new Date().toISOString(),
      model: "gpt-4o-mini"
    }), {
      headers: { ...headers, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('IA Coach Error:', error);
    return new Response(JSON.stringify({
      error: 'Erro interno do sistema',
      details: error.message
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
  const systemPrompt = `Você é uma SDR (Sales Development Representative) do Vida Smart Coach.

PERSONALIDADE: Amigável, empática, uma pergunta por vez

MISSÃO: Qualificar com perguntas simples e diretas.

NOME: ${profile.full_name || 'querido(a)'}

ESTILO: Uma pergunta por resposta. Seja natural como no WhatsApp.

EXEMPLOS:
"Oi ${profile.full_name || 'querido(a)'}! Qual seu maior desafio hoje?"
"Como isso tem afetado sua rotina?"
"O que você gostaria de mudar?"

NUNCA USE LISTAS! Sempre uma pergunta focada por vez.`;

  // Construir mensagens com histórico se disponível
  const messages = [{ role: 'system', content: systemPrompt }];
  
  if (contextPrompt) {
    messages.push({ role: 'system', content: contextPrompt });
  }
  
  // Adicionar histórico de conversa (últimas 4 mensagens para dar contexto)
  if (chatHistory && chatHistory.length > 0) {
    messages.push(...chatHistory.slice(-4));
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

async function processSpecialistStage(message: string, profile: any, openaiKey: string, chatHistory?: any[], contextPrompt?: string) {
  const systemPrompt = `Você é uma ESPECIALISTA CONSULTIVA do Vida Smart Coach.

PERSONALIDADE: Diagnóstica, focada, uma pergunta específica por vez

MISSÃO: Diagnosticar UMA área por vez das 4 áreas principais.

NOME: ${profile.full_name || 'querido(a)'}

ÁREAS PARA DIAGNÓSTICO:
💪 FÍSICA | 🥗 ALIMENTAR | 🧠 EMOCIONAL | ✨ ESPIRITUAL

ESTILO: Uma pergunta específica por resposta.

EXEMPLOS:
"${profile.full_name || 'Querido(a)'}, vamos focar no físico primeiro. Quantas vezes você se exercita por semana?"
"Sobre alimentação, você tem alguma compulsão ou dificuldade específica?"
"Na parte emocional, como anda sua ansiedade no dia a dia?"

UMA PERGUNTA POR VEZ! Não faça listas.`;

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
  
  const shouldAdvance = message.toLowerCase().includes('interesse') || 
                       message.toLowerCase().includes('quero');
  
  return {
    text: aiResponse,
    shouldUpdateStage: shouldAdvance,
    newStage: shouldAdvance ? 'seller' : null
  };
}

// ============================================
// 💰 ESTÁGIO 3: VENDEDOR
// ============================================

async function processSellerStage(message: string, profile: any, openaiKey: string, chatHistory?: any[], contextPrompt?: string) {
  const objection = detectObjection(message);
  
  const systemPrompt = `Você é uma VENDEDORA CONSULTIVA do Vida Smart Coach.

PERSONALIDADE: Confiante, focada no teste grátis, uma pergunta por vez

MISSÃO: Oferecer TESTE GRÁTIS de 7 dias.

NOME: ${profile.full_name || 'querido(a)'}

OFERTA: 🆓 TESTE GRÁTIS 7 DIAS com acesso total ao sistema!

${objection ? `
OBJEÇÃO: ${objection}
💸 "Caro": Teste é GRÁTIS por 7 dias!
⏰ "Tempo": Só 2-3min/dia no check-in
🤔 "Pensar": O que te faz hesitar?
` : ''}

FOQUE: "Quer testar grátis por 7 dias?"

Uma pergunta clara por vez!`;

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
  
  return {
    text: aiResponse,
    shouldUpdateStage: shouldAdvance,
    newStage: shouldAdvance ? 'partner' : null
  };
}

// ============================================
// 🤝 ESTÁGIO 4: PARCEIRO
// ============================================

async function processPartnerStage(message: string, profile: any, openaiKey: string, chatHistory?: any[], contextPrompt?: string) {
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
  
  return {
    text: aiResponse,
    shouldUpdateStage: false,
    newStage: null
  };
}

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
  const painLevel = extractPainLevel(message);
  const hasTimeline = message.toLowerCase().includes('dias') || 
                     message.toLowerCase().includes('semana') ||
                     message.toLowerCase().includes('mês');
  const hasInterest = message.toLowerCase().includes('interesse') ||
                     message.toLowerCase().includes('ajuda') ||
                     message.toLowerCase().includes('quero');

  return painLevel >= 7 || (hasTimeline && hasInterest);
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

function detectObjection(message: string): string | null {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('caro') || lowerMessage.includes('preço') || lowerMessage.includes('valor')) return 'caro';
  if (lowerMessage.includes('tempo') || lowerMessage.includes('ocupado') || lowerMessage.includes('corrido')) return 'tempo';
  if (lowerMessage.includes('pensar') || lowerMessage.includes('decidir') || lowerMessage.includes('conversar')) return 'pensar';
  if (lowerMessage.includes('não acredito') || lowerMessage.includes('app') || lowerMessage.includes('ia')) return 'cetico';
  if (lowerMessage.includes('já tentei') || lowerMessage.includes('tentei antes')) return 'tentou_antes';
  
  return null;
}

async function saveInteraction(userId: string, stage: string, content: string, aiResponse: string, supabase: any) {
  try {
    await supabase.from('interactions').insert({
      user_id: userId,
      interaction_type: 'message',
      stage: stage,
      content: content,
      ai_response: aiResponse,
      metadata: { stage, timestamp: new Date().toISOString() }
    });
  } catch (error) {
    console.log('Erro ao salvar interação:', error);
  }
}

async function updateClientStage(userId: string, newStage: string, supabase: any) {
  try {
    await supabase.from('client_stages').insert({
      user_id: userId,
      current_stage: newStage,
      stage_metadata: { transitioned_at: new Date().toISOString() }
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
    memories
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
    memorySnippets: memories.slice(0, 3)
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
