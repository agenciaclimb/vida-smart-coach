-- Migration: Add missing essential fields for client tracking
-- Date: 2025-09-15
-- Purpose: Restore profile and check-in fields needed for client evolution tracking and plan creation

-- Add missing fields to user_profiles table
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS current_weight DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS target_weight DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS gender VARCHAR(10),
ADD COLUMN IF NOT EXISTS goal_type VARCHAR(50);

-- Add missing fields to daily_checkins table
ALTER TABLE daily_checkins
ADD COLUMN IF NOT EXISTS weight DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS mood_score INTEGER,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone ON user_profiles(phone);

CREATE INDEX IF NOT EXISTS idx_user_profiles_current_weight ON user_profiles(current_weight);

CREATE INDEX IF NOT EXISTS idx_daily_checkins_weight ON daily_checkins(weight);

CREATE INDEX IF NOT EXISTS idx_daily_checkins_mood_score ON daily_checkins(mood_score);

-- Add comments for documentation
COMMENT ON COLUMN user_profiles.phone IS 'WhatsApp phone number for client contact';

COMMENT ON COLUMN user_profiles.current_weight IS 'Current weight in kg for progress tracking';

COMMENT ON COLUMN user_profiles.target_weight IS 'Target weight in kg for goal setting';

COMMENT ON COLUMN user_profiles.gender IS 'Gender for personalized recommendations';

COMMENT ON COLUMN user_profiles.goal_type IS 'Primary fitness/health goal type';

COMMENT ON COLUMN daily_checkins.weight IS 'Daily weight measurement in kg';

COMMENT ON COLUMN daily_checkins.mood_score IS 'Mood score from 1-5 for wellbeing tracking';

-- Update RLS policies if needed (ensure existing policies cover new columns)
-- The existing policies should automatically cover the new columns

-- Add update trigger for updated_at in daily_checkins
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_daily_checkins_updated_at ON daily_checkins;

DROP TRIGGER IF EXISTS update_daily_checkins_updated_at ON daily_checkins;

CREATE TRIGGER update_daily_checkins_updated_at
    BEFORE UPDATE ON daily_checkins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
