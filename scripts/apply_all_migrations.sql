-- ==========================================
-- SCRIPT CONSOLIDADO DE MIGRATIONS
-- Ciclo 31 - 28/10/2025
-- ==========================================
-- Copie este SQL completo e execute no SQL Editor
-- do Supabase para aplicar todas as migrations pendentes
-- ==========================================

-- ==================================================
-- 1. VIEWS UNIFICADAS DE XP
-- ==================================================

-- View Unificada de XP (v_user_xp_totals)
DROP VIEW IF EXISTS public.v_user_xp_totals CASCADE;
CREATE VIEW public.v_user_xp_totals AS
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
  g.updated_at
  
FROM auth.users u
LEFT JOIN public.gamification g ON g.user_id = u.id;

-- View de Ranking Semanal com timezone America/Sao_Paulo
DROP VIEW IF EXISTS public.v_weekly_ranking CASCADE;
CREATE VIEW public.v_weekly_ranking AS
SELECT
  da.user_id,
  DATE_TRUNC('week', da.activity_date AT TIME ZONE 'America/Sao_Paulo') AS week_start,
  COALESCE(SUM(da.points_earned), 0) AS xp_semana,
  COUNT(DISTINCT da.activity_date) AS dias_ativos
FROM public.daily_activities da
WHERE da.activity_date >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY da.user_id, DATE_TRUNC('week', da.activity_date AT TIME ZONE 'America/Sao_Paulo')
ORDER BY week_start DESC, xp_semana DESC;

-- ==================================================
-- 2. SISTEMA DE RECOMPENSAS
-- ==================================================

-- Tabela de Recompensas disponíveis
CREATE TABLE IF NOT EXISTS public.rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  category TEXT NOT NULL CHECK (category IN ('experiencia', 'desconto', 'produto', 'servico', 'digital')),
  xp_cost INTEGER NOT NULL CHECK (xp_cost > 0),
  stock_quantity INTEGER CHECK (stock_quantity >= 0), -- NULL = ilimitado
  is_active BOOLEAN DEFAULT TRUE,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  terms TEXT,
  partner_name TEXT,
  partner_logo_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_rewards_category ON public.rewards(category) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_rewards_xp_cost ON public.rewards(xp_cost) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_rewards_active ON public.rewards(is_active, xp_cost);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_rewards_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_rewards_timestamp ON public.rewards;
CREATE TRIGGER trigger_update_rewards_timestamp
  BEFORE UPDATE ON public.rewards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_rewards_timestamp();

-- Tabela de Resgates
CREATE TABLE IF NOT EXISTS public.reward_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE RESTRICT,
  xp_spent INTEGER NOT NULL CHECK (xp_spent > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'delivered', 'cancelled', 'expired')),
  coupon_code TEXT,
  delivery_info JSONB,
  notes TEXT,
  redeemed_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_redemptions_user_id ON public.reward_redemptions(user_id, redeemed_at DESC);
