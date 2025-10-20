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
  const cleaned = raw.replace(/[^0-9+]/g, "");
  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.startsWith("55")) return `+${cleaned}`;
  return cleaned.length ? `+${cleaned}` : null;
}

async function findUserByPhone(supabase: any, phone: string | null): Promise<MatchedUser | null> {
  const normalized = normalizePhoneNumber(phone);
  if (!normalized) return null;

  const { data, error } = await supabase
    .from("user_profiles")
    .select("id, phone")
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
    // Verificar autorização
    const apiKey = req.headers.get("apikey");
    const evolutionSecret = Deno.env.get("EVOLUTION_API_SECRET");
    
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase credentials");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

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
      const evolutionApiUrl = Deno.env.get("EVOLUTION_API_URL");
      const evolutionApiKey = Deno.env.get("EVOLUTION_API_KEY");
      
      if (evolutionApiUrl && evolutionApiKey) {
        await fetch(`${evolutionApiUrl}/send-message`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": evolutionApiKey,
          },
          body: JSON.stringify({
            phone: phoneNumber,
            instanceId: instance,
            message: EMERGENCY_RESPONSE
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
        try {
          const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
          
          if (supabaseAnonKey) {
            const iaCoachResponse = await fetch(`${supabaseUrl}/functions/v1/ia-coach-chat`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${supabaseAnonKey}`,
              },
              body: JSON.stringify({
                message: messageContent,
                user_id: matchedUser.id,
                channel: "whatsapp"
              }),
            });

            if (iaCoachResponse.ok) {
              const iaCoachData = await iaCoachResponse.json();
              responseMessage = iaCoachData.response || "Desculpe, não consegui processar sua mensagem.";
            } else {
              // Fallback simples
              responseMessage = "Olá! Sou seu Vida Smart Coach. Como posso ajudá-lo hoje?";
            }
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
      const evolutionApiUrl = Deno.env.get("EVOLUTION_API_URL");
      const evolutionApiKey = Deno.env.get("EVOLUTION_API_KEY");
      
      if (evolutionApiUrl && evolutionApiKey && responseMessage) {
        await fetch(`${evolutionApiUrl}/send-message`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": evolutionApiKey,
          },
          body: JSON.stringify({
            phone: phoneNumber,
            instanceId: instance,
            message: responseMessage
          }),
        }).catch(err => console.error("Failed to send response:", err));
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