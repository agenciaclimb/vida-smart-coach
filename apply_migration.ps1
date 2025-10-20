# Script PowerShell para aplicar migração IA Coach
# Executa SQL diretamente no Supabase

Write-Host "🚀 Aplicando migração IA Coach Strategic System..." -ForegroundColor Green

# Conteúdo SQL da migração
$sqlContent = @"
-- ============================================
-- 🧠 IA COACH VIDA SMART - SISTEMA ESTRATÉGICO
-- 4 Estágios: SDR → Especialista → Vendedor → Parceiro
-- ============================================

-- Verificar se as tabelas já existem
DO `$`$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'client_stages') THEN
    
    -- 1. TABELA DE ESTÁGIOS DO CLIENTE
    CREATE TABLE client_stages (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      current_stage TEXT NOT NULL CHECK (current_stage IN ('sdr', 'specialist', 'seller', 'partner')),
      stage_metadata JSONB DEFAULT '{}',
      bant_score JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 2. TABELA DE INTERAÇÕES DETALHADAS
    CREATE TABLE interactions (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      interaction_type TEXT NOT NULL,
      stage TEXT NOT NULL,
      content TEXT,
      ai_response TEXT,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 3. MEMÓRIA CONVERSACIONAL INTELIGENTE
    CREATE TABLE conversation_memory (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      memory_type TEXT NOT NULL,
      content TEXT NOT NULL,
      importance INTEGER DEFAULT 1,
      stage_discovered TEXT,
      last_referenced TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 4. DIAGNÓSTICO DAS 4 ÁREAS
    CREATE TABLE area_diagnostics (
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
    CREATE TABLE gamification (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      stage TEXT NOT NULL,
      action_type TEXT NOT NULL,
      points INTEGER DEFAULT 0,
      badges TEXT[],
      streak_days INTEGER DEFAULT 0,
      achievement_unlocked TEXT,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 6. OBJETIVOS E METAS DO CLIENTE
    CREATE TABLE client_goals (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      area TEXT NOT NULL,
      goal_title TEXT NOT NULL,
      goal_description TEXT,
      target_value NUMERIC,
      current_value NUMERIC DEFAULT 0,
      unit TEXT,
      deadline DATE,
      priority INTEGER DEFAULT 1,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 7. AÇÕES E PLANOS PERSONALIZADOS
    CREATE TABLE client_actions (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      goal_id UUID REFERENCES client_goals(id) ON DELETE CASCADE,
      action_title TEXT NOT NULL,
      action_description TEXT,
      area TEXT NOT NULL,
      frequency TEXT,
      suggested_time TIME,
      difficulty INTEGER DEFAULT 1 CHECK (difficulty >= 1 AND difficulty <= 5),
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'skipped')),
      completion_notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- ÍNDICES PARA PERFORMANCE
    CREATE INDEX idx_client_stages_user_id ON client_stages(user_id);
    CREATE INDEX idx_client_stages_current_stage ON client_stages(current_stage);
    CREATE INDEX idx_interactions_user_id ON interactions(user_id);
    CREATE INDEX idx_interactions_stage ON interactions(stage);
    CREATE INDEX idx_conversation_memory_user_id ON conversation_memory(user_id);
    CREATE INDEX idx_area_diagnostics_user_id ON area_diagnostics(user_id);
    CREATE INDEX idx_area_diagnostics_area ON area_diagnostics(area);
    CREATE INDEX idx_gamification_user_id ON gamification(user_id);
    CREATE INDEX idx_client_goals_user_id ON client_goals(user_id);
    CREATE INDEX idx_client_actions_user_id ON client_actions(user_id);

    -- RLS (ROW LEVEL SECURITY)
    ALTER TABLE client_stages ENABLE ROW LEVEL SECURITY;
    ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
    ALTER TABLE conversation_memory ENABLE ROW LEVEL SECURITY;
    ALTER TABLE area_diagnostics ENABLE ROW LEVEL SECURITY;
    ALTER TABLE gamification ENABLE ROW LEVEL SECURITY;
    ALTER TABLE client_goals ENABLE ROW LEVEL SECURITY;
    ALTER TABLE client_actions ENABLE ROW LEVEL SECURITY;

    -- Políticas RLS
    CREATE POLICY "Users can view own client_stages" ON client_stages FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert own client_stages" ON client_stages FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update own client_stages" ON client_stages FOR UPDATE USING (auth.uid() = user_id);

    CREATE POLICY "Users can view own interactions" ON interactions FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert own interactions" ON interactions FOR INSERT WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can view own conversation_memory" ON conversation_memory FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert own conversation_memory" ON conversation_memory FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update own conversation_memory" ON conversation_memory FOR UPDATE USING (auth.uid() = user_id);

    CREATE POLICY "Users can view own area_diagnostics" ON area_diagnostics FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert own area_diagnostics" ON area_diagnostics FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update own area_diagnostics" ON area_diagnostics FOR UPDATE USING (auth.uid() = user_id);

    CREATE POLICY "Users can view own gamification" ON gamification FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert own gamification" ON gamification FOR INSERT WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can view own client_goals" ON client_goals FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert own client_goals" ON client_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update own client_goals" ON client_goals FOR UPDATE USING (auth.uid() = user_id);

    CREATE POLICY "Users can view own client_actions" ON client_actions FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert own client_actions" ON client_actions FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update own client_actions" ON client_actions FOR UPDATE USING (auth.uid() = user_id);

    -- TRIGGERS PARA UPDATED_AT
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS `$`$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    `$`$ language 'plpgsql';

    CREATE TRIGGER update_client_stages_updated_at BEFORE UPDATE ON client_stages 
        FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

    CREATE TRIGGER update_area_diagnostics_updated_at BEFORE UPDATE ON area_diagnostics 
        FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

    CREATE TRIGGER update_client_goals_updated_at BEFORE UPDATE ON client_goals 
        FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

    CREATE TRIGGER update_client_actions_updated_at BEFORE UPDATE ON client_actions 
        FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

    RAISE NOTICE '✅ IA Coach Strategic System criado com sucesso!';
    RAISE NOTICE '🎯 4 Estágios: SDR → Especialista → Vendedor → Parceiro';
    RAISE NOTICE '📊 7 tabelas estratégicas criadas';
    RAISE NOTICE '🔒 RLS habilitado para segurança';

  ELSE
    RAISE NOTICE '⚠️ Sistema IA Coach já existe. Não foram feitas alterações.';
  END IF;
END
`$`$;
"@

# Salvar SQL em arquivo temporário
$tempFile = "C:\temp\apply_migration.sql"
$sqlContent | Out-File -FilePath $tempFile -Encoding UTF8

Write-Host "📄 SQL gerado em: $tempFile" -ForegroundColor Yellow
Write-Host "🔗 Para aplicar, acesse: https://supabase.com/dashboard/project/zzugbgoylwbaojdnunuz/sql/new" -ForegroundColor Cyan
Write-Host "📋 E cole o conteúdo do arquivo ou execute o SQL diretamente" -ForegroundColor Cyan

# Exibir parte do SQL para confirmação
Write-Host "`n📝 Prévia do SQL:" -ForegroundColor Magenta
Write-Host ($sqlContent.Substring(0, [Math]::Min(500, $sqlContent.Length)) + "...") -ForegroundColor Gray

Write-Host "`n✅ Script de migração preparado!" -ForegroundColor Green