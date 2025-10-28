CREATE OR REPLACE VIEW public.v_user_xp_totals AS
SELECT
  u.id AS user_id,
  u.email,
  COALESCE(g.physical_points, 0) AS xp_fisico,
  COALESCE(g.nutrition_points, 0) AS xp_nutri,
  COALESCE(g.emotional_points, 0) AS xp_emocional,
  COALESCE(g.spiritual_points, 0) AS xp_espiritual,
  COALESCE(g.total_points, 0) AS xp_total,
  COALESCE(
    (SELECT SUM(points_earned) FROM public.daily_activities da WHERE da.user_id = u.id AND da.activity_date >= CURRENT_DATE - 7),
    0
  ) AS xp_7d,
  COALESCE(
    (SELECT SUM(points_earned) FROM public.daily_activities da WHERE da.user_id = u.id AND da.activity_date >= CURRENT_DATE - 30),
    0
  ) AS xp_30d,
  GREATEST(FLOOR(COALESCE(g.total_points, 0) / 1000.0), 0)::INTEGER AS level,
  (COALESCE(g.total_points, 0) % 1000) / 1000.0 AS progress_pct,
  COALESCE(g.current_streak, 0) AS current_streak,
  COALESCE(g.longest_streak, 0) AS longest_streak,
  COALESCE(
    (SELECT COUNT(DISTINCT activity_date) FROM public.daily_activities da WHERE da.user_id = u.id),
    0
  ) AS active_days,
  g.updated_at AS last_activity
FROM auth.users u
LEFT JOIN public.gamification g ON g.user_id = u.id;
