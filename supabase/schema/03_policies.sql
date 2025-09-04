
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Allow public read access on plans" ON public.plans
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to manage plans" ON public.plans
    FOR ALL USING (auth.role() = 'authenticated');

COMMENT ON POLICY "Allow public read access on plans" ON public.plans IS 'Public can view subscription plans';
COMMENT ON POLICY "Allow authenticated users to manage plans" ON public.plans IS 'Authenticated users can manage plans (admin role enforced in app)';


CREATE POLICY "Allow public read access on rewards" ON public.rewards
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to manage rewards" ON public.rewards
    FOR ALL USING (auth.role() = 'authenticated');

COMMENT ON POLICY "Allow public read access on rewards" ON public.rewards IS 'Public can view available rewards';
COMMENT ON POLICY "Allow authenticated users to manage rewards" ON public.rewards IS 'Authenticated users can manage rewards (admin role enforced in app)';


CREATE POLICY "Users can view own profile" ON user_profiles 
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles 
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles 
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Service role can manage all profiles" ON user_profiles
    FOR ALL USING (auth.role() = 'service_role');

COMMENT ON POLICY "Users can view own profile" ON user_profiles IS 'Users can only view their own profile data';
COMMENT ON POLICY "Users can insert own profile" ON user_profiles IS 'Users can create their own profile during signup';
COMMENT ON POLICY "Users can update own profile" ON user_profiles IS 'Users can update their own profile information';
COMMENT ON POLICY "Service role can manage all profiles" ON user_profiles IS 'Service role has full access for admin operations';


CREATE POLICY "Users can view own checkins" ON daily_checkins 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own checkins" ON daily_checkins 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own checkins" ON daily_checkins 
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all checkins" ON daily_checkins
    FOR ALL USING (auth.role() = 'service_role');

COMMENT ON POLICY "Users can view own checkins" ON daily_checkins IS 'Users can only view their own daily check-ins';
COMMENT ON POLICY "Users can insert own checkins" ON daily_checkins IS 'Users can create their own daily check-ins';
COMMENT ON POLICY "Users can update own checkins" ON daily_checkins IS 'Users can update their own check-ins (same day only)';
COMMENT ON POLICY "Service role can manage all checkins" ON daily_checkins IS 'Service role has full access for admin and AI operations';


CREATE POLICY "Users can view own gamification" ON gamification 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own gamification" ON gamification 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own gamification" ON gamification 
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all gamification" ON gamification
    FOR ALL USING (auth.role() = 'service_role');

COMMENT ON POLICY "Users can view own gamification" ON gamification IS 'Users can only view their own gamification data';
COMMENT ON POLICY "Users can insert own gamification" ON gamification IS 'Users can create their own gamification record';
COMMENT ON POLICY "Users can update own gamification" ON gamification IS 'Users can update their own gamification data';
COMMENT ON POLICY "Service role can manage all gamification" ON gamification IS 'Service role has full access for system operations';


CREATE POLICY "Service role can manage whatsapp_messages" ON whatsapp_messages
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view whatsapp_messages" ON whatsapp_messages
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert whatsapp_messages" ON whatsapp_messages
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

COMMENT ON POLICY "Service role can manage whatsapp_messages" ON whatsapp_messages IS 'Service role has full access for webhook processing';
COMMENT ON POLICY "Users can view whatsapp_messages" ON whatsapp_messages IS 'Users can view messages (filtered by phone in app)';
COMMENT ON POLICY "Authenticated users can insert whatsapp_messages" ON whatsapp_messages IS 'Authenticated users can insert messages for testing';


CREATE OR REPLACE FUNCTION prevent_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.role IS DISTINCT FROM NEW.role AND auth.role() != 'service_role' THEN
        RAISE EXCEPTION 'Only system administrators can change user roles';
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER prevent_role_escalation_trigger
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION prevent_role_escalation();

COMMENT ON TRIGGER prevent_role_escalation_trigger ON user_profiles IS 'Prevents users from escalating their own role privileges';


/*
SELECT * FROM user_profiles WHERE id = auth.uid();

SELECT * FROM daily_checkins WHERE user_id = auth.uid();

SELECT * FROM gamification WHERE user_id = auth.uid();

SELECT * FROM public.plans;

SELECT * FROM public.rewards;

SELECT COUNT(*) FROM user_profiles;
SELECT COUNT(*) FROM daily_checkins;
SELECT COUNT(*) FROM whatsapp_messages;
*/
