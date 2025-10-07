-- 🚨 CRITICAL TYPE MISMATCH FIX MIGRATION
-- 📍 EXECUTE THIS SQL IN SUPABASE DASHBOARD IMMEDIATELY
-- 🎯 This fixes the "ERROR: 42883: operator does not exist: text = integer" error
-- 📋 Copy and paste this COMPLETE code in Supabase SQL Editor, then click "RUN"

BEGIN;

-- ✅ 1. CHECK AND FIX DATA TYPE INCONSISTENCIES IN USER_PROFILES TABLE
DO $$
DECLARE
    column_exists BOOLEAN;
    column_type TEXT;
BEGIN
    -- Check if user_profiles table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        RAISE NOTICE 'Creating user_profiles table...';
        CREATE TABLE user_profiles (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            full_name TEXT,
            name TEXT,
            email TEXT,
            phone VARCHAR(20),
            age INTEGER CHECK (age > 0 AND age < 150),
            height INTEGER CHECK (height > 0 AND height < 300),
            current_weight DECIMAL(5,2) CHECK (current_weight > 0 AND current_weight < 1000),
            target_weight DECIMAL(5,2) CHECK (target_weight > 0 AND target_weight < 1000),
            gender VARCHAR(20),
            activity_level VARCHAR(30),
            goal_type VARCHAR(50),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;

    -- Fix column types that might be causing the text = integer error
    -- Check age column type
    SELECT data_type INTO column_type
    FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'age';
    
    IF column_type IS NOT NULL AND column_type != 'integer' THEN
        RAISE NOTICE 'Fixing age column type from % to integer...', column_type;
        -- First, clean invalid data
        UPDATE user_profiles 
        SET age = NULL 
        WHERE age::TEXT !~ '^[0-9]+$' OR age::INTEGER < 1 OR age::INTEGER > 150;
        -- Then alter column type
        ALTER TABLE user_profiles ALTER COLUMN age TYPE INTEGER USING age::INTEGER;
    END IF;

    -- Check height column type  
    SELECT data_type INTO column_type
    FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'height';
    
    IF column_type IS NOT NULL AND column_type != 'integer' THEN
        RAISE NOTICE 'Fixing height column type from % to integer...', column_type;
        -- First, clean invalid data
        UPDATE user_profiles 
        SET height = NULL 
        WHERE height::TEXT !~ '^[0-9]+$' OR height::INTEGER < 1 OR height::INTEGER > 300;
        -- Then alter column type
        ALTER TABLE user_profiles ALTER COLUMN height TYPE INTEGER USING height::INTEGER;
    END IF;

    -- Check current_weight column type
    SELECT data_type INTO column_type
    FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'current_weight';
    
    IF column_type IS NOT NULL AND column_type NOT IN ('numeric', 'decimal') THEN
        RAISE NOTICE 'Fixing current_weight column type from % to decimal...', column_type;
        -- First, clean invalid data
        UPDATE user_profiles 
        SET current_weight = NULL 
        WHERE current_weight::TEXT !~ '^[0-9]+\.?[0-9]*$' OR current_weight::DECIMAL < 1 OR current_weight::DECIMAL > 1000;
        -- Then alter column type
        ALTER TABLE user_profiles ALTER COLUMN current_weight TYPE DECIMAL(5,2) USING current_weight::DECIMAL;
    END IF;

    -- Check target_weight column type
    SELECT data_type INTO column_type
    FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'target_weight';
    
    IF column_type IS NOT NULL AND column_type NOT IN ('numeric', 'decimal') THEN
        RAISE NOTICE 'Fixing target_weight column type from % to decimal...', column_type;
        -- First, clean invalid data
        UPDATE user_profiles 
        SET target_weight = NULL 
        WHERE target_weight::TEXT !~ '^[0-9]+\.?[0-9]*$' OR target_weight::DECIMAL < 1 OR target_weight::DECIMAL > 1000;
        -- Then alter column type
        ALTER TABLE user_profiles ALTER COLUMN target_weight TYPE DECIMAL(5,2) USING target_weight::DECIMAL;
    END IF;
END $$;

-- ✅ 2. ENSURE ALL REQUIRED COLUMNS EXIST WITH CORRECT TYPES
DO $$
BEGIN
    -- Add missing columns with correct types
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='phone') THEN
        ALTER TABLE user_profiles ADD COLUMN phone VARCHAR(20);
        RAISE NOTICE 'Added phone column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='age') THEN
        ALTER TABLE user_profiles ADD COLUMN age INTEGER CHECK (age > 0 AND age < 150);
        RAISE NOTICE 'Added age column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='height') THEN
        ALTER TABLE user_profiles ADD COLUMN height INTEGER CHECK (height > 0 AND height < 300);
        RAISE NOTICE 'Added height column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='current_weight') THEN
        ALTER TABLE user_profiles ADD COLUMN current_weight DECIMAL(5,2) CHECK (current_weight > 0 AND current_weight < 1000);
        RAISE NOTICE 'Added current_weight column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='target_weight') THEN
        ALTER TABLE user_profiles ADD COLUMN target_weight DECIMAL(5,2) CHECK (target_weight > 0 AND target_weight < 1000);
        RAISE NOTICE 'Added target_weight column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='gender') THEN
        ALTER TABLE user_profiles ADD COLUMN gender VARCHAR(20);
        RAISE NOTICE 'Added gender column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='activity_level') THEN
        ALTER TABLE user_profiles ADD COLUMN activity_level VARCHAR(30);
        RAISE NOTICE 'Added activity_level column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='goal_type') THEN
        ALTER TABLE user_profiles ADD COLUMN goal_type VARCHAR(50);
        RAISE NOTICE 'Added goal_type column';
    END IF;
