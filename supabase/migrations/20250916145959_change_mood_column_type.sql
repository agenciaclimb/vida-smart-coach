-- Migration: Change mood column type from INTEGER to TEXT
-- Date: 2025-09-16

-- Step 1: Drop the existing CHECK constraint on the mood column.
-- The name is inferred from the table and column name as it was not explicitly named.
ALTER TABLE public.daily_checkins DROP CONSTRAINT IF EXISTS daily_checkins_mood_check;

-- Step 2: Alter the column type to TEXT.
ALTER TABLE public.daily_checkins ALTER COLUMN mood TYPE TEXT USING (mood::text);