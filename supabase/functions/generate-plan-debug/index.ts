import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTotal = Date.now();
  const timings: Record<string, number> = {};

  try {
    const { userId, planType } = await req.json();
    timings['parse_request'] = Date.now() - startTotal;
    
    if (!userId || !planType) {
      throw new Error('userId e planType obrigatórios');
    }

    // 1. TESTE: Conectar Supabase
    const t1 = Date.now();
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    timings['supabase_connect'] = Date.now() - t1;

    // 2. TESTE: Buscar OpenAI Key
    const t2 = Date.now();
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      throw new Error('OpenAI API key não configurada');
    }
    timings['get_openai_key'] = Date.now() - t2;

    // 3. TESTE: Query simples no banco
    const t3 = Date.now();
    const { data: testQuery, error: testError } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1);
    timings['db_test_query'] = Date.now() - t3;
    
    if (testError) {
      console.error('DB Error:', testError);
    }

    // 4. TESTE: Chamada OpenAI MÍNIMA
    const t4 = Date.now();
    const prompt = `Retorne JSON: {"title":"Plano Teste","description":"teste","duration_weeks":1}`;
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${openaiKey}`, 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.4,
        max_tokens: 150,
        response_format: { type: "json_object" },
        messages: [
          {
            role: 'system',
            content: 'Retorne APENAS JSON válido.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });
    timings['openai_call'] = Date.now() - t4;

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI Error ${response.status}: ${errorText}`);
    }

    // 5. TESTE: Parse response
    const t5 = Date.now();
    const data = await response.json();
    const planData = JSON.parse(data.choices[0]?.message?.content || '{}');
    timings['parse_openai_response'] = Date.now() - t5;

    // 6. TESTE: Insert simples no banco
    const t6 = Date.now();
    const { error: saveError } = await supabase
      .from('user_training_plans')
      .insert({
        user_id: userId,
        plan_type: planType,
        plan_data: planData,
        is_active: true,
        generated_by: 'ai_coach_debug',
        experience_level: 'test'
      });
    timings['db_insert'] = Date.now() - t6;

    if (saveError) {
      console.error('Save Error:', saveError);
    }

    timings['total'] = Date.now() - startTotal;

    return new Response(JSON.stringify({
      success: true,
      timings,
      message: 'Diagnóstico completo',
      bottleneck: Object.entries(timings).sort((a, b) => b[1] - a[1])[0]
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    timings['total'] = Date.now() - startTotal;
    
    console.error('Debug Error:', error);
    return new Response(JSON.stringify({
      error: error?.message || String(error),
      timings,
      stack: error?.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
