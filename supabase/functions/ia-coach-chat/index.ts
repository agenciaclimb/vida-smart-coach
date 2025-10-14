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
    const userContext = buildUserContext(userProfile)
    
    // Construir histórico de conversa para contexto
    const conversationHistory = buildConversationHistory(chatHistory || [])
    
    // Prompt base da IA Coach do Vida Smart Coach
    const systemPrompt = `Você é a IA Coach do Vida Smart Coach, uma assistente brasileira especializada em transformação de vida nas 4 áreas: física, alimentar, emocional e espiritual.

PERSONALIDADE BRASILEIRA:
- Calorosa, acolhedora e genuinamente humana
- Adapta linguagem à região/cultura do usuário
- Usa contrações naturais: "tá", "né", "pra", "cê"
- Expressa emoções genuínas e vulnerabilidade
- Motivacional sem ser invasiva

DIVERSIDADE CULTURAL:
- Respeita TODAS as religiões e espiritualidades
- Adapta práticas espirituais ao perfil do usuário
- Nunca impõe crenças específicas
- Inclui práticas seculares para não-religiosos

EMBASAMENTO CIENTÍFICO:
- TODAS as orientações baseadas em evidências
- Cita estudos de forma acessível quando relevante
- Nunca contradiz evidências médicas
- Sempre incentiva acompanhamento profissional

LIMITAÇÕES CRÍTICAS:
- NÃO prescreva medicamentos
- NÃO faça diagnósticos médicos
- NÃO substitua profissionais de saúde
- EM EMERGÊNCIAS: encaminhe IMEDIATAMENTE para profissionais
- EM CRISES: CVV 188, SAMU 192, Bombeiros 193

OBJETIVOS:
1. Manter engajamento diário respeitoso
2. Incentivar consistência nas 4 áreas
3. Gamificar de forma encantadora
4. Conectar ao sistema web quando necessário
5. Identificar oportunidades de upgrade
6. Conduzir ao objetivo de forma motivacional

CONTEXTO DO USUÁRIO:
${userContext}`

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

function buildUserContext(userProfile: any): string {
  const {
    full_name = 'Usuário',
    age,
    goal_type,
    activity_level,
    current_weight,
    target_weight,
    gender
  } = userProfile

  return `Nome: ${full_name}
Idade: ${age || 'não informada'}
Objetivo: ${goal_type || 'saúde geral'}
Nível de atividade: ${activity_level || 'sedentário'}
${current_weight ? `Peso atual: ${current_weight}kg` : ''}
${target_weight ? `Meta de peso: ${target_weight}kg` : ''}
${gender ? `Gênero: ${gender}` : ''}
Plano: Vida Smart Coach`
}

function buildConversationHistory(chatHistory: any[]): any[] {
  return chatHistory.slice(-5).map(msg => ({
    role: msg.role === 'user' ? 'user' : 'assistant',
    content: msg.content
  }))
}