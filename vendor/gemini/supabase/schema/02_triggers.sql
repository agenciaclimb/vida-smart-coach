
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id,
    email,
    phone,
    name,
    role,
    referral_token,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.phone,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
    gen_random_uuid()::text,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    name = EXCLUDED.name,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates user profile when new user is created in auth.users';
COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'Trigger to create user profile after auth user creation';




CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TRIGGER update_user_profiles_updated_at ON user_profiles IS 'Automatically updates updated_at timestamp when user profile is modified';

CREATE TRIGGER update_gamification_updated_at 
    BEFORE UPDATE ON gamification 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TRIGGER update_gamification_updated_at ON gamification IS 'Automatically updates updated_at timestamp when gamification data is modified';

CREATE TRIGGER create_gamification_on_user_creation 
    AFTER INSERT ON user_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION create_gamification_for_user();

COMMENT ON TRIGGER create_gamification_on_user_creation ON user_profiles IS 'Automatically creates gamification record when new user profile is created';

CREATE OR REPLACE FUNCTION award_checkin_points_trigger()
RETURNS TRIGGER AS $$
DECLARE
    points_earned INTEGER := 10; -- Base points for check-in
    streak_bonus INTEGER := 0;
    current_streak INTEGER;
BEGIN
    current_streak := update_user_streak(NEW.user_id, NEW.date);
    
    streak_bonus := LEAST(current_streak - 1, 10);
    
    PERFORM award_points(NEW.user_id, points_earned + streak_bonus);
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER award_checkin_points
    AFTER INSERT ON daily_checkins
    FOR EACH ROW
    EXECUTE FUNCTION award_checkin_points_trigger();

COMMENT ON TRIGGER award_checkin_points ON daily_checkins IS 'Awards points and updates streak when user completes daily check-in';

CREATE OR REPLACE FUNCTION validate_checkin_date_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.date > CURRENT_DATE THEN
        RAISE EXCEPTION 'Check-in date cannot be in the future';
    END IF;
    
    IF NEW.date < CURRENT_DATE - INTERVAL '30 days' THEN
        RAISE EXCEPTION 'Check-in date cannot be more than 30 days in the past';
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER validate_checkin_date
    BEFORE INSERT OR UPDATE ON daily_checkins
    FOR EACH ROW
    EXECUTE FUNCTION validate_checkin_date_trigger();

COMMENT ON TRIGGER validate_checkin_date ON daily_checkins IS 'Validates that check-in dates are reasonable (not future, not too old)';

CREATE OR REPLACE FUNCTION update_whatsapp_processed_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ai_response IS NOT NULL AND OLD.ai_response IS NULL THEN
        NEW.processed := TRUE;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_whatsapp_processed
    BEFORE UPDATE ON whatsapp_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_whatsapp_processed_trigger();

COMMENT ON TRIGGER update_whatsapp_processed ON whatsapp_messages IS 'Automatically marks messages as processed when AI response is added';

CREATE OR REPLACE FUNCTION validate_user_profile_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.birth_date IS NOT NULL THEN
        IF NEW.birth_date > CURRENT_DATE THEN
            RAISE EXCEPTION 'Birth date cannot be in the future';
        END IF;
        
        IF NEW.birth_date < CURRENT_DATE - INTERVAL '120 years' THEN
            RAISE EXCEPTION 'Birth date cannot be more than 120 years ago';
        END IF;
    END IF;
    
    IF NEW.height IS NOT NULL THEN
        IF NEW.height < 50 OR NEW.height > 300 THEN
            RAISE EXCEPTION 'Height must be between 50cm and 300cm';
        END IF;
    END IF;
    
    IF NEW.weight IS NOT NULL THEN
        IF NEW.weight < 20 OR NEW.weight > 500 THEN
            RAISE EXCEPTION 'Weight must be between 20kg and 500kg';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER validate_user_profile_data
    BEFORE INSERT OR UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION validate_user_profile_trigger();

COMMENT ON TRIGGER validate_user_profile_data ON user_profiles IS 'Validates user profile data for reasonable ranges and constraints';
