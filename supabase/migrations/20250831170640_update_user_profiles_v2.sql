ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS personality_type TEXT CHECK (personality_type IN ('analitico', 'emotivo', 'pratico', 'social'));
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS cultural_region TEXT CHECK (cultural_region IN ('nordeste', 'sudeste', 'sul', 'centro_oeste', 'norte'));
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS physical_level INTEGER CHECK (physical_level >= 1 AND physical_level <= 4);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS nutrition_level INTEGER CHECK (nutrition_level >= 1 AND nutrition_level <= 4);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS mood_level INTEGER CHECK (mood_level >= 1 AND mood_level <= 4);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS spiritual_level INTEGER CHECK (spiritual_level >= 1 AND spiritual_level <= 4);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0 CHECK (total_points >= 0);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS current_level INTEGER DEFAULT 1 CHECK (current_level >= 1);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS streak_days INTEGER DEFAULT 0 CHECK (streak_days >= 0);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS last_interaction TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_user_profiles_phone_number ON user_profiles(phone_number);
CREATE INDEX IF NOT EXISTS idx_user_profiles_cultural_region ON user_profiles(cultural_region);
CREATE INDEX IF NOT EXISTS idx_user_profiles_personality_type ON user_profiles(personality_type);

CREATE OR REPLACE FUNCTION increment_points(phone TEXT, points INTEGER)
RETURNS INTEGER AS $$
DECLARE
    current_points INTEGER;
BEGIN
    SELECT total_points INTO current_points 
    FROM user_profiles 
    WHERE phone_number = phone;
    
    IF current_points IS NULL THEN
        current_points := 0;
    END IF;
    
    RETURN current_points + points;
END;
$$ LANGUAGE plpgsql;
