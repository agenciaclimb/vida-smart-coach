-- Tabela de feedback sobre planos
CREATE TABLE IF NOT EXISTS plan_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('physical', 'nutritional', 'emotional', 'spiritual')),
  feedback_text TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'ignored')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  ai_response TEXT,
  plan_updated BOOLEAN DEFAULT FALSE
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_plan_feedback_user ON plan_feedback(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_plan_feedback_status ON plan_feedback(status, created_at);
CREATE INDEX IF NOT EXISTS idx_plan_feedback_pending ON plan_feedback(user_id, status) WHERE status = 'pending';

-- RLS
ALTER TABLE plan_feedback ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own feedback' AND tablename = 'plan_feedback'
  ) THEN
    CREATE POLICY "Users can view own feedback"
      ON plan_feedback FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own feedback' AND tablename = 'plan_feedback'
  ) THEN
    CREATE POLICY "Users can insert own feedback"
      ON plan_feedback FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

COMMENT ON TABLE plan_feedback IS 'Feedback dos usuários sobre seus planos para ajuste pela IA';
