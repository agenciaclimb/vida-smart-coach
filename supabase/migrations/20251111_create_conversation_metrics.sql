-- File: supabase/migrations/20251111_create_conversation_metrics.sql
-- Purpose: persist guard/enforcement insights for observability dashboards.

CREATE TABLE IF NOT EXISTS conversation_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  stage_before TEXT NOT NULL,
  stage_after TEXT NOT NULL,
  issues TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  hints TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  guard_action TEXT NOT NULL DEFAULT 'none',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversation_metrics_user
  ON conversation_metrics(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversation_metrics_session
  ON conversation_metrics(session_id, created_at DESC);

ALTER TABLE conversation_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own conversation_metrics" ON conversation_metrics;
CREATE POLICY "Users can view own conversation_metrics"
  ON conversation_metrics FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role inserts conversation_metrics" ON conversation_metrics;
CREATE POLICY "Service role inserts conversation_metrics"
  ON conversation_metrics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS conversation_metrics_set_updated_at ON conversation_metrics;
CREATE TRIGGER conversation_metrics_set_updated_at
  BEFORE UPDATE ON conversation_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE conversation_metrics IS 'Observability records for IA Coach guard/enforcement decisions.';
COMMENT ON COLUMN conversation_metrics.guard_action IS 'Action enforced by guard (force_stage, block_reply, none, etc).';
