-- Add cultural context columns to user_profiles table
-- These columns are used by the evolution-webhook function to store
-- culturally-aware context for personalized AI responses

ALTER TABLE public.user_profiles 
 ADD COLUMN IF NOT EXISTS cultural_context TEXT,
 ADD COLUMN IF NOT EXISTS spiritual_belief TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.user_profiles.cultural_context IS 'Cultural context information detected from user messages (e.g., region of Brazil)';
COMMENT ON COLUMN public.user_profiles.spiritual_belief IS 'Spiritual belief information detected from user messages for personalized responses';