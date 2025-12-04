import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId, planType, userProfile } = await req.json();
    
    if (!userId || !planType) {
      throw new Error('userId e planType são obrigatórios');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      throw new Error('OpenAI API key não configurada');
    }

    // Buscar perfil se não foi fornecido
    let profile = userProfile;
    if (!profile) {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      profile = data;
    }

    // ===== BUSCAR FEEDBACKS PENDENTES DO USUÁRIO =====
    const { data: pendingFeedbacks, error: feedbackError } = await supabase
      .from('plan_feedback')
      .select('*')
      .eq('user_id', userId)
      .eq('plan_type', planType)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (feedbackError) {
      console.error('Erro ao buscar feedbacks:', feedbackError);
      // Não bloqueia a geração, apenas loga o erro
    } else {
      console.log(`📋 Feedbacks pendentes encontrados: ${pendingFeedbacks?.length || 0}`);
    }

    // Construir seção de feedbacks para o prompt
    let feedbackSection = '';
    const feedbackIds: string[] = [];
    
    if (pendingFeedbacks && pendingFeedbacks.length > 0) {
      console.log(`🔄 Incluindo ${pendingFeedbacks.length} feedback(s) no contexto de geração`);
      feedbackSection = '\n\n🔄 FEEDBACKS PENDENTES DO USUÁRIO (IMPORTANTE - INCORPORAR NO PLANO):\n';
      pendingFeedbacks.forEach((fb: any, idx: number) => {
        feedbackSection += `\n${idx + 1}. [${fb.plan_type.toUpperCase()}] "${fb.feedback_text}"\n   (Submetido em: ${new Date(fb.created_at).toLocaleDateString('pt-BR')})`;
        feedbackIds.push(fb.id);
      });
      feedbackSection += '\n\n⚠️ INSTRUÇÃO: Ajuste o plano considerando TODOS os feedbacks acima. Seja específico nas mudanças e valide as sugestões do usuário com empatia.\n';
    } else {
      console.log('ℹ️ Nenhum feedback pendente para este plano');
    }

    // ===== Regeneração: normalizar inputs personalizados para influenciar a IA =====
    // Os diálogos de regeneração enviam campos como goal/experience/limitations etc.
    // Aqui mapeamos esses campos para os utilizados no prompt e reforçamos no PERFIL.
    const normalizeString = (s?: string) => (s || '').toString().toLowerCase();

    const mapExperience = (exp?: string) => {
      const e = normalizeString(exp);
      if (!e) return undefined;
      if (/(inic|begin|start|baixo|low)/.test(e)) return 'beginner';
      if (/(inter|m[eé]dio|moderado)/.test(e)) return 'intermediate';
      if (/(avan|alto|high|experiente|pro)/.test(e)) return 'advanced';
      return undefined;
    };

    const mapGoal = (goal?: string) => {
      const g = normalizeString(goal);
      if (!g) return undefined;
      if (/(massa|hipertrof|ganhar|aumentar m[úu]sculo)/.test(g)) return 'gain_muscle';
      if (/(perder|emagre|defin|gordura|fat)/.test(g)) return 'fat_loss';
      if (/(resist|enduran|cardio)/.test(g)) return 'endurance';
      if (/(for[çc]a|strength)/.test(g)) return 'strength';
      if (/(equil[ií]brio|bem-estar|sa[úu]de)/.test(g)) return 'general_health';
      return undefined;
    };

    // Clonar para evitar mutação inesperada
    profile = { ...profile } as any;
    // Aplicar overrides quando presentes nos inputs
    const expOverride = mapExperience((userProfile as any)?.experience);
    if (expOverride) (profile as any).activity_level = expOverride;
    const goalOverride = mapGoal((userProfile as any)?.goal);
    if (goalOverride) (profile as any).goal_type = goalOverride;

    // Montar observações adicionais para o prompt
    const extraNotes: string[] = [];
    if ((userProfile as any)?.goal) extraNotes.push(`Objetivo específico informado: ${(userProfile as any).goal}`);
    if ((userProfile as any)?.experience) extraNotes.push(`Nível de experiência informado: ${(userProfile as any).experience}`);
    if ((userProfile as any)?.limitations) extraNotes.push(`Limitações/restrições físicas: ${(userProfile as any).limitations}`);
    if ((userProfile as any)?.restrictions) extraNotes.push(`Restrições alimentares: ${(userProfile as any).restrictions}`);
    if ((userProfile as any)?.preferences) extraNotes.push(`Preferências alimentares: ${(userProfile as any).preferences}`);
    if ((userProfile as any)?.challenges) extraNotes.push(`Desafios emocionais: ${(userProfile as any).challenges}`);
    if ((userProfile as any)?.stressors) extraNotes.push(`Fontes de estresse: ${(userProfile as any).stressors}`);
    if ((userProfile as any)?.practices) extraNotes.push(`Práticas espirituais atuais: ${(userProfile as any).practices}`);
    if ((userProfile as any)?.interests) extraNotes.push(`Interesses espirituais: ${(userProfile as any).interests}`);
    if ((userProfile as any)?.time) extraNotes.push(`Tempo diário disponível: ${(userProfile as any).time}`);

    // Prompts específicos por tipo de plano
    const extraSection = extraNotes.length ? `\n\nINFORMAÇÕES ADICIONAIS FORNECIDAS PELO USUÁRIO:\n- ${extraNotes.join('\n- ')}` : '';
    
    // Adicionar seção de feedbacks ao contexto
    const fullExtraSection = extraSection + feedbackSection;

    const planPrompts = {
      physical: `Personal Trainer (NSCA/ACSM). JSON treino 4 semanas.

PERFIL: ${profile.full_name}, ${profile.age || '?'}anos, ${profile.current_weight || '?'}kg, objetivo: ${profile.goal_type || 'saúde'}, nível: ${profile.activity_level || 'iniciante'}

${fullExtraSection}

Retorne JSON:
{"title":"Plano Treino","description":"4 semanas","duration_weeks":4,"weeks":[{"week":1,"focus":"Adaptação","workouts":[{"day":"Segunda","name":"A","exercises":[{"name":"exerc","sets":3,"reps":"8-10","rest_seconds":90,"notes":""}]}]}]}`,

  nutritional: `Nutricionista. JSON alimentar.

PERFIL: ${profile.full_name}, ${profile.age || '?'}anos, ${profile.current_weight || '?'}kg→${profile.target_weight || '?'}kg

${fullExtraSection}

JSON:
{"title":"Nutricional","daily_calories":1800,"macronutrients":{"protein":130,"carbs":180,"fat":60},"meals":[{"name":"Café","time":"08:00","items":["item"]}],"tips":["dica"]}`,

  emotional: `Psicólogo. JSON emocional.

PERFIL: ${profile.full_name}, ${profile.age || '?'}anos

${fullExtraSection}

JSON:
{"title":"Emocional","focus_areas":["área"],"daily_routines":[{"time":"Manhã","activity":"atividade"}],"techniques":[{"name":"técnica","description":"desc"}],"weekly_goals":["meta"]}`,

  spiritual: `Coach espiritual. JSON espiritual.

PERFIL: ${profile.full_name}, ${profile.age || '?'}anos

${fullExtraSection}

JSON:
{"title":"Espiritual","focus_areas":["área"],"daily_practices":[{"time":"Manhã","activity":"prática"}],"weekly_reflection_prompts":["pergunta"],"monthly_goals":["meta"]}`
    };

    const prompt = planPrompts[planType as keyof typeof planPrompts];
    if (!prompt) {
      throw new Error(`Tipo de plano inválido: ${planType}`);
    }

    // Chamar OpenAI (Supabase Edge Function já tem timeout nativo de 60s)
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${openaiKey}`, 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          {
            role: 'system',
            content: 'Especialista que retorna APENAS JSON válido, sem texto adicional.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const planDataRaw = data.choices[0]?.message?.content;
    
    if (!planDataRaw) {
      throw new Error('OpenAI não retornou dados');
    }

    // Parse JSON
    let planData;
    try {
      planData = JSON.parse(planDataRaw);
    } catch (parseError) {
      console.error('Erro ao parsear JSON da OpenAI:', planDataRaw);
      throw new Error('Resposta da IA não é JSON válido');
    }

    // Salvar no banco
    const { data: savedPlan, error: saveError } = await supabase
      .from('user_training_plans')
      .insert({
        user_id: userId,
        plan_type: planType,
        plan_data: planData,
        is_active: true,
        generated_by: 'ai_coach',
        experience_level: profile.activity_level || 'beginner'
      })
      .select()
      .single();

    if (saveError) throw saveError;

    // ===== MARCAR FEEDBACKS COMO PROCESSADOS =====
    if (feedbackIds.length > 0) {
      const { error: updateFeedbackError } = await supabase
        .from('plan_feedback')
        .update({
          status: 'processed',
          processed_at: new Date().toISOString(),
          plan_updated: true,
          ai_response: `Plano ${planType} regenerado incorporando feedback do usuário`
        })
        .in('id', feedbackIds);

      if (updateFeedbackError) {
        console.error('Erro ao atualizar feedbacks:', updateFeedbackError);
        // Não bloqueia a resposta, apenas loga
      } else {
        console.log(`✅ ${feedbackIds.length} feedback(s) marcado(s) como processado(s)`);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      plan: savedPlan,
      feedbacks_processed: feedbackIds.length,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Generate Plan Error:', error);
    return new Response(JSON.stringify({
      error: 'Erro ao gerar plano',
      details: error?.message || String(error)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
