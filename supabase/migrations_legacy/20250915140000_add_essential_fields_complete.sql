-- Migration: Add Essential Fields Complete
-- Date: 2025-09-15
-- Purpose: Add all missing essential fields for complete client tracking and coaching functionality

-- Add missing fields to user_profiles table
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS current_weight DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS target_weight DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS height DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS gender VARCHAR(10),
ADD COLUMN IF NOT EXISTS activity_level VARCHAR(20),
ADD COLUMN IF NOT EXISTS goal_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(20),
ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);

-- Add missing fields to daily_checkins table
ALTER TABLE daily_checkins
ADD COLUMN IF NOT EXISTS weight DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 5),
ADD COLUMN IF NOT EXISTS sleep_hours DECIMAL(3,1),
ADD COLUMN IF NOT EXISTS energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 5),
ADD COLUMN IF NOT EXISTS stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 5),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Ensure water_intake has proper default and NOT NULL constraint only when column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'daily_checkins'
      AND column_name = 'water_intake'
  ) THEN
    EXECUTE 'ALTER TABLE daily_checkins ALTER COLUMN water_intake SET DEFAULT 0';
    EXECUTE 'ALTER TABLE daily_checkins ALTER COLUMN water_intake SET NOT NULL';
  END IF;
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone ON user_profiles(phone);

CREATE INDEX IF NOT EXISTS idx_user_profiles_current_weight ON user_profiles(current_weight);

CREATE INDEX IF NOT EXISTS idx_user_profiles_activity_level ON user_profiles(activity_level);

CREATE INDEX IF NOT EXISTS idx_user_profiles_goal_type ON user_profiles(goal_type);

CREATE INDEX IF NOT EXISTS idx_daily_checkins_weight ON daily_checkins(weight);

CREATE INDEX IF NOT EXISTS idx_daily_checkins_mood_score ON daily_checkins(mood_score);

CREATE INDEX IF NOT EXISTS idx_daily_checkins_created_at ON daily_checkins(created_at);

CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_id_date ON daily_checkins (user_id, created_at);

-- Add comments for documentation
COMMENT ON COLUMN user_profiles.phone IS 'Phone number for client contact';

COMMENT ON COLUMN user_profiles.whatsapp IS 'WhatsApp number for client contact';

COMMENT ON COLUMN user_profiles.current_weight IS 'Current weight in kg for progress tracking';

COMMENT ON COLUMN user_profiles.target_weight IS 'Target weight in kg for goal setting';

COMMENT ON COLUMN user_profiles.height IS 'Height in cm for BMI calculations';

COMMENT ON COLUMN user_profiles.age IS 'Age for personalized recommendations';

COMMENT ON COLUMN user_profiles.gender IS 'Gender for personalized recommendations (male/female/other)';

COMMENT ON COLUMN user_profiles.activity_level IS 'Activity level (sedentary/light/moderate/active/very_active)';

COMMENT ON COLUMN user_profiles.goal_type IS 'Primary fitness/health goal type';

COMMENT ON COLUMN user_profiles.full_name IS 'Full name of the user';

COMMENT ON COLUMN daily_checkins.weight IS 'Daily weight measurement in kg';

COMMENT ON COLUMN daily_checkins.mood_score IS 'Mood score from 1-5 for wellbeing tracking';

COMMENT ON COLUMN daily_checkins.sleep_hours IS 'Hours of sleep for recovery tracking';

COMMENT ON COLUMN daily_checkins.energy_level IS 'Energy level from 1-5';

COMMENT ON COLUMN daily_checkins.stress_level IS 'Stress level from 1-5';

-- Create or update the updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add update trigger for updated_at in daily_checkins
DROP TRIGGER IF EXISTS update_daily_checkins_updated_at ON daily_checkins;

DROP TRIGGER IF EXISTS update_daily_checkins_updated_at ON daily_checkins;

CREATE TRIGGER update_daily_checkins_updated_at
    BEFORE UPDATE ON daily_checkins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to calculate BMI
CREATE OR REPLACE FUNCTION calculate_bmi(weight_kg DECIMAL, height_cm DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
    IF weight_kg IS NULL OR height_cm IS NULL OR height_cm = 0 THEN
        RETURN NULL;
    END IF;
    RETURN ROUND((weight_kg / POWER(height_cm / 100, 2))::DECIMAL, 1);
END;
$$ LANGUAGE plpgsql;

-- Create view for user progress tracking
CREATE OR REPLACE VIEW user_progress AS
SELECT 
    up.id AS user_id,
    up.full_name,
    up.current_weight,
    up.target_weight,
    up.height,
    calculate_bmi(up.current_weight, up.height) as current_bmi,
    calculate_bmi(up.target_weight, up.height) as target_bmi,
    up.goal_type,
    up.activity_level,
    COUNT(dc.id) as total_checkins,
    AVG(dc.mood_score) as avg_mood,
    AVG(dc.sleep_hours) as avg_sleep,
    MAX(dc.created_at) as last_checkin,
    (SELECT weight FROM daily_checkins WHERE user_id = up.id AND weight IS NOT NULL ORDER BY created_at DESC LIMIT 1) as latest_weight
FROM user_profiles up
LEFT JOIN daily_checkins dc ON up.id = dc.user_id
GROUP BY up.id, up.full_name, up.current_weight, up.target_weight, up.height, up.goal_type, up.activity_level;

COMMENT ON VIEW user_progress IS 'Comprehensive view of user progress including BMI calculations and check-in statistics';

-- Grant appropriate permissions
GRANT SELECT ON user_progress TO authenticated;

GRANT EXECUTE ON FUNCTION calculate_bmi(DECIMAL, DECIMAL) TO authenticated;
