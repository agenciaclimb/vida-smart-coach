// ============================================
// 🚨 PROBLEMA IDENTIFICADO - DEPLOY v8 QUEBROU ALGO
// ============================================

console.log('🚨 PROBLEMA: Deploy v8 quebrou WhatsApp');
console.log('📅 Data:', new Date().toLocaleString('pt-BR'));
console.log('════════════════════════════════════════════════');

console.log('🎯 DIAGNÓSTICO CONFIRMADO:');
console.log('✅ Variables OK (funcionava antes)');
console.log('❌ Parou após deploy v8');
console.log('🔍 Problema: Código novo tem bug');

console.log('\n🔍 POSSÍVEIS PROBLEMAS NO CÓDIGO v8:');
console.log('════════════════════════════════════════════════');

console.log('\n1. 🔥 HISTÓRICO WHATSAPP QUEBROU ALGO');
console.log('   📝 Nova busca de chatHistory pode ter erro');
console.log('   🔧 Código: .from(\'whatsapp_messages\').select(\'message, user_id\')');
console.log('   ❌ Problema: user_id não existe na tabela!');

console.log('\n2. 🔥 FORMATAÇÃO DO HISTÓRICO INCORRETA');
console.log('   📝 formattedHistory pode estar causando erro');
console.log('   🔧 Código: msg.user_id ? \'user\' : \'assistant\'');
console.log('   ❌ Problema: user_id undefined causa erro');

console.log('\n3. 🔥 FULL_NAME UNDEFINED');
console.log('   📝 matchedUser.full_name pode não existir');
console.log('   🔧 Código: full_name: matchedUser.full_name || "Usuário WhatsApp"');
console.log('   ❌ Problema: Campo pode não existir na tabela');

console.log('\n⚡ CORREÇÕES URGENTES NECESSÁRIAS:');
console.log('════════════════════════════════════════════════');

console.log('\n🔧 CORREÇÃO #1: REMOVER user_id da query');
console.log('ANTES: .select(\'message, user_id\')');
console.log('DEPOIS: .select(\'message, phone\')');

console.log('\n🔧 CORREÇÃO #2: Corrigir lógica do histórico');
console.log('ANTES: role: msg.user_id ? \'user\' : \'assistant\'');
console.log('DEPOIS: role: msg.phone ? \'user\' : \'assistant\'');

console.log('\n🔧 CORREÇÃO #3: Proteger full_name');
console.log('ANTES: full_name: matchedUser.full_name || "Usuário WhatsApp"');
console.log('DEPOIS: full_name: matchedUser.name || matchedUser.full_name || "Usuário WhatsApp"');

console.log('\n🔧 CORREÇÃO #4: Fallback para histórico');
console.log('Adicionar try/catch na busca do histórico');

console.log('\n🚀 SOLUÇÃO RÁPIDA:');
console.log('════════════════════════════════════════════════');
console.log('1. Reverter para código anterior (funcionava)');
console.log('2. OU aplicar correções específicas');
console.log('3. Re-deploy imediatamente');

console.log('\n📋 CÓDIGO PROBLEMÁTICO IDENTIFICADO:');
console.log('────────────────────────────────────────────────');
console.log('Linha ~175: .select(\'message, user_id\') ← ERRO!');
console.log('Linha ~180: msg.user_id ? \'user\' ← ERRO!');
console.log('Linha ~190: matchedUser.full_name ← POSSÍVEL ERRO!');

console.log('\n⚡ AÇÃO IMEDIATA:');
console.log('Vou corrigir o código evolution-webhook agora!');