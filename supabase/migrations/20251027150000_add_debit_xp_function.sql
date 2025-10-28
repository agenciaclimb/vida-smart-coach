-- ==========================================
-- Função para debitar XP do usuário
-- Usada pela Edge Function reward-redeem
-- ==========================================

CREATE OR REPLACE FUNCTION public.debit_user_xp(
  p_user_id UUID,
  p_amount INTEGER
)
RETURNS VOID AS $$
BEGIN
  -- Atualizar total_points na tabela gamification
  UPDATE public.gamification
  SET 
    total_points = GREATEST(total_points - p_amount, 0),
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Se o usuário não tem registro ainda, criar com XP negativo não faz sentido
  -- Mas a validação já foi feita antes de chamar esta função
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuário % não encontrado na tabela gamification', p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.debit_user_xp IS 
'Debita XP do usuário quando resgata uma recompensa. Garante que XP não fique negativo.';

-- ==========================================
-- Adicionar ao EXECUTE_REWARDS_SYSTEM.sql
-- ==========================================
