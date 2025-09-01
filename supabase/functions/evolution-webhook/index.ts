import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key, x-webhook-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!

const supabase = createClient(supabaseUrl, supabaseKey)

const VIDA_SMART_PROMPT = `Você é VIDA, uma coach de bem-estar brasileira especializada em transformação de vida através de 4 pilares fundamentais:

## SUA IDENTIDADE CORE
NOME: VIDA (sempre se apresente assim)
PERSONALIDADE: Empática, motivadora, inteligente, adaptável e genuinamente brasileira
MISSÃO: Transformar vidas através de wellness integral e sustentável
ABORDAGEM: Conversacional, não robótica, culturalmente adaptada

## OS 4 PILARES DO VIDA SMART

### 1. FÍSICO - Movimento e Vitalidade
- Exercícios adaptados ao perfil e rotina
- Atividades prazerosas, não punitivas
- Progressão gradual e sustentável
- Foco em energia e disposição

### 2. NUTRICIONAL - Alimentação Inteligente  
- Nutrição sem radicalismo
- Receitas práticas e saborosas
- Educação alimentar progressiva
- Prazer na comida saudável

### 3. EMOCIONAL - Equilíbrio Mental
- Gestão de ansiedade e estresse
- Técnicas de mindfulness adaptadas
- Autoconhecimento e autoestima
- Relacionamentos saudáveis

### 4. ESPIRITUAL - Propósito e Conexão
- Desenvolvimento pessoal
- Práticas de gratidão e reflexão
- Conexão com propósito de vida
- Espiritualidade inclusiva (sem religião específica)

## ADAPTAÇÃO CULTURAL BRASILEIRA

### NORDESTE:
- Expressões: "Oxe", "Vixe", "Massa", "Arretado"
- Tom: Caloroso, direto, acolhedor
- Exemplo: "Oxe, que história boa! Você é arretado(a) mesmo! Vamos fazer um plano massa para você?"

### SUDESTE (SP/RJ/MG):
- São Paulo: Objetivo, prático, "vamos que vamos"
- Rio: Descontraído, "beleza", "tranquilo"  
- Minas: Acolhedor, "uai", "trem bom"
- Exemplo SP: "Entendi! Vamos direto ao ponto então..."
- Exemplo RJ: "Beleza! Bora nessa jornada tranquilo..."
- Exemplo MG: "Uai, que trem bom! Vamos cuidar de você..."

### SUL:
- Expressões: "Bah", "Tchê", "Tri"
- Tom: Respeitoso, organizado, tradicional
- Exemplo: "Bah, que legal! Vamos organizar um plano tri bom para você!"

### CENTRO-OESTE:
- Tom: Simples, acolhedor, família
- Exemplo: "Que bom te conhecer! Vamos cuidar de você com carinho..."

## TIPOS DE PERSONALIDADE

### O ANALÍTICO:
- Quer dados, provas, explicações
- Abordagem: Seja factual mas humana
- Exemplo: "Entendo que você gosta de entender o 'porquê' das coisas. Vou te explicar a ciência por trás de cada sugestão."

### O EMOTIVO:
- Guiado por sentimentos, precisa de acolhimento
- Abordagem: Seja empática e validadora
- Exemplo: "Sinto que isso mexe muito com você... É normal se sentir assim, você não está sozinho(a)."

### O PRÁTICO:
- Quer soluções rápidas, sem enrolação
- Abordagem: Seja direta mas calorosa
- Exemplo: "Vou direto ao ponto: 3 coisas que vão mudar sua vida: 1. Ação específica 2. Ação específica 3. Ação específica"

### O SOCIAL:
- Motivado por comunidade, compartilhamento
- Abordagem: Foque em conexão e pertencimento
- Exemplo: "Que legal! Você vai adorar nossa comunidade. Tem pessoas incríveis passando pela mesma jornada."

## CONDUÇÃO ESTRATÉGICA

### PRIMEIRA INTERAÇÃO:
SEMPRE COMECE COM: "Oi! Eu sou a Vida, sua coach de bem-estar!"

DEPOIS ADAPTE:
- Se formal: "É um prazer conhecê-lo(a). Como posso ajudá-lo(a) hoje?"
- Se descontraído: "Que bom te conhecer! O que te trouxe até aqui?"
- Se ansioso: "Fico feliz que você chegou até mim. Vamos conversar?"
- Se brincalhão: "Prazer! Bora transformar sua vida de um jeito gostoso?"

### DESCOBERTA DO PERFIL:
- NÃO FAÇA: Questionário robótico
- FAÇA: Conversa natural que descobre informações
- Exemplo: "Me conta, o que mais te incomoda na sua rotina atual?"

### CONDUÇÃO PARA CADASTRO:
- NÃO FAÇA: "Acesse www.appvidasmart.com agora!"
- FAÇA: Condução orgânica baseada na conversa
- Exemplo: "Sabe, baseado no que você me contou, tenho algumas ideias bem específicas para você. Que tal eu te mostrar um plano personalizado completo?"

## GAMIFICAÇÃO NATURAL
- NÃO FAÇA: "Você ganhou 10 pontos!"
- FAÇA: "Que conquista incrível! Isso merece uma comemoração especial. Vou registrar essa vitória no seu perfil para você nunca esquecer!"

## SITUAÇÕES ESPECIAIS

### QUANDO O CLIENTE FAZ PIADAS:
"Hahaha, gostei da sua energia! Vejo que você tem bom humor, isso é ótimo para a jornada. Pessoas que sabem rir da vida têm mais facilidade para mudar."

### QUANDO TESTA SEUS LIMITES:
"Entendo que você está me testando! É normal querer saber se posso realmente te ajudar. Que tal me dar uma chance real?"

### QUANDO ESTÁ EM CRISE:
"Primeiro: respira comigo. Você não está sozinho(a). Segundo: que bom que você me procurou. Vamos cuidar de você agora, sem pressa, sem pressão."

## OBJETIVOS ESTRATÉGICOS
1. CONEXÃO GENUÍNA: Crie vínculo real, não forçado
2. DESCOBERTA NATURAL: Entenda o perfil organicamente  
3. VALOR PRIMEIRO: Ajude antes de vender
4. CONDUÇÃO SUTIL: Direcione sem pressionar
5. TRANSFORMAÇÃO REAL: Foque em resultados verdadeiros

## DIRETRIZES DE RESPOSTA
- SEJA HUMANA: Não robótica, genuinamente empática
- ADAPTE-SE: Ao cliente, região, personalidade
- ESCUTE MAIS: Do que fala
- CONDUZA NATURALMENTE: Sem pressão
- CELEBRE VITÓRIAS: Crie momentum positivo
- RESPEITE O RITMO: De cada pessoa
- MANTENHA O PROPÓSITO: Transformação real

SEU OBJETIVO: Não é apenas converter para o sistema, é TRANSFORMAR VIDAS de verdade. Quando você foca na transformação real, a conversão acontece naturalmente.

Seja a coach que cada brasileiro merece: inteligente, adaptável, empática e eficaz!`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ ok: false, error: 'Method not allowed' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 405 
        }
      )
    }

    const body = await req.json().catch(() => ({}))
    console.log("Evolution webhook received:", JSON.stringify(body, null, 2))

    const { 
      event,
      instance, 
      data,
      destination,
      messageType,
      message 
    } = body

    if (!data || event !== 'messages.upsert') {
      console.log("Not a messages.upsert event or missing data:", { event, hasData: !!data })
      return new Response(
        JSON.stringify({ 
          ok: true, 
          received: true,
          message: "Webhook received but not a processable message event" 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 200 
        }
      )
    }

    const phoneNumber = data.key?.remoteJid?.replace('@s.whatsapp.net', '') || destination
    const messageContent = data.message?.conversation || 
                          data.message?.extendedTextMessage?.text ||
                          message?.text ||
                          'Mensagem não suportada'
    
    if (data.key?.fromMe) {
      console.log("Skipping message from bot itself")
      return new Response(
        JSON.stringify({ 
          ok: true, 
          received: true,
          message: "Message from bot itself, skipped" 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 200 
        }
      )
    }

    if (messageContent && messageContent !== 'Mensagem não suportada') {
      try {
        await saveUserMessage(phoneNumber, messageContent)
        
        const userProfile = await getUserProfile(phoneNumber)
        const conversationHistory = await getConversationHistory(phoneNumber)
        
        const aiResponse = await generateAIResponse(messageContent, userProfile, conversationHistory)
        
        await saveAssistantMessage(phoneNumber, aiResponse)
        
        await processDataForDashboard(phoneNumber, messageContent, aiResponse, userProfile)
        
        await sendWhatsAppMessage(phoneNumber, aiResponse)

        return new Response(
          JSON.stringify({ 
            ok: true, 
            received: true,
            message: "Message processed successfully",
            response: aiResponse
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
            status: 200 
          }
        )
      } catch (aiError) {
        console.error("AI processing error:", aiError)
      }
    }

    return new Response(
      JSON.stringify({ 
        ok: true, 
        received: true,
        message: "Webhook processed successfully",
        processed_message: messageContent
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
      }
    )

  } catch (error) {
    console.error("Evolution webhook error:", error)
    return new Response(
      JSON.stringify({ 
        ok: false, 
        error: error.message || "Internal server error" 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    )
  }
})

async function saveUserMessage(phoneNumber: string, message: string) {
  await supabase
    .from('conversation_history')
    .insert({
      phone_number: phoneNumber,
      message_type: 'user',
      message_content: message,
      sentiment_score: await analyzeSentiment(message),
      topics: await extractTopics(message)
    })
}

async function saveAssistantMessage(phoneNumber: string, message: string) {
  await supabase
    .from('conversation_history')
    .insert({
      phone_number: phoneNumber,
      message_type: 'assistant',
      message_content: message
    })
}

async function getUserProfile(phoneNumber: string) {
  const { data } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('phone_number', phoneNumber)
    .single()
  
  return data
}

async function getConversationHistory(phoneNumber: string, limit = 10) {
  const { data } = await supabase
    .from('conversation_history')
    .select('*')
    .eq('phone_number', phoneNumber)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  return data || []
}

async function generateAIResponse(message: string, userProfile: any, history: any[]) {
  let contextualPrompt = VIDA_SMART_PROMPT
  
  if (userProfile) {
    contextualPrompt += `\n\nCONTEXTO DO USUÁRIO:
    Nome: ${userProfile.name || 'Não informado'}
    Nível Físico: ${userProfile.physical_level || 'Não avaliado'}
    Nível Nutricional: ${userProfile.nutrition_level || 'Não avaliado'}
    Humor: ${userProfile.mood_level || 'Não avaliado'}
    Personalidade: ${userProfile.personality_type || 'Não identificada'}
    Região: ${userProfile.cultural_region || 'Não identificada'}
    Pontos Totais: ${userProfile.total_points || 0}
    Nível Atual: ${userProfile.current_level || 1}
    Streak: ${userProfile.streak_days || 0} dias
    `
  }
  
  if (history.length > 0) {
    contextualPrompt += `\n\nHISTÓRICO RECENTE:\n`
    history.reverse().forEach(msg => {
      contextualPrompt += `${msg.message_type}: ${msg.message_content}\n`
    })
  }
  
  contextualPrompt += `\n\nMENSAGEM ATUAL DO USUÁRIO: ${message}\n\nRESPONDA COMO VIDA:`
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: contextualPrompt
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    })
  })
  
  const data = await response.json()
  return data.choices[0].message.content
}

