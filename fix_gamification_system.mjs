import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zzugbgoylwbaojdnunuz.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createGamificationTables() {
  console.log('🎮 Criando sistema de gamificação...');

  // 1. Tabela de atividades diárias
  const { error: activitiesError } = await supabase.rpc('exec_sql', {
    sql_query: `
      CREATE TABLE IF NOT EXISTS daily_activities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        activity_type VARCHAR(50) NOT NULL,
        points_earned INTEGER DEFAULT 0,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
  });

  if (activitiesError) {
    console.log('⚠️ Tabela daily_activities já existe ou erro:', activitiesError.message);
  } else {
    console.log('✅ Tabela daily_activities criada');
  }

  // 2. Tabela de conquistas
  const { error: achievementsError } = await supabase.rpc('exec_sql', {
    sql_query: `
      CREATE TABLE IF NOT EXISTS achievements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        description TEXT,
        icon VARCHAR(50),
        points_required INTEGER DEFAULT 0,
        badge_color VARCHAR(20) DEFAULT 'blue',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
  });

  if (achievementsError) {
    console.log('⚠️ Tabela achievements já existe ou erro:', achievementsError.message);
  } else {
    console.log('✅ Tabela achievements criada');
  }

  // 3. Tabela de conquistas do usuário
  const { error: userAchievementsError } = await supabase.rpc('exec_sql', {
    sql_query: `
      CREATE TABLE IF NOT EXISTS user_achievements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
        earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, achievement_id)
      );
    `
  });

  if (userAchievementsError) {
    console.log('⚠️ Tabela user_achievements já existe ou erro:', userAchievementsError.message);
  } else {
    console.log('✅ Tabela user_achievements criada');
  }

  // 4. Atualizar user_profiles com campos de gamificação
  const { error: profilesError } = await supabase.rpc('exec_sql', {
    sql_query: `
      ALTER TABLE user_profiles 
      ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS current_level INTEGER DEFAULT 1,
      ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS last_activity_date DATE;
    `
  });

  if (profilesError) {
    console.log('⚠️ Campos de gamificação já existem ou erro:', profilesError.message);
  } else {
    console.log('✅ Campos de gamificação adicionados ao user_profiles');
  }

  // 5. Inserir conquistas padrão
  const defaultAchievements = [
    { name: 'Primeiro Passo', description: 'Complete sua primeira atividade', icon: '🎯', points_required: 10 },
    { name: 'Dedicado', description: 'Mantenha uma sequência de 7 dias', icon: '🔥', points_required: 100 },
    { name: 'Guerreiro', description: 'Alcance 500 pontos totais', icon: '⚔️', points_required: 500 },
    { name: 'Lenda', description: 'Alcance 1000 pontos totais', icon: '👑', points_required: 1000 }
  ];

  for (const achievement of defaultAchievements) {
    const { error } = await supabase
      .from('achievements')
      .upsert(achievement, { onConflict: 'name' });
    
    if (error) {
      console.log(`⚠️ Conquista ${achievement.name} já existe ou erro:`, error.message);
    } else {
      console.log(`✅ Conquista ${achievement.name} criada`);
    }
  }

  // 6. Criar função para atualizar pontos
  const { error: functionError } = await supabase.rpc('exec_sql', {
    sql_query: `
      CREATE OR REPLACE FUNCTION update_user_points()
      RETURNS TRIGGER AS $$
      BEGIN
        UPDATE user_profiles 
        SET 
          total_points = total_points + NEW.points_earned,
          current_level = GREATEST(1, FLOOR((total_points + NEW.points_earned) / 100) + 1),
          last_activity_date = CURRENT_DATE
        WHERE user_id = NEW.user_id;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `
  });

  if (functionError) {
    console.log('⚠️ Função update_user_points já existe ou erro:', functionError.message);
  } else {
    console.log('✅ Função update_user_points criada');
  }

  // 7. Criar trigger
  const { error: triggerError } = await supabase.rpc('exec_sql', {
    sql_query: `
      DROP TRIGGER IF EXISTS update_points_on_activity_insert ON daily_activities;
      CREATE TRIGGER update_points_on_activity_insert 
        AFTER INSERT ON daily_activities
        FOR EACH ROW EXECUTE FUNCTION update_user_points();
    `
  });

  if (triggerError) {
    console.log('⚠️ Trigger já existe ou erro:', triggerError.message);
  } else {
    console.log('✅ Trigger criado');
  }

  console.log('🎉 Sistema de gamificação configurado com sucesso!');
}

// Executar
createGamificationTables().catch(console.error);

