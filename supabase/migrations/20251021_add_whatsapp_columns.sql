-- Add missing 'phone' column to whatsapp_messages if it doesn't exist
-- This is a safe migration that won't drop existing data

DO $$ 
BEGIN
    -- Add phone column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'whatsapp_messages' 
        AND column_name = 'phone'
    ) THEN
        ALTER TABLE public.whatsapp_messages 
        ADD COLUMN phone TEXT;
        
        -- Migrate data from phone_number to phone if phone_number exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'whatsapp_messages' 
            AND column_name = 'phone_number'
        ) THEN
            UPDATE public.whatsapp_messages 
            SET phone = phone_number 
            WHERE phone IS NULL;
        END IF;
    END IF;

    -- Add message column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'whatsapp_messages' 
        AND column_name = 'message'
    ) THEN
        ALTER TABLE public.whatsapp_messages 
        ADD COLUMN message TEXT;
        
        -- Migrate from message_content if it exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'whatsapp_messages' 
            AND column_name = 'message_content'
        ) THEN
            UPDATE public.whatsapp_messages 
            SET message = message_content 
            WHERE message IS NULL;
        END IF;
    END IF;

    -- Add event column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'whatsapp_messages' 
        AND column_name = 'event'
    ) THEN
        ALTER TABLE public.whatsapp_messages 
        ADD COLUMN event TEXT DEFAULT 'messages.upsert';
    END IF;

    -- Add timestamp column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'whatsapp_messages' 
        AND column_name = 'timestamp'
    ) THEN
        ALTER TABLE public.whatsapp_messages 
        ADD COLUMN timestamp BIGINT;
        
        -- Migrate from created_at if needed
        UPDATE public.whatsapp_messages 
        SET timestamp = EXTRACT(EPOCH FROM created_at) * 1000 
        WHERE timestamp IS NULL AND created_at IS NOT NULL;
    END IF;

    -- Add user_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'whatsapp_messages' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.whatsapp_messages 
        ADD COLUMN user_id UUID;
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_phone 
    ON public.whatsapp_messages(phone);
    
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_timestamp 
    ON public.whatsapp_messages(timestamp DESC);