END $$;

-- ✅ 3. FIX DAILY_CHECKINS TABLE TYPE MISMATCHES
DO $$
DECLARE
    column_type TEXT;
BEGIN
    -- Check if daily_checkins table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'daily_checkins') THEN
        RAISE NOTICE 'Creating daily_checkins table...';
        CREATE TABLE daily_checkins (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            date DATE NOT NULL DEFAULT CURRENT_DATE,
            mood INTEGER CHECK (mood >= 1 AND mood <= 5),
            mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 5),
            energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 5),
            sleep_hours DECIMAL(3,1) CHECK (sleep_hours > 0 AND sleep_hours <= 24),
            weight DECIMAL(5,2) CHECK (weight > 0 AND weight < 1000),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, date)
        );
    END IF;

    -- Fix mood column type
    SELECT data_type INTO column_type
    FROM information_schema.columns 
    WHERE table_name = 'daily_checkins' AND column_name = 'mood';
    
    IF column_type IS NOT NULL AND column_type != 'integer' THEN
        RAISE NOTICE 'Fixing mood column type from % to integer...', column_type;
        UPDATE daily_checkins 
        SET mood = NULL 
        WHERE mood::TEXT !~ '^[1-5]$';
        ALTER TABLE daily_checkins ALTER COLUMN mood TYPE INTEGER USING mood::INTEGER;
    END IF;

    -- Fix mood_score column type
    SELECT data_type INTO column_type
    FROM information_schema.columns 
    WHERE table_name = 'daily_checkins' AND column_name = 'mood_score';
    
    IF column_type IS NOT NULL AND column_type != 'integer' THEN
        RAISE NOTICE 'Fixing mood_score column type from % to integer...', column_type;
        UPDATE daily_checkins 
        SET mood_score = NULL 
        WHERE mood_score::TEXT !~ '^[1-5]$';
        ALTER TABLE daily_checkins ALTER COLUMN mood_score TYPE INTEGER USING mood_score::INTEGER;
    END IF;

    -- Fix energy_level column type
    SELECT data_type INTO column_type
    FROM information_schema.columns 
    WHERE table_name = 'daily_checkins' AND column_name = 'energy_level';
    
    IF column_type IS NOT NULL AND column_type != 'integer' THEN
        RAISE NOTICE 'Fixing energy_level column type from % to integer...', column_type;
        UPDATE daily_checkins 
        SET energy_level = NULL 
        WHERE energy_level::TEXT !~ '^[1-5]$';
        ALTER TABLE daily_checkins ALTER COLUMN energy_level TYPE INTEGER USING energy_level::INTEGER;
    END IF;

    -- Add missing columns in daily_checkins
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='daily_checkins' AND column_name='weight') THEN
        ALTER TABLE daily_checkins ADD COLUMN weight DECIMAL(5,2) CHECK (weight > 0 AND weight < 1000);
        RAISE NOTICE 'Added weight column to daily_checkins';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='daily_checkins' AND column_name='mood_score') THEN
        ALTER TABLE daily_checkins ADD COLUMN mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 5);
        RAISE NOTICE 'Added mood_score column to daily_checkins';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='daily_checkins' AND column_name='updated_at') THEN
        ALTER TABLE daily_checkins ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column to daily_checkins';
    END IF;
