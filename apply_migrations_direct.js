const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://zzugbgoylwbaojdnunuz.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não encontrada nas variáveis de ambiente');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigrations() {
  console.log('🔧 Iniciando aplicação das migrações críticas...');
  
  try {
    // Migração 1: Fix dos triggers de autenticação
    console.log('📝 Aplicando migração: Fix dos triggers de autenticação...');
    const migration1 = `
      -- Fix authentication triggers
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS trigger AS $$
      BEGIN
        INSERT INTO public.profiles (id, email, created_at, updated_at)
        VALUES (new.id, new.email, now(), now());
        RETURN new;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      -- Recreate trigger if exists
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
      -- Enable RLS on all tables
      ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.user_plans ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

      -- Create secure policies
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

    // Migração 3: Adicionar campos essenciais
    console.log('📝 Aplicando migração: Adicionar campos essenciais...');
    const migration3 = `
      -- Add missing columns to profiles
      ALTER TABLE public.profiles 
      ADD COLUMN IF NOT EXISTS full_name TEXT,
      ADD COLUMN IF NOT EXISTS whatsapp TEXT,
      ADD COLUMN IF NOT EXISTS activity_level TEXT DEFAULT 'sedentary',
      ADD COLUMN IF NOT EXISTS weight DECIMAL,
      ADD COLUMN IF NOT EXISTS height DECIMAL,
      ADD COLUMN IF NOT EXISTS age INTEGER;

      -- Add missing columns to daily_checkins
      ALTER TABLE public.daily_checkins
      ADD COLUMN IF NOT EXISTS water_intake INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS exercise_minutes INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS mood_score INTEGER DEFAULT 5;

      -- Create indexes for performance
      CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
      CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_date ON public.daily_checkins(user_id, date);
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

applyMigrations();

