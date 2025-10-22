-- Fix whatsapp_messages table structure to match webhook expectations
-- The webhook uses: phone, message, event, timestamp, user_id
-- But the table might have: phone_number, message_content, etc.

-- Drop old structure if exists
DROP TABLE IF EXISTS public.whatsapp_messages CASCADE;

-- Recreate with correct structure
CREATE TABLE public.whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    phone TEXT NOT NULL,
    message TEXT NOT NULL,
    event TEXT DEFAULT 'messages.upsert',
    timestamp BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_whatsapp_messages_phone ON public.whatsapp_messages(phone);
CREATE INDEX idx_whatsapp_messages_timestamp ON public.whatsapp_messages(timestamp DESC);
CREATE INDEX idx_whatsapp_messages_created_at ON public.whatsapp_messages(created_at DESC);
CREATE INDEX idx_whatsapp_messages_user_id ON public.whatsapp_messages(user_id);

-- RLS
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Service role can manage everything
CREATE POLICY "Service role can manage whatsapp_messages" ON public.whatsapp_messages
    FOR ALL USING (auth.role() = 'service_role');

-- Users can view their own messages
CREATE POLICY "Users can view their whatsapp_messages" ON public.whatsapp_messages
    FOR SELECT USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.whatsapp_messages TO service_role;
GRANT SELECT ON public.whatsapp_messages TO authenticated;
