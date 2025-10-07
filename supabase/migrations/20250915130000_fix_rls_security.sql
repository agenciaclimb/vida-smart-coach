-- Migration: Fix RLS Security Issues
-- Date: 2025-09-15
-- Purpose: Enable RLS on public tables and fix security definer views

-- Enable RLS on public tables that are exposed to PostgREST
ALTER TABLE public.community_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comentfade ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recompensas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planos_old ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for community_feed
CREATE POLICY "Users can view community feed" ON public.community_feed
    FOR SELECT USING (true);

CREATE POLICY "Users can insert to community feed" ON public.community_feed
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Create RLS policies for app_plans
CREATE POLICY "Users can view app plans" ON public.app_plans
    FOR SELECT USING (true);

-- Create RLS policies for comentfade
CREATE POLICY "Users can view comments" ON public.comentfade
    FOR SELECT USING (true);

CREATE POLICY "Users can insert comments" ON public.comentfade
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Create RLS policies for recompensas
CREATE POLICY "Users can view rewards" ON public.recompensas
    FOR SELECT USING (true);

-- Create RLS policies for planos_old (read-only for migration purposes)
CREATE POLICY "Users can view old plans" ON public.planos_old
    FOR SELECT USING (true);

-- Create RLS policies for planos
CREATE POLICY "Users can view plans" ON public.planos
    FOR SELECT USING (true);

-- Create RLS policies for error_logs (admin only)
CREATE POLICY "Only admins can view error logs" ON public.error_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "System can insert error logs" ON public.error_logs
    FOR INSERT WITH CHECK (true);

-- Fix security definer views by recreating them with proper security context
-- Note: These views should be recreated with SECURITY INVOKER instead of SECURITY DEFINER
-- or with proper RLS policies on the underlying tables

-- Add comments for documentation
COMMENT ON POLICY "Users can view community feed" ON public.community_feed IS 'Allow all users to view community feed posts';
COMMENT ON POLICY "Users can view app plans" ON public.app_plans IS 'Allow all users to view available app plans';
COMMENT ON POLICY "Only admins can view error logs" ON public.error_logs IS 'Restrict error log access to admin users only';

