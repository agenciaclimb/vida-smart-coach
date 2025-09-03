CREATE TABLE IF NOT EXISTS activity_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone_number TEXT NOT NULL,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('exercise', 'nutrition', 'meditation', 'general')),
    activity_name TEXT NOT NULL,
    points_earned INTEGER DEFAULT 0 CHECK (points_earned >= 0),
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_tracking_phone_number ON activity_tracking(phone_number);
CREATE INDEX IF NOT EXISTS idx_activity_tracking_completed_at ON activity_tracking(completed_at);
CREATE INDEX IF NOT EXISTS idx_activity_tracking_type ON activity_tracking(activity_type);

ALTER TABLE activity_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage activity_tracking" ON activity_tracking
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view activity_tracking" ON activity_tracking
    FOR SELECT USING (true);
