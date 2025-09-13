CREATE TABLE IF NOT EXISTS gamification (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    total_points INTEGER DEFAULT 0 CHECK (total_points >= 0),
    current_streak INTEGER DEFAULT 0 CHECK (current_streak >= 0),
    longest_streak INTEGER DEFAULT 0 CHECK (longest_streak >= 0),
    level INTEGER DEFAULT 1 CHECK (level >= 1),
    badges TEXT[] DEFAULT '{}',
    weekly_goal_progress INTEGER DEFAULT 0 CHECK (weekly_goal_progress >= 0 AND weekly_goal_progress <= 100),
    monthly_goal_progress INTEGER DEFAULT 0 CHECK (monthly_goal_progress >= 0 AND monthly_goal_progress <= 100),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE gamification ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own gamification" ON gamification FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own gamification" ON gamification FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own gamification" ON gamification FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_gamification_updated_at BEFORE UPDATE ON gamification FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION create_gamification_for_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO gamification (user_id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER create_gamification_on_user_creation 
    AFTER INSERT ON user_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION create_gamification_for_user();
