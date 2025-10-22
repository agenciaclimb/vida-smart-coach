-- File: supabase/migrations/20251023_create_plan_completions.sql

-- Tabela de conclusões de itens dos planos
CREATE TABLE IF NOT EXISTS plan_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('physical', 'nutritional', 'emotional', 'spiritual')),
  item_type TEXT NOT NULL CHECK (item_type IN ('exercise', 'workout', 'meal', 'routine', 'practice', 'goal', 'technique')),
  item_identifier TEXT NOT NULL, -- ex: "week_1_workout_0_exercise_2"
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  points_awarded INTEGER DEFAULT 0,
  
  -- Constraint de unicidade (usuário não pode completar o mesmo item 2x)
  UNIQUE(user_id, plan_type, item_identifier)
);

-- Índices para performance
CREATE INDEX idx_plan_completions_user_date 
  ON plan_completions(user_id, completed_at DESC);

CREATE INDEX idx_plan_completions_type 
  ON plan_completions(user_id, plan_type);

CREATE INDEX idx_plan_completions_item_type 
  ON plan_completions(item_type, completed_at DESC);

-- RLS Policies
ALTER TABLE plan_completions ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver apenas suas próprias conclusões
CREATE POLICY "Users can view own completions"
  ON plan_completions FOR SELECT
  USING (auth.uid() = user_id);

-- Usuários podem inserir suas próprias conclusões
CREATE POLICY "Users can insert own completions"
  ON plan_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Usuários podem deletar suas próprias conclusões (desmarcar)
CREATE POLICY "Users can delete own completions"
  ON plan_completions FOR DELETE
  USING (auth.uid() = user_id);

-- Comentários
COMMENT ON TABLE plan_completions IS 'Rastreamento de itens completados nos planos (exercícios, refeições, práticas)';
COMMENT ON COLUMN plan_completions.item_identifier IS 'Identificador único do item dentro do plano (ex: week_1_workout_0_exercise_2)';
COMMENT ON COLUMN plan_completions.points_awarded IS 'Pontos de gamificação concedidos por esta conclusão';
