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

    // Usar perfil fornecido (obrigatório para performance)
    const profile = userProfile;
    if (!profile) {
      throw new Error('userProfile é obrigatório');
    }

    // Contexto extra simplificado
    const extraInfo = (userProfile as any)?.limitations ? `Limitações: ${(userProfile as any).limitations}` : '';

    const planPrompts = {
      physical: `Personal Trainer. JSON 4 semanas: ${profile.full_name || 'User'}, ${profile.age || 30}anos, ${profile.current_weight || 70}kg, ${profile.goal_type || 'saúde'}, ${profile.activity_level || 'iniciante'}. ${extraInfo}
Retorne: {"title":"Plano","duration_weeks":4,"weeks":[{"week":1,"focus":"Adaptação","workouts":[{"day":"Seg","exercises":[{"name":"exerc","sets":3,"reps":"8-10","rest_seconds":90}]}]}]}`,

      nutritional: `Nutricionista. JSON: ${profile.full_name || 'User'}, ${profile.age || 30}anos, ${profile.current_weight || 70}kg→${profile.target_weight || 65}kg. ${extraInfo}
Retorne: {"title":"Nutricional","daily_calories":1800,"macronutrients":{"protein":130,"carbs":180,"fat":60},"meals":[{"name":"Café","time":"08:00","items":["item"]}]}`,

      emotional: `Psicólogo. JSON: ${profile.full_name || 'User'}, ${profile.age || 30}anos. ${extraInfo}
Retorne: {"title":"Emocional","focus_areas":["área"],"daily_routines":[{"time":"Manhã","activity":"atividade"}],"techniques":[{"name":"técnica"}]}`,

      spiritual: `Coach. JSON: ${profile.full_name || 'User'}, ${profile.age || 30}anos. ${extraInfo}
Retorne: {"title":"Espiritual","focus_areas":["área"],"daily_practices":[{"time":"Manhã","activity":"prática"}],"monthly_goals":["meta"]}`
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
      const errorText = await response.text();
      console.error('OpenAI Error:', response.status, errorText);
      throw new Error(`OpenAI: ${response.status}`);
    }

    const data = await response.json();
    const planDataRaw = data.choices[0]?.message?.content;
    
    if (!planDataRaw) {
      console.error('OpenAI response:', JSON.stringify(data));
      throw new Error('OpenAI empty response');
    }

    // Parse JSON
    let planData;
    try {
      planData = JSON.parse(planDataRaw);
      console.log('✅ JSON parsed OK');
    } catch (parseError) {
      console.error('Parse error:', planDataRaw.substring(0, 200));
      throw new Error(`JSON inválido: ${parseError}`);
    }

    // Salvar no banco
    console.log('💾 Salvando no banco...');
    const { data: savedPlan, error: saveError } = await supabase
      .from('user_training_plans')
      .insert({
        user_id: userId,
        plan_type: planType,
        plan_data: planData,
        is_active: true,
        generated_by: 'ai_coach_v2',
        experience_level: profile.activity_level || 'beginner'
      })
      .select()
      .single();

    if (saveError) {
      console.error('DB Error:', JSON.stringify(saveError));
      throw new Error(`DB: ${saveError.message}`);
    }
    
    console.log('✅ Plano salvo:', savedPlan.id);

    return new Response(JSON.stringify({
      success: true,
      plan: savedPlan,
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
