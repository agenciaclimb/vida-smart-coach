-- Migration: add legacy spirituality column for compatibility
-- Date: 2025-10-11
-- Reason: triggers ainda referenciam coluna 'spirituality'.

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS spirituality TEXT;

COMMENT ON COLUMN user_profiles.spirituality IS 'Campo legado utilizado por triggers antigas.';
