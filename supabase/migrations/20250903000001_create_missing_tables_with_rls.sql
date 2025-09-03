

CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    whatsapp_number VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    context JSONB DEFAULT '{}',
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own conversations" ON public.conversations
    FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    message_type VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own interactions" ON public.interactions
    FOR ALL USING (
        conversation_id IN (
            SELECT id FROM conversations WHERE user_id = auth.uid()
        )
    );

CREATE TABLE IF NOT EXISTS public.checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    checkin_type VARCHAR(30) NOT NULL,
    data JSONB NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own checkins" ON public.checkins
    FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.plan_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    plan_data JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    completion_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.plan_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own plan_days" ON public.plan_days
    FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.measurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    measurement_type VARCHAR(30) NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    unit VARCHAR(10) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.measurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own measurements" ON public.measurements
    FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.points_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    points_change INTEGER NOT NULL,
    reason TEXT NOT NULL,
    reference_id UUID,
    reference_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.points_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own points_ledger" ON public.points_ledger 
    FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');
CREATE POLICY "Users can insert own points_ledger" ON public.points_ledger 
    FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE TABLE IF NOT EXISTS public.commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    referrer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    commission_type VARCHAR(30) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    percentage DECIMAL(5,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    payment_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own commissions" ON public.commissions 
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = referrer_id OR auth.role() = 'service_role');
CREATE POLICY "Service role can manage commissions" ON public.commissions 
    FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_whatsapp ON public.conversations(whatsapp_number);
CREATE INDEX IF NOT EXISTS idx_interactions_conversation_id ON public.interactions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_interactions_timestamp ON public.interactions(timestamp);
CREATE INDEX IF NOT EXISTS idx_checkins_user_date ON public.checkins(user_id, date);
CREATE INDEX IF NOT EXISTS idx_plan_days_user_date ON public.plan_days(user_id, date);
CREATE INDEX IF NOT EXISTS idx_measurements_user_type_date ON public.measurements(user_id, measurement_type, date);
CREATE INDEX IF NOT EXISTS idx_points_ledger_user_id ON public.points_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_commissions_user_id ON public.commissions(user_id);
CREATE INDEX IF NOT EXISTS idx_commissions_referrer_id ON public.commissions(referrer_id);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plan_days_updated_at BEFORE UPDATE ON public.plan_days
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
