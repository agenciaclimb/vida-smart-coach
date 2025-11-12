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
  const url = new URL(req.url);
  const debugParam = url.searchParams.get('debug');
  const debug = debugParam === '1' || debugParam === 'true';
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

    // Setup Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase credentials");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 🛡️ DEDUPLICAÇÃO CORRIGIDA: Salvar mensagem PRIMEIRO, depois verificar duplicatas
    const messageId = data.key?.id;
    
    // Procurar usuário pelo telefone
    const matchedUser = await findUserByPhone(supabase, phoneNumber);
    
    // Normalizar telefone para storage consistente (sem @s.whatsapp.net)
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    
    console.log('📞 Phone lookup:', {
      raw: phoneNumber,
      normalized: normalizedPhone,
      matched: !!matchedUser,
      userId: matchedUser?.id,
      userName: matchedUser?.full_name,
    });

    // Log da mensagem recebida
    const currentTimestamp = Date.now();
    await supabase.from("whatsapp_messages").insert({
      user_id: matchedUser?.id || null,
      phone: normalizedPhone,  // Usar normalizado para busca consistente
      message: messageContent,
      event: "messages.upsert",
      timestamp: currentTimestamp,
    });

    // Verificar se já existem outras mensagens idênticas recentes (últimos 30s)
    if (messageId && phoneNumber) {
      const thirtySecondsAgo = currentTimestamp - 30000;
      const { count } = await supabase
        .from("whatsapp_messages")
        .select("*", { count: 'exact', head: true })
        .eq("phone", normalizedPhone)  // Usar normalizado para deduplicação
        .eq("message", messageContent)
        .eq("event", "messages.upsert")
        .gte("timestamp", thirtySecondsAgo);

      // Se count >= 2 (incluindo a que acabamos de inserir), é duplicação
      if (count && count >= 2) {
        console.log("Duplicate message ignored:", messageId, "count:", count);
        return new Response(
          JSON.stringify({ ok: true, message: "Duplicate message ignored" }),
          { 
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
    }

    // Se debug=env, retornar presença das variáveis de ambiente (mascaradas)
    if (debugParam === 'env') {
      const dbg = {
        EVOLUTION_API_URL: !!(Deno.env.get('EVOLUTION_API_URL') || Deno.env.get('EVOLUTION_BASE_URL')),
        EVOLUTION_API_KEY: !!Deno.env.get('EVOLUTION_API_KEY'),
        EVOLUTION_API_TOKEN: !!Deno.env.get('EVOLUTION_API_TOKEN'),
        EVOLUTION_API_SECRET: !!Deno.env.get('EVOLUTION_API_SECRET'),
        EVOLUTION_INSTANCE_ID: !!(Deno.env.get('EVOLUTION_INSTANCE_ID') || Deno.env.get('EVOLUTION_INSTANCE_NAME')),
        SUPABASE_URL: !!Deno.env.get('SUPABASE_URL'),
        SUPABASE_ANON_KEY: !!(Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('VITE_SUPABASE_ANON_KEY')),
        SUPABASE_SERVICE_ROLE_KEY: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
      };
      return new Response(JSON.stringify({ ok: true, debug: 'env', present: dbg }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Verificar emergência
    if (isEmergency(messageContent)) {
      const evolutionApiUrl = Deno.env.get("EVOLUTION_API_URL") || Deno.env.get("EVOLUTION_BASE_URL");
      const evolutionToken =
        Deno.env.get("EVOLUTION_API_TOKEN") ||
        Deno.env.get("EVOLUTION_API_SECRET") ||
        Deno.env.get("EVOLUTION_API_KEY");
      
      if (evolutionApiUrl && evolutionToken) {
        // URL correta: /message/sendText/{instanceId}
        const instanceId = instance || Deno.env.get("EVOLUTION_INSTANCE_ID") || Deno.env.get("EVOLUTION_INSTANCE_NAME") || "";
        const sendUrl = `${evolutionApiUrl}/message/sendText/${instanceId}`;
        
        await fetch(sendUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": evolutionToken,
          },
          body: JSON.stringify({
            number: phoneNumber.replace('@s.whatsapp.net', '').replace(/\D/g, ''),
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
  let iaDebug: { ok?: boolean; stage?: string; replyLength?: number; status?: number } = {};

      if (matchedUser) {
        // Usuário cadastrado - usar IA Coach
        const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("VITE_SUPABASE_ANON_KEY");
        try {
          // Prefer SERVICE ROLE for server-to-server reliability; fall back to ANON if missing
          const iaAuthToken = supabaseKey || supabaseAnonKey;
          if (iaAuthToken) {
            // Buscar histórico das últimas 10 mensagens do WhatsApp (usar telefone normalizado)
            const { data: chatHistory } = await supabase
              .from('whatsapp_messages')
              .select('message, user_id, timestamp')
              .eq('phone', normalizedPhone)
              .order('timestamp', { ascending: false })
              .limit(10);

            console.log('💬 Chat history:', {
              count: chatHistory?.length || 0,
              phone: normalizedPhone,
            });

            // Formatar histórico como mensagens de chat (ordenar do mais antigo ao mais recente)
            const formattedHistory = (chatHistory || []).reverse().map(msg => ({
              role: msg.user_id ? 'user' : 'assistant',
              content: msg.message,
              created_at: new Date(msg.timestamp).toISOString()
            }));

            // Verificar se a última mensagem da IA foi idêntica à penúltima (loop detection)
            const lastAssistantMessages = formattedHistory
              .filter(m => m.role === 'assistant')
              .slice(-2);
            
            const isLooping = lastAssistantMessages.length >= 2 && 
                             lastAssistantMessages[0].content === lastAssistantMessages[1].content;

            // ⏱️ TIMEOUT: 120 segundos para evitar cancelar a IA durante a regeneracao de plano
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 120000);

            try {
              // Injetar aviso anti-loop se detectado
              let effectiveMessageContent = messageContent;
              if (isLooping) {
                effectiveMessageContent = `[SYSTEM: A última resposta da IA foi repetida. AVANCE para uma nova pergunta ou área diferente.]\nUsuário: ${messageContent}`;
              }

              const iaCoachResponse = await fetch(`${supabaseUrl}/functions/v1/ia-coach-chat`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  // Use whichever token is available/valid for this project (anon preferred, else service role)
                  "Authorization": `Bearer ${iaAuthToken}`,
                  // 🔐 Segredo interno para validar chamada entre funções
                  "X-Internal-Secret": Deno.env.get('INTERNAL_FUNCTION_SECRET') || '',
                },
                body: JSON.stringify({
                  messageContent: effectiveMessageContent,
                  userProfile: { 
                    id: matchedUser.id, 
                    full_name: matchedUser.full_name || "Usuário WhatsApp" 
                  },
                  chatHistory: formattedHistory
                }),
                signal: controller.signal
              });

              clearTimeout(timeoutId);

              iaDebug.status = iaCoachResponse.status;
              if (iaCoachResponse.ok) {
                const iaCoachData = await iaCoachResponse.json();
                responseMessage = iaCoachData.reply || iaCoachData.response || iaCoachData.text || "Desculpe, não consegui processar sua mensagem.";
                console.log('🤖 IA Coach:', {
                  stage: iaCoachData.stage,
                  replyLength: responseMessage.length,
                  loopDetected: isLooping,
                });
                iaDebug.ok = true;
                iaDebug.stage = iaCoachData.stage;
                iaDebug.replyLength = responseMessage.length;

                // 🔧 NOVO: Executar ações solicitadas pela IA (ex.: gerar plano)
                const actions = Array.isArray(iaCoachData.actions) ? iaCoachData.actions : [];
                for (const action of actions) {
                  if (!action || typeof action !== 'object') continue;
                  if (action.type === 'generate_plan') {
                    // Avisar o usuário ANTES de gerar (para evitar delay percebido)
                    const planTypeLabel = action.planType === 'nutritional' ? 'nutricional' : action.planType === 'emotional' ? 'emocional' : action.planType === 'spiritual' ? 'espiritual' : 'físico';
                    const preGenMsg = `Vou gerar seu plano ${planTypeLabel} agora. Te aviso quando estiver pronto! ⏳`;
                    
                    // Enviar aviso imediato via Evolution
                    const evolutionApiUrl = Deno.env.get("EVOLUTION_API_URL") || Deno.env.get("EVOLUTION_BASE_URL");
                    const evolutionToken = Deno.env.get("EVOLUTION_API_TOKEN") || Deno.env.get("EVOLUTION_API_SECRET") || Deno.env.get("EVOLUTION_API_KEY");
                    if (evolutionApiUrl && evolutionToken) {
                      const instanceId = instance || Deno.env.get("EVOLUTION_INSTANCE_ID") || Deno.env.get("EVOLUTION_INSTANCE_NAME") || "";
                      const sendUrl = `${evolutionApiUrl}/message/sendText/${instanceId}`;
                      await fetch(sendUrl, {
                        method: "POST",
                        headers: { "Content-Type": "application/json", "apikey": evolutionToken },
                        body: JSON.stringify({ number: phoneNumber.replace('@s.whatsapp.net', '').replace(/\D/g, ''), text: preGenMsg })
                      }).catch(err => console.warn('warn: pre-gen notification failed', err));
                    }

                    try {
                      // Desativar planos anteriores do mesmo tipo para evitar múltiplos ativos
                      try {
                        await supabase
                          .from('user_training_plans')
                          .update({ is_active: false })
                          .eq('user_id', matchedUser.id)
                          .eq('plan_type', action.planType || 'physical');
                      } catch (_deactErr) {
                        console.warn('warn: could not deactivate previous plans', _deactErr);
                      }

                      const overrides = action.overrides || {};
                      const payload = {
                        userId: matchedUser.id,
                        planType: action.planType || 'physical',
                        userProfile: {
                          id: matchedUser.id,
                          full_name: matchedUser.full_name || 'Usuário',
                          // Espalhar overrides diretamente sem aninhá-los novamente
                          goal: overrides.goal,
                          experience: overrides.experience,
                          limitations: overrides.limitations,
                          schedule: overrides.schedule,
                          preferences: overrides.preferences,
                          restrictions: overrides.restrictions,
                          challenges: overrides.challenges,
                          stressors: overrides.stressors,
                          practices: overrides.practices,
                          interests: overrides.interests,
                          time: overrides.time
                        }
                      };

                      const doCall = () => fetch(`${supabaseUrl}/functions/v1/generate-plan`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${supabaseKey}`,
                          'X-Internal-Secret': Deno.env.get('INTERNAL_FUNCTION_SECRET') || ''
                        },
                        body: JSON.stringify(payload)
                      });

                      console.log('[generate_plan action] calling generate-plan:', { userId: matchedUser.id, planType: action.planType || 'physical', overrides });
                      let genRes = await doCall();
                      let errDetails = '';
                      if (!genRes.ok) {
                        errDetails = await genRes.text().catch(() => '');
                        console.error('[generate_plan] first call failed:', { status: genRes.status, body: errDetails });
                        // Retry once after brief delay
                        await new Promise(r => setTimeout(r, 500));
                        genRes = await doCall();
                        if (!genRes.ok) {
                          const errDetails2 = await genRes.text().catch(() => '');
                          console.error('[generate_plan] retry also failed:', { status: genRes.status, body: errDetails2 });
                          errDetails = errDetails2 || errDetails;
                        }
                      }

                      // Enviar confirmação/falha via Evolution (substitui a linha técnica no responseMessage)
                      let postGenMsg = '';
                      if (genRes.ok) {
                        const json = await genRes.json().catch(() => ({}));
                        console.log('[generate_plan action] success:', json?.plan?.id);
                        postGenMsg = `✅ Pronto! Seu plano ${planTypeLabel} foi gerado com sucesso. Abra o app em "Meu Plano" para conferir os detalhes.`;
                      } else {
                        console.error('[generate_plan] final fail details:', { status: genRes.status, errDetails });
                        postGenMsg = `⚠️ Tive um imprevisto técnico ao gerar o plano (${genRes.status}). Posso tentar novamente em alguns minutos ou você pode gerar pelo app em "Meu Plano".`;
                      }
                      
                      // Enviar resultado via Evolution
                      if (evolutionApiUrl && evolutionToken && postGenMsg) {
                        const instanceId = instance || Deno.env.get("EVOLUTION_INSTANCE_ID") || Deno.env.get("EVOLUTION_INSTANCE_NAME") || "";
                        const sendUrl = `${evolutionApiUrl}/message/sendText/${instanceId}`;
                        await fetch(sendUrl, {
                          method: "POST",
                          headers: { "Content-Type": "application/json", "apikey": evolutionToken },
                          body: JSON.stringify({ number: phoneNumber.replace('@s.whatsapp.net', '').replace(/\D/g, ''), text: postGenMsg })
                        }).catch(err => console.warn('warn: post-gen notification failed', err));
                      }

                    } catch (genErr) {
                      console.error('generate-plan error:', genErr);
                      const fallbackMsg = `⚠️ Tive um probleminha para gerar o plano agora. Vou monitorar por aqui, mas se preferir, você pode gerar pelo app na aba "Meu Plano".`;
                      if (evolutionApiUrl && evolutionToken) {
                        const instanceId = instance || Deno.env.get("EVOLUTION_INSTANCE_ID") || Deno.env.get("EVOLUTION_INSTANCE_NAME") || "";
                        const sendUrl = `${evolutionApiUrl}/message/sendText/${instanceId}`;
                        await fetch(sendUrl, {
                          method: "POST",
                          headers: { "Content-Type": "application/json", "apikey": evolutionToken },
                          body: JSON.stringify({ number: phoneNumber.replace('@s.whatsapp.net', '').replace(/\D/g, ''), text: fallbackMsg })
                        }).catch(err => console.warn('warn: fallback notification failed', err));
                      }
                    }
                  }
                }
              } else {
                console.error("IA Coach error:", await iaCoachResponse.text());
                responseMessage = "Olá! Sou seu Vida Smart Coach. Como posso ajudá-lo hoje?";
                iaDebug.ok = false;
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
            console.warn("Nenhum token JWT disponível (ANON ou SERVICE). Usando fallback de saudação.");
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

      // Se estiver em modo debug simples, retornar sem enviar para Evolution
      if (debug) {
        return new Response(
          JSON.stringify({ ok: true, debug: true, responseMessage, phoneNumber, matchedUser, iaDebug }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Enviar resposta via Evolution API
      const evolutionApiUrl = Deno.env.get("EVOLUTION_API_URL") || Deno.env.get("EVOLUTION_BASE_URL");
      const evolutionToken =
        Deno.env.get("EVOLUTION_API_TOKEN") ||
        Deno.env.get("EVOLUTION_API_SECRET") ||
        Deno.env.get("EVOLUTION_API_KEY");
      
      if (evolutionApiUrl && evolutionToken && responseMessage) {
        // URL correta: /message/sendText/{instanceId}
        const instanceId = instance || Deno.env.get("EVOLUTION_INSTANCE_ID") || Deno.env.get("EVOLUTION_INSTANCE_NAME") || "";
        const sendUrl = `${evolutionApiUrl}/message/sendText/${instanceId}`;
        
        const sendResult = await fetch(sendUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": evolutionToken,
          },
          body: JSON.stringify({
            number: phoneNumber.replace('@s.whatsapp.net', '').replace(/\D/g, ''),
            text: responseMessage
          }),
        }).catch(err => {
          console.error("Failed to send response:", err);
          return null;
        });

        // Se debug=send, retornar o status e corpo da Evolution sem salvar histórico
        if (debugParam === 'send') {
          const dbgStatus = sendResult ? sendResult.status : null;
          const dbgText = sendResult ? (await sendResult.text().catch(() => '')) : 'no-response';
          return new Response(
            JSON.stringify({ ok: !!(sendResult && sendResult.ok), debug: 'send', status: dbgStatus, body: dbgText, url: sendUrl }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (sendResult && !sendResult.ok) {
          const errText = await sendResult.text().catch(() => '');
          console.error("Evolution send failed:", sendResult.status, errText);
        }

        // ✅ Armazenar resposta da IA no histórico SOMENTE após envio bem-sucedido
        if (sendResult && sendResult.ok && matchedUser) {
          await supabase.from("whatsapp_messages").insert({
            user_id: null, // null indica resposta da IA
            phone: normalizedPhone,  // Usar normalizado para busca consistente
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
