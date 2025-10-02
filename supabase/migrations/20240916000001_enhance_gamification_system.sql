-- Enhance Gamification System - Vida Smart Coach
-- Based on the detailed gamification specification document

-- ==========================================
-- 1. ENHANCED GAMIFICATION TABLE
-- ==========================================

-- Add new columns to existing gamification table
ALTER TABLE gamification ADD COLUMN IF NOT EXISTS physical_points INTEGER DEFAULT 0 CHECK (physical_points >= 0);
ALTER TABLE gamification ADD COLUMN IF NOT EXISTS nutrition_points INTEGER DEFAULT 0 CHECK (nutrition_points >= 0);
ALTER TABLE gamification ADD COLUMN IF NOT EXISTS emotional_points INTEGER DEFAULT 0 CHECK (emotional_points >= 0);
ALTER TABLE gamification ADD COLUMN IF NOT EXISTS spiritual_points INTEGER DEFAULT 0 CHECK (spiritual_points >= 0);
ALTER TABLE gamification ADD COLUMN IF NOT EXISTS referral_points INTEGER DEFAULT 0 CHECK (referral_points >= 0);
ALTER TABLE gamification ADD COLUMN IF NOT EXISTS achievement_points INTEGER DEFAULT 0 CHECK (achievement_points >= 0);
ALTER TABLE gamification ADD COLUMN IF NOT EXISTS weekly_points INTEGER DEFAULT 0 CHECK (weekly_points >= 0);
ALTER TABLE gamification ADD COLUMN IF NOT EXISTS monthly_points INTEGER DEFAULT 0 CHECK (monthly_points >= 0);
ALTER TABLE gamification ADD COLUMN IF NOT EXISTS yearly_points INTEGER DEFAULT 0 CHECK (yearly_points >= 0);

-- ==========================================
-- 2. DAILY ACTIVITIES TRACKING TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS daily_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
    activity_type TEXT NOT NULL, -- 'physical', 'nutrition', 'emotional', 'spiritual'
    activity_name TEXT NOT NULL,
    points_earned INTEGER NOT NULL DEFAULT 0,
    is_bonus BOOLEAN DEFAULT FALSE,
    bonus_type TEXT, -- 'streak', 'consistency', 'special'
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, activity_date, activity_type, activity_name)
);

ALTER TABLE daily_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activities" ON daily_activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activities" ON daily_activities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own activities" ON daily_activities FOR UPDATE USING (auth.uid() = user_id);

-- ==========================================
-- 3. ACHIEVEMENTS AND MILESTONES TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL, -- 'streak_master', 'fitness_warrior', etc.
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT '🏆',
    category TEXT NOT NULL, -- 'consistency', 'milestone', 'social', 'special'
    points_reward INTEGER DEFAULT 0,
    requirements JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 4. USER ACHIEVEMENTS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    progress JSONB DEFAULT '{}',
    
    UNIQUE(user_id, achievement_id)
);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own achievements" ON user_achievements FOR SELECT USING (auth.uid() = user_id);

-- ==========================================
-- 5. LEADERBOARD/RANKING TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS leaderboards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ranking_type TEXT NOT NULL, -- 'global', 'weekly', 'monthly', 'category'
    category TEXT, -- 'physical', 'nutrition', 'emotional', 'spiritual', 'overall'
    points INTEGER NOT NULL DEFAULT 0,
    rank_position INTEGER,
    period_start DATE,
    period_end DATE,
    city TEXT,
    age_group TEXT, -- '18-25', '26-35', '36-45', '46+'
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, ranking_type, category, period_start, period_end)
);

ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on leaderboards" ON leaderboards FOR SELECT USING (true);

-- ==========================================
-- 6. MISSIONS SYSTEM TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS daily_missions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    mission_date DATE NOT NULL DEFAULT CURRENT_DATE,
    mission_type TEXT NOT NULL, -- 'easy', 'medium', 'challenging'
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL, -- 'physical', 'nutrition', 'emotional', 'spiritual'
    target_value JSONB DEFAULT '{}',
    current_progress JSONB DEFAULT '{}',
    points_reward INTEGER NOT NULL DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, mission_date, mission_type)
);

ALTER TABLE daily_missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own missions" ON daily_missions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own missions" ON daily_missions FOR UPDATE USING (auth.uid() = user_id);

