CREATE TABLE IF NOT EXISTS conversation_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone_number TEXT NOT NULL,
    message_type TEXT NOT NULL CHECK (message_type IN ('user', 'assistant')),
    message_content TEXT NOT NULL,
    sentiment_score DECIMAL(3,2) DEFAULT 0.0 CHECK (sentiment_score >= -1.0 AND sentiment_score <= 1.0),
    topics TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversation_history_phone_number ON conversation_history(phone_number);
CREATE INDEX IF NOT EXISTS idx_conversation_history_created_at ON conversation_history(created_at);
CREATE INDEX IF NOT EXISTS idx_conversation_history_message_type ON conversation_history(message_type);

ALTER TABLE conversation_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage conversation_history" ON conversation_history
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view conversation_history" ON conversation_history
    FOR SELECT USING (true);
