-- Migration: add optional region column to user_profiles
-- Date: 2025-10-11
-- Reason: Supabase auth trigger ainda referencia a coluna region durante o signup.

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS region TEXT;

COMMENT ON COLUMN user_profiles.region IS 'Região/UF opcional informada pelo usuário.';
