-- Migration: Create a compatibility view for subscription_plans
-- Date: 2025-09-16
-- Reason: The migration 20250917010000_fix_security_issues.sql incorrectly
-- references a non-existent table 'subscription_plans' instead of 'plans'.
-- This view is created to ensure that migration can pass.

CREATE OR REPLACE VIEW public.subscription_plans AS
SELECT * FROM public.plans;
