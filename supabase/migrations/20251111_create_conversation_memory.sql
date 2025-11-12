-- File: supabase/migrations/20251111_create_conversation_memory.sql
-- Goal: materialize the conversation_memory table used by ia-coach-chat + provide
--       guard rails for environments that already created experimental schemas.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Base definition (idempotent if the table is already present)
CREATE TABLE IF NOT EXISTS conversation_memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  entities JSONB NOT NULL DEFAULT '{}'::jsonb,
  conversation_summary TEXT,
  last_topics TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  pending_actions TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, session_id)
);

-- Normalize legacy schemas from previous experiments
ALTER TABLE conversation_memory
  ADD COLUMN IF NOT EXISTS session_id TEXT,
  ADD COLUMN IF NOT EXISTS entities JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS conversation_summary TEXT,
  ADD COLUMN IF NOT EXISTS last_topics TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS pending_actions TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

UPDATE conversation_memory
SET session_id = TO_CHAR(COALESCE(created_at, NOW()) AT TIME ZONE 'UTC', 'YYYY-MM-DD')
WHERE session_id IS NULL;

UPDATE conversation_memory
SET entities = '{}'::jsonb
WHERE entities IS NULL;

UPDATE conversation_memory
SET last_topics = ARRAY[]::TEXT[]
WHERE last_topics IS NULL;

UPDATE conversation_memory
SET pending_actions = ARRAY[]::TEXT[]
WHERE pending_actions IS NULL;

ALTER TABLE conversation_memory
  ALTER COLUMN session_id SET NOT NULL,
  ALTER COLUMN entities SET DEFAULT '{}'::jsonb,
  ALTER COLUMN entities SET NOT NULL,
  ALTER COLUMN last_topics SET DEFAULT ARRAY[]::TEXT[],
  ALTER COLUMN last_topics SET NOT NULL,
  ALTER COLUMN pending_actions SET DEFAULT ARRAY[]::TEXT[],
  ALTER COLUMN pending_actions SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE conversation_memory
  DROP CONSTRAINT IF EXISTS conversation_memory_user_session_unique,
  ADD CONSTRAINT conversation_memory_user_session_unique UNIQUE (user_id, session_id);

-- Remove obsolete columns from prior prototypes
ALTER TABLE conversation_memory
  DROP COLUMN IF EXISTS memory_type,
  DROP COLUMN IF EXISTS content,
  DROP COLUMN IF EXISTS context,
  DROP COLUMN IF EXISTS importance,
  DROP COLUMN IF EXISTS last_referenced,
  DROP COLUMN IF EXISTS reference_count,
  DROP COLUMN IF EXISTS conversation_id,
  DROP COLUMN IF EXISTS message_type,
  DROP COLUMN IF EXISTS message_text,
  DROP COLUMN IF EXISTS emotional_tone,
  DROP COLUMN IF EXISTS embedding;

CREATE INDEX IF NOT EXISTS idx_conversation_memory_user
  ON conversation_memory(user_id);

CREATE INDEX IF NOT EXISTS idx_conversation_memory_session
  ON conversation_memory(session_id, updated_at DESC);

ALTER TABLE conversation_memory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own conversation_memory" ON conversation_memory;
CREATE POLICY "Users can view own conversation_memory"
  ON conversation_memory FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own conversation_memory" ON conversation_memory;
CREATE POLICY "Users can insert own conversation_memory"
  ON conversation_memory FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own conversation_memory" ON conversation_memory;
CREATE POLICY "Users can update own conversation_memory"
  ON conversation_memory FOR UPDATE
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS conversation_memory_set_updated_at ON conversation_memory;
CREATE TRIGGER conversation_memory_set_updated_at
  BEFORE UPDATE ON conversation_memory
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE conversation_memory IS 'Contextual memory per user/session with extracted entities for the IA Coach.';
COMMENT ON COLUMN conversation_memory.entities IS 'Structured entities (goals, pain points, preferences, activities, restrictions, emotional state).';
COMMENT ON COLUMN conversation_memory.last_topics IS 'Latest conversation topics (free text snippets) for quick prompt injection.';
COMMENT ON COLUMN conversation_memory.pending_actions IS 'Lightweight reminders or follow-ups captured from the conversation.';
