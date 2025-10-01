-- Fix generate_daily_missions_for_user loop to avoid RECORD alias issues
-- Date: 2025-10-01

CREATE OR REPLACE FUNCTION public.generate_daily_missions_for_user(
  p_user_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
) RETURNS void AS $$
DECLARE
  missions_data JSONB := '[
    {"type": "easy", "category": "physical", "title": "Check-in de treino", "description": "Faça seu check-in de treino diário", "points": 10},
    {"type": "easy", "category": "nutrition", "title": "Registrar refeição", "description": "Registre pelo menos uma refeição", "points": 10},
    {"type": "easy", "category": "emotional", "title": "Check-in de humor", "description": "Registre como você está se sentindo", "points": 10},
    {"type": "medium", "category": "physical", "title": "Meta de passos", "description": "Alcance sua meta diária de passos", "points": 20},
    {"type": "medium", "category": "nutrition", "title": "Meta de água", "description": "Beba sua meta diária de água", "points": 15},
    {"type": "medium", "category": "emotional", "title": "Prática de respiração", "description": "Faça um exercício de respiração", "points": 20},
    {"type": "challenging", "category": "physical", "title": "Treino completo", "description": "Complete um treino de 30 minutos", "points": 40},
    {"type": "challenging", "category": "nutrition", "title": "Alimentação perfeita", "description": "Siga 100% do seu plano alimentar", "points": 35},
    {"type": "challenging", "category": "emotional", "title": "Meditação", "description": "Medite por pelo menos 15 minutos", "points": 30}
  ]'::JSONB;
  mission JSONB;
  mission_type TEXT;
BEGIN
  DELETE FROM public.daily_missions
   WHERE user_id = p_user_id
     AND mission_date = p_date;

  FOR mission_type IN
    SELECT DISTINCT elem.value->>'type'
      FROM jsonb_array_elements(missions_data) AS elem(value)
  LOOP
    SELECT elem.value
      INTO mission
      FROM jsonb_array_elements(missions_data) AS elem(value)
      WHERE elem.value->>'type' = mission_type
      ORDER BY random()
      LIMIT 1;

    INSERT INTO public.daily_missions (
      user_id,
      mission_date,
      mission_type,
      title,
      description,
      category,
      points_reward,
      target_value
    ) VALUES (
      p_user_id,
      p_date,
      mission->>'type',
      mission->>'title',
      mission->>'description',
      mission->>'category',
      (mission->>'points')::INTEGER,
      '{}'::JSONB
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
