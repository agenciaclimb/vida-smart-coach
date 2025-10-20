-- ============================================
-- SCHEMA COMPLETO PARA IA COACH ESTRATÉGICA
-- ============================================

-- Estágios da jornada do cliente
CREATE TABLE IF NOT EXISTS client_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  current_stage TEXT NOT NULL CHECK (current_stage IN ('sdr', 'specialist', 'seller', 'partner')),
  stage_start_time TIMESTAMPTZ DEFAULT NOW(),
  previous_stage TEXT,
  stage_metadata JSONB DEFAULT '{}',
  bant_score INTEGER DEFAULT 0, -- Budget, Authority, Need, Timeline (0-100)
  qualification_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Interações detalhadas
CREATE TABLE IF NOT EXISTS interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL, -- 'message', 'checkin', 'objection', 'conversion'
  stage TEXT NOT NULL,
  content TEXT NOT NULL,
  ai_response TEXT,
  metadata JSONB DEFAULT '{}', -- context, sentiment, triggers, etc.
  success_score INTEGER DEFAULT 0, -- 0-100 effectiveness
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Objetivos e metas do cliente
CREATE TABLE IF NOT EXISTS client_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  area TEXT NOT NULL CHECK (area IN ('fisica', 'alimentar', 'emocional', 'espiritual')),
  goal_type TEXT NOT NULL, -- 'perder_peso', 'ganhar_massa', 'ansiedade', etc.
  description TEXT,
  priority INTEGER DEFAULT 5, -- 1-10
  current_status TEXT DEFAULT 'active', -- 'active', 'completed', 'paused'
  target_value NUMERIC,
  current_value NUMERIC,
  unit TEXT, -- 'kg', 'dias', 'nivel_1_10', etc.
  deadline DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ações e tasks personalizadas
CREATE TABLE IF NOT EXISTS client_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'exercise', 'nutrition', 'mindfulness', 'habit'
  title TEXT NOT NULL,
  description TEXT,
  area TEXT NOT NULL CHECK (area IN ('fisica', 'alimentar', 'emocional', 'espiritual')),
  difficulty INTEGER DEFAULT 5, -- 1-10
  estimated_time INTEGER, -- minutos
  points_reward INTEGER DEFAULT 10,
  status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'skipped'
  scheduled_for DATE,
  completed_at TIMESTAMPTZ,
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Memória de conversação contextual
CREATE TABLE IF NOT EXISTS conversation_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  memory_type TEXT NOT NULL, -- 'preference', 'pain_point', 'objection', 'success'
  content TEXT NOT NULL,
  context JSONB DEFAULT '{}',
  importance INTEGER DEFAULT 5, -- 1-10
  last_referenced TIMESTAMPTZ DEFAULT NOW(),
  reference_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sistema de gamificação
-- Gamification table is created in earlier migrations (20240101000004/20240916).
-- Ensure strategic columns exist without recreating the table.
ALTER TABLE public.gamification
  ADD COLUMN IF NOT EXISTS checkins_completed INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS actions_completed INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referrals_made INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Diagnóstico das 4 áreas
CREATE TABLE IF NOT EXISTS area_diagnostics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  area TEXT NOT NULL CHECK (area IN ('fisica', 'alimentar', 'emocional', 'espiritual')),
  questions_completed INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  pain_level INTEGER, -- 1-10
  motivation_level INTEGER, -- 1-10
  readiness_score INTEGER, -- 1-10
  diagnosis_data JSONB DEFAULT '{}',
  recommendations JSONB DEFAULT '{}',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE client_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE area_diagnostics ENABLE ROW LEVEL SECURITY;

-- Garantir colunas essenciais quando as tabelas já existirem com schema antigo
ALTER TABLE client_goals
  ADD COLUMN IF NOT EXISTS current_status TEXT DEFAULT 'active';
ALTER TABLE client_actions
  ADD COLUMN IF NOT EXISTS scheduled_for DATE,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

DROP POLICY IF EXISTS "Users can view own stages" ON client_stages;
CREATE POLICY "Users can view own stages" ON client_stages
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own stages" ON client_stages;
CREATE POLICY "Users can insert own stages" ON client_stages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own stages" ON client_stages;
CREATE POLICY "Users can update own stages" ON client_stages
  FOR UPDATE USING (auth.uid() = user_id);

-- Policies para interactions
DROP POLICY IF EXISTS "Users can view own interactions" ON interactions;
CREATE POLICY "Users can view own interactions" ON interactions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own interactions" ON interactions;
CREATE POLICY "Users can insert own interactions" ON interactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies para client_goals
DROP POLICY IF EXISTS "Users can manage own goals" ON client_goals;
CREATE POLICY "Users can manage own goals" ON client_goals
  FOR ALL USING (auth.uid() = user_id);

-- Policies para client_actions
DROP POLICY IF EXISTS "Users can manage own actions" ON client_actions;
CREATE POLICY "Users can manage own actions" ON client_actions
  FOR ALL USING (auth.uid() = user_id);

-- Policies para conversation_memory
DROP POLICY IF EXISTS "Users can manage own memory" ON conversation_memory;
CREATE POLICY "Users can manage own memory" ON conversation_memory
  FOR ALL USING (auth.uid() = user_id);

-- Policies para gamification
DROP POLICY IF EXISTS "Users can manage own gamification" ON gamification;
CREATE POLICY "Users can manage own gamification" ON gamification
  FOR ALL USING (auth.uid() = user_id);

-- Policies para area_diagnostics
DROP POLICY IF EXISTS "Users can manage own diagnostics" ON area_diagnostics;
CREATE POLICY "Users can manage own diagnostics" ON area_diagnostics
  FOR ALL USING (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_client_stages_user_stage ON client_stages(user_id, current_stage);
CREATE INDEX IF NOT EXISTS idx_interactions_user_stage ON interactions(user_id, stage, created_at);
CREATE INDEX IF NOT EXISTS idx_client_goals_user_area ON client_goals(user_id, area, current_status);
CREATE INDEX IF NOT EXISTS idx_client_actions_user_scheduled ON client_actions(user_id, scheduled_for, status);
CREATE INDEX IF NOT EXISTS idx_conversation_memory_user_type ON conversation_memory(user_id, memory_type, importance);
CREATE INDEX IF NOT EXISTS idx_gamification_user ON gamification(user_id);
CREATE INDEX IF NOT EXISTS idx_area_diagnostics_user_area ON area_diagnostics(user_id, area);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_client_stages_updated_at ON client_stages;
CREATE TRIGGER update_client_stages_updated_at
  BEFORE UPDATE ON client_stages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_client_goals_updated_at ON client_goals;
CREATE TRIGGER update_client_goals_updated_at
  BEFORE UPDATE ON client_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_gamification_updated_at ON gamification;
CREATE TRIGGER update_gamification_updated_at
  BEFORE UPDATE ON gamification
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
