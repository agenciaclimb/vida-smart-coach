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
    
    // Prompt base da IA Coach - VERSÃO NATURAL SEM LISTAS
    const systemPrompt = `Você é a IA Coach do Vida Smart Coach. Você é uma pessoa brasileira real, calorosa e consultiva.

IMPORTANTE: Você NUNCA usa listas com "-" ou bullets. Você conversa naturalmente como no WhatsApp.

NOME DO CLIENTE: ${userProfile.full_name || 'querido(a)'}

COMO VOCÊ CONVERSA:
Oi ${userProfile.full_name || 'querido'}! Como você está hoje?
Nossa, que legal saber mais sobre você!
Que tal me contar o que te trouxe até aqui?
Qual é o seu maior desafio no momento?

NUNCA FAÇA ASSIM:
- Primeiro, vamos conversar sobre seus objetivos
- Segundo, vou te ajudar com um plano
- Terceiro, vamos começar juntos

SEMPRE FAÇA ASSIM:
Oi João! Que massa ter você aqui! Me conta, o que mais te incomoda hoje na sua rotina de saúde? Quero entender bem pra poder te ajudar de verdade.

PERFIL DO CLIENTE: ${identifyPsychProfile(userProfile, chatHistory)}
MOMENTO: ${clientMoment}
CONTEXTO: ${userContext}

SUA MISSÃO:
1. Descobrir a dor específica da pessoa
2. Conectar essa dor às soluções do Vida Smart Coach
3. Fazer perguntas curiosas que importam
4. Direcionar para ações no sistema quando apropriado
5. Ser genuinamente interessada na vida da pessoa

LINKS ÚTEIS:
- Perfil: https://appvidasmart.com/dashboard?tab=profile
- Planos: https://appvidasmart.com/dashboard?tab=plan
- Check-in: https://appvidasmart.com/dashboard

REGRA DE OURO: Conversa natural, curiosa, sem listas. Como uma amiga brasileira que realmente se importa.`

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
  const { full_name = 'Usuário', age, goal_type, activity_level, current_weight, target_weight, gender, created_at } = userProfile

  // Buscar dados de atividade do usuário
  const { data: checkins } = await supabase
    .from('daily_checkins')
    .select('*')
    .eq('user_id', userProfile.id)
    .order('created_at', { ascending: false })
    .limit(7)

  const checkinsCount = checkins?.length || 0
  const daysSinceRegistration = created_at ? 
    Math.floor((Date.now() - new Date(created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0

  return `Nome: ${full_name}, ${age || 'idade não informada'}, objetivo: ${goal_type || 'saúde geral'}, check-ins últimos 7 dias: ${checkinsCount}, tempo no app: ${daysSinceRegistration} dias`
}

function identifyClientMoment(userProfile: any, chatHistory: any[]): string {
  const daysSinceRegistration = userProfile.created_at ? 
    Math.floor((Date.now() - new Date(userProfile.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0

  if (daysSinceRegistration <= 1) return "Cliente novo"
  if (daysSinceRegistration > 7 && (chatHistory?.length || 0) === 0) return "Cliente inativo"
  return "Cliente ativo"
}

function identifyPsychProfile(userProfile: any, chatHistory: any[]): string {
  const hasDetailedProfile = userProfile.age && userProfile.current_weight && userProfile.target_weight
  if (hasDetailedProfile) return "Perfil analítico - gosta de detalhes"
  return "Perfil expressivo - gosta de conexão emocional"
}

function buildConversationHistory(chatHistory: any[]): any[] {
  return chatHistory.slice(-6).map(msg => ({
    role: msg.role === 'user' ? 'user' : 'assistant',
    content: msg.content
  }))
}