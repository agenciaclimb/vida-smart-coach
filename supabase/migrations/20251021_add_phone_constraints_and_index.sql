-- Enforce normalized phone format and add index
BEGIN;

-- Sanitizar valores existentes: manter apenas dígitos; se vazio, deixar NULL
UPDATE public.whatsapp_messages
SET phone = NULLIF(REGEXP_REPLACE(COALESCE(phone, ''), '[^0-9]', '', 'g'), '')
WHERE phone IS NOT NULL;

-- Index by phone for faster lookups
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_phone ON public.whatsapp_messages (phone);

-- Add constraint: no '@s.whatsapp.net' suffix
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'whatsapp_phone_no_suffix'
  ) THEN
    ALTER TABLE public.whatsapp_messages
      ADD CONSTRAINT whatsapp_phone_no_suffix
      CHECK (phone IS NULL OR phone !~ '@s\\.whatsapp\\.net$');
  END IF;
END$$;

-- Add constraint: numeric-only phone
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'whatsapp_phone_numeric'
  ) THEN
    ALTER TABLE public.whatsapp_messages
      ADD CONSTRAINT whatsapp_phone_numeric
      CHECK (phone IS NULL OR phone ~ '^[0-9]+$');
  END IF;
END$$;

COMMIT;
