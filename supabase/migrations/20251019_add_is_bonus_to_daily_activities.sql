-- Ensure daily_activities has is_bonus column expected by frontend
ALTER TABLE public.daily_activities
  ADD COLUMN IF NOT EXISTS is_bonus boolean NOT NULL DEFAULT false;

-- Optional: refresh PostgREST schema cache by touching a no-op comment on the table
COMMENT ON TABLE public.daily_activities IS 'Tracks user daily activities with points and bonus flags';
