CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone_number TEXT NOT NULL,
    achievement_name TEXT NOT NULL,
    achievement_description TEXT,
    achievement_type TEXT NOT NULL CHECK (achievement_type IN ('fitness', 'nutrition', 'mental_health', 'spirituality', 'streak', 'points')),
    points_value INTEGER DEFAULT 0 CHECK (points_value >= 0),
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_phone_number ON user_achievements(phone_number);
CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked_at ON user_achievements(unlocked_at);
CREATE INDEX IF NOT EXISTS idx_user_achievements_type ON user_achievements(achievement_type);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage user_achievements" ON user_achievements
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view user_achievements" ON user_achievements
    FOR SELECT USING (true);
