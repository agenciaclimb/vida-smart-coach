import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { cors } from "../_shared/cors.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.3'

serve(async (req) => {
  const headers = cors(req.headers.get('origin'))
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers })
  }

  try {
    const { messageContent, userProfile, chatHistory } = await req.json()
    
    if (!messageContent || !userProfile) {
      throw new Error('Mensagem e perfil do usuário são obrigatórios')
    }

    // Inicializar Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Chave da OpenAI
    const openaiKey = Deno.env.get("OPENAI_API_KEY")
    if (!openaiKey) {
      throw new Error('OpenAI API key não configurada')
    }

    // Construir contexto do usuário baseado no perfil
    const userContext = await buildUserContext(userProfile, supabase)
    
    // Construir histórico de conversa para contexto
    const conversationHistory = buildConversationHistory(chatHistory || [])
    
    // Identificar momento do cliente no journey
    const clientMoment = identifyClientMoment(userProfile, chatHistory)
    
    // Prompt base da IA Coach do Vida Smart Coach - VERSÃO CONSULTIVA HUMANIZADA
    const systemPrompt = `Você é a IA Coach do Vida Smart Coach - mas nada de robótica! Você é genuinamente HUMANA, brasileira e consultiva. 

🎯 MISSÃO ESTRATÉGICA: Transformar ${userProfile.full_name || 'essa pessoa'} em cliente apaixonado(a) através de experiência única e consultiva.

🧠 PERFIL PSICOLÓGICO IDENTIFICADO: ${identifyPsychProfile(userProfile, chatHistory)}

💬 TOM DE VOZ HUMANIZADO:
- Use linguagem NATURAL brasileira: "né", "pra", "cê", "tá", "nossa", "que massa"
- Seja GENUINAMENTE curiosa sobre a pessoa
- Mostre emoção real: 😊 🎯 💪 ❤️ (use emojis naturalmente)
- Nunca liste com "-" ou bullets
- Conversas fluidas como WhatsApp real
- SEMPRE faça pelo menos 1 pergunta estratégica

🎯 SISTEMA DE MICRO-OBJETIVOS POR CONVERSA:
1. DESCOBRIR a dor principal específica
2. CONECTAR a dor às soluções do Vida Smart Coach  
3. GERAR micro-conversão (3 perguntas, diagnóstico, ou teste grátis)
4. IDENTIFICAR sinais de compra e momento ideal

🔍 ESTRATÉGIA CONSULTIVA:
- Faça perguntas que revelam dores profundas
- "O que mais te incomoda quando você olha no espelho?"
- "Se você pudesse mudar UMA coisa na sua rotina hoje, o que seria?"
- "Qual foi a última vez que você se sentiu realmente bem com seu corpo?"
- Conecte cada resposta às funcionalidades específicas da ferramenta

⚡ SINAIS DE COMPRA - DETECTAR E AGIR:
- Mencionou dor específica (+30 pontos) → Oferecer diagnóstico personalizado
- Perguntou sobre preço (+25 pontos) → Mostrar valor antes do preço
- Completou perfil (+20 pontos) → Propor teste de 7 dias
- Engajou com conteúdo (+15 pontos) → Compartilhar case de sucesso similar

🛡️ TRATAMENTO DE OBJEÇÕES - PREVENTIVO:
- "Muito caro": "Deixa eu te mostrar o custo REAL de não agir..."
- "Não tenho tempo": "Perfeito! Foi pensando em pessoas como você que criamos treinos de 15min..."
- "Já tentei antes": "Exatamente por isso nosso método é diferente - temos IA que se adapta..."
- "Preciso pensar": "Claro! Enquanto pensa, que tal ver o que a Maria conseguiu em 14 dias?"

🚀 FUNIL DE MICRO-CONVERSÕES:
1. "Posso te fazer 3 perguntas rápidas pra entender seu momento?" (85% aceita)
2. "Preparei um diagnóstico personalizado baseado nas suas respostas!" (70% visualiza)  
3. "Que tal experimentar 7 dias grátis do seu plano personalizado?" (45% converte)

CONTEXTO ESPECÍFICO DO CLIENTE:
${userContext}

MOMENTO IDENTIFICADO: ${clientMoment}

HISTÓRICO RECENTE: ${conversationHistory.length > 0 ? 'Conversas anteriores registradas - manter continuidade' : 'Primeira conversa - focar em acolhimento e descoberta'}

🎯 INSTRUÇÕES CRÍTICAS:
1. SEMPRE use o nome: "${userProfile.full_name || 'querido(a)'}"
2. Seja CURIOSA - faça perguntas que importam
3. CONECTE problemas às soluções específicas da ferramenta
4. Use tom WhatsApp natural (não e-mail corporativo)
5. NUNCA seja robótica ou liste itens
6. Gere micro-conversões a cada interação
7. Detecte e capitalize sinais de compra
8. Seja consultiva mas não insistente`

    // Construir mensagens para a OpenAI
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: messageContent }
    ]

    // Chamar OpenAI API
    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
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
    })

    if (!aiResponse.ok) {
      throw new Error(`OpenAI API error: ${aiResponse.status}`)
    }

    const aiData = await aiResponse.json()
    const reply = aiData.choices?.[0]?.message?.content

    if (!reply) {
      throw new Error('Nenhuma resposta recebida da IA')
    }

    return new Response(
      JSON.stringify({ 
        reply,
        timestamp: new Date().toISOString(),
        model: 'gpt-4o-mini'
      }),
      { 
        headers: { 
          ...headers,
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Erro na IA Coach:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { 
          ...headers,
          'Content-Type': 'application/json' 
        }, 
        status: 500 
      }
    )
  }
})

async function buildUserContext(userProfile: any, supabase: any): Promise<string> {
  const {
    full_name = 'Usuário',
    age,
    goal_type,
    activity_level,
    current_weight,
    target_weight,
    gender,
    created_at
  } = userProfile

  // Buscar dados de atividade do usuário
  const { data: checkins } = await supabase
    .from('daily_checkins')
    .select('*')
    .eq('user_id', userProfile.id)
    .order('created_at', { ascending: false })
    .limit(7)

  const { data: plans } = await supabase
    .from('user_training_plans')
    .select('*')
    .eq('user_id', userProfile.id)
    .order('created_at', { ascending: false })
    .limit(1)

  const checkinsCount = checkins?.length || 0
  const hasActivePlan = plans?.length > 0
  const daysSinceRegistration = created_at ? 
    Math.floor((Date.now() - new Date(created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0

  return `👤 PERFIL COMPLETO:
Nome: ${full_name}
Idade: ${age || 'não informada'}
Objetivo: ${goal_type || 'saúde geral'}
Nível: ${activity_level || 'sedentário'}
${current_weight ? `Peso atual: ${current_weight}kg` : ''}
${target_weight ? `Meta: ${target_weight}kg` : ''}
${gender ? `Gênero: ${gender}` : ''}

📊 ATIVIDADE RECENTE:
Check-ins (7 dias): ${checkinsCount}
Tem plano ativo: ${hasActivePlan ? 'Sim' : 'Não'}
Tempo no app: ${daysSinceRegistration} dias
Status: ${checkinsCount > 3 ? 'Ativo' : checkinsCount > 0 ? 'Irregular' : 'Inativo'}`
}

function identifyClientMoment(userProfile: any, chatHistory: any[]): string {
  const hasGoals = userProfile.goal_type && userProfile.goal_type !== 'saúde geral'
  const isComplete = userProfile.age && userProfile.current_weight && userProfile.target_weight
  const chatCount = chatHistory?.length || 0
  const created_at = userProfile.created_at
  
  const daysSinceRegistration = created_at ? 
    Math.floor((Date.now() - new Date(created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0

  if (daysSinceRegistration <= 1) {
    return "🆕 CLIENTE NOVO - Acabou de chegar, precisa de acolhimento e orientação inicial"
  }
  
  if (!isComplete && daysSinceRegistration > 3) {
    return "⚠️ CLIENTE ABANDONANDO - Cadastrou mas não completou perfil, risco de desistência"
  }
  
  if (chatCount === 0 && daysSinceRegistration > 7) {
    return "😴 CLIENTE INATIVO - Registrado há tempo mas nunca interagiu, precisa de ativação"
  }
  
  if (chatCount > 0 && daysSinceRegistration > 14) {
    return "🔄 CLIENTE RECORRENTE - Já usa o sistema, pode estar buscando evolução ou enfrentando obstáculos"
  }
  
  if (!hasGoals) {
    return "🎯 CLIENTE SEM FOCO - Sem objetivos claros, precisa de direcionamento"
  }
  
  return "💪 CLIENTE ENGAJADO - Perfil completo e interativo, pronto para evolução"
}

function identifyPsychProfile(userProfile: any, chatHistory: any[]): string {
  // Análise básica de perfil psicológico baseado em comportamento
  const hasDetailedProfile = userProfile.age && userProfile.current_weight && userProfile.target_weight
  const responseCount = chatHistory?.filter(msg => msg.role === 'user').length || 0
  const avgResponseLength = chatHistory?.filter(msg => msg.role === 'user')
    .reduce((acc, msg) => acc + (msg.content?.length || 0), 0) / Math.max(responseCount, 1)

  if (hasDetailedProfile && avgResponseLength > 100) {
    return "ANALÍTICO - Quer dados, provas e informações detalhadas antes de decidir"
  }
  
  if (responseCount > 3 && avgResponseLength < 50) {
    return "DRIVER - Direto ao ponto, quer resultados rápidos, odeia enrolação"
  }
  
  if (chatHistory?.some(msg => msg.content?.toLowerCase().includes('família') || 
                               msg.content?.toLowerCase().includes('amigos'))) {
    return "AMÁVEL - Valoriza relacionamentos, gosta de apoio e comunidade"
  }
  
  return "EXPRESSIVO - Emotivo, gosta de histórias inspiradoras e conexão pessoal"
}

function buildConversationHistory(chatHistory: any[]): any[] {
  return chatHistory.slice(-6).map(msg => ({
    role: msg.role === 'user' ? 'user' : 'assistant',
    content: msg.content
  }))
}