-- ==========================================
-- 7. EVENTS AND CHALLENGES TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS gamification_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    event_type TEXT NOT NULL, -- 'challenge', 'competition', 'special_event'
    category TEXT, -- 'monthly_challenge', 'weekend_special', 'seasonal'
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    requirements JSONB DEFAULT '{}',
    rewards JSONB DEFAULT '{}',
    bonus_multiplier DECIMAL(3,2) DEFAULT 1.0,
    is_active BOOLEAN DEFAULT TRUE,
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE gamification_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on events" ON gamification_events FOR SELECT USING (true);

-- ==========================================
-- 8. USER EVENT PARTICIPATION TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS user_event_participation (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id UUID REFERENCES gamification_events(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    current_progress JSONB DEFAULT '{}',
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    points_earned INTEGER DEFAULT 0,
    rank_position INTEGER,
    
    UNIQUE(user_id, event_id)
);

ALTER TABLE user_event_participation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own participation" ON user_event_participation FOR SELECT USING (auth.uid() = user_id);

-- ==========================================
-- 9. ENHANCED REDEMPTION HISTORY TABLE  
-- ==========================================

-- Check if redemption_history table exists, create if not
CREATE TABLE IF NOT EXISTS redemption_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reward_name TEXT NOT NULL,
    reward_icon TEXT DEFAULT '🎁',
    points_spent INTEGER NOT NULL,
    redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
    metadata JSONB DEFAULT '{}'
);

-- Add new columns to redemption_history if they don't exist
ALTER TABLE redemption_history ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled'));
ALTER TABLE redemption_history ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Enable RLS if not already enabled
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'redemption_history' 
        AND policyname = 'Users can view own redemption history'
    ) THEN
        ALTER TABLE redemption_history ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Users can view own redemption history" ON redemption_history FOR SELECT USING (auth.uid() = user_id);
        CREATE POLICY "Users can insert own redemption history" ON redemption_history FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- ==========================================
-- 10. REFERRAL SYSTEM TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS referrals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    referred_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    referral_code TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'registered', 'subscribed', 'active')),
    points_earned INTEGER DEFAULT 0,
    milestone_reached TEXT, -- 'registration', 'subscription', '1_month', 'goal_achieved'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(referrer_id, referred_id)
);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referrals" ON referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- ==========================================
-- 11. INDEXES FOR PERFORMANCE
-- ==========================================

