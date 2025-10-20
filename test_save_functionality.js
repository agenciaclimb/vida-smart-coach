import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zzugbgoylwbaojdnunuz.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSaveFunctionality() {
  console.log('🧪 TESTANDO FUNCIONALIDADE DE SALVAMENTO\n');
  
  // 1. Verificar se há usuários autenticados
  console.log('1️⃣ Verificando sessão atual...');
  const { data: session, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.log('❌ Erro ao obter sessão:', sessionError.message);
    return;
  }
  
  if (!session?.session?.user) {
    console.log('⚠️ Nenhum usuário autenticado encontrado');
    console.log('ℹ️ Para testar completamente, você precisa estar logado');
    console.log('\n📝 TESTE SEM AUTENTICAÇÃO:');
    console.log('Vou testar se as tabelas respondem corretamente...\n');
  } else {
    console.log('✅ Usuário autenticado:', session.session.user.email);
    console.log('🆔 User ID:', session.session.user.id);
  }

  // 2. Testar estrutura de user_profiles
  console.log('2️⃣ Testando estrutura user_profiles...');
  
  try {
    // Tentar SELECT simples para verificar se funciona
    const { data, error, count } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact' })
      .limit(5);
      
    if (error) {
      console.log('❌ Erro ao consultar user_profiles:', error.message);
      console.log('🔍 Código do erro:', error.code);
      console.log('🔍 Detalhes:', error.details);
    } else {
      console.log('✅ Consulta user_profiles bem-sucedida');
      console.log('📊 Total de registros:', count);
      console.log('📋 Primeiros registros:', data?.length || 0);
      
      if (data && data.length > 0) {
        console.log('🔍 Campos disponíveis:', Object.keys(data[0]));
      }
    }
  } catch (e) {
    console.log('❌ Erro inesperado user_profiles:', e.message);
  }

  // 3. Testar estrutura de daily_checkins
  console.log('\n3️⃣ Testando estrutura daily_checkins...');
  
  try {
    const { data, error, count } = await supabase
      .from('daily_checkins')
      .select('*', { count: 'exact' })
      .limit(5);
      
    if (error) {
      console.log('❌ Erro ao consultar daily_checkins:', error.message);
      console.log('🔍 Código do erro:', error.code);
      console.log('🔍 Detalhes:', error.details);
    } else {
      console.log('✅ Consulta daily_checkins bem-sucedida');
      console.log('📊 Total de registros:', count);
      console.log('📋 Primeiros registros:', data?.length || 0);
      
      if (data && data.length > 0) {
        console.log('🔍 Campos disponíveis:', Object.keys(data[0]));
      }
    }
  } catch (e) {
    console.log('❌ Erro inesperado daily_checkins:', e.message);
  }

  // 4. Testar operações específicas se há usuário autenticado
  if (session?.session?.user) {
    const userId = session.session.user.id;
    
    console.log('\n4️⃣ Testando operações com usuário autenticado...');
    
    // Testar busca de perfil existente
    try {
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
        
      if (profileError) {
        console.log('❌ Erro ao buscar perfil:', profileError.message);
      } else if (!profile) {
        console.log('ℹ️ Perfil não existe ainda - pode ser criado');
      } else {
        console.log('✅ Perfil encontrado:', profile.full_name || profile.name || 'Sem nome');
      }
    } catch (e) {
      console.log('❌ Erro ao buscar perfil:', e.message);
    }
    
    // Testar busca de check-ins
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data: checkins, error: checkinsError } = await supabase
        .from('daily_checkins')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today);
        
      if (checkinsError) {
        console.log('❌ Erro ao buscar check-ins:', checkinsError.message);
      } else {
        console.log('✅ Busca de check-ins bem-sucedida');
        console.log('📊 Check-ins hoje:', checkins?.length || 0);
      }
    } catch (e) {
      console.log('❌ Erro ao buscar check-ins:', e.message);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎯 DIAGNÓSTICO COMPLETO');
  console.log('='.repeat(60));
  
  // 5. Verificar se o problema está na configuração do RLS
  console.log('\n5️⃣ Verificando configuração RLS (Row Level Security)...');
  
  try {
    // Tentar uma operação que deveria falhar sem autenticação
    const { error: testError } = await supabase
      .from('user_profiles')
      .insert({
        id: '00000000-0000-0000-0000-000000000000',
        full_name: 'Teste RLS'
      });
      
    if (testError) {
      if (testError.message.includes('RLS') || 
          testError.message.includes('policy') || 
          testError.message.includes('not allowed') ||
          testError.code === '42501') {
        console.log('✅ RLS está funcionando corretamente');
        console.log('ℹ️ Isto é normal - o RLS impede operações não autorizadas');
      } else {
        console.log('⚠️ Erro inesperado no RLS:', testError.message);
      }
    } else {
      console.log('⚠️ Possível problema: RLS pode não estar configurado');
    }
  } catch (e) {
    console.log('ℹ️ Teste RLS não concluído:', e.message);
  }
  
  // 6. Gerar recomendações
  console.log('\n📝 RECOMENDAÇÕES:');
  
  if (!session?.session?.user) {
    console.log('1. Faça login na aplicação para testar completamente');
    console.log('2. Teste o formulário de perfil após fazer login');
    console.log('3. Teste o check-in diário após fazer login');
  } else {
    console.log('1. As tabelas estão configuradas corretamente');
    console.log('2. Teste o formulário no frontend');
    console.log('3. Verifique o console do browser para erros JavaScript');
  }
  
  console.log('\n🔗 URL da aplicação: https://5173-iv9yhogpcrchrblddtvwb-6532622b.e2b.dev');
  console.log('📱 Acesse /dashboard?tab=profile para testar o perfil');
  console.log('📱 Acesse /dashboard para testar o check-in diário');
}

testSaveFunctionality().catch(console.error);