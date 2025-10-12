-- Migration: Idempotently fix the water column in daily_checkins
-- Reason: The original migration 20250916140000 failed because the column
-- water_intake did not exist. This script ensures the column is named water_glasses.

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'daily_checkins'
        AND column_name = 'water_intake'
    ) THEN
        ALTER TABLE public.daily_checkins RENAME COLUMN water_intake TO water_glasses;
    END IF;
END
$$;
