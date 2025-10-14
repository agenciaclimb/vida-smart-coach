-- Migration: Add notification preferences to user_profiles
-- Date: 2025-10-14
-- Purpose: Add wants_reminders and wants_quotes columns for notification settings

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS wants_reminders BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS wants_quotes BOOLEAN DEFAULT true;

-- Update existing users to have notifications enabled by default
UPDATE user_profiles 
SET 
    wants_reminders = COALESCE(wants_reminders, true),
    wants_quotes = COALESCE(wants_quotes, true)
WHERE wants_reminders IS NULL OR wants_quotes IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN user_profiles.wants_reminders IS 'User preference for receiving check-in reminders';
COMMENT ON COLUMN user_profiles.wants_quotes IS 'User preference for receiving motivational quotes';