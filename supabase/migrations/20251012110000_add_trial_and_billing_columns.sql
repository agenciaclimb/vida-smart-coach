-- Add billing and trial-related columns to user_profiles
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS trial_started_at timestamptz DEFAULT timezone('UTC'::text, now()),
ADD COLUMN IF NOT EXISTS trial_expires_at timestamptz,
ADD COLUMN IF NOT EXISTS billing_status text CHECK (billing_status IN ('trialing', 'active', 'past_due', 'canceled')),
ADD COLUMN IF NOT EXISTS stripe_customer_id text,
ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
ADD COLUMN IF NOT EXISTS stripe_price_id text,
ADD COLUMN IF NOT EXISTS stripe_subscription_status text,
ADD COLUMN IF NOT EXISTS stripe_current_period_end timestamptz;

-- Add a comment to describe the change
COMMENT ON COLUMN public.user_profiles.billing_status IS 'Manages the subscription state of the user, aligned with the post-trial billing strategy.';
