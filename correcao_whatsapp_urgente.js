// ============================================
// 🔧 CORREÇÃO URGENTE - WHATSAPP PAROU
// ============================================

console.log('🔧 PLANO DE CORREÇÃO URGENTE - WHATSAPP');
console.log('📅 Data:', new Date().toLocaleString('pt-BR'));
console.log('════════════════════════════════════════════════');

console.log('🎯 DIAGNÓSTICO CONFIRMADO:');
console.log('✅ IA Coach: FUNCIONANDO (200 OK)');
console.log('✅ Webhook: PROTEGIDO (401 correto)');
console.log('❌ Problema: Integração Evolution API');

console.log('\n🔍 BASEADO NOS LOGS VISUALIZADOS:');
console.log('1. 🔴 Erros RLS policy violations');
console.log('2. 🔴 Function.net.http_post errors');
console.log('3. 🔴 "does not exist" errors');
console.log('4. 🔴 Múltiplos ERROR no PgCron');

console.log('\n📋 CAUSAS MAIS PROVÁVEIS:');
console.log('════════════════════════════════════════════════');

console.log('\n🔥 CAUSA #1: RLS POLICIES BLOQUEANDO (MAIS PROVÁVEL)');
console.log('📝 Problema: Row Level Security bloqueando inserções');
console.log('🛠️ Solução: Desabilitar ou ajustar RLS na tabela whatsapp_messages');
console.log('💾 SQL necessário:');
console.log('   ALTER TABLE whatsapp_messages DISABLE ROW LEVEL SECURITY;');
console.log('   -- OU --');
console.log('   CREATE POLICY allow_insert_whatsapp ON whatsapp_messages FOR INSERT TO authenticated WITH CHECK (true);');

console.log('\n🔥 CAUSA #2: EVOLUTION_API_SECRET INCORRETA');
console.log('📝 Problema: Secret mudou ou não está configurada');
console.log('🛠️ Solução: Verificar e atualizar secret no Supabase');
console.log('📍 Local: Dashboard > Settings > Environment Variables');

console.log('\n🔥 CAUSA #3: FINDUSER FALHANDO');
console.log('📝 Problema: Usuário não encontrado na tabela user_profiles');
console.log('🛠️ Solução: Verificar se telefone existe no formato correto');
console.log('💾 SQL para verificar:');
console.log('   SELECT * FROM user_profiles WHERE phone = \'5516981459950\';');

console.log('\n⚡ AÇÕES URGENTES EM ORDEM DE PRIORIDADE:');
console.log('════════════════════════════════════════════════');

console.log('\n1️⃣ PRIORIDADE MÁXIMA - RLS POLICIES');
console.log('   🎯 Desabilitar RLS temporariamente');
console.log('   📍 SQL Editor Supabase');
console.log('   🔧 ALTER TABLE whatsapp_messages DISABLE ROW LEVEL SECURITY;');

console.log('\n2️⃣ VERIFICAR ENVIRONMENT VARIABLES');
console.log('   🎯 Confirmar EVOLUTION_API_SECRET');
console.log('   📍 Dashboard > Settings > Edge Functions > Environment Variables');
console.log('   🔧 Verificar se secret está definida corretamente');

console.log('\n3️⃣ VERIFICAR USUÁRIO WHATSAPP');
console.log('   🎯 Confirmar se telefone existe no banco');
console.log('   📍 SQL Editor');
console.log('   🔧 SELECT * FROM user_profiles WHERE phone LIKE \'%16981459950%\';');

console.log('\n4️⃣ TESTAR FLUXO MANUALMENTE');
console.log('   🎯 Enviar mensagem WhatsApp');
console.log('   📍 Monitorar logs em tempo real');
console.log('   🔧 Verificar cada etapa do processo');

console.log('\n📊 COMANDOS SQL PARA CORREÇÃO RÁPIDA:');
console.log('════════════════════════════════════════════════');

console.log('\n-- 🚀 CORREÇÃO #1: Desabilitar RLS temporariamente');
console.log('ALTER TABLE whatsapp_messages DISABLE ROW LEVEL SECURITY;');

console.log('\n-- 🔍 DIAGNÓSTICO #1: Verificar usuário');
console.log('SELECT id, phone, full_name FROM user_profiles WHERE phone LIKE \'%981459950%\';');

console.log('\n-- 🔍 DIAGNÓSTICO #2: Verificar mensagens recentes');
console.log('SELECT * FROM whatsapp_messages ORDER BY timestamp DESC LIMIT 10;');

console.log('\n-- 🔍 DIAGNÓSTICO #3: Verificar client_stages');
console.log('SELECT * FROM client_stages ORDER BY updated_at DESC LIMIT 5;');

console.log('\n🎯 TESTE APÓS CORREÇÃO:');
console.log('════════════════════════════════════════════════');
console.log('1. ✅ Executar SQL de correção');
console.log('2. ✅ Enviar mensagem WhatsApp teste');
console.log('3. ✅ Verificar logs em tempo real');
console.log('4. ✅ Confirmar resposta da IA');
console.log('5. ✅ Validar inserção na tabela whatsapp_messages');

console.log('\n🏆 EXPECTATIVA PÓS-CORREÇÃO:');
console.log('════════════════════════════════════════════════');
console.log('✅ WhatsApp recebe mensagem');
console.log('✅ Webhook processa corretamente');
console.log('✅ IA Coach responde com v8 otimizado');
console.log('✅ Mensagem é armazenada no histórico');
console.log('✅ Resposta é enviada via Evolution API');

console.log('\n🚨 AÇÃO IMEDIATA RECOMENDADA:');
console.log('Executar: ALTER TABLE whatsapp_messages DISABLE ROW LEVEL SECURITY;');