-- Gamification indexes
CREATE INDEX IF NOT EXISTS idx_gamification_user_id ON gamification(user_id);
CREATE INDEX IF NOT EXISTS idx_gamification_total_points ON gamification(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_gamification_level ON gamification(level DESC);

-- Daily activities indexes
CREATE INDEX IF NOT EXISTS idx_daily_activities_user_date ON daily_activities(user_id, activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_activities_type ON daily_activities(activity_type, activity_date DESC);

-- Achievements indexes
CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);

-- Leaderboards indexes
CREATE INDEX IF NOT EXISTS idx_leaderboards_type_category ON leaderboards(ranking_type, category);
CREATE INDEX IF NOT EXISTS idx_leaderboards_rank ON leaderboards(rank_position);
CREATE INDEX IF NOT EXISTS idx_leaderboards_points ON leaderboards(points DESC);

-- Missions indexes
CREATE INDEX IF NOT EXISTS idx_daily_missions_user_date ON daily_missions(user_id, mission_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_missions_completion ON daily_missions(is_completed, mission_date DESC);

-- Events indexes
CREATE INDEX IF NOT EXISTS idx_events_active_dates ON gamification_events(is_active, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_user_participation_events ON user_event_participation(user_id, event_id);

-- ==========================================
-- 12. INITIAL ACHIEVEMENTS DATA
-- ==========================================

INSERT INTO achievements (code, name, description, icon, category, points_reward, requirements) VALUES
-- Consistency Achievements
('streak_master', 'Streak Master', '30 dias consecutivos de atividade', '🔥', 'consistency', 1000, '{"type": "consecutive_days", "target": 30}'),
('lightning', 'Lightning', '7 dias perfeitos de check-ins', '⚡', 'consistency', 500, '{"type": "perfect_week", "target": 7}'),
('diamond_habit', 'Diamond Habit', '100 dias da mesma atividade', '💎', 'consistency', 2000, '{"type": "same_activity", "target": 100}'),

-- Category Achievements
('fitness_warrior', 'Fitness Warrior', 'Metas físicas alcançadas', '💪', 'milestone', 800, '{"type": "physical_goals", "target": 5}'),
('nutrition_ninja', 'Nutrition Ninja', 'Alimentação perfeita por 30 dias', '🥗', 'milestone', 1000, '{"type": "nutrition_perfect", "target": 30}'),
('zen_master', 'Zen Master', 'Equilíbrio emocional mantido', '🧘', 'milestone', 800, '{"type": "emotional_balance", "target": 21}'),
('soul_seeker', 'Soul Seeker', 'Crescimento espiritual consistente', '✨', 'milestone', 800, '{"type": "spiritual_growth", "target": 30}'),

-- Social Achievements
('influencer', 'Influencer', '10+ indicações realizadas', '📢', 'social', 2000, '{"type": "referrals", "target": 10}'),
('community_helper', 'Community Helper', 'Ajudar outros usuários', '🤝', 'social', 500, '{"type": "help_others", "target": 5}'),
('party_starter', 'Party Starter', 'Criar desafios em grupo', '🎉', 'social', 300, '{"type": "create_challenges", "target": 3}'),

-- Milestone Achievements
('transformer_1_week', 'Primeira Semana', '7 dias de transformação', '🌟', 'milestone', 100, '{"type": "week_consistent", "target": 1}'),
('transformer_1_month', '1 Mês de Evolução', '30 dias de mudança', '🏆', 'milestone', 500, '{"type": "month_consistent", "target": 1}'),
('transformer_3_months', '3 Meses de Evolução', 'Trimestre de progresso', '👑', 'milestone', 1500, '{"type": "months_consistent", "target": 3}'),
('transformer_6_months', '6 Meses de Mudança', 'Semestre de transformação', '🔱', 'milestone', 3000, '{"type": "months_consistent", "target": 6}'),
('transformer_1_year', '1 Ano de Transformação', 'Ano completo de evolução', '🎖️', 'milestone', 6000, '{"type": "year_consistent", "target": 1}'),

-- Specific Goal Achievements
('weight_loss_5kg', 'Perdeu 5kg', 'Meta de perda de peso alcançada', '⚖️', 'milestone', 1000, '{"type": "weight_loss", "target": 5}'),
('runner_5k', 'Corredor 5km', 'Capacidade de correr 5km', '🏃', 'milestone', 800, '{"type": "run_distance", "target": 5000}'),
('meditation_30_days', '30 Dias de Meditação', 'Mês completo meditando', '🧘‍♀️', 'milestone', 1200, '{"type": "meditation_streak", "target": 30}'),
('sugar_free_30_days', '30 Dias Sem Açúcar', 'Mês sem açúcar refinado', '🚫🍭', 'milestone', 1500, '{"type": "no_sugar", "target": 30}'),
('mood_improvement', 'Melhoria no Humor', 'Avaliação de humor positiva', '😊', 'milestone', 800, '{"type": "mood_score", "target": 80}')

ON CONFLICT (code) DO NOTHING;

-- ==========================================
-- 13. FUNCTIONS FOR GAMIFICATION LOGIC
-- ==========================================

-- Function to update user points and level
CREATE OR REPLACE FUNCTION update_user_gamification(
    p_user_id UUID,
    p_points_to_add INTEGER,
    p_activity_type TEXT DEFAULT NULL,
    p_is_bonus BOOLEAN DEFAULT FALSE
)
RETURNS VOID AS $$
DECLARE
    current_total INTEGER;
    new_level INTEGER;
BEGIN
    -- Get current total points
    SELECT total_points INTO current_total 
    FROM gamification 
    WHERE user_id = p_user_id;
    
    -- Calculate new total and level
    current_total := COALESCE(current_total, 0) + p_points_to_add;
    new_level := GREATEST(1, FLOOR(current_total / 1000) + 1);
    
    -- Update gamification table
    INSERT INTO gamification (user_id, total_points, level)
    VALUES (p_user_id, current_total, new_level)
    ON CONFLICT (user_id) DO UPDATE SET
        total_points = current_total,
        level = new_level,
        physical_points = CASE WHEN p_activity_type = 'physical' THEN gamification.physical_points + p_points_to_add ELSE gamification.physical_points END,
        nutrition_points = CASE WHEN p_activity_type = 'nutrition' THEN gamification.nutrition_points + p_points_to_add ELSE gamification.nutrition_points END,
        emotional_points = CASE WHEN p_activity_type = 'emotional' THEN gamification.emotional_points + p_points_to_add ELSE gamification.emotional_points END,
        spiritual_points = CASE WHEN p_activity_type = 'spiritual' THEN gamification.spiritual_points + p_points_to_add ELSE gamification.spiritual_points END,
        referral_points = CASE WHEN p_activity_type = 'referral' THEN gamification.referral_points + p_points_to_add ELSE gamification.referral_points END,
        achievement_points = CASE WHEN p_activity_type = 'achievement' THEN gamification.achievement_points + p_points_to_add ELSE gamification.achievement_points END,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to generate daily missions
CREATE OR REPLACE FUNCTION generate_daily_missions_for_user(p_user_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
DECLARE
    missions_data JSONB := '[
        {"type": "easy", "category": "physical", "title": "Check-in de treino", "description": "Faça seu check-in de treino diário", "points": 10},
        {"type": "easy", "category": "nutrition", "title": "Registrar refeição", "description": "Registre pelo menos uma refeição", "points": 10},
        {"type": "easy", "category": "emotional", "title": "Check-in de humor", "description": "Registre como você está se sentindo", "points": 10},
        {"type": "medium", "category": "physical", "title": "Meta de passos", "description": "Alcance sua meta diária de passos", "points": 20},
        {"type": "medium", "category": "nutrition", "title": "Meta de água", "description": "Beba sua meta diária de água", "points": 15},
        {"type": "medium", "category": "emotional", "title": "Prática de respiração", "description": "Faça um exercício de respiração", "points": 20},
        {"type": "challenging", "title": "Treino completo", "category": "physical", "description": "Complete um treino de 30 minutos", "points": 40},
        {"type": "challenging", "title": "Alimentação perfeita", "category": "nutrition", "description": "Siga 100% do seu plano alimentar", "points": 35},
        {"type": "challenging", "title": "Meditação", "category": "emotional", "description": "Medite por pelo menos 15 minutos", "points": 30}
    ]'::JSONB;
    
    mission JSONB;
    mission_type_record RECORD;
BEGIN
    -- Delete existing missions for the date
    DELETE FROM daily_missions WHERE user_id = p_user_id AND mission_date = p_date;
    
    -- Select one mission of each type randomly
    FOR mission_type_record IN SELECT DISTINCT value->>'type' as mission_type FROM jsonb_array_elements(missions_data)
    LOOP
        SELECT value INTO mission 
        FROM jsonb_array_elements(missions_data) 
        WHERE value->>'type' = mission_type_record.mission_type 
        ORDER BY random() 
        LIMIT 1;
        
        INSERT INTO daily_missions (
            user_id, mission_date, mission_type, title, description, 
            category, points_reward, target_value
        ) VALUES (
            p_user_id, p_date, mission->>'type', mission->>'title', 
            mission->>'description', mission->>'category', 
            (mission->>'points')::INTEGER, '{}'::JSONB
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 14. TRIGGERS
-- ==========================================

-- Trigger to update user points when activities are added
CREATE OR REPLACE FUNCTION trigger_update_points_on_activity()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM update_user_gamification(
        NEW.user_id, 
        NEW.points_earned, 
        NEW.activity_type, 
        NEW.is_bonus
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_points_on_activity_insert 
    AFTER INSERT ON daily_activities 
    FOR EACH ROW 
    EXECUTE FUNCTION trigger_update_points_on_activity();

-- ==========================================
-- 15. VIEWS FOR EASY ACCESS
-- ==========================================

-- View for user gamification summary
CREATE OR REPLACE VIEW user_gamification_summary AS
SELECT 
    g.user_id,
    up.name,
    up.email,
    g.total_points,
    g.level,
    g.current_streak,
    g.longest_streak,
    g.physical_points,
    g.nutrition_points,
    g.emotional_points,
    g.spiritual_points,
    g.referral_points,
    g.achievement_points,
    g.badges,
    COUNT(ua.id) as achievements_count,
    g.updated_at
FROM gamification g
JOIN user_profiles up ON g.user_id = up.id
LEFT JOIN user_achievements ua ON g.user_id = ua.user_id
GROUP BY g.user_id, up.name, up.email, g.total_points, g.level, g.current_streak, 
         g.longest_streak, g.physical_points, g.nutrition_points, g.emotional_points, 
         g.spiritual_points, g.referral_points, g.achievement_points, g.badges, g.updated_at;

-- View for global leaderboard
CREATE OR REPLACE VIEW global_leaderboard AS
SELECT 
    ROW_NUMBER() OVER (ORDER BY g.total_points DESC, g.updated_at ASC) as rank,
    up.name,
    up.email,
    g.total_points,
    g.level,
    g.current_streak,
    COUNT(ua.id) as achievements_count
FROM gamification g
JOIN user_profiles up ON g.user_id = up.id
LEFT JOIN user_achievements ua ON g.user_id = ua.user_id
GROUP BY g.user_id, up.name, up.email, g.total_points, g.level, g.current_streak, g.updated_at
ORDER BY g.total_points DESC, g.updated_at ASC;

COMMIT;

