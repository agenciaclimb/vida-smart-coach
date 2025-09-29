-- Fix SQL loop syntax in generate_daily_missions_for_user function
-- Correção do erro de loop na função de gamificação

-- Drop and recreate the function with correct RECORD variable usage
CREATE OR REPLACE FUNCTION generate_daily_missions_for_user(p_user_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
DECLARE
    missions_data JSONB := '[
        {"type": "easy", "category": "physical", "title": "Check-in de treino", "description": "Faça seu check-in de treino diário", "points": 10},
        {"type": "easy", "category": "nutrition", "title": "Registrar refeição", "description": "Registre pelo menos uma refeição", "points": 10},
        {"type": "easy", "category": "emotional", "title": "Check-in de humor", "description": "Registre como você está se sentindo", "points": 10},
        {"type": "medium", "category": "physical", "title": "Meta de passos", "description": "Alcance sua meta diária de passos", "points": 20},
        {"type": "medium", "category": "nutrition", "title": "Meta de água", "description": "Beba sua meta diária de água", "points": 15},
        {"type": "medium", "category": "emotional", "title": "Prática de respiração", "description": "Faça um exercício de respiração", "points": 20},
        {"type": "challenging", "title": "Treino completo", "category": "physical", "description": "Complete um treino de 30 minutos", "points": 40},
        {"type": "challenging", "title": "Alimentação perfeita", "category": "nutrition", "description": "Siga 100% do seu plano alimentar", "points": 35},
        {"type": "challenging", "title": "Meditação", "category": "emotional", "description": "Medite por pelo menos 15 minutos", "points": 30}
    ]'::JSONB;
    
    mission JSONB;
    mission_type_record RECORD;
    selected_missions JSONB[];
    i INTEGER;
BEGIN
    -- Delete existing missions for the date
    DELETE FROM daily_missions WHERE user_id = p_user_id AND mission_date = p_date;
    
    -- Select one mission of each type randomly
    -- CORREÇÃO: usar o alias correto uma única vez no WHERE
    FOR mission_type_record IN 
        SELECT DISTINCT value->>'type' as mission_type 
        FROM jsonb_array_elements(missions_data)
    LOOP
        SELECT value INTO mission 
        FROM jsonb_array_elements(missions_data) AS mission
        WHERE mission.value->>'type' = mission_type_record.mission_type 
        ORDER BY random() 
        LIMIT 1;
        
        INSERT INTO daily_missions (
            user_id, mission_date, mission_type, title, description, 
            category, points_reward, target_value
        ) VALUES (
            p_user_id, p_date, mission->>'type', mission->>'title', 
            mission->>'description', mission->>'category', 
            (mission->>'points')::INTEGER, '{}'::JSONB
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;