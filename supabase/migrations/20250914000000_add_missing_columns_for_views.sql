-- Migration: Add missing columns to support normalized views
-- Date: 2025-09-14
-- Reason: The migration 20250915000000_normalized_views.sql references columns
-- that do not exist in the base tables. This migration adds them to allow
-- the subsequent view creation to succeed.

-- Add missing columns to rewards table for the normalized view
ALTER TABLE public.rewards ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.rewards ADD COLUMN IF NOT EXISTS points INTEGER;
ALTER TABLE public.rewards ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE public.rewards ADD COLUMN IF NOT EXISTS is_active BOOLEAN;

-- Add missing columns to plans table for the normalized view
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS details TEXT;
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS amount DECIMAL(10,2);
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS is_available BOOLEAN;
