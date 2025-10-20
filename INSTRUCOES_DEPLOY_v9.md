# 🚀 DEPLOY WEBHOOK CORRIGIDO v9

## ✅ CORREÇÕES IMPLEMENTADAS:

### 1. **FORMATO EVOLUTION API CORRETO**
```javascript
// ❌ ANTES (v8 - estava errado):
body: JSON.stringify({
  number: phoneNumber,
  message: responseMessage  // ERRO: Evolution API espera "text"
})

// ✅ AGORA (v9 - correto):
body: JSON.stringify({
  number: phoneNumber,
  text: responseMessage     // CORRETO: conforme Evolution API
})
```

### 2. **ESTRUTURA TABELA whatsapp_messages**
```javascript
// ❌ ANTES (v8 - campo inexistente):
user_id: matchedUser?.id || null  // ERRO: coluna não existe

// ✅ AGORA (v9 - sem user_id):
phone: phoneNumber,
message: messageContent,
event: 'messages.upsert',
timestamp: Date.now()
```

### 3. **HEADERS EVOLUTION API**
```javascript
// ✅ Header correto conforme suas especificações:
headers: {
  'Content-Type': 'application/json',
  'apikey': 'C26C953E32F8-4223-A0FF-755288E45822'  // Token da instância
}
```

---

## 🎯 ARQUIVO PARA DEPLOY:

**📁 Arquivo:** `evolution_webhook_DEPLOY_v9.js`

**📋 Instruções:**

1. **COPIE** todo o conteúdo de `evolution_webhook_DEPLOY_v9.js`
2. **ACESSE** Supabase Dashboard → Edge Functions
3. **ABRA** a função `evolution-webhook`
4. **COLE** o código corrigido
5. **SALVE** a função

---

## 🧪 TESTE APÓS DEPLOY:

1. ✅ **Enviar mensagem WhatsApp**
2. ✅ **Verificar resposta da IA**
3. ✅ **Confirmar logs no Supabase**
4. ✅ **Validar formato Evolution API**

---

## 🎉 RESULTADO ESPERADO:

✅ **WhatsApp volta a funcionar**  
✅ **IA Coach v8 responde com otimizações**  
✅ **Uma pergunta por vez (otimização v8)**  
✅ **Contexto WhatsApp mantido**  
✅ **Logs corretos no banco**  

---

## 🔧 DEBUGGING:

Se ainda não funcionar, verifique:

- ✅ **URL Webhook:** `https://zzugbgoylwbaojdnunuz.supabase.co/functions/v1/evolution-webhook`
- ✅ **Token Instância:** `C26C953E32F8-4223-A0FF-755288E45822`
- ✅ **Variáveis Ambiente:** EVOLUTION_API_KEY, EVOLUTION_BASE_URL, EVOLUTION_INSTANCE_NAME

---

**🚨 DEPLOY AGORA!** O arquivo está pronto para correção completa.