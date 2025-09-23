-- === Ensure subscription_plans and comments tables (idempotente) ===

-- 1) subscription_plans com colunas esperadas pelas views/migrations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'subscription_plans'
  ) THEN
    CREATE TABLE public.subscription_plans (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      description text,
      price numeric(10,2) DEFAULT 0,
      features jsonb DEFAULT '[]'::jsonb,
      is_active boolean DEFAULT true,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
  END IF;
END$$;

-- garante colunas essenciais mesmo se tabela existir
ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS price numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS features jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE public.subscription_plans
  ALTER COLUMN features SET DEFAULT '[]'::jsonb,
  ALTER COLUMN is_active SET DEFAULT true,
  ALTER COLUMN price SET DEFAULT 0,
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now();

-- Trigger de updated_at aproveitando função global (se existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'subscription_plans_set_updated_at'
  ) THEN
    CREATE TRIGGER subscription_plans_set_updated_at
      BEFORE UPDATE ON public.subscription_plans
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
EXCEPTION WHEN undefined_function THEN
  -- ignora se função não existir; migrations antigas já criam update_updated_at_column()
  NULL;
END$$;

-- 2) comments com colunas esperadas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'comments'
  ) THEN
    CREATE TABLE public.comments (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      post_id uuid,
      user_id uuid,
      content text,
      is_deleted boolean DEFAULT false,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
  END IF;
END$$;

ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS post_id uuid,
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS content text,
  ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE public.comments
  ALTER COLUMN is_deleted SET DEFAULT false,
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'comments_set_updated_at'
  ) THEN
    CREATE TRIGGER comments_set_updated_at
      BEFORE UPDATE ON public.comments
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
EXCEPTION WHEN undefined_function THEN
  NULL;
END$$;

-- Índices simples para consultas
CREATE INDEX IF NOT EXISTS idx_subscription_plans_is_active ON public.subscription_plans (is_active);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments (post_id);

CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments (user_id);
