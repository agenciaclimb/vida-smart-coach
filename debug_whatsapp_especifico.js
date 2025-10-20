// ============================================
// 🚨 DEBUG ESPECÍFICO - WHATSAPP NÃO RESPONDE
// ============================================

console.log('🚨 DEBUG ESPECÍFICO - APÓS CORREÇÃO RLS');
console.log('📅 Data:', new Date().toLocaleString('pt-BR'));

// Vamos verificar especificamente o que pode estar bloqueando

console.log('\n🎯 POSSÍVEIS PROBLEMAS RESTANTES:');
console.log('════════════════════════════════════════════════');

console.log('\n1. 🔥 EVOLUTION_API_SECRET INCORRETA');
console.log('   📝 Webhook não consegue autenticar');
console.log('   🔧 Solução: Verificar secret no Supabase');
console.log('   📍 Local: Dashboard > Edge Functions > Environment Variables');

console.log('\n2. 🔥 FINDUSER RETORNANDO NULL');
console.log('   📝 Usuário WhatsApp não encontrado no banco');
console.log('   🔧 Solução: Verificar formato do telefone');
console.log('   📍 Telefone deve estar como: "5516981459950"');

console.log('\n3. 🔥 IA COACH ERRO INTERNO');
console.log('   📝 Função ia-coach-chat com problema');
console.log('   🔧 Solução: Verificar logs específicos');
console.log('   📍 Edge Functions > ia-coach-chat > Logs');

console.log('\n4. 🔥 EVOLUTION API DESCONFIGURADA');
console.log('   📝 Webhook URL mudou ou não está ativo');
console.log('   🔧 Solução: Reconfigurar webhook');
console.log('   📍 Evolution API dashboard');

console.log('\n📊 TESTES ESPECÍFICOS PARA FAZER:');
console.log('════════════════════════════════════════════════');

console.log('\n✅ TESTE 1: VERIFICAR ENVIRONMENT VARIABLES');
console.log('1. Dashboard Supabase');
console.log('2. Edge Functions > Environment Variables');
console.log('3. Verificar se existe: EVOLUTION_API_SECRET');
console.log('4. Verificar se existe: SUPABASE_ANON_KEY');
console.log('5. Verificar se existe: EVOLUTION_API_URL');
console.log('6. Verificar se existe: EVOLUTION_API_KEY');

console.log('\n✅ TESTE 2: VERIFICAR USUÁRIO NO BANCO');
console.log('SQL: SELECT * FROM user_profiles WHERE phone LIKE \'%981459950%\';');
console.log('Resultado esperado: 1 linha com o usuário');

console.log('\n✅ TESTE 3: VERIFICAR INSERÇÃO FUNCIONA');
console.log('SQL: INSERT INTO whatsapp_messages (phone, message, event, timestamp)');
console.log('     VALUES (\'test\', \'test\', \'test\', 1234567890);');
console.log('Se der erro: RLS ainda ativo ou outro problema');

console.log('\n✅ TESTE 4: VERIFICAR LOGS EM TEMPO REAL');
console.log('1. Abrir Dashboard > Logs & Analytics > Edge Functions');
console.log('2. Filtrar por: evolution-webhook');
console.log('3. Enviar mensagem WhatsApp');
console.log('4. Ver se aparece log novo');

console.log('\n⚡ PASSOS DE DEBUGGING URGENTE:');
console.log('════════════════════════════════════════════════');

console.log('\n1️⃣ EXECUTAR SQL SEGURO');
console.log('   📁 Arquivo: CORRECAO_WHATSAPP_SEGURA.sql');
console.log('   🎯 Descobrir estrutura + testar inserção');

console.log('\n2️⃣ VERIFICAR ENVIRONMENT VARIABLES');
console.log('   📍 Dashboard > Settings > API');
console.log('   🔧 Confirmar todas as keys necessárias');

console.log('\n3️⃣ MONITORAR LOGS TEMPO REAL');
console.log('   📍 Dashboard > Logs & Analytics');
console.log('   🔧 Enviar mensagem + ver logs');

console.log('\n4️⃣ TESTE WEBHOOK DIRETO');
console.log('   🔧 Teste sem Evolution API');
console.log('   📤 POST direto no webhook');

console.log('\n🚨 CAUSAS MAIS PROVÁVEIS (EM ORDEM):');
console.log('════════════════════════════════════════════════');
console.log('1. 🔥 EVOLUTION_API_SECRET errada (70% chance)');
console.log('2. 🔥 Usuário não existe no banco (20% chance)');
console.log('3. 🔥 Evolution API não envia webhook (10% chance)');

console.log('\n🎯 AÇÃO IMEDIATA:');
console.log('Execute CORRECAO_WHATSAPP_SEGURA.sql primeiro!');