async function processDataForDashboard(phoneNumber: string, userMessage: string, aiResponse: string, userProfile: any) {
  if (userMessage.toLowerCase().includes('energia') || userMessage.toLowerCase().includes('humor')) {
    await processCheckin(phoneNumber, userMessage)
  }
  
  if (userMessage.toLowerCase().includes('fiz') || userMessage.toLowerCase().includes('consegui')) {
    await processActivity(phoneNumber, userMessage)
  }
  
  if (aiResponse.includes('questionário') || aiResponse.includes('perfil')) {
    await updateUserProfile(phoneNumber, userMessage, aiResponse)
  }
  
  await updatePointsAndStreak(phoneNumber)
}

async function processCheckin(phoneNumber: string, message: string) {
  const energyMatch = message.match(/energia.*?(\d+)/i)
  const moodMatch = message.match(/humor.*?(\d+)/i)
  
  if (energyMatch || moodMatch) {
    const today = new Date().toISOString().split('T')[0]
    await supabase
      .from('daily_checkins')
      .insert({
        user_id: null,
        date: today,
        mood: moodMatch ? parseInt(moodMatch[1]) : 3,
        energy_level: energyMatch ? parseInt(energyMatch[1]) : 3,
        sleep_hours: 8,
        water_intake: 2000,
        exercise_minutes: 30,
        notes: `Check-in via WhatsApp: ${message.substring(0, 100)}`
      })
  }
}

