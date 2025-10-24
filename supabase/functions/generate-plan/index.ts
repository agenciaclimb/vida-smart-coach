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

    const planPrompts = {
      physical: `Você é um Personal Trainer com base científica (NSCA/ACSM). Gere um plano de treino em JSON ESTRUTURADO e COMPLETO.

PERFIL:
- Nome: ${profile.full_name}
- Idade: ${profile.age || 'não informada'}
- Peso: ${profile.current_weight || 'não informado'}kg
- Altura: ${profile.height || 'não informada'}cm
- Objetivo: ${profile.goal_type || 'saúde geral'}
- Nível: ${profile.activity_level || 'iniciante'}
- Limitações: ${(userProfile as any)?.limitations || 'nenhuma informada'}

PRINCÍPIOS OBRIGATÓRIOS:
- Periodização curta de 4 semanas: Semana 1 adaptação técnica; Semanas 2-3 progressão; Semana 4 consolidar/deload leve se iniciante. O array "weeks" DEVE ter 4 itens (1,2,3,4).
- Frequência: 3 sessões/semana (Segunda, Quarta, Sexta) ou respeite restrição de tempo se informada.
- Cada treino DEVE ter entre 5 e 7 exercícios (array exercises com 5-7 itens), cobrindo padrões: empurrar, puxar, joelhos/quadris, core.
- Volume semanal por grupo muscular (objetivo hipertrofia): 10-16 séries; força: 8-12 séries pesadas; emagrecimento: 8-12 séries moderadas + 1-2 condicionamentos.
- Faixas de repetições por objetivo: força 3-6; hipertrofia 6-12; resistência/definição 12-20. Ajuste o descanso (força 120-180s; hipertrofia 60-120s; resistência 30-60s).
- Respeite limitações (ex.: joelho/coluna): substitua exercícios por variações seguras e acrescente nota.
- Inclua pelo menos 1 exercício de core por sessão.
- Progrida semana a semana (em sets, reps OU carga sugerida) e registre em notes: "Progredir +1-2 reps ou +2,5-5%".

FORMATO JSON (RETORNE SOMENTE O JSON VÁLIDO):
{
  "title": "Plano de Treino ${profile.goal_type || 'Personalizado'}",
  "description": "Plano de ${profile.activity_level || 'iniciante'} focado em ${profile.goal_type || 'saúde'} com progressão semanal",
  "duration_weeks": 4,
  "weeks": [
    {
      "week": 1,
      "focus": "Adaptação técnica e mobilidade",
      "workouts": [
        {
          "day": "Segunda",
          "name": "Treino A - Peito/Tríceps e Core",
          "exercises": [
            { "name": "Supino reto", "sets": 3, "reps": "8-10", "rest_seconds": 90, "notes": "Técnica; RPE 6-7" },
            { "name": "Supino inclinado com halteres", "sets": 3, "reps": "10-12", "rest_seconds": 90, "notes": "Controle excêntrico" },
            { "name": "Crucifixo em máquina", "sets": 3, "reps": "12-15", "rest_seconds": 60, "notes": "Amplitude confortável" },
            { "name": "Tríceps testa ou corda", "sets": 3, "reps": "10-12", "rest_seconds": 60, "notes": "Evite dor nas articulações" },
            { "name": "Prancha", "sets": 3, "reps": "30-45s", "rest_seconds": 45, "notes": "Core estável" }
          ]
        },
        {
          "day": "Quarta",
          "name": "Treino B - Costas/Bíceps e Core",
          "exercises": [
            { "name": "Remada curvada ou máquina", "sets": 3, "reps": "8-12", "rest_seconds": 90, "notes": "Coluna neutra" },
            { "name": "Puxada na frente", "sets": 3, "reps": "10-12", "rest_seconds": 90, "notes": "Controle escapular" },
            { "name": "Remada baixa", "sets": 3, "reps": "10-12", "rest_seconds": 90, "notes": "Amplitude completa" },
            { "name": "Rosca direta", "sets": 3, "reps": "10-12", "rest_seconds": 60, "notes": "Evite balanço" },
            { "name": "Prancha lateral", "sets": 3, "reps": "25-40s", "rest_seconds": 45, "notes": "Core anti-rotação" }
          ]
        },
        {
          "day": "Sexta",
          "name": "Treino C - Pernas/Glúteos e Core",
          "exercises": [
            { "name": "Agachamento livre ou goblet", "sets": 3, "reps": "8-10", "rest_seconds": 120, "notes": "Se joelho sensível, agachamento caixa" },
            { "name": "Levantamento terra romeno", "sets": 3, "reps": "8-10", "rest_seconds": 120, "notes": "Quadril dominante" },
            { "name": "Leg press ou passada", "sets": 3, "reps": "10-12", "rest_seconds": 90, "notes": "Amplitude confortável" },
            { "name": "Elevação pélvica (hip thrust)", "sets": 3, "reps": "10-12", "rest_seconds": 90, "notes": "Foco em glúteos" },
            { "name": "Abdominal infra", "sets": 3, "reps": "12-15", "rest_seconds": 45, "notes": "Controle lombar" }
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

${extraSection}

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

${extraSection}

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

${extraSection}

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
  temperature: 0.4,
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
