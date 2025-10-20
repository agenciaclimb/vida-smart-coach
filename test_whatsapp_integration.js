import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Variáveis de ambiente VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testWhatsAppIntegration() {
  console.log('🔍 Testando integração WhatsApp com IA Coach...\n');

  try {
    // 1. Verificar se existem usuários com telefone
    console.log('1. Verificando usuários com telefone...');
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('id, email, phone')
      .not('phone', 'is', null)
      .limit(5);

    if (usersError) {
      console.error('Erro ao buscar usuários:', usersError);
      return;
    }

    console.log(`Encontrados ${users.length} usuários com telefone:`);
    users.forEach(user => {
      console.log(`- ID: ${user.id}, Email: ${user.email}, Phone: ${user.phone}`);
    });

    if (users.length === 0) {
      console.log('\n⚠️ Nenhum usuário com telefone encontrado. Criando usuário de teste...');
      
      // Criar usuário de teste
      const testUser = {
        id: crypto.randomUUID(),
        email: 'teste.whatsapp@vidasmartcoach.com',
        phone: '+5511999999999',
        full_name: 'Usuário Teste WhatsApp'
      };

      const { error: insertError } = await supabase
        .from('user_profiles')
        .insert(testUser);

      if (insertError) {
        console.error('Erro ao criar usuário de teste:', insertError);
      } else {
        console.log('✅ Usuário de teste criado com sucesso!');
        users.push(testUser);
      }
    }

    // 2. Verificar tabelas do IA Coach
    console.log('\n2. Verificando tabelas do IA Coach...');
    
    const tables = ['client_stages', 'interactions', 'conversation_memory'];
    
    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error(`Erro ao verificar tabela ${table}:`, error);
      } else {
        console.log(`✅ Tabela ${table}: ${count} registros`);
      }
    }

    // 3. Simular webhook do WhatsApp
    console.log('\n3. Simulando webhook do WhatsApp...');
    
    if (users.length > 0) {
      const testUser = users[0];
      console.log(`Usando usuário: ${testUser.email} (${testUser.phone})`);
      
      // Simular payload do Evolution API
      const webhookPayload = {
        event: "messages.upsert",
        instance: "test-instance",
        data: {
          key: {
            remoteJid: testUser.phone,
            fromMe: false
          },
          message: {
            conversation: "Oi, quero saber mais sobre vida saudável!"
          }
        }
      };

      console.log('Payload de teste:', JSON.stringify(webhookPayload, null, 2));
      
      // Verificar se já existe um estágio para este usuário
      const { data: existingStage } = await supabase
        .from('client_stages')
        .select('*')
        .eq('user_id', testUser.id)
        .single();

      if (existingStage) {
        console.log(`\n✅ Usuário já tem estágio: ${existingStage.current_stage} (Score BANT: ${existingStage.bant_score})`);
      } else {
        console.log('\n📝 Usuário sem estágio - seria criado pelo IA Coach na primeira interação');
      }
    }

    // 4. Verificar configuração das funções
    console.log('\n4. Verificando URLs das funções...');
    console.log(`IA Coach URL: ${supabaseUrl}/functions/v1/ia-coach-chat`);
    console.log(`WhatsApp Webhook URL: ${supabaseUrl}/functions/v1/evolution-webhook`);

    console.log('\n✅ Teste de integração concluído!');
    console.log('\n📋 Próximos passos:');
    console.log('1. Configure o Evolution API para enviar webhooks para o endpoint evolution-webhook');
    console.log('2. Teste enviando uma mensagem real via WhatsApp');
    console.log('3. Monitore os logs para verificar o processamento');

  } catch (error) {
    console.error('Erro durante o teste:', error);
  }
}

testWhatsAppIntegration();