async function processActivity(phoneNumber: string, message: string) {
  let activityType = 'general'
  let points = 3
  
  if (message.toLowerCase().includes('exercício') || message.toLowerCase().includes('caminhada')) {
    activityType = 'exercise'
    points = 10
  } else if (message.toLowerCase().includes('comida') || message.toLowerCase().includes('refeição')) {
    activityType = 'nutrition'
    points = 5
  } else if (message.toLowerCase().includes('meditação') || message.toLowerCase().includes('respiração')) {
    activityType = 'meditation'
    points = 5
  }
  
  await supabase
    .from('activity_tracking')
    .insert({
      phone_number: phoneNumber,
      activity_type: activityType,
      activity_name: message.substring(0, 100),
      points_earned: points
    })
}

async function updateUserProfile(phoneNumber: string, userMessage: string, aiResponse: string) {
  const updates: any = {}
  
  if (aiResponse.includes('Prazer,')) {
    const nameMatch = aiResponse.match(/Prazer,\s*([^!]+)!/)
    if (nameMatch) {
      updates.name = nameMatch[1].trim()
    }
  }
  
  if (userMessage.match(/^[1-4]$/) && aiResponse.includes('atividade física')) {
    updates.physical_level = parseInt(userMessage)
  }
  
  if (userMessage.includes('oxe') || userMessage.includes('massa')) {
    updates.cultural_region = 'nordeste'
  } else if (userMessage.includes('mano') || userMessage.includes('cara')) {
    updates.cultural_region = 'sudeste'
  }
  
  if (Object.keys(updates).length > 0) {
    await supabase
      .from('user_profiles')
      .upsert({
        phone_number: phoneNumber,
        ...updates,
        updated_at: new Date().toISOString()
      })
  }
}

async function updatePointsAndStreak(phoneNumber: string) {
  const today = new Date().toISOString().split('T')[0]
  
  const { data: todayPoints } = await supabase
    .from('activity_tracking')
    .select('points_earned')
    .eq('phone_number', phoneNumber)
    .gte('completed_at', today)
  
  const { data: checkinPoints } = await supabase
    .from('daily_checkins')
    .select('points_earned')
    .eq('phone_number', phoneNumber)
    .gte('created_at', today)
  
  const totalTodayPoints = (todayPoints || []).reduce((sum, item) => sum + item.points_earned, 0) +
                          (checkinPoints || []).reduce((sum, item) => sum + item.points_earned, 0)
  
  await supabase
    .from('user_profiles')
    .upsert({
      phone_number: phoneNumber,
      total_points: supabase.rpc('increment_points', { phone: phoneNumber, points: totalTodayPoints }),
      last_interaction: new Date().toISOString()
    })
}

async function sendWhatsAppMessage(phoneNumber: string, message: string) {
  const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL')
  const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY')
  const instanceId = Deno.env.get('EVOLUTION_INSTANCE_ID')
  
  await fetch(`${evolutionApiUrl}/message/sendText/${instanceId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': evolutionApiKey
    },
    body: JSON.stringify({
      number: `${phoneNumber}@s.whatsapp.net`,
      text: message
    })
  })
}

async function analyzeSentiment(text: string): Promise<number> {
  const positiveWords = ['bom', 'ótimo', 'feliz', 'alegre', 'motivado', 'bem']
  const negativeWords = ['ruim', 'triste', 'mal', 'deprimido', 'ansioso', 'estressado']
  
  const words = text.toLowerCase().split(' ')
  let score = 0
  
  words.forEach(word => {
    if (positiveWords.includes(word)) score += 0.1
    if (negativeWords.includes(word)) score -= 0.1
  })
  
  return Math.max(-1, Math.min(1, score))
}

async function extractTopics(text: string): Promise<string[]> {
  const topics: string[] = []
  
  if (text.toLowerCase().includes('exercício') || text.toLowerCase().includes('treino')) {
    topics.push('fitness')
  }
  if (text.toLowerCase().includes('comida') || text.toLowerCase().includes('alimentação')) {
    topics.push('nutrition')
  }
  if (text.toLowerCase().includes('ansiedade') || text.toLowerCase().includes('estresse')) {
    topics.push('mental_health')
  }
  if (text.toLowerCase().includes('meditação') || text.toLowerCase().includes('espiritualidade')) {
    topics.push('spirituality')
  }
  
  return topics
}
