CREATE TABLE IF NOT EXISTS daily_checkins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    mood INTEGER NOT NULL CHECK (mood >= 1 AND mood <= 5),
    energy_level INTEGER NOT NULL CHECK (energy_level >= 1 AND energy_level <= 5),
    sleep_hours DECIMAL(3,1) NOT NULL CHECK (sleep_hours >= 0 AND sleep_hours <= 24),
    water_intake INTEGER NOT NULL CHECK (water_intake >= 0),
    exercise_minutes INTEGER NOT NULL CHECK (exercise_minutes >= 0),
    notes TEXT,
    ai_feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own checkins" ON daily_checkins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own checkins" ON daily_checkins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own checkins" ON daily_checkins FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX idx_daily_checkins_user_date ON daily_checkins(user_id, date DESC);
