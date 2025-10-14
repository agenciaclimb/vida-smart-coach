-- Migration: Rename water_intake to water_glasses in daily_checkins
-- Date: 2025-09-16
-- Reason: To align the table schema with the expectations of the
-- 20250916150000_fix_daily_checkins_constraints.sql migration.

-- Note: This statement will fail if the column does not exist, which is intended
-- to halt the migration process if the schema is not as expected.
ALTER TABLE public.daily_checkins RENAME COLUMN water_intake TO water_glasses;