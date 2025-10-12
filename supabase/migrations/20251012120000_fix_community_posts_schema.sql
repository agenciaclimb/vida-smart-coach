-- Migration: Idempotently fix the community_posts table schema
-- Reason: The original migration 20250916000000 failed because the table
-- existed but was missing the is_published column. This script corrects the schema.

-- 1. Add the is_published column if it doesn't exist
ALTER TABLE public.community_posts
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;

-- 2. Ensure RLS is enabled
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

-- 3. Create policies if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Allow public read on published posts' AND polrelid = 'public.community_posts'::regclass) THEN
        CREATE POLICY "Allow public read on published posts" ON public.community_posts
            FOR SELECT USING (is_published = true);
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Allow users to insert their own posts' AND polrelid = 'public.community_posts'::regclass) THEN
        CREATE POLICY "Allow users to insert their own posts" ON public.community_posts
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Allow users to update their own posts' AND polrelid = 'public.community_posts'::regclass) THEN
        CREATE POLICY "Allow users to update their own posts" ON public.community_posts
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END
$$;

-- 4. Grant usage (can be run multiple times safely)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_posts TO authenticated;
GRANT SELECT ON public.community_posts TO anon;
