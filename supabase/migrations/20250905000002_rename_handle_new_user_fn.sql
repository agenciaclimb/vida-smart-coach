-- Migration: Rename handle_new_user to on_auth_user_created
-- Date: 2025-09-05
-- Reason: To prepare for the 20250905000003_update_auth_triggers.sql migration,
-- which expects the function to be named on_auth_user_created.

ALTER FUNCTION public.handle_new_user() RENAME TO on_auth_user_created;