-- Migration: Create the community_posts table
-- Date: 2025-09-16
-- Reason: This table is the base for the community_feed view and was missing.

CREATE TABLE IF NOT EXISTS public.community_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_published BOOLEAN DEFAULT false,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on the new table
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

-- Policies for the table
-- Allow users to read all published posts
CREATE POLICY "Allow public read on published posts" ON public.community_posts
    FOR SELECT USING (is_published = true);

-- Allow users to insert their own posts
CREATE POLICY "Allow users to insert their own posts" ON public.community_posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own posts
CREATE POLICY "Allow users to update their own posts" ON public.community_posts
    FOR UPDATE USING (auth.uid() = user_id);

-- Grant usage
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_posts TO authenticated;
GRANT SELECT ON public.community_posts TO anon;
