
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    features TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.rewards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    points_required INTEGER NOT NULL DEFAULT 0,
    badge_icon VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255),
    whatsapp_number VARCHAR(20),
    birth_date DATE,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    height DECIMAL(5,2),
    weight DECIMAL(5,2),
    activity_level VARCHAR(20) CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
    health_goals TEXT[],
    medical_conditions TEXT[],
    medications TEXT[],
    allergies TEXT[],
    role VARCHAR(20) DEFAULT 'client' CHECK (role IN ('client', 'admin', 'affiliate')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS gamification (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    total_points INTEGER DEFAULT 0,
    current_level INTEGER DEFAULT 1,
    badges TEXT[] DEFAULT '{}',
    streak_days INTEGER DEFAULT 0,
    last_checkin_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_phone VARCHAR(20) NOT NULL,
    message_type VARCHAR(20) NOT NULL CHECK (message_type IN ('incoming', 'outgoing')),
    content TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed BOOLEAN DEFAULT FALSE,
    ai_response TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_date ON daily_checkins(user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_phone ON whatsapp_messages(user_phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_timestamp ON whatsapp_messages(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_gamification_user_id ON gamification(user_id);
CREATE INDEX IF NOT EXISTS idx_gamification_points ON gamification(total_points DESC);

CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_whatsapp ON user_profiles(whatsapp_number);


ALTER TABLE user_profiles ADD CONSTRAINT check_positive_height CHECK (height > 0);
ALTER TABLE user_profiles ADD CONSTRAINT check_positive_weight CHECK (weight > 0);

ALTER TABLE user_profiles ADD CONSTRAINT check_whatsapp_format CHECK (whatsapp_number ~ '^\+?[1-9]\d{1,14}$');

ALTER TABLE gamification ADD CONSTRAINT check_non_negative_points CHECK (total_points >= 0);
ALTER TABLE gamification ADD CONSTRAINT check_positive_level CHECK (current_level > 0);
ALTER TABLE gamification ADD CONSTRAINT check_non_negative_streak CHECK (streak_days >= 0);


COMMENT ON TABLE public.plans IS 'Subscription plans and pricing information';
COMMENT ON TABLE public.rewards IS 'Gamification rewards and badges system';
COMMENT ON TABLE user_profiles IS 'User profile information and health preferences';
COMMENT ON TABLE daily_checkins IS 'Daily health check-ins and mood tracking';
COMMENT ON TABLE gamification IS 'User gamification data including points and levels';
COMMENT ON TABLE whatsapp_messages IS 'WhatsApp message history and AI responses';

COMMENT ON COLUMN user_profiles.activity_level IS 'Physical activity level: sedentary, light, moderate, active, very_active';
COMMENT ON COLUMN user_profiles.role IS 'User role: client, admin, or affiliate';
COMMENT ON COLUMN daily_checkins.mood IS 'Mood rating from 1 (very bad) to 5 (excellent)';
COMMENT ON COLUMN daily_checkins.energy_level IS 'Energy level from 1 (very low) to 5 (very high)';
COMMENT ON COLUMN gamification.streak_days IS 'Consecutive days of check-ins';
