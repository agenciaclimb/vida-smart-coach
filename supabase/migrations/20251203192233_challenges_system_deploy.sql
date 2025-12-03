-- ==========================================
-- MIGRATION: Sistema de Desafios Completo
-- ==========================================

-- 1. FUNÇÃO PARA ADICIONAR XP (se não existir)
CREATE OR REPLACE FUNCTION add_user_xp(
  p_user_id UUID,
  p_points INTEGER,
  p_source TEXT DEFAULT 'manual'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE gamification
  SET 
    total_points = COALESCE(total_points, 0) + p_points,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO gamification (user_id, total_points, level, updated_at)
    VALUES (p_user_id, p_points, 1, NOW())
    ON CONFLICT (user_id) DO UPDATE
    SET total_points = gamification.total_points + p_points;
  END IF;

  UPDATE gamification
  SET level = GREATEST(1, FLOOR((total_points::FLOAT / 1000.0) + 1))
  WHERE user_id = p_user_id;
END;
$$;

-- 2. ACHIEVEMENTS ESPECÍFICOS PARA DESAFIOS
INSERT INTO achievements (code, name, description, icon, category, points_reward, requirements, is_active)
VALUES
  ('seven_day_warrior', '7 Dias de Guerreiro', 'Complete 7 dias consecutivos de atividade física', '🏆', 'challenge', 500, '{"type": "challenge_completion", "challenge_category": "weekly"}', true),
  ('hydration_hero', 'Herói da Hidratação', 'Atinja sua meta de água por 7 dias consecutivos', '💧', 'challenge', 400, '{"type": "challenge_completion", "challenge_category": "weekly"}', true),
  ('consistency_master', 'Mestre da Consistência', 'Faça check-in em todos os 4 pilares por 7 dias', '⭐', 'challenge', 750, '{"type": "challenge_completion", "challenge_category": "weekly"}', true),
  ('monthly_warrior', 'Guerreiro dos 30 Dias', 'Acumule 10.000 XP em um mês', '🛡️', 'challenge', 2000, '{"type": "challenge_completion", "challenge_category": "monthly"}', true),
  ('marathon_master', 'Mestre da Maratona', 'Complete 20 treinos em um mês', '🏃', 'challenge', 1500, '{"type": "challenge_completion", "challenge_category": "monthly"}', true),
  ('total_transformation', 'Transformação Total', 'Complete 80% dos planos em um mês', '🌟', 'challenge', 3000, '{"type": "challenge_completion", "challenge_category": "monthly"}', true)
ON CONFLICT (code) DO UPDATE
SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  points_reward = EXCLUDED.points_reward;

-- 3. FUNÇÃO PARA AUTO-PARTICIPAR EM DESAFIOS
CREATE OR REPLACE FUNCTION auto_join_active_challenges()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_event_participation (user_id, event_id, current_progress)
  SELECT 
    NEW.id,
    ge.id,
    '{}'::jsonb
  FROM gamification_events ge
  WHERE 
    ge.is_active = true
    AND ge.start_date <= NOW()
    AND ge.end_date >= NOW()
    AND NOT EXISTS (
      SELECT 1 FROM user_event_participation
      WHERE user_id = NEW.id AND event_id = ge.id
    );
  
  RETURN NEW;
END;
$$;

-- 4. FUNÇÃO PARA VERIFICAR EXPIRAÇÃO DE DESAFIOS
CREATE OR REPLACE FUNCTION expire_old_challenges()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE gamification_events
  SET is_active = false
  WHERE end_date < NOW() AND is_active = true;
END;
$$;

-- 5. VIEW PARA DESAFIOS ATIVOS DO USUÁRIO
DROP VIEW IF EXISTS user_active_challenges;
CREATE VIEW user_active_challenges AS
SELECT 
  uep.id as participation_id,
  uep.user_id,
  uep.event_id,
  uep.joined_at,
  uep.current_progress,
  uep.is_completed,
  uep.completed_at,
  uep.points_earned,
  ge.name as challenge_name,
  ge.description,
  ge.event_type,
  ge.category,
  ge.start_date,
  ge.end_date,
  ge.requirements,
  ge.rewards,
  ge.bonus_multiplier,
  ge.max_participants,
  ge.current_participants,
  EXTRACT(EPOCH FROM (ge.end_date - NOW())) / 3600 as hours_remaining
FROM user_event_participation uep
INNER JOIN gamification_events ge ON uep.event_id = ge.id
WHERE 
  ge.is_active = true
  AND ge.end_date >= NOW()
ORDER BY ge.end_date ASC;

GRANT SELECT ON user_active_challenges TO authenticated;

-- 6. ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_gamification_events_active_dates 
ON gamification_events(is_active, start_date, end_date) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_user_event_participation_user_event 
ON user_event_participation(user_id, event_id);

CREATE INDEX IF NOT EXISTS idx_user_event_participation_completed 
ON user_event_participation(is_completed, completed_at) 
WHERE is_completed = true;

-- 7. COMENTÁRIOS
COMMENT ON FUNCTION add_user_xp IS 'Adiciona XP ao usuário e atualiza automaticamente o level';
COMMENT ON FUNCTION auto_join_active_challenges IS 'Auto-inscreve novos usuários em desafios ativos';
COMMENT ON FUNCTION expire_old_challenges IS 'Desativa desafios expirados';
COMMENT ON VIEW user_active_challenges IS 'Visão consolidada dos desafios ativos de cada usuário';
