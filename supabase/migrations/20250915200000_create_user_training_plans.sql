-- Migration: Create user_training_plans table for AI-generated personalized plans
-- Date: 2025-09-15
-- Purpose: Store AI-generated training plans with scientific periodization

CREATE TABLE IF NOT EXISTS user_training_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Plan metadata
    plan_type VARCHAR(50) NOT NULL DEFAULT 'general_fitness', -- strength, hypertrophy, endurance, fat_loss, etc
    experience_level VARCHAR(20) NOT NULL DEFAULT 'beginner', -- beginner, intermediate, advanced
    duration_weeks INTEGER NOT NULL DEFAULT 4,
    
    -- Plan content (JSON structure)
    plan_data JSONB NOT NULL, -- Full plan structure with weeks, days, exercises
    
    -- Generation metadata  
    generated_by VARCHAR(50) NOT NULL DEFAULT 'ai_coach', -- ai_coach, manual, imported
    generation_prompt TEXT, -- Store the prompt used for reproducibility
    scientific_basis TEXT, -- References and methodologies used
    
    -- Status and tracking
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    progress_data JSONB DEFAULT '{}', -- Track completion, weights, notes
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_training_plans_user_id ON user_training_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_user_training_plans_active ON user_training_plans(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_training_plans_type ON user_training_plans(plan_type);
CREATE INDEX IF NOT EXISTS idx_user_training_plans_created ON user_training_plans(created_at DESC);
-- GIN index for JSONB queries
CREATE INDEX IF NOT EXISTS idx_user_training_plans_plan_data_gin ON user_training_plans USING GIN (plan_data);
CREATE INDEX IF NOT EXISTS idx_user_training_plans_progress_gin ON user_training_plans USING GIN (progress_data);
-- Row Level Security
ALTER TABLE user_training_plans ENABLE ROW LEVEL SECURITY;
-- RLS Policies
CREATE POLICY "Users can view own training plans" ON user_training_plans 
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own training plans" ON user_training_plans 
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own training plans" ON user_training_plans 
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own training plans" ON user_training_plans 
    FOR DELETE USING (auth.uid() = user_id);
-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_user_training_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';
DROP TRIGGER IF EXISTS update_user_training_plans_updated_at ON user_training_plans;
CREATE TRIGGER update_user_training_plans_updated_at
    BEFORE UPDATE ON user_training_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_user_training_plans_updated_at();
-- Comments for documentation
COMMENT ON TABLE user_training_plans IS 'AI-generated personalized training plans with scientific periodization';
COMMENT ON COLUMN user_training_plans.plan_data IS 'Complete plan structure in JSON format with weeks, days, and exercises';
COMMENT ON COLUMN user_training_plans.progress_data IS 'User progress tracking data including completions, weights, and notes';
COMMENT ON COLUMN user_training_plans.scientific_basis IS 'Scientific references and methodologies used in plan generation';
COMMENT ON COLUMN user_training_plans.generation_prompt IS 'AI prompt used for plan generation for reproducibility and debugging';
