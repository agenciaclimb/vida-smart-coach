# 🚨 CORREÇÃO CRÍTICA v9 - EVOLUTION WEBHOOK

## 📋 PROBLEMAS IDENTIFICADOS E CORRIGIDOS:

### 🔴 **PROBLEMA 1: Formato Evolution API Incorreto**
**ANTES v8:**
```javascript
body: JSON.stringify({
  number: phone,
  message: responseMessage  // ❌ ERRADO: deveria ser "text"
})
```

**DEPOIS v9:**
```javascript
body: JSON.stringify({
  number: phone,
  text: responseMessage  // ✅ CORRETO: conforme Evolution API
})
```

### 🔴 **PROBLEMA 2: Estrutura Tabela WhatsApp**
**ANTES v8:**
```sql
user_id: matchedUser?.id || null  // ❌ ERRO: coluna não existe
```

**DEPOIS v9:**
```sql
-- ✅ CORRETO: removido user_id que não existe na tabela
phone: phoneNumber,
message: messageContent,
event: "messages.upsert",
timestamp: Date.now()
```

### 🔴 **PROBLEMA 3: Headers Evolution API**
**ANTES v8:**
```javascript
headers: {
  "apikey": evolutionApiKey  // ❌ Usando variável genérica
}
```

**DEPOIS v9:**
```javascript
headers: {
  "apikey": evolutionApiKey  // ✅ Confirmado: token da instância
}
```

## 🚀 DEPLOY NECESSÁRIO:

### **ARQUIVO CORRIGIDO:** `evolution_webhook_corrigido_v9.js`

### **INSTRUÇÕES DE DEPLOY:**
1. **Copie** todo o conteúdo de `evolution_webhook_corrigido_v9.js`
2. **Cole** no Supabase Dashboard > Edge Functions > evolution-webhook
3. **Salve** a função

## 🎯 CORREÇÕES IMPLEMENTADAS:

✅ **Formato Evolution API:** `text` em vez de `message`  
✅ **Estrutura Tabela:** Removido `user_id` inexistente  
✅ **Headers Corretos:** `apikey` com token da instância  
✅ **Histórico Simplificado:** Sem campos inexistentes  
✅ **Error Handling:** Melhor tratamento de erros  

## 🧪 TESTE APÓS DEPLOY:

1. **Enviar mensagem WhatsApp**
2. **Verificar se IA responde**
3. **Confirmar inserção em whatsapp_messages**
4. **Validar otimizações v8 funcionando**

## 🏆 RESULTADO ESPERADO:

✅ WhatsApp volta a funcionar  
✅ IA Coach v8 otimizado responde  
✅ Uma pergunta por vez  
✅ Contexto mantido  

---
**DEPLOY AGORA:** Copie `evolution_webhook_corrigido_v9.js` → Supabase Dashboard!