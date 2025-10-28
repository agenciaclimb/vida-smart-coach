-- ==========================================
-- Sistema de Loja de Recompensas
-- Data: 27/10/2025
-- Objetivo: Permitir que usuários resgatem recompensas com XP acumulado
-- ==========================================

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
  terms TEXT, -- Termos e condições
  partner_name TEXT, -- Nome do parceiro que oferece a recompensa
  partner_logo_url TEXT,
  metadata JSONB DEFAULT '{}', -- Dados extras (códigos, links, etc)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_rewards_category ON public.rewards(category) WHERE is_active = TRUE;
CREATE INDEX idx_rewards_xp_cost ON public.rewards(xp_cost) WHERE is_active = TRUE;
CREATE INDEX idx_rewards_active ON public.rewards(is_active, xp_cost);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_rewards_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_rewards_timestamp
  BEFORE UPDATE ON public.rewards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_rewards_timestamp();

-- ==========================================
-- Tabela de Resgates (Redemptions)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.reward_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE RESTRICT,
  xp_spent INTEGER NOT NULL CHECK (xp_spent > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'delivered', 'cancelled', 'expired')),
  coupon_code TEXT, -- Código gerado para resgate
  delivery_info JSONB, -- Informações de entrega (endereço, email, etc)
  notes TEXT, -- Observações do usuário ou admin
  redeemed_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES auth.users(id), -- Admin que processou
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_redemptions_user_id ON public.reward_redemptions(user_id, redeemed_at DESC);
CREATE INDEX idx_redemptions_reward_id ON public.reward_redemptions(reward_id);
CREATE INDEX idx_redemptions_status ON public.reward_redemptions(status) WHERE status IN ('pending', 'approved');
CREATE INDEX idx_redemptions_coupon ON public.reward_redemptions(coupon_code) WHERE coupon_code IS NOT NULL;

-- Trigger para atualizar updated_at
CREATE TRIGGER trigger_update_redemptions_timestamp
  BEFORE UPDATE ON public.reward_redemptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_rewards_timestamp();

-- ==========================================
-- Tabela de Cupons de Recompensa
-- ==========================================

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

-- Índices
CREATE INDEX idx_coupons_code ON public.reward_coupons(code);
CREATE INDEX idx_coupons_redemption ON public.reward_coupons(redemption_id);
CREATE INDEX idx_coupons_available ON public.reward_coupons(is_used, expires_at) WHERE is_used = FALSE;

-- ==========================================
-- RLS (Row Level Security)
-- ==========================================

-- Ativar RLS
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_coupons ENABLE ROW LEVEL SECURITY;

-- Policies para REWARDS
-- Todos podem ver recompensas ativas
CREATE POLICY "Recompensas ativas são públicas"
  ON public.rewards
  FOR SELECT
  USING (is_active = TRUE AND (valid_until IS NULL OR valid_until > NOW()));

-- Apenas admins podem inserir/atualizar recompensas
CREATE POLICY "Admins podem gerenciar recompensas"
  ON public.rewards
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policies para REDEMPTIONS
-- Usuários veem apenas seus próprios resgates
CREATE POLICY "Usuários veem seus resgates"
  ON public.reward_redemptions
  FOR SELECT
  USING (user_id = auth.uid());

-- Usuários podem criar resgates
CREATE POLICY "Usuários podem resgatar recompensas"
  ON public.reward_redemptions
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Admins podem ver e atualizar todos os resgates
CREATE POLICY "Admins gerenciam todos os resgates"
  ON public.reward_redemptions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policies para COUPONS
-- Usuários veem cupons de seus resgates
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

-- Admins podem gerenciar todos os cupons
CREATE POLICY "Admins gerenciam cupons"
  ON public.reward_coupons
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==========================================
-- View para catálogo de recompensas com estoque
-- ==========================================

CREATE OR REPLACE VIEW public.v_rewards_catalog AS
SELECT
  r.*,
  COALESCE(
    r.stock_quantity - (
      SELECT COUNT(*)
      FROM public.reward_redemptions rd
      WHERE rd.reward_id = r.id
        AND rd.status IN ('pending', 'approved', 'delivered')
    ),
    999999 -- Se stock_quantity é NULL (ilimitado), retorna número alto
  ) AS available_stock,
  (
    SELECT COUNT(*)
    FROM public.reward_redemptions rd
    WHERE rd.reward_id = r.id
      AND rd.status = 'delivered'
  ) AS total_redeemed
FROM public.rewards r
WHERE r.is_active = TRUE
  AND (r.valid_until IS NULL OR r.valid_until > NOW())
ORDER BY r.xp_cost ASC;

COMMENT ON VIEW public.v_rewards_catalog IS 
'Catálogo de recompensas disponíveis com estoque calculado e total de resgates.';

-- ==========================================
-- Função para validar resgate
-- ==========================================

CREATE OR REPLACE FUNCTION public.validate_reward_redemption(
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
  v_valid_until TIMESTAMPTZ;
BEGIN
  -- Buscar XP do usuário
  SELECT COALESCE(xp_total, 0)
  INTO v_user_xp
  FROM public.v_user_xp_totals
  WHERE user_id = p_user_id;

  -- Buscar dados da recompensa
  SELECT xp_cost, stock_quantity, is_active, valid_until
  INTO v_reward_cost, v_reward_stock, v_is_active, v_valid_until
  FROM public.rewards
  WHERE id = p_reward_id;

  -- Validações
  IF v_reward_cost IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Recompensa não encontrada'::TEXT, v_user_xp, 0, 0;
    RETURN;
  END IF;

  IF v_is_active = FALSE THEN
    RETURN QUERY SELECT FALSE, 'Recompensa não está mais disponível'::TEXT, v_user_xp, v_reward_cost, 0;
    RETURN;
  END IF;

  IF v_valid_until IS NOT NULL AND v_valid_until < NOW() THEN
    RETURN QUERY SELECT FALSE, 'Recompensa expirada'::TEXT, v_user_xp, v_reward_cost, 0;
    RETURN;
  END IF;

  IF v_user_xp < v_reward_cost THEN
    RETURN QUERY SELECT FALSE, 'XP insuficiente'::TEXT, v_user_xp, v_reward_cost, 0;
    RETURN;
  END IF;

  -- Calcular estoque disponível
  IF v_reward_stock IS NOT NULL THEN
    SELECT COALESCE(
      v_reward_stock - COUNT(*),
      v_reward_stock
    )
    INTO v_available_stock
    FROM public.reward_redemptions
    WHERE reward_id = p_reward_id
      AND status IN ('pending', 'approved', 'delivered');

    IF v_available_stock <= 0 THEN
      RETURN QUERY SELECT FALSE, 'Estoque esgotado'::TEXT, v_user_xp, v_reward_cost, 0;
      RETURN;
    END IF;
  ELSE
    v_available_stock := 999999; -- Ilimitado
  END IF;

  -- Tudo OK
  RETURN QUERY SELECT TRUE, NULL::TEXT, v_user_xp, v_reward_cost, v_available_stock;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.validate_reward_redemption IS 
'Valida se usuário pode resgatar uma recompensa (XP suficiente, estoque disponível, validade).';
