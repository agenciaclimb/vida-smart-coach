CREATE TABLE IF NOT EXISTS public.plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    features JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='plans' and policyname='Allow public read access on plans'
  ) then
    CREATE POLICY "Allow public read access on plans" ON public.plans
        FOR SELECT USING (true);
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='plans' and policyname='Allow authenticated users to manage plans'
  ) then
    CREATE POLICY "Allow authenticated users to manage plans" ON public.plans
        FOR ALL USING (auth.role() = 'authenticated');
  end if;
end;
$$;
