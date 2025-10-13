-- Migration: Add a dedicated date column to daily_checkins to create a stable index
-- Date: 2025-09-15

-- Add a dedicated date column
ALTER TABLE public.daily_checkins ADD COLUMN IF NOT EXISTS created_date DATE;

-- Update existing rows to populate the new column
-- This might take time on large tables
UPDATE public.daily_checkins SET created_date = created_at::date WHERE created_date IS NULL;

-- Create a function and trigger to keep the column updated automatically
CREATE OR REPLACE FUNCTION set_created_date()
RETURNS TRIGGER AS $$
BEGIN
    NEW.created_date = NEW.created_at::date;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists, to make this migration idempotent
DROP TRIGGER IF EXISTS set_daily_checkin_created_date ON public.daily_checkins;

CREATE TRIGGER set_daily_checkin_created_date
BEFORE INSERT OR UPDATE ON public.daily_checkins
FOR EACH ROW
EXECUTE FUNCTION set_created_date();

-- Now, create a simple, stable index on the new column
CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_id_date ON public.daily_checkins(user_id, created_date);
