import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Carregar variáveis do .env.local
config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  console.error('Certifique-se de que SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão no .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Email da conta que será resetada
const TARGET_EMAIL = 'jeferson@jccempresas.com.br';

async function resetUserData() {
  try {
    console.log('\n🔄 Iniciando reset de dados de teste...');
    console.log(`📧 Conta alvo: ${TARGET_EMAIL}\n`);

    // 1. Buscar usuário pelo email
    console.log('1️⃣ Buscando usuário...');
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, name, email')
      .eq('email', TARGET_EMAIL)
      .single();

    if (profileError || !profile) {
      console.error('❌ Usuário não encontrado!');
      console.error(profileError?.message);
      return;
    }

    const userId = profile.id;
    console.log(`✅ Usuário encontrado: ${userId}`);
    console.log(`   Nome: ${profile.name}`);
    console.log(`   Email: ${profile.email}\n`);

    // 2. Deletar histórico de conversas
    console.log('2️⃣ Removendo histórico de conversas IA...');
    
    const { error: messagesError } = await supabase
      .from('conversation_messages')
      .delete()
      .eq('user_id', userId);

    if (messagesError && !messagesError.message.includes('does not exist')) {
      console.error(`⚠️  Mensagens: ${messagesError.message}`);
    } else if (!messagesError) {
      console.log('✅ Mensagens removidas');
    }

    const { error: chatError } = await supabase
      .from('chat_history')
      .delete()
      .eq('user_id', userId);

    if (chatError && !chatError.message.includes('does not exist')) {
      console.error(`⚠️  Chat: ${chatError.message}`);
    } else if (!chatError) {
      console.log('✅ Chat removido');
    }

    // 3. Deletar completions de planos
    console.log('\n3️⃣ Removendo completions de planos...');
    const { error: completionsError } = await supabase
      .from('plan_completions')
      .delete()
      .eq('user_id', userId);

    if (completionsError) {
      console.error(`⚠️  Erro: ${completionsError.message}`);
    } else {
      console.log('✅ Completions removidas');
    }

    // 4. Deletar feedback de planos
    console.log('\n4️⃣ Removendo feedback de planos...');
    const { error: feedbackError } = await supabase
      .from('plan_feedback')
      .delete()
      .eq('user_id', userId);

    if (feedbackError) {
      console.error(`⚠️  Erro: ${feedbackError.message}`);
    } else {
      console.log('✅ Feedback removido');
    }

    // 5. Deletar resgates (cascata remove cupons)
    console.log('\n5️⃣ Removendo resgates de recompensas...');
    const { error: redemptionsError } = await supabase
      .from('reward_redemptions')
      .delete()
      .eq('user_id', userId);

    if (redemptionsError) {
      console.error(`⚠️  Erro: ${redemptionsError.message}`);
    } else {
      console.log('✅ Resgates removidos (cupons em cascata)');
    }

    // 6. Deletar achievements
    console.log('\n6️⃣ Removendo achievements...');
    const { error: achievementsError } = await supabase
      .from('user_achievements')
      .delete()
      .eq('user_id', userId);

    if (achievementsError) {
      console.error(`⚠️  Erro: ${achievementsError.message}`);
    } else {
      console.log('✅ Achievements removidas');
    }

    // 7. Deletar daily activities
    console.log('\n7️⃣ Removendo daily activities...');
    const { error: activitiesError } = await supabase
      .from('daily_activities')
      .delete()
      .eq('user_id', userId);

    if (activitiesError) {
      console.error(`⚠️  Erro: ${activitiesError.message}`);
    } else {
      console.log('✅ Daily activities removidas');
    }

    // 8. Deletar eventos de gamificação
    console.log('\n8️⃣ Removendo eventos de gamificação...');
    const { error: eventsError } = await supabase
      .from('gamification_events')
      .delete()
      .eq('user_id', userId);

    if (eventsError && !eventsError.message.includes('does not exist')) {
      console.error(`⚠️  Eventos: ${eventsError.message}`);
    } else if (!eventsError) {
      console.log('✅ Eventos removidos');
    }

    // 9. Resetar gamificação (deletar e recriar zerado)
    console.log('\n9️⃣ Resetando gamificação...');
    
    await supabase
      .from('gamification')
      .delete()
      .eq('user_id', userId);

    const { error: gamificationError } = await supabase
      .from('gamification')
      .insert({
        user_id: userId,
        total_points: 0,
        level: 1,
        current_streak: 0,
        longest_streak: 0
      });

    if (gamificationError) {
      console.error(`⚠️  Erro: ${gamificationError.message}`);
    } else {
      console.log('✅ Gamificação resetada (0 XP, Nível 1)');
    }

    // 10. Deletar planos
    console.log('\n🔟 Removendo planos...');
    const { error: plansError } = await supabase
      .from('user_plans')
      .delete()
      .eq('user_id', userId);

    if (plansError) {
      console.error(`⚠️  Erro: ${plansError.message}`);
    } else {
      console.log('✅ Planos removidos');
    }

    // 11. Limpar diagnósticos
    console.log('\n1️⃣1️⃣ Limpando diagnósticos...');
    const { error: diagnosticsError } = await supabase
      .from('area_diagnostics')
      .delete()
      .eq('user_id', userId);

    if (diagnosticsError) {
      console.error(`⚠️  Erro: ${diagnosticsError.message}`);
    } else {
      console.log('✅ Diagnósticos removidos');
    }

    // 12. Limpar notificações
    console.log('\n1️⃣2️⃣ Limpando notificações...');
    const { error: notifError } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId);
    
    if (notifError && !notifError.message.includes('does not exist')) {
      console.error(`⚠️  Erro: ${notifError.message}`);
    } else if (!notifError) {
      console.log('✅ Notificações limpas');
    }

    // 13. Atualizar perfil (timestamp)
    console.log('\n1️⃣3️⃣ Atualizando perfil...');
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error(`⚠️  Erro: ${updateError.message}`);
    } else {
      console.log('✅ Perfil atualizado');
    }

    // Resultado final
    console.log('\n' + '='.repeat(60));
    console.log('✅ RESET COMPLETO!\n');
    console.log('📊 Estado da conta após reset:');
    console.log('   ✅ Perfil: mantido (nome, email, telefone)');
    console.log('   ✅ XP: 0');
    console.log('   ✅ Nível: 1 (inicial)');
    console.log('   ✅ Planos: nenhum');
    console.log('   ✅ Histórico IA: limpo');
    console.log('   ✅ Resgates: nenhum');
    console.log('   ✅ Completions: nenhuma');
    console.log('   ✅ Diagnósticos: limpo');
    console.log('   ✅ Notificações: limpas\n');
    
    console.log('🚀 Conta ZERADA! Experiência completa desde o início disponível!');
    console.log('\n📋 Próximos passos - JORNADA COMPLETA:');
    console.log('   1️⃣  Enviar mensagem via WhatsApp para iniciar conversa');
    console.log('   2️⃣  IA começará como SDR (acolhimento inicial)');
    console.log('   3️⃣  Preencher questionário 4 Pilares (Físico/Nutricional/Emocional/Espiritual)');
    console.log('   4️⃣  Gerar plano personalizado baseado nas respostas');
    console.log('   5️⃣  Testar completions no calendário');
    console.log('   6️⃣  Ganhar XP e achievements');
    console.log('   7️⃣  Receber ofertas de recompensas via WhatsApp');
    console.log('   8️⃣  Resgatar recompensas no dashboard');
    console.log('\n💡 Você verá toda a experiência do zero, como um usuário novo!');

  } catch (err) {
    console.error('\n❌ Erro no reset:', err);
    throw err;
  }
}

// Confirmação de segurança
console.log('\n⚠️  RESET COMPLETO DE CONTA - EXPERIÊNCIA DO ZERO ⚠️');
console.log('=' .repeat(60));
console.log(`📧 Conta: ${TARGET_EMAIL}`);
console.log('\n✅ Será mantido apenas:');
console.log('   - Perfil básico (nome, email, telefone)');
console.log('   - Registro de autenticação\n');

console.log('🗑️  Serão REMOVIDOS:');
console.log('   - Todos os planos');
console.log('   - Todo o XP e gamificação');
console.log('   - Todos os resgates e cupons');
console.log('   - Todo histórico de conversas IA');
console.log('   - Todas as completions');
console.log('   - Todo feedback');
console.log('   - Todas as achievements');
console.log('   - Todos os diagnósticos');
console.log('   - Todas as notificações\n');

// Executar
resetUserData().catch(err => {
  console.error('❌ Reset falhou:', err);
  process.exit(1);
});
