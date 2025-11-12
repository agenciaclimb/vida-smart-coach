-- Migration: conversation_memory table (Semana 1 - T1.4)
-- Created at: 2025-11-11
-- Purpose: Persist memory signals for IA Coach conversations

CREATE TABLE IF NOT EXISTS conversation_memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  entities JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, session_id)
);

CREATE INDEX IF NOT EXISTS idx_conversation_memory_user_id ON conversation_memory(user_id);

ALTER TABLE conversation_memory ENABLE ROW LEVEL SECURITY;

-- Policies: user can CRUD own memory rows
DROP POLICY IF EXISTS "Users can view own conversation_memory" ON conversation_memory;
CREATE POLICY "Users can view own conversation_memory" ON conversation_memory
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own conversation_memory" ON conversation_memory;
CREATE POLICY "Users can insert own conversation_memory" ON conversation_memory
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own conversation_memory" ON conversation_memory;
CREATE POLICY "Users can update own conversation_memory" ON conversation_memory
  FOR UPDATE USING (auth.uid() = user_id);

-- Down migration (manual):
-- DROP TABLE IF EXISTS conversation_memory;
