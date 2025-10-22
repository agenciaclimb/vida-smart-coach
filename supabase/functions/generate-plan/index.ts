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

    // Prompts específicos por tipo de plano
    const planPrompts = {
      physical: `Você é um Personal Trainer expert. Crie um plano de treino personalizado em JSON.

PERFIL:
- Nome: ${profile.full_name}
- Idade: ${profile.age || 'não informada'}
- Peso: ${profile.current_weight || 'não informado'}kg
- Altura: ${profile.height || 'não informada'}cm
- Objetivo: ${profile.goal_type || 'saúde geral'}
- Nível: ${profile.activity_level || 'iniciante'}

ESTRUTURA JSON (IMPORTANTE: retorne APENAS o JSON, sem texto adicional):
{
  "title": "Nome do Plano",
  "description": "Descrição breve",
  "duration_weeks": 4,
  "weeks": [
    {
      "week": 1,
      "focus": "Adaptação",
      "workouts": [
        {
          "day": "Segunda",
          "name": "Treino A - Peito/Tríceps",
          "exercises": [
            {
              "name": "Supino reto",
              "sets": 3,
              "reps": "10-12",
              "rest_seconds": 90,
              "notes": "Foco na execução"
            }
          ]
        }
      ]
    }
  ]
}`,

      nutritional: `Você é um Nutricionista expert. Crie um plano alimentar personalizado em JSON.

PERFIL:
- Nome: ${profile.full_name}
- Idade: ${profile.age || 'não informada'}
- Peso atual: ${profile.current_weight || 'não informado'}kg
- Peso alvo: ${profile.target_weight || 'não informado'}kg
- Objetivo: ${profile.goal_type || 'saúde geral'}
- Restrições: ${profile.dietary_restrictions || 'nenhuma'}

ESTRUTURA JSON (IMPORTANTE: retorne APENAS o JSON, sem texto adicional):
{
  "title": "Plano Nutricional Personalizado",
  "description": "Descrição do plano",
  "daily_calories": 1800,
  "macronutrients": {
    "protein": 130,
    "carbs": 180,
    "fat": 60
  },
  "water_intake_liters": 3,
  "meals": [
    {
      "name": "Café da Manhã",
      "time": "08:00",
      "calories": 350,
      "items": ["Ovos mexidos", "Pão integral", "Fruta"]
    }
  ],
  "tips": ["Dica 1", "Dica 2"]
}`,

      emotional: `Você é um Psicólogo especialista em bem-estar. Crie um plano emocional personalizado em JSON.

PERFIL:
- Nome: ${profile.full_name}
- Idade: ${profile.age || 'não informada'}
- Objetivo: ${profile.goal_type || 'saúde geral'}

ESTRUTURA JSON (IMPORTANTE: retorne APENAS o JSON, sem texto adicional):
{
  "title": "Plano de Bem-Estar Emocional",
  "description": "Rotinas para equilíbrio emocional",
  "focus_areas": ["Reduzir ansiedade", "Melhorar autoestima"],
  "daily_routines": [
    {
      "time": "Manhã",
      "duration_minutes": 10,
      "activity": "Check-in de humor e respiração consciente"
    }
  ],
  "techniques": [
    {
      "name": "Respiração 4-7-8",
      "description": "Técnica para acalmar o sistema nervoso"
    }
  ],
  "weekly_goals": ["Meta 1", "Meta 2"]
}`,

      spiritual: `Você é um Coach espiritual. Crie um plano de crescimento espiritual personalizado em JSON.

PERFIL:
- Nome: ${profile.full_name}
- Idade: ${profile.age || 'não informada'}

ESTRUTURA JSON (IMPORTANTE: retorne APENAS o JSON, sem texto adicional):
{
  "title": "Plano de Crescimento Espiritual",
  "description": "Práticas para conexão e propósito",
  "focus_areas": ["Conexão com propósito", "Gratidão"],
  "daily_practices": [
    {
      "time": "Manhã",
      "activity": "Momento de silêncio e definição de intenção"
    }
  ],
  "weekly_reflection_prompts": [
    "Como vivi meu propósito esta semana?",
    "Que lições aprendi sobre mim mesmo(a)?"
  ],
  "monthly_goals": ["Objetivo 1", "Objetivo 2"]
}`
    };

    const prompt = planPrompts[planType as keyof typeof planPrompts];
    if (!prompt) {
      throw new Error(`Tipo de plano inválido: ${planType}`);
    }

    // Chamar OpenAI
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${openaiKey}`, 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.7,
        response_format: { type: "json_object" },
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista que SEMPRE retorna respostas EXCLUSIVAMENTE em formato JSON válido, sem qualquer texto adicional antes ou depois.'
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
