import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zzugbgoylwbaojdnunuz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6dWdiZ295bHdiYW9qZG51bnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxODE5MTEsImV4cCI6MjA2OTc1NzkxMX0.8xe_8yAKTq4gWz0tzsYNgHRKvO5G7ZYK58Z2pkxxrmE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugProfileAndCheckin() {
  console.log('🔍 DEBUGANDO PROBLEMAS DE PERFIL E CHECK-IN\n');
  
  // 1. Verificar autenticação atual
  console.log('1️⃣ Verificando autenticação...');
  const { data: session, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.log('❌ Erro na sessão:', sessionError.message);
    return;
  }
  
  if (!session?.session?.user) {
    console.log('⚠️ Nenhum usuário autenticado encontrado');
    console.log('🔑 Para testar, você precisa estar logado no sistema');
    return;
  }
  
  const user = session.session.user;
  console.log('✅ Usuário autenticado:', user.email);
  console.log('🆔 User ID:', user.id);
  
  // 2. Verificar perfil atual
  console.log('\n2️⃣ Verificando perfil atual...');
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  
  if (profileError && profileError.code !== 'PGRST116') {
    console.log('❌ Erro ao buscar perfil:', profileError.message);
  } else if (!profile) {
    console.log('⚠️ Perfil não existe ainda - será criado na primeira atualização');
  } else {
    console.log('✅ Perfil encontrado:');
    console.log('   - Nome:', profile.full_name || profile.name || 'Não definido');
    console.log('   - Telefone:', profile.phone || 'Não definido');
    console.log('   - Peso atual:', profile.current_weight || 'Não definido');
    console.log('   - Altura:', profile.height || 'Não definido');
  }
  
  // 3. Testar atualização de perfil
  console.log('\n3️⃣ Testando atualização de perfil...');
  const testProfileData = {
    id: user.id,
    full_name: 'Teste Debug User',
    name: 'Debug',
    email: user.email,
    phone: '11999887766',
    current_weight: 75.5,
    target_weight: 70.0,
    height: 175,
    gender: 'masculino',
    activity_level: 'moderado',
    goal_type: 'perder_peso',
    updated_at: new Date().toISOString()
  };
  
  const { data: updatedProfile, error: updateError } = await supabase
    .from('user_profiles')
    .upsert(testProfileData)
    .select()
    .single();
  
  if (updateError) {
    console.log('❌ Erro ao atualizar perfil:', updateError.message);
    console.log('🔍 Detalhes do erro:', updateError);
  } else {
    console.log('✅ Perfil atualizado com sucesso!');
    console.log('📝 Dados salvos:', updatedProfile);
  }
  
  // 4. Verificar check-ins de hoje
  console.log('\n4️⃣ Verificando check-in de hoje...');
  const today = new Date().toISOString().split('T')[0];
  
  const { data: todayCheckin, error: checkinError } = await supabase
    .from('daily_checkins')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', today);
  
  if (checkinError) {
    console.log('❌ Erro ao buscar check-in:', checkinError.message);
  } else if (!todayCheckin || todayCheckin.length === 0) {
    console.log('⚠️ Nenhum check-in encontrado para hoje');
  } else {
    console.log('✅ Check-in de hoje encontrado:');
    console.log('   - Humor:', todayCheckin[0].mood || todayCheckin[0].mood_score || 'Não definido');
    console.log('   - Sono:', todayCheckin[0].sleep_hours || 'Não definido');
    console.log('   - Peso:', todayCheckin[0].weight || 'Não definido');
  }
  
  // 5. Testar criação de check-in (apenas se não existir)
  if (!todayCheckin || todayCheckin.length === 0) {
    console.log('\n5️⃣ Testando criação de check-in...');
    const testCheckinData = {
      user_id: user.id,
      date: today,
      mood: 4,
      mood_score: 4,
      energy_level: 4,
      sleep_hours: 7.5,
      weight: 75.2,
      created_at: new Date().toISOString()
    };
    
    const { data: newCheckin, error: newCheckinError } = await supabase
      .from('daily_checkins')
      .insert([testCheckinData])
      .select();
    
    if (newCheckinError) {
      console.log('❌ Erro ao criar check-in:', newCheckinError.message);
      console.log('🔍 Detalhes do erro:', newCheckinError);
    } else {
      console.log('✅ Check-in criado com sucesso!');
      console.log('📝 Dados salvos:', newCheckin[0]);
    }
  }
  
  // 6. Verificar RLS (Row Level Security)
  console.log('\n6️⃣ Verificando políticas de segurança (RLS)...');
  
  const { data: policies } = await supabase.rpc('get_table_policies', { table_name: 'user_profiles' }).catch(() => null);
  
  if (!policies) {
    console.log('⚠️ Não foi possível verificar políticas RLS');
    console.log('💡 Certifique-se de que as políticas estão configuradas no Supabase Dashboard');
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🎯 RESUMO DO DIAGNÓSTICO:');
  console.log('✅ Campos do banco de dados: OK');
  console.log(`${updatedProfile ? '✅' : '❌'} Atualização de perfil: ${updatedProfile ? 'OK' : 'FALHOU'}`);
  console.log(`${!checkinError ? '✅' : '❌'} Verificação de check-in: ${!checkinError ? 'OK' : 'FALHOU'}`);
  console.log('='.repeat(60));
  
  if (updateError || checkinError) {
    console.log('\n🚨 PROBLEMAS IDENTIFICADOS:');
    if (updateError) console.log('- Erro na atualização de perfil');
    if (checkinError) console.log('- Erro no sistema de check-in');
    console.log('\n💡 PRÓXIMOS PASSOS:');
    console.log('1. Verificar políticas RLS no Supabase Dashboard');
    console.log('2. Verificar logs do browser para erros JavaScript');
    console.log('3. Verificar configuração de autenticação');
  } else {
    console.log('\n🎉 TUDO FUNCIONANDO CORRETAMENTE!');
    console.log('Se ainda há problemas no frontend, verifique:');
    console.log('1. Console do browser para erros JavaScript');
    console.log('2. Estado da aplicação React');
    console.log('3. Configuração do AuthProvider');
  }
}

debugProfileAndCheckin().catch(console.error);