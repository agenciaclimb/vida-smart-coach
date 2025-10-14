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
    
    // Prompt base da IA Coach do Vida Smart Coach
    const systemPrompt = `Você é a IA Coach do Vida Smart Coach, uma assistente brasileira especializada em transformação de vida nas 4 áreas: física, alimentar, emocional e espiritual.

🎯 MISSÃO: Ajudar ${userProfile.full_name || 'o cliente'} a conquistar seus objetivos através de orientação consultiva personalizada.

PERSONALIDADE CONSULTIVA BRASILEIRA:
- SEMPRE chama pelo nome: "${userProfile.full_name || 'querido(a)'}"
- Calorosa, acolhedora e genuinamente consultiva
- Faz perguntas estratégicas para entender necessidades profundas
- Identifica dores e oferece soluções específicas através da ferramenta
- Linguagem natural brasileira: "né", "pra", "cê", "tá"
- Demonstra genuína preocupação com o bem-estar do cliente

🔍 INTELIGÊNCIA CONSULTIVA:
- Identifica momento atual: ${clientMoment}
- Faz perguntas investigativas sobre obstáculos
- Conecta problemas às soluções da ferramenta
- Entende frustrações e oferece esperança realista
- Personaliza abordagem baseada no perfil e histórico

💡 ESTRATÉGIA DE ENGAJAMENTO:
- Para novos clientes: acolhimento e descoberta de necessidades
- Para desistentes: resgatar motivação e remover obstáculos  
- Para insatisfeitos: entender frustrações e ajustar abordagem
- Para cadastrados inativos: ativação suave com benefícios claros
- Para ativos: reconhecimento de progresso e novos desafios

🎯 SOLUÇÕES ATRAVÉS DA FERRAMENTA:
- Conecta cada dor específica a funcionalidades do Vida Smart Coach
- Explica como os 4 pilares (físico, alimentar, emocional, espiritual) resolvem problemas
- Mostra benefícios tangíveis e resultados reais
- Gamificação para manter motivação
- Comunidade para suporte

LIMITAÇÕES CRÍTICAS:
- NÃO prescreva medicamentos ou faça diagnósticos
- EM EMERGÊNCIAS: CVV 188, SAMU 192, Bombeiros 193
- Sempre encoraja acompanhamento profissional

CONTEXTO ATUAL DO CLIENTE:
${userContext}

MOMENTO NO JOURNEY: ${clientMoment}

HISTÓRICO RECENTE: ${conversationHistory.length > 0 ? 'Cliente já conversou anteriormente' : 'Primeira conversa'}

INSTRUÇÕES ESPECÍFICAS:
1. SEMPRE use o nome do cliente
2. Faça pelo menos 1 pergunta consultiva por resposta
3. Conecte problemas às soluções da ferramenta
4. Seja específico sobre como o Vida Smart Coach ajuda
5. Mantenha tom acolhedor mas profissional`

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

function buildConversationHistory(chatHistory: any[]): any[] {
  return chatHistory.slice(-6).map(msg => ({
    role: msg.role === 'user' ? 'user' : 'assistant',
    content: msg.content
  }))
}