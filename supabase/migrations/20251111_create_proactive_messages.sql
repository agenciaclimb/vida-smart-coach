-- Migration: Create proactive_messages table for intelligent proactive messaging system
-- Created: 11/11/2025
-- Purpose: Track proactive message history with cooldown system

-- Create enum for message types
CREATE TYPE proactive_message_type AS ENUM (
  'inactive_24h',
  'progress_stagnant',
  'repeated_difficulties',
  'milestone_achieved',
  'checkin_missed',
  'streak_at_risk',
  'xp_threshold',
  'success_pattern'
);

-- Create proactive_messages table
CREATE TABLE IF NOT EXISTS proactive_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_type proactive_message_type NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  message_content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  response_received BOOLEAN DEFAULT FALSE,
  response_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_response_timing CHECK (
    response_at IS NULL OR response_at >= sent_at
  )
);

-- Create indexes for performance
CREATE INDEX idx_proactive_messages_user_id ON proactive_messages(user_id);
CREATE INDEX idx_proactive_messages_type ON proactive_messages(message_type);
CREATE INDEX idx_proactive_messages_sent_at ON proactive_messages(sent_at DESC);
CREATE INDEX idx_proactive_messages_user_type ON proactive_messages(user_id, message_type, sent_at DESC);

-- Create view for cooldown status
CREATE OR REPLACE VIEW v_proactive_cooldown AS
SELECT 
  user_id,
  message_type,
  MAX(sent_at) as last_sent_at,
  COUNT(*) as total_sent,
  COUNT(*) FILTER (WHERE sent_at >= NOW() - INTERVAL '24 hours') as sent_today,
  COUNT(*) FILTER (WHERE sent_at >= NOW() - INTERVAL '7 days') as sent_this_week,
  BOOL_OR(response_received) as ever_responded
FROM proactive_messages
GROUP BY user_id, message_type;

-- RLS Policies
ALTER TABLE proactive_messages ENABLE ROW LEVEL SECURITY;

-- Users can view their own proactive messages
CREATE POLICY "Users can view own proactive messages"
  ON proactive_messages
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert proactive messages
CREATE POLICY "Service role can insert proactive messages"
  ON proactive_messages
  FOR INSERT
  WITH CHECK (true);

-- Service role can update response status
CREATE POLICY "Service role can update proactive messages"
  ON proactive_messages
  FOR UPDATE
  USING (true);

-- Admins have full access
CREATE POLICY "Admins have full access to proactive messages"
  ON proactive_messages
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Function to check if proactive message can be sent
CREATE OR REPLACE FUNCTION can_send_proactive_message(
  p_user_id UUID,
  p_message_type proactive_message_type
) RETURNS BOOLEAN AS $$
DECLARE
  v_last_sent TIMESTAMPTZ;
  v_sent_today INTEGER;
  v_sent_this_week INTEGER;
  v_last_user_message TIMESTAMPTZ;
BEGIN
  -- Get cooldown data
  SELECT 
    last_sent_at,
    sent_today,
    sent_this_week
  INTO v_last_sent, v_sent_today, v_sent_this_week
  FROM v_proactive_cooldown
  WHERE user_id = p_user_id
  AND message_type = p_message_type;

  -- Check global daily limit (max 2 proactive messages per day)
  IF (SELECT COUNT(*) FROM proactive_messages 
      WHERE user_id = p_user_id 
      AND sent_at >= NOW() - INTERVAL '24 hours') >= 2 THEN
    RETURN FALSE;
  END IF;

  -- Check type-specific weekly limit (max 1 per type per week)
  IF COALESCE(v_sent_this_week, 0) >= 1 THEN
    RETURN FALSE;
  END IF;

  -- Check if user sent a message in last 2 hours (don't interrupt active conversation)
  SELECT MAX(created_at) INTO v_last_user_message
  FROM conversation_memory
  WHERE user_id = p_user_id
  AND role = 'user';

  IF v_last_user_message IS NOT NULL 
     AND v_last_user_message >= NOW() - INTERVAL '2 hours' THEN
    RETURN FALSE;
  END IF;

  -- Check time of day (only send between 8am and 10pm)
  IF EXTRACT(HOUR FROM NOW() AT TIME ZONE 'America/Sao_Paulo') < 8 
     OR EXTRACT(HOUR FROM NOW() AT TIME ZONE 'America/Sao_Paulo') >= 22 THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION can_send_proactive_message TO authenticated, service_role;

-- Comments
COMMENT ON TABLE proactive_messages IS 'Tracks proactive messages sent to users with cooldown system';
COMMENT ON COLUMN proactive_messages.message_type IS 'Type of proactive message (8 categories)';
COMMENT ON COLUMN proactive_messages.metadata IS 'Additional context (XP earned, streak count, etc)';
COMMENT ON COLUMN proactive_messages.response_received IS 'Whether user responded to this proactive message';
COMMENT ON FUNCTION can_send_proactive_message IS 'Checks if a proactive message can be sent based on cooldown rules';
