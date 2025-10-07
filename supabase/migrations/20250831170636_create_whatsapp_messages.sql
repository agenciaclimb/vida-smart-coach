CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone_number TEXT NOT NULL,
    message_content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text',
    webhook_data JSONB,
    received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    instance_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_phone_number ON whatsapp_messages(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_received_at ON whatsapp_messages(received_at);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_instance_id ON whatsapp_messages(instance_id);

ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage whatsapp_messages" ON whatsapp_messages
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view whatsapp_messages" ON whatsapp_messages
    FOR SELECT USING (true);
