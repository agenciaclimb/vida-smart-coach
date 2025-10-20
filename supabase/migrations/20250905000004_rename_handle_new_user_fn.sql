-- Migration: Rename handle_new_user to on_auth_user_created
-- Date: 2025-09-05
-- Reason: To prepare for the 20250905000003_update_auth_triggers.sql migration,
-- which expects the function to be named on_auth_user_created.

DO $$
BEGIN
  RAISE NOTICE 'Skipping rename of handle_new_user(); função já consolidada em migrações posteriores.';
END;
$$;
