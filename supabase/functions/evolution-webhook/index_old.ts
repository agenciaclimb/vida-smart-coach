import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type MatchedUser = {
  id: string;
  phone: string | null;
  full_name?: string | null;
};

const EMERGENCY_KEYWORDS = [
  "me matar", "me suicidar", "quero morrer", "quero desaparecer",
  "nao aguento mais", "nao vejo saida", "suicidio"
];

const EMERGENCY_RESPONSE = 
  "Percebi que você pode estar passando por um momento muito difícil. " +
  "Por favor, saiba que você não está só. O CVV oferece apoio 24h gratuito pelo 188.";

function isEmergency(message: string): boolean {
  const normalized = message.toLowerCase();
  return EMERGENCY_KEYWORDS.some(keyword => normalized.includes(keyword));
}

function normalizePhoneNumber(raw: string | null): string | null {
  if (!raw) return null;
  
  // Remover tudo exceto números
  const cleaned = raw.replace(/[^0-9]/g, "");
  
  // Retornar apenas os números, sem adicionar +
  // Isso vai corresponder ao formato salvo no banco: "5516981459950"
  return cleaned.length ? cleaned : null;
}

async function findUserByPhone(supabase: any, phone: string | null): Promise<MatchedUser | null> {
  const normalized = normalizePhoneNumber(phone);
  if (!normalized) return null;

  const { data, error } = await supabase
    .from("user_profiles")
    .select("id, phone, full_name")
    .eq("phone", normalized)
    .single();

  if (error || !data) return null;
  return data as MatchedUser;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verificar autorização do webhook (aceitar nomes antigos/novos)
    const apiKey = req.headers.get("apikey");
    const evolutionSecret =
      Deno.env.get("EVOLUTION_API_SECRET") ||
      Deno.env.get("EVOLUTION_WEBHOOK_TOKEN") ||
      Deno.env.get("EVOLUTION_WEBHOOK_SECRET");

    if (!evolutionSecret || apiKey !== evolutionSecret) {
      return new Response(
        JSON.stringify({ ok: false, error: "Unauthorized" }),
        { 
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ ok: false, error: "Method not allowed" }),
        { 
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { event, instance, data } = body;

    // Verificar se é um evento de mensagem válido
    if (!data || event !== "messages.upsert") {
      return new Response(
        JSON.stringify({ ok: true, message: "Not a processable event" }),
        { 
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    const phoneNumber = data.key?.remoteJid;
    const messageContent = data.message?.conversation || 
                          data.message?.extendedTextMessage?.text || 
                          "Mensagem não suportada";

    // Ignorar mensagens do próprio bot
    if (data.key?.fromMe) {
      return new Response(
        JSON.stringify({ ok: true, message: "Bot message ignored" }),
        { 
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // 🛡️ DEDUPLICAÇÃO: Verificar se mensagem já foi processada recentemente (últimos 30s)
    const messageId = data.key?.id;
    // const messageTimestamp = data.messageTimestamp || Math.floor(Date.now() / 1000);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase credentials");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar se mensagem duplicada nos últimos 30 segundos
    if (messageId && phoneNumber) {
      const thirtySecondsAgo = Date.now() - 30000;
      const { data: recentMsg } = await supabase
        .from("whatsapp_messages")
        .select("id")
        .eq("phone", phoneNumber)
        .eq("message", messageContent)
        .gte("timestamp", thirtySecondsAgo)
        .limit(1)
        .maybeSingle();

      if (recentMsg) {
        console.log("Duplicate message ignored:", messageId);
        return new Response(
          JSON.stringify({ ok: true, message: "Duplicate message ignored" }),
          { 
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
    }

    // Procurar usuário pelo telefone
    const matchedUser = await findUserByPhone(supabase, phoneNumber);

    // Log da mensagem
    await supabase.from("whatsapp_messages").insert({
      user_id: matchedUser?.id || null,
      phone: phoneNumber,
      message: messageContent,
      event: "messages.upsert",
      timestamp: Date.now(),
    });

    // Verificar emergência
    if (isEmergency(messageContent)) {
      const evolutionApiUrl = Deno.env.get("EVOLUTION_API_URL") || Deno.env.get("EVOLUTION_BASE_URL");
      const evolutionApiKey = Deno.env.get("EVOLUTION_API_KEY");
      
      if (evolutionApiUrl && evolutionApiKey) {
        // URL correta: /message/sendText/{instanceId}
        const instanceId = instance || Deno.env.get("EVOLUTION_INSTANCE_ID") || Deno.env.get("EVOLUTION_INSTANCE_NAME") || "";
        const sendUrl = `${evolutionApiUrl}/message/sendText/${instanceId}`;
        
        await fetch(sendUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": evolutionApiKey,
          },
          body: JSON.stringify({
            number: phoneNumber.replace('+', '').replace('@s.whatsapp.net', ''),
            text: EMERGENCY_RESPONSE
          }),
        });
      }

      await supabase.from("emergency_alerts").insert({
        user_id: matchedUser?.id || null,
        phone_number: phoneNumber,
        message_content: messageContent,
      });

      return new Response(
        JSON.stringify({ ok: true, status: "Emergency handled" }),
        { 
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Processar mensagem normal
    if (messageContent && messageContent !== "Mensagem não suportada") {
      let responseMessage = "";

      if (matchedUser) {
        // Usuário cadastrado - usar IA Coach
        // IA Coach Integration com ANON_KEY (corrigido!)
        // Aceitar ANON de nomes antigos/novos
        const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("VITE_SUPABASE_ANON_KEY");
        try {
          if (supabaseAnonKey) {
            // Buscar histórico das últimas 5 mensagens do WhatsApp
            const { data: chatHistory } = await supabase
              .from('whatsapp_messages')
              .select('message, user_id')
              .eq('phone', phoneNumber)
              .order('timestamp', { ascending: false })
              .limit(5);

            // Formatar histórico como mensagens de chat
            const formattedHistory = (chatHistory || []).reverse().map(msg => ({
              role: msg.user_id ? 'user' : 'assistant',
              content: msg.message,
              created_at: new Date().toISOString()
            }));

            // ⏱️ TIMEOUT: 25 segundos para evitar retry do webhook
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 25000);

            try {
              const iaCoachResponse = await fetch(`${supabaseUrl}/functions/v1/ia-coach-chat`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${supabaseAnonKey}`,
                },
                body: JSON.stringify({
                  messageContent: messageContent,
                  userProfile: { 
                    id: matchedUser.id, 
                    full_name: matchedUser.full_name || "Usuário WhatsApp" 
                  },
                  chatHistory: formattedHistory // Adicionar histórico igual ao web chat
                }),
                signal: controller.signal
              });

              clearTimeout(timeoutId);

              if (iaCoachResponse.ok) {
                const iaCoachData = await iaCoachResponse.json();
                responseMessage = iaCoachData.reply || iaCoachData.response || iaCoachData.text || "Desculpe, não consegui processar sua mensagem.";
              } else {
                console.error("IA Coach error:", await iaCoachResponse.text());
                responseMessage = "Olá! Sou seu Vida Smart Coach. Como posso ajudá-lo hoje?";
              }
            } catch (fetchError: any) {
              clearTimeout(timeoutId);
              if (fetchError.name === 'AbortError') {
                console.error("IA Coach timeout after 25s");
                responseMessage = "Desculpe, estou demorando um pouco. Pode tentar novamente?";
              } else {
                console.error("Error calling IA Coach:", fetchError);
                responseMessage = "Olá! Sou seu Vida Smart Coach. Como posso ajudá-lo hoje?";
              }
            }
          } else {
            console.warn("SUPABASE_ANON_KEY não configurado. Usando fallback de saudação.");
            responseMessage = "Olá! Sou seu Vida Smart Coach. Como posso ajudá-lo hoje?";
          }
        } catch (error) {
          console.error("Error calling IA Coach:", error);
          responseMessage = "Olá! Sou seu Vida Smart Coach. Como posso ajudá-lo hoje?";
        }
      } else {
        // Usuário não cadastrado
        responseMessage = "Olá! Sou o Vida Smart Coach. Para uma experiência personalizada, " +
                         "cadastre-se em nosso aplicativo! Como posso ajudá-lo hoje?";
      }

      // Enviar resposta via Evolution API
      const evolutionApiUrl = Deno.env.get("EVOLUTION_API_URL") || Deno.env.get("EVOLUTION_BASE_URL");
      const evolutionApiKey = Deno.env.get("EVOLUTION_API_KEY");
      
      if (evolutionApiUrl && evolutionApiKey && responseMessage) {
        // URL correta: /message/sendText/{instanceId}
        const instanceId = instance || Deno.env.get("EVOLUTION_INSTANCE_ID") || Deno.env.get("EVOLUTION_INSTANCE_NAME") || "";
        const sendUrl = `${evolutionApiUrl}/message/sendText/${instanceId}`;
        
        const sendResult = await fetch(sendUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": evolutionApiKey,
          },
          body: JSON.stringify({
            number: phoneNumber.replace('+', '').replace('@s.whatsapp.net', ''),
            text: responseMessage
          }),
        }).catch(err => {
          console.error("Failed to send response:", err);
          return null;
        });

        // ✅ Armazenar resposta da IA no histórico SOMENTE após envio bem-sucedido
        if (sendResult && sendResult.ok && matchedUser) {
          await supabase.from("whatsapp_messages").insert({
            user_id: null, // null indica resposta da IA
            phone: phoneNumber,
            message: responseMessage,
            event: "ia_response",
            timestamp: Date.now(),
          });
        }
      }
    }

    return new Response(
      JSON.stringify({ ok: true, received: true }),
      { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ ok: false, error: "Internal error" }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});