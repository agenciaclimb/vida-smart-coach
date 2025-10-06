-- Create emergency_alerts table for WhatsApp emergency detection system
-- This table stores emergency alerts detected from user messages

CREATE TABLE IF NOT EXISTS public.emergency_alerts (
   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
   user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
   phone_number VARCHAR(20) NOT NULL,
   message_content TEXT NOT NULL,
   detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
   response_sent BOOLEAN DEFAULT FALSE,
   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_user_id ON public.emergency_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_phone ON public.emergency_alerts(phone_number);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_detected_at ON public.emergency_alerts(detected_at DESC);

-- Add table comment
COMMENT ON TABLE public.emergency_alerts IS 'Emergency alerts detected from WhatsApp messages requiring intervention';

-- Add column comments
COMMENT ON COLUMN public.emergency_alerts.user_id IS 'Reference to user profile if phone number matches a registered user';
COMMENT ON COLUMN public.emergency_alerts.phone_number IS 'Phone number from which the emergency message was sent';
COMMENT ON COLUMN public.emergency_alerts.message_content IS 'Original message content that triggered emergency detection';
COMMENT ON COLUMN public.emergency_alerts.detected_at IS 'Timestamp when the emergency was detected';
COMMENT ON COLUMN public.emergency_alerts.response_sent IS 'Whether emergency response message was successfully sent';