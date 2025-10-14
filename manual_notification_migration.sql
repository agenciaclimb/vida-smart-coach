-- Migration: Add notification preferences to user_profiles
-- EXECUTE THIS SQL DIRECTLY IN SUPABASE DASHBOARD - SQL EDITOR

-- Add columns if they don't exist
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS wants_reminders BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS wants_quotes BOOLEAN DEFAULT true;

-- Update existing users to have notifications enabled by default
UPDATE user_profiles 
SET wants_reminders = true, wants_quotes = true 
WHERE wants_reminders IS NULL OR wants_quotes IS NULL;

-- Add comment to document the change
COMMENT ON COLUMN user_profiles.wants_reminders IS 'User preference for receiving reminder notifications';
COMMENT ON COLUMN user_profiles.wants_quotes IS 'User preference for receiving motivational quotes';

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name IN ('wants_reminders', 'wants_quotes');