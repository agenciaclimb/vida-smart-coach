-- Aplicação direta da migração IA Coach Strategic System
-- Execute este script no SQL Editor do Supabase

SELECT 'Iniciando aplicação da migração IA Coach Strategic System...' as status;

-- Verificar se as tabelas já existem
SELECT 
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'client_stages') 
    THEN 'Tabelas já existem - migração já aplicada'
    ELSE 'Aplicando nova migração...'
  END as migration_status;

-- ============================================
-- 🧠 IA COACH VIDA SMART - SISTEMA ESTRATÉGICO
-- 4 Estágios: SDR → Especialista → Vendedor → Parceiro
-- ============================================

-- 1. TABELA DE ESTÁGIOS DO CLIENTE
CREATE TABLE IF NOT EXISTS client_stages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  current_stage TEXT NOT NULL CHECK (current_stage IN ('sdr', 'specialist', 'seller', 'partner')),
  stage_metadata JSONB DEFAULT '{}',
  bant_score JSONB DEFAULT '{}', -- Budget, Authority, Need, Timeline
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA DE INTERAÇÕES DETALHADAS
CREATE TABLE IF NOT EXISTS interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL, -- 'message', 'check_in', 'stage_transition'
  stage TEXT NOT NULL,
  content TEXT,
  ai_response TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. MEMÓRIA CONVERSACIONAL INTELIGENTE
CREATE TABLE IF NOT EXISTS conversation_memory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  memory_type TEXT NOT NULL, -- 'pain_point', 'goal', 'objection', 'preference'
  content TEXT NOT NULL,
  importance INTEGER DEFAULT 1, -- 1-10 
  stage_discovered TEXT,
  last_referenced TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. DIAGNÓSTICO DAS 4 ÁREAS
CREATE TABLE IF NOT EXISTS area_diagnostics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  area TEXT NOT NULL CHECK (area IN ('physical', 'nutritional', 'emotional', 'spiritual')),
  current_state JSONB DEFAULT '{}',
  pain_points TEXT[],
  goals TEXT[],
  score INTEGER CHECK (score >= 1 AND score <= 10),
  specialist_insights TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. SISTEMA DE GAMIFICAÇÃO APRIMORADO
CREATE TABLE IF NOT EXISTS gamification (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  action_type TEXT NOT NULL, -- 'stage_advance', 'daily_checkin', 'goal_completion'
  points INTEGER DEFAULT 0,
  badges TEXT[],
  streak_days INTEGER DEFAULT 0,
  achievement_unlocked TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. OBJETIVOS E METAS DO CLIENTE
CREATE TABLE IF NOT EXISTS client_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  area TEXT NOT NULL,
  goal_title TEXT NOT NULL,
  goal_description TEXT,
  target_value NUMERIC,
  current_value NUMERIC DEFAULT 0,
  unit TEXT, -- 'kg', 'cm', 'days', 'hours'
  deadline DATE,
  priority INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. AÇÕES E PLANOS PERSONALIZADOS
CREATE TABLE IF NOT EXISTS client_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES client_goals(id) ON DELETE CASCADE,
  action_title TEXT NOT NULL,
  action_description TEXT,
  area TEXT NOT NULL,
  frequency TEXT, -- 'daily', 'weekly', 'monthly'
  suggested_time TIME,
  difficulty INTEGER DEFAULT 1 CHECK (difficulty >= 1 AND difficulty <= 5),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'skipped')),
  completion_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

SELECT 'Tabelas criadas com sucesso!' as status;

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_client_stages_user_id ON client_stages(user_id);
CREATE INDEX IF NOT EXISTS idx_client_stages_current_stage ON client_stages(current_stage);
CREATE INDEX IF NOT EXISTS idx_interactions_user_id ON interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_stage ON interactions(stage);
CREATE INDEX IF NOT EXISTS idx_conversation_memory_user_id ON conversation_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_area_diagnostics_user_id ON area_diagnostics(user_id);
CREATE INDEX IF NOT EXISTS idx_area_diagnostics_area ON area_diagnostics(area);
CREATE INDEX IF NOT EXISTS idx_gamification_user_id ON gamification(user_id);
CREATE INDEX IF NOT EXISTS idx_client_goals_user_id ON client_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_client_actions_user_id ON client_actions(user_id);

SELECT 'Índices criados com sucesso!' as status;

-- ============================================
-- RLS (ROW LEVEL SECURITY)
-- ============================================

ALTER TABLE client_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE area_diagnostics ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_actions ENABLE ROW LEVEL SECURITY;

SELECT 'RLS habilitado com sucesso!' as status;

-- Políticas RLS
CREATE POLICY IF NOT EXISTS "Users can view own client_stages" ON client_stages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can insert own client_stages" ON client_stages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can update own client_stages" ON client_stages FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can view own interactions" ON interactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can insert own interactions" ON interactions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can view own conversation_memory" ON conversation_memory FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can insert own conversation_memory" ON conversation_memory FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can update own conversation_memory" ON conversation_memory FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can view own area_diagnostics" ON area_diagnostics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can insert own area_diagnostics" ON area_diagnostics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can update own area_diagnostics" ON area_diagnostics FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can view own gamification" ON gamification FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can insert own gamification" ON gamification FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can view own client_goals" ON client_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can insert own client_goals" ON client_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can update own client_goals" ON client_goals FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can view own client_actions" ON client_actions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can insert own client_actions" ON client_actions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can update own client_actions" ON client_actions FOR UPDATE USING (auth.uid() = user_id);

SELECT 'Políticas RLS criadas com sucesso!' as status;

-- ============================================
-- TRIGGERS PARA UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_client_stages_updated_at ON client_stages;
CREATE TRIGGER update_client_stages_updated_at BEFORE UPDATE ON client_stages 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_area_diagnostics_updated_at ON area_diagnostics;
CREATE TRIGGER update_area_diagnostics_updated_at BEFORE UPDATE ON area_diagnostics 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_client_goals_updated_at ON client_goals;
CREATE TRIGGER update_client_goals_updated_at BEFORE UPDATE ON client_goals 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_client_actions_updated_at ON client_actions;
CREATE TRIGGER update_client_actions_updated_at BEFORE UPDATE ON client_actions 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

SELECT 'Triggers criados com sucesso!' as status;

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================

SELECT 
  'Migração IA Coach Strategic System aplicada com sucesso!' as resultado,
  '✅ 7 tabelas estratégicas criadas' as tabelas,
  '✅ Índices para performance otimizada' as indices,
  '✅ RLS habilitado para segurança' as seguranca,
  '✅ Triggers para updated_at configurados' as triggers,
  '🎯 Sistema pronto para SDR → Especialista → Vendedor → Parceiro' as sistema;

-- Verificar tabelas criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('client_stages', 'interactions', 'conversation_memory', 'area_diagnostics', 'gamification', 'client_goals', 'client_actions')
ORDER BY table_name;