END $$;

-- ✅ 4. CREATE SAFE UPSERT FUNCTION FOR PROFILES (NO TYPE CONFLICTS)
CREATE OR REPLACE FUNCTION safe_upsert_user_profile(
    p_user_id UUID,
    p_full_name TEXT DEFAULT NULL,
    p_name TEXT DEFAULT NULL,
    p_email TEXT DEFAULT NULL,
    p_phone VARCHAR(20) DEFAULT NULL,
    p_age INTEGER DEFAULT NULL,
    p_height INTEGER DEFAULT NULL,
    p_current_weight DECIMAL(5,2) DEFAULT NULL,
    p_target_weight DECIMAL(5,2) DEFAULT NULL,
    p_gender VARCHAR(20) DEFAULT NULL,
    p_activity_level VARCHAR(30) DEFAULT NULL,
    p_goal_type VARCHAR(50) DEFAULT NULL
)
RETURNS user_profiles AS $$
DECLARE
    result user_profiles;
BEGIN
    -- Validate input types to prevent type mismatch errors
    IF p_age IS NOT NULL AND (p_age < 1 OR p_age > 150) THEN
        RAISE EXCEPTION 'Age must be between 1 and 150';
    END IF;
    
    IF p_height IS NOT NULL AND (p_height < 1 OR p_height > 300) THEN
        RAISE EXCEPTION 'Height must be between 1 and 300 cm';
    END IF;
    
    IF p_current_weight IS NOT NULL AND (p_current_weight < 1 OR p_current_weight > 1000) THEN
        RAISE EXCEPTION 'Current weight must be between 1 and 1000 kg';
    END IF;
    
    IF p_target_weight IS NOT NULL AND (p_target_weight < 1 OR p_target_weight > 1000) THEN
        RAISE EXCEPTION 'Target weight must be between 1 and 1000 kg';
    END IF;

    -- Safe upsert with explicit type casting
    INSERT INTO user_profiles (
        id, full_name, name, email, phone, age, height, 
        current_weight, target_weight, gender, activity_level, goal_type,
        created_at, updated_at
    ) VALUES (
        p_user_id,
        p_full_name,
        COALESCE(p_name, p_full_name),
        p_email,
        p_phone,
        p_age::INTEGER,
        p_height::INTEGER,
        p_current_weight::DECIMAL(5,2),
        p_target_weight::DECIMAL(5,2),
        p_gender,
        p_activity_level,
        p_goal_type,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
        name = COALESCE(EXCLUDED.name, EXCLUDED.full_name, user_profiles.name),
        email = COALESCE(EXCLUDED.email, user_profiles.email),
        phone = COALESCE(EXCLUDED.phone, user_profiles.phone),
        age = COALESCE(EXCLUDED.age::INTEGER, user_profiles.age),
        height = COALESCE(EXCLUDED.height::INTEGER, user_profiles.height),
        current_weight = COALESCE(EXCLUDED.current_weight::DECIMAL(5,2), user_profiles.current_weight),
        target_weight = COALESCE(EXCLUDED.target_weight::DECIMAL(5,2), user_profiles.target_weight),
        gender = COALESCE(EXCLUDED.gender, user_profiles.gender),
        activity_level = COALESCE(EXCLUDED.activity_level, user_profiles.activity_level),
        goal_type = COALESCE(EXCLUDED.goal_type, user_profiles.goal_type),
        updated_at = NOW()
    RETURNING * INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ✅ 5. CREATE SAFE UPSERT FUNCTION FOR DAILY CHECKINS
CREATE OR REPLACE FUNCTION safe_upsert_daily_checkin(
    p_user_id UUID,
    p_date DATE DEFAULT CURRENT_DATE,
    p_mood INTEGER DEFAULT NULL,
    p_mood_score INTEGER DEFAULT NULL,
    p_energy_level INTEGER DEFAULT NULL,
    p_sleep_hours DECIMAL(3,1) DEFAULT NULL,
    p_weight DECIMAL(5,2) DEFAULT NULL
)
RETURNS daily_checkins AS $$
DECLARE
    result daily_checkins;
BEGIN
    -- Validate input types
    IF p_mood IS NOT NULL AND (p_mood < 1 OR p_mood > 5) THEN
        RAISE EXCEPTION 'Mood must be between 1 and 5';
    END IF;
    
    IF p_mood_score IS NOT NULL AND (p_mood_score < 1 OR p_mood_score > 5) THEN
        RAISE EXCEPTION 'Mood score must be between 1 and 5';
    END IF;
    
    IF p_energy_level IS NOT NULL AND (p_energy_level < 1 OR p_energy_level > 5) THEN
        RAISE EXCEPTION 'Energy level must be between 1 and 5';
    END IF;
    
    IF p_sleep_hours IS NOT NULL AND (p_sleep_hours < 0 OR p_sleep_hours > 24) THEN
        RAISE EXCEPTION 'Sleep hours must be between 0 and 24';
    END IF;
    
    IF p_weight IS NOT NULL AND (p_weight < 1 OR p_weight > 1000) THEN
        RAISE EXCEPTION 'Weight must be between 1 and 1000 kg';
    END IF;

    -- Safe upsert with explicit type casting
    INSERT INTO daily_checkins (
        user_id, date, mood, mood_score, energy_level, sleep_hours, weight,
        created_at, updated_at
    ) VALUES (
        p_user_id,
        p_date,
        p_mood::INTEGER,
        p_mood_score::INTEGER,
        p_energy_level::INTEGER,
        p_sleep_hours::DECIMAL(3,1),
        p_weight::DECIMAL(5,2),
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id, date) DO UPDATE SET
        mood = COALESCE(EXCLUDED.mood::INTEGER, daily_checkins.mood),
        mood_score = COALESCE(EXCLUDED.mood_score::INTEGER, daily_checkins.mood_score),
        energy_level = COALESCE(EXCLUDED.energy_level::INTEGER, daily_checkins.energy_level),
        sleep_hours = COALESCE(EXCLUDED.sleep_hours::DECIMAL(3,1), daily_checkins.sleep_hours),
        weight = COALESCE(EXCLUDED.weight::DECIMAL(5,2), daily_checkins.weight),
        updated_at = NOW()
    RETURNING * INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ✅ 6. ENABLE RLS AND CREATE POLICIES
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- Create policies for user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own checkins" ON daily_checkins;
DROP POLICY IF EXISTS "Users can insert own checkins" ON daily_checkins;
DROP POLICY IF EXISTS "Users can update own checkins" ON daily_checkins;

-- Create policies for daily_checkins
CREATE POLICY "Users can view own checkins" ON daily_checkins
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own checkins" ON daily_checkins
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own checkins" ON daily_checkins
    FOR UPDATE USING (auth.uid() = user_id);

-- ✅ 7. CREATE PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_full_name ON user_profiles(full_name);
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone ON user_profiles(phone);

CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_date ON daily_checkins(user_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_date ON daily_checkins(date);

-- ✅ 8. CREATE TRIGGER FOR AUTO UPDATE TIMESTAMPS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_daily_checkins_updated_at ON daily_checkins;
CREATE TRIGGER update_daily_checkins_updated_at
    BEFORE UPDATE ON daily_checkins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMIT;

-- ✅ 9. FINAL VALIDATION AND SUCCESS MESSAGE
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 TYPE MISMATCH FIX MIGRATION COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '✅ All column types have been standardized';
    RAISE NOTICE '✅ Safe upsert functions created';
    RAISE NOTICE '✅ RLS policies configured';
    RAISE NOTICE '✅ Performance indexes created';
    RAISE NOTICE '✅ Auto-update triggers configured';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 The "text = integer" error should now be resolved';
    RAISE NOTICE '📱 Profile saving functionality should work correctly';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 Next steps:';
    RAISE NOTICE '1. Test profile saving in the application';
    RAISE NOTICE '2. Test daily check-in functionality';
    RAISE NOTICE '3. Monitor for any remaining errors';
END $$;