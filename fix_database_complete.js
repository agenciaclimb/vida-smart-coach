const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://zzugbgoylwbaojdnunuz.supabase.co';
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createMissingTables() {
  console.log('🔧 Criando tabelas faltantes...');
  
  try {
    // Criar tabela profiles se não existir
    const createProfiles = `
      CREATE TABLE IF NOT EXISTS public.profiles (
        id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
        email TEXT UNIQUE,
        full_name TEXT,
        whatsapp TEXT,
        activity_level TEXT DEFAULT 'sedentary',
        weight DECIMAL,
        height DECIMAL,
        age INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    // Criar tabela plans se não existir
    const createPlans = `
      CREATE TABLE IF NOT EXISTS public.plans (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        price DECIMAL,
        duration_days INTEGER,
        features JSONB,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    // Criar tabela user_plans se não existir
    const createUserPlans = `
      CREATE TABLE IF NOT EXISTS public.user_plans (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
        plan_id UUID REFERENCES public.plans(id) ON DELETE CASCADE,
        start_date DATE,
        end_date DATE,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    // Criar tabela daily_checkins se não existir
    const createDailyCheckins = `
      CREATE TABLE IF NOT EXISTS public.daily_checkins (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        water_intake INTEGER DEFAULT 0,
        exercise_minutes INTEGER DEFAULT 0,
        mood_score INTEGER DEFAULT 5,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, date)
      );
    `;

    console.log('📝 Executando criação de tabelas...');
    
    const { error: error1 } = await supabase.rpc('exec_sql', { sql: createProfiles });
    if (error1) console.log('Profiles:', error1.message);
    else console.log('✅ Tabela profiles criada/verificada');

    const { error: error2 } = await supabase.rpc('exec_sql', { sql: createPlans });
    if (error2) console.log('Plans:', error2.message);
    else console.log('✅ Tabela plans criada/verificada');

    const { error: error3 } = await supabase.rpc('exec_sql', { sql: createUserPlans });
    if (error3) console.log('User Plans:', error3.message);
    else console.log('✅ Tabela user_plans criada/verificada');

    const { error: error4 } = await supabase.rpc('exec_sql', { sql: createDailyCheckins });
    if (error4) console.log('Daily Checkins:', error4.message);
    else console.log('✅ Tabela daily_checkins criada/verificada');

  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error);
  }
}

async function applyMigrations() {
  console.log('🔧 Aplicando migrações críticas...');
  
  try {
    // Migração 1: Fix dos triggers de autenticação
    console.log('📝 Aplicando migração: Fix dos triggers de autenticação...');
    const migration1 = `
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS trigger AS $$
      BEGIN
        INSERT INTO public.profiles (id, email, created_at, updated_at)
        VALUES (new.id, new.email, now(), now())
        ON CONFLICT (id) DO UPDATE SET
          email = EXCLUDED.email,
          updated_at = now();
        RETURN new;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
    `;
    
    const { error: error1 } = await supabase.rpc('exec_sql', { sql: migration1 });
    if (error1) {
      console.error('❌ Erro na migração 1:', error1);
    } else {
      console.log('✅ Migração 1 aplicada com sucesso');
    }

    // Migração 2: Correção das políticas RLS
    console.log('📝 Aplicando migração: Correção das políticas RLS...');
    const migration2 = `
      ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.user_plans ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
      DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
      DROP POLICY IF EXISTS "Users can view own checkins" ON public.daily_checkins;
      DROP POLICY IF EXISTS "Users can insert own checkins" ON public.daily_checkins;

      CREATE POLICY "Users can view own profile" ON public.profiles
        FOR SELECT USING (auth.uid() = id);
      
      CREATE POLICY "Users can update own profile" ON public.profiles
        FOR UPDATE USING (auth.uid() = id);
      
      CREATE POLICY "Users can view own checkins" ON public.daily_checkins
        FOR SELECT USING (auth.uid() = user_id);
      
      CREATE POLICY "Users can insert own checkins" ON public.daily_checkins
        FOR INSERT WITH CHECK (auth.uid() = user_id);
    `;
    
    const { error: error2 } = await supabase.rpc('exec_sql', { sql: migration2 });
    if (error2) {
      console.error('❌ Erro na migração 2:', error2);
    } else {
      console.log('✅ Migração 2 aplicada com sucesso');
    }

    // Migração 3: Criar índices
    console.log('📝 Aplicando migração: Criar índices...');
    const migration3 = `
      CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
      CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_date ON public.daily_checkins(user_id, date);
      CREATE INDEX IF NOT EXISTS idx_user_plans_user_id ON public.user_plans(user_id);
    `;
    
    const { error: error3 } = await supabase.rpc('exec_sql', { sql: migration3 });
    if (error3) {
      console.error('❌ Erro na migração 3:', error3);
    } else {
      console.log('✅ Migração 3 aplicada com sucesso');
    }

    console.log('🎉 Todas as migrações foram aplicadas com sucesso!');
    
    // Testar conexão
    console.log('🔍 Testando conexão com o banco...');
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    if (error) {
      console.error('❌ Erro ao testar conexão:', error);
    } else {
      console.log('✅ Conexão com banco funcionando corretamente');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

async function main() {
  console.log('🚀 Iniciando correção completa do banco de dados...');
  await createMissingTables();
  await applyMigrations();
  console.log('🎉 Correção completa finalizada!');
}

main();

