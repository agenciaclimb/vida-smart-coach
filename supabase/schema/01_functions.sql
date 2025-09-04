
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

COMMENT ON FUNCTION update_updated_at_column() IS 'Trigger function to automatically update updated_at timestamp';

CREATE OR REPLACE FUNCTION create_gamification_for_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO gamification (user_id, total_points, current_level, badges, streak_days)
    VALUES (NEW.id, 0, 1, '{}', 0);
    RETURN NEW;
END;
$$ language 'plpgsql';

COMMENT ON FUNCTION create_gamification_for_user() IS 'Trigger function to create gamification record for new users';

CREATE OR REPLACE FUNCTION calculate_user_level(points INTEGER)
RETURNS INTEGER AS $$
BEGIN
    RETURN GREATEST(1, (points / 100) + 1);
END;
$$ language 'plpgsql';

COMMENT ON FUNCTION calculate_user_level(INTEGER) IS 'Calculates user level based on total points (100 points per level)';

CREATE OR REPLACE FUNCTION update_user_streak(user_uuid UUID, checkin_date DATE)
RETURNS INTEGER AS $$
DECLARE
    current_streak INTEGER;
    last_checkin DATE;
BEGIN
    SELECT streak_days, last_checkin_date 
    INTO current_streak, last_checkin
    FROM gamification 
    WHERE user_id = user_uuid;
    
    IF last_checkin IS NULL THEN
        current_streak := 1;
    ELSIF checkin_date = last_checkin + INTERVAL '1 day' THEN
        current_streak := current_streak + 1;
    ELSIF checkin_date = last_checkin THEN
        current_streak := current_streak;
    ELSE
        current_streak := 1;
    END IF;
    
    UPDATE gamification 
    SET 
        streak_days = current_streak,
        last_checkin_date = checkin_date,
        updated_at = NOW()
    WHERE user_id = user_uuid;
    
    RETURN current_streak;
END;
$$ language 'plpgsql';

COMMENT ON FUNCTION update_user_streak(UUID, DATE) IS 'Updates user streak based on check-in dates';

CREATE OR REPLACE FUNCTION award_points(user_uuid UUID, points_to_add INTEGER)
RETURNS TABLE(new_total INTEGER, new_level INTEGER) AS $$
DECLARE
    current_total INTEGER;
    calculated_level INTEGER;
BEGIN
    SELECT total_points INTO current_total
    FROM gamification 
    WHERE user_id = user_uuid;
    
    current_total := current_total + points_to_add;
    calculated_level := calculate_user_level(current_total);
    
    UPDATE gamification 
    SET 
        total_points = current_total,
        current_level = calculated_level,
        updated_at = NOW()
    WHERE user_id = user_uuid;
    
    RETURN QUERY SELECT current_total, calculated_level;
END;
$$ language 'plpgsql';

COMMENT ON FUNCTION award_points(UUID, INTEGER) IS 'Awards points to user and automatically updates their level';

CREATE OR REPLACE FUNCTION get_user_stats(user_uuid UUID)
RETURNS TABLE(
    total_points INTEGER,
    current_level INTEGER,
    streak_days INTEGER,
    total_checkins BIGINT,
    avg_mood NUMERIC,
    avg_energy NUMERIC,
    badges TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        g.total_points,
        g.current_level,
        g.streak_days,
        COUNT(dc.id) as total_checkins,
        ROUND(AVG(dc.mood), 2) as avg_mood,
        ROUND(AVG(dc.energy_level), 2) as avg_energy,
        g.badges
    FROM gamification g
    LEFT JOIN daily_checkins dc ON dc.user_id = g.user_id
    WHERE g.user_id = user_uuid
    GROUP BY g.user_id, g.total_points, g.current_level, g.streak_days, g.badges;
END;
$$ language 'plpgsql';

COMMENT ON FUNCTION get_user_stats(UUID) IS 'Returns comprehensive user statistics including points, level, streaks, and averages';
