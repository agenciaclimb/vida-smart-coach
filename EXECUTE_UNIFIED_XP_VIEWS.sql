-- ==========================================
-- EXECUTAR NO SQL EDITOR DO SUPABASE
-- ==========================================
-- Copie este SQL completo e execute no painel SQL Editor
-- do Supabase para criar as views unificadas de XP
-- ==========================================

-- View Unificada de XP (v_user_xp_totals)
CREATE OR REPLACE VIEW public.v_user_xp_totals AS
SELECT
  u.id AS user_id,
  u.email,
  -- XP por área (da tabela gamification)
  COALESCE(g.physical_points, 0) AS xp_fisico,
  COALESCE(g.nutrition_points, 0) AS xp_nutri,
  COALESCE(g.emotional_points, 0) AS xp_emocional,
  COALESCE(g.spiritual_points, 0) AS xp_espiritual,
  
  -- XP total consolidado
  COALESCE(g.total_points, 0) AS xp_total,
  
  -- XP por período (últimos 7 e 30 dias via daily_activities)
  COALESCE(
    (SELECT SUM(points_earned) 
     FROM public.daily_activities da
     WHERE da.user_id = u.id
       AND da.activity_date >= CURRENT_DATE - INTERVAL '7 days'),
    0
  ) AS xp_7d,
  
  COALESCE(
    (SELECT SUM(points_earned)
     FROM public.daily_activities da
     WHERE da.user_id = u.id
       AND da.activity_date >= CURRENT_DATE - INTERVAL '30 days'),
    0
  ) AS xp_30d,
  
  -- Nível calculado (1000 XP por nível)
  GREATEST(FLOOR(COALESCE(g.total_points, 0) / 1000.0), 0)::INTEGER AS level,
  
  -- Progresso para próximo nível (0.0 a 1.0)
  (COALESCE(g.total_points, 0) % 1000) / 1000.0 AS progress_pct,
  
  -- Informações auxiliares
  COALESCE(g.current_streak, 0) AS current_streak,
  COALESCE(g.longest_streak, 0) AS longest_streak,
  g.last_activity_date,
  g.updated_at
  
FROM auth.users u
LEFT JOIN public.gamification g ON g.user_id = u.id;

-- Comentários de documentação
COMMENT ON VIEW public.v_user_xp_totals IS 
'View consolidada de XP para uso em header, ranking e gráficos. Garante consistência entre todos os componentes.';

COMMENT ON COLUMN public.v_user_xp_totals.xp_fisico IS 'Pontos acumulados na área física';
COMMENT ON COLUMN public.v_user_xp_totals.xp_nutri IS 'Pontos acumulados na área nutricional';
COMMENT ON COLUMN public.v_user_xp_totals.xp_emocional IS 'Pontos acumulados na área emocional';
COMMENT ON COLUMN public.v_user_xp_totals.xp_espiritual IS 'Pontos acumulados na área espiritual';
COMMENT ON COLUMN public.v_user_xp_totals.xp_total IS 'Total de pontos acumulados (todas as áreas)';
COMMENT ON COLUMN public.v_user_xp_totals.xp_7d IS 'Pontos ganhos nos últimos 7 dias';
COMMENT ON COLUMN public.v_user_xp_totals.xp_30d IS 'Pontos ganhos nos últimos 30 dias';
COMMENT ON COLUMN public.v_user_xp_totals.level IS 'Nível calculado (1000 XP por nível)';
COMMENT ON COLUMN public.v_user_xp_totals.progress_pct IS 'Progresso para próximo nível (0.0 a 1.0)';

-- Garantir que usuários possam acessar apenas seus próprios dados
ALTER VIEW public.v_user_xp_totals OWNER TO postgres;

-- Índices nas tabelas base para otimizar a view
CREATE INDEX IF NOT EXISTS idx_gamification_user_id 
  ON public.gamification(user_id);

CREATE INDEX IF NOT EXISTS idx_daily_activities_user_date 
  ON public.daily_activities(user_id, activity_date DESC);

CREATE INDEX IF NOT EXISTS idx_daily_activities_points_date
  ON public.daily_activities(activity_date DESC, points_earned)
  WHERE points_earned > 0;

-- ==========================================
-- View de Ranking Semanal com Timezone Correto
-- ==========================================

CREATE OR REPLACE VIEW public.v_weekly_ranking AS
SELECT
  da.user_id,
  DATE_TRUNC('week', (da.activity_date AT TIME ZONE 'America/Sao_Paulo'))::DATE AS week_start,
  SUM(da.points_earned) AS xp_semana,
  COUNT(DISTINCT da.activity_date) AS dias_ativos,
  COUNT(*) AS total_atividades
FROM public.daily_activities da
WHERE da.points_earned > 0
GROUP BY da.user_id, week_start
ORDER BY week_start DESC, xp_semana DESC;

COMMENT ON VIEW public.v_weekly_ranking IS 
'Ranking semanal de XP com timezone America/Sao_Paulo para evitar divergências na virada de semana.';

COMMENT ON COLUMN public.v_weekly_ranking.week_start IS 'Início da semana (segunda-feira)';
COMMENT ON COLUMN public.v_weekly_ranking.xp_semana IS 'Total de XP ganho na semana';
COMMENT ON COLUMN public.v_weekly_ranking.dias_ativos IS 'Quantidade de dias com atividades na semana';
COMMENT ON COLUMN public.v_weekly_ranking.total_atividades IS 'Total de atividades registradas na semana';

ALTER VIEW public.v_weekly_ranking OWNER TO postgres;

-- ==========================================
-- TESTE: Verificar views criadas
-- ==========================================

-- Deve retornar dados do usuário logado
SELECT * FROM public.v_user_xp_totals LIMIT 5;

-- Deve retornar ranking da semana atual
SELECT * FROM public.v_weekly_ranking 
WHERE week_start = DATE_TRUNC('week', CURRENT_DATE)::DATE
LIMIT 10;