CREATE INDEX IF NOT EXISTS idx_redemptions_reward_id ON public.reward_redemptions(reward_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_status ON public.reward_redemptions(status) WHERE status IN ('pending', 'approved');
CREATE INDEX IF NOT EXISTS idx_redemptions_coupon ON public.reward_redemptions(coupon_code) WHERE coupon_code IS NOT NULL;

-- Trigger updated_at
DROP TRIGGER IF EXISTS trigger_update_redemptions_timestamp ON public.reward_redemptions;
CREATE TRIGGER trigger_update_redemptions_timestamp
  BEFORE UPDATE ON public.reward_redemptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_rewards_timestamp();

-- Tabela de Cupons (para recompensas digitais)
CREATE TABLE IF NOT EXISTS public.reward_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  redemption_id UUID REFERENCES public.reward_redemptions(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE RESTRICT,
  code TEXT NOT NULL UNIQUE,
  is_used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMPTZ,
  used_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.reward_coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_redemption ON public.reward_coupons(redemption_id);
CREATE INDEX IF NOT EXISTS idx_coupons_available ON public.reward_coupons(is_used, expires_at) WHERE is_used = FALSE;

-- ==================================================
-- 3. RLS POLICIES - REWARDS
-- ==================================================

ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Recompensas ativas são públicas" ON public.rewards;
CREATE POLICY "Recompensas ativas são públicas"
  ON public.rewards
  FOR SELECT
  USING (is_active = TRUE AND (valid_until IS NULL OR valid_until > NOW()));

DROP POLICY IF EXISTS "Admins podem gerenciar recompensas" ON public.rewards;
CREATE POLICY "Admins podem gerenciar recompensas"
  ON public.rewards
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==================================================
-- 4. RLS POLICIES - REDEMPTIONS
-- ==================================================

DROP POLICY IF EXISTS "Usuários veem seus resgates" ON public.reward_redemptions;
CREATE POLICY "Usuários veem seus resgates"
  ON public.reward_redemptions
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Usuários podem resgatar recompensas" ON public.reward_redemptions;
CREATE POLICY "Usuários podem resgatar recompensas"
  ON public.reward_redemptions
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins gerenciam todos os resgates" ON public.reward_redemptions;
CREATE POLICY "Admins gerenciam todos os resgates"
  ON public.reward_redemptions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==================================================
-- 5. RLS POLICIES - COUPONS
-- ==================================================

DROP POLICY IF EXISTS "Usuários veem seus cupons" ON public.reward_coupons;
CREATE POLICY "Usuários veem seus cupons"
  ON public.reward_coupons
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.reward_redemptions r
      WHERE r.id = reward_coupons.redemption_id
        AND r.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins gerenciam cupons" ON public.reward_coupons;
CREATE POLICY "Admins gerenciam cupons"
  ON public.reward_coupons
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==================================================
-- 6. VIEW - CATÁLOGO DE RECOMPENSAS
-- ==================================================

DROP VIEW IF EXISTS public.v_rewards_catalog CASCADE;
CREATE VIEW public.v_rewards_catalog AS
SELECT
  r.id,
  r.title,
  r.description,
  r.image_url,
  r.category,
  r.xp_cost,
  r.stock_quantity,
  r.is_active,
  r.valid_from,
  r.valid_until,
  r.terms,
  r.partner_name,
  r.partner_logo_url,
  r.metadata,
  
  -- Estoque disponível (considerando resgates)
  CASE
    WHEN r.stock_quantity IS NULL THEN NULL -- ilimitado
    ELSE GREATEST(
      r.stock_quantity - COALESCE(
        (SELECT COUNT(*) 
         FROM public.reward_redemptions rr
         WHERE rr.reward_id = r.id
           AND rr.status NOT IN ('cancelled', 'expired')),
        0
      ),
      0
    )
  END AS available_stock,
  
  -- Total de resgates
  (SELECT COUNT(*) 
   FROM public.reward_redemptions rr
   WHERE rr.reward_id = r.id) AS total_redemptions,
  
  r.created_at,
  r.updated_at
FROM public.rewards r
WHERE r.is_active = TRUE
  AND (r.valid_from IS NULL OR r.valid_from <= NOW())
  AND (r.valid_until IS NULL OR r.valid_until >= NOW())
ORDER BY r.xp_cost ASC, r.created_at DESC;

-- ==================================================
-- 7. FUNÇÃO - VALIDAR RESGATE
-- ==================================================

DROP FUNCTION IF EXISTS public.validate_reward_redemption(UUID, UUID) CASCADE;
CREATE FUNCTION public.validate_reward_redemption(
  p_user_id UUID,
  p_reward_id UUID
)
RETURNS TABLE (
  is_valid BOOLEAN,
  error_message TEXT,
  user_xp INTEGER,
  reward_cost INTEGER,
  available_stock INTEGER
) AS $$
DECLARE
  v_user_xp INTEGER;
  v_reward_cost INTEGER;
  v_reward_stock INTEGER;
  v_available_stock INTEGER;
  v_is_active BOOLEAN;
  v_valid_from TIMESTAMPTZ;
  v_valid_until TIMESTAMPTZ;
BEGIN
  -- Buscar XP do usuário
  SELECT COALESCE(g.total_points, 0)
  INTO v_user_xp
  FROM public.gamification g
  WHERE g.user_id = p_user_id;

  -- Buscar dados da recompensa
  SELECT r.xp_cost, r.stock_quantity, r.is_active, r.valid_from, r.valid_until
  INTO v_reward_cost, v_reward_stock, v_is_active, v_valid_from, v_valid_until
  FROM public.rewards r
  WHERE r.id = p_reward_id;

  -- Verificar se recompensa existe
  IF v_reward_cost IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Recompensa não encontrada'::TEXT, v_user_xp, 0, 0;
    RETURN;
  END IF;

  -- Verificar se está ativa
  IF NOT v_is_active THEN
    RETURN QUERY SELECT FALSE, 'Recompensa não está mais disponível'::TEXT, v_user_xp, v_reward_cost, 0;
    RETURN;
  END IF;

  -- Verificar período de validade
  IF v_valid_from IS NOT NULL AND v_valid_from > NOW() THEN
    RETURN QUERY SELECT FALSE, 'Recompensa ainda não disponível'::TEXT, v_user_xp, v_reward_cost, 0;
    RETURN;
  END IF;

  IF v_valid_until IS NOT NULL AND v_valid_until < NOW() THEN
    RETURN QUERY SELECT FALSE, 'Recompensa expirada'::TEXT, v_user_xp, v_reward_cost, 0;
    RETURN;
  END IF;

  -- Calcular estoque disponível
  IF v_reward_stock IS NULL THEN
    v_available_stock := NULL; -- ilimitado
  ELSE
    SELECT GREATEST(
      v_reward_stock - COALESCE(
        (SELECT COUNT(*) 
         FROM public.reward_redemptions rr
         WHERE rr.reward_id = p_reward_id
           AND rr.status NOT IN ('cancelled', 'expired')),
        0
      ),
      0
    ) INTO v_available_stock;
  END IF;

  -- Verificar estoque
  IF v_available_stock IS NOT NULL AND v_available_stock <= 0 THEN
    RETURN QUERY SELECT FALSE, 'Recompensa esgotada'::TEXT, v_user_xp, v_reward_cost, v_available_stock;
    RETURN;
  END IF;

  -- Verificar XP suficiente
  IF v_user_xp < v_reward_cost THEN
    RETURN QUERY SELECT FALSE, 
      format('XP insuficiente. Você tem %s XP, mas precisa de %s XP', v_user_xp, v_reward_cost),
      v_user_xp, v_reward_cost, v_available_stock;
    RETURN;
  END IF;

  -- Tudo OK!
  RETURN QUERY SELECT TRUE, NULL::TEXT, v_user_xp, v_reward_cost, v_available_stock;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================================================
-- 8. FUNÇÃO - DEBITAR XP
-- ==================================================

DROP FUNCTION IF EXISTS public.debit_user_xp(UUID, INTEGER) CASCADE;
CREATE FUNCTION public.debit_user_xp(
  p_user_id UUID,
  p_amount INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_xp INTEGER;
BEGIN
  -- Buscar XP atual
  SELECT COALESCE(total_points, 0)
  INTO v_current_xp
  FROM public.gamification
  WHERE user_id = p_user_id;

  -- Verificar se tem XP suficiente
  IF v_current_xp < p_amount THEN
    RETURN FALSE;
  END IF;

  -- Debitar XP (nunca deixar negativo)
  UPDATE public.gamification
  SET 
    total_points = GREATEST(total_points - p_amount, 0),
    updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================================================
-- 9. DADOS DE EXEMPLO (OPCIONAL - COMENTAR SE NÃO QUISER)
-- ==================================================

-- Inserir recompensas de exemplo
INSERT INTO public.rewards (title, description, category, xp_cost, stock_quantity, partner_name) VALUES
  ('1 Sessão de Coaching Individual', 'Sessão de 1 hora com coach especializado em desenvolvimento pessoal', 'experiencia', 5000, 10, 'Vida Smart Coach'),
  ('Desconto 50% em Consulta Nutricional', 'Cupom de desconto para primeira consulta com nutricionista parceiro', 'desconto', 3000, 20, 'NutriVida'),
  ('E-book: 30 Dias de Meditação', 'Guia completo com práticas diárias de meditação', 'digital', 1500, NULL, 'Vida Smart Coach'),
  ('Kit de Suplementos Básicos', 'Kit com Whey Protein + Creatina + Multivitamínico', 'produto', 8000, 5, 'SupleVida'),
  ('Acesso Premium 1 Mês', 'Upgrade para plano premium com funcionalidades exclusivas', 'servico', 2500, NULL, 'Vida Smart Coach')
ON CONFLICT DO NOTHING;

-- ==================================================
-- FIM DO SCRIPT
-- ==================================================

-- Verificar criação
SELECT 'Views criadas:' AS info;
SELECT table_name FROM information_schema.views 
WHERE table_schema = 'public' 
  AND table_name IN ('v_user_xp_totals', 'v_weekly_ranking', 'v_rewards_catalog');

SELECT 'Tabelas criadas:' AS info;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('rewards', 'reward_redemptions', 'reward_coupons');

SELECT 'Funções criadas:' AS info;
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('validate_reward_redemption', 'debit_user_xp');

SELECT '✅ Migration aplicada com sucesso!' AS status;
