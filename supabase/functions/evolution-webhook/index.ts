import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { cors } from "../_shared/cors.ts";

type SupabaseClient = ReturnType<typeof createClient>;

type MatchedUser = {
  id: string;
  phone: string | null;
  cultural_context?: string;
  spiritual_belief?: string;
};

const EMERGENCY_KEYWORDS = [
  "me matar",
  "me suicidar",
  "quero morrer",
  "quero desaparecer",
  "nao aguento mais",
  "nao vejo saida",
  "me cortar",
  "automutilacao",
  "suicidio",
  "desistir de tudo",
];

const EMERGENCY_RESPONSE =
  "Percebi que voce pode estar passando por um momento muito dificil. " +
  "Por favor, saiba que voce nao esta so e que ajuda esta disponivel. " +
  "O Centro de Valorizacao da Vida (CVV) oferece apoio emocional gratuito e sigiloso, 24 horas por dia. " +
  "Ligue para 188 ou acesse cvv.org.br. Sua vida e muito importante.";

const isEmergency = (message: string): boolean => {
  const normalized = message.toLowerCase();
  return EMERGENCY_KEYWORDS.some((keyword) => normalized.includes(keyword));
};

function buildSystemPrompt(user: MatchedUser | null): string {
  let prompt =
    "Voce e o Vida Smart Coach, um assistente de IA especializado em wellness e saude. " +
    "Responda de forma amigavel, motivadora e com dicas praticas sobre saude fisica, alimentacao, " +
    "bem-estar emocional e crescimento espiritual. Mantenha as respostas concisas e uteis.";

  if (user?.cultural_context) {
    prompt += ` Considere o contexto cultural do usuario: ${user.cultural_context}. Adapte linguagem e exemplos.`;
  }

  if (user?.spiritual_belief) {
    prompt += ` O usuario possui uma crenca espiritual: ${user.spiritual_belief}. Integre referencias respeitosas.`;
  }

  return prompt;
}

function normalizePhoneNumber(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const withoutSuffix = raw.includes("@") ? raw.split("@")[0] : raw;
  const cleaned = withoutSuffix.replace(/[^0-9+]/g, "");
  if (cleaned.startsWith("+")) {
    return cleaned;
  }
  if (cleaned.startsWith("55")) {
    return `+${cleaned}`;
  }
  return cleaned.length ? `+${cleaned}` : null;
}

async function findUserByPhone(client: SupabaseClient, originalPhone: string | null): Promise<MatchedUser | null> {
  const normalized = normalizePhoneNumber(originalPhone);
  if (!normalized) return null;

  const candidates = new Set<string>();
  candidates.add(normalized);

  const digitsOnly = normalized.replace(/[^0-9]/g, "");
  if (digitsOnly.length) {
    candidates.add(digitsOnly);
  }

  if (!normalized.startsWith("+")) {
    candidates.add(`+${normalized}`);
  }

  const { data, error } = await client
    .from("user_profiles")
    .select("id, phone, cultural_context, spiritual_belief")
    .in("phone", Array.from(candidates));

  if (error) {
    console.error("Error trying to map phone to user:", error);
    return null;
  }

  return data && data.length ? (data[0] as MatchedUser) : null;
}

serve(async (req) => {
  const headers = cors(req.headers.get("origin"));
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers });
  }

  const apiKey = req.headers.get("apikey");
  const evolutionApiSecret = Deno.env.get("EVOLUTION_API_SECRET");

  if (!evolutionApiSecret || apiKey !== evolutionApiSecret) {
    console.error("Unauthorized webhook access attempt");
    return new Response(
      JSON.stringify({ ok: false, error: "Unauthorized" }),
      { headers: { ...headers, "Content-Type": "application/json" }, status: 401 },
    );
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ ok: false, error: "Method not allowed" }),
        { headers: { ...headers, "Content-Type": "application/json" }, status: 405 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { event, instance, data, destination, message } = body;

    if (!data || event !== "messages.upsert") {
      return new Response(
        JSON.stringify({ ok: true, message: "Not a processable message event" }),
        { headers: { ...headers, "Content-Type": "application/json" }, status: 200 },
      );
    }

    const phoneNumber = data.key?.remoteJid || destination;
    const messageContent =
      data.message?.conversation ||
      data.message?.extendedTextMessage?.text ||
      message?.text ||
      "Mensagem nao suportada";

    if (data.key?.fromMe) {
      return new Response(
        JSON.stringify({ ok: true, message: "Skipped message from bot" }),
        { headers: { ...headers, "Content-Type": "application/json" }, status: 200 },
      );
    }

    const matchedUser = await findUserByPhone(supabase, phoneNumber);

    await supabase.from("whatsapp_messages").insert({
      user_id: matchedUser?.id ?? null,
      phone_number: phoneNumber,
      normalized_phone: normalizePhoneNumber(phoneNumber),
      message_content: messageContent,
      webhook_data: body,
      received_at: new Date().toISOString(),
      instance_id: instance,
    });

    if (isEmergency(messageContent)) {
      console.warn(`EMERGENCY DETECTED for phone: ${phoneNumber}.`);
      await fetch("https://evolution.api/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneNumber, instanceId: instance, message: EMERGENCY_RESPONSE }),
      }).catch((err) => console.error("Failed to send emergency response:", err));

      await supabase.from("emergency_alerts").insert({
        user_id: matchedUser?.id ?? null,
        phone_number: phoneNumber,
        message_content: messageContent,
      });

      return new Response(
        JSON.stringify({ ok: true, status: "Emergency protocol activated" }),
        { headers, status: 200 },
      );
    }

    if (messageContent && messageContent !== "Mensagem nao suportada") {
      const openaiKey = Deno.env.get("OPENAI_API_KEY");
      if (openaiKey) {
        const systemPrompt = buildSystemPrompt(matchedUser);
        const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${openaiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: messageContent },
            ],
            max_tokens: 500,
            temperature: 0.7,
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const aiMessage = aiData.choices?.[0]?.message?.content;
          if (aiMessage) {
            await fetch("https://evolution.api/send-message", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ phone: phoneNumber, instanceId: instance, message: aiMessage }),
            }).catch((err) => console.error("Failed to send AI response:", err));
          }
        } else {
          console.error("AI response error", await aiResponse.text());
        }
      }
    }

    return new Response(
      JSON.stringify({ ok: true, received: true }),
      { headers, status: 200 },
    );
  } catch (error) {
    console.error("Unhandled webhook error:", error);
    return new Response(
      JSON.stringify({ ok: false, error: "Internal error" }),
      { headers, status: 500 },
    );
  }
});