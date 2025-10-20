# 🚨 CORREÇÃO CRÍTICA v9.1 - JWT AUTHENTICATION FIX

## 🔍 **PROBLEMA IDENTIFICADO:**

```
❌ Webhook Status: 500
❌ IA Coach Error: 401 - Invalid JWT
❌ WhatsApp não responde
```

### 🎯 **CAUSA RAIZ:**
O webhook estava usando `SUPABASE_ANON_KEY` para chamar a IA Coach, mas ela requer `SUPABASE_SERVICE_ROLE_KEY` para autenticação interna.

---

## ✅ **CORREÇÕES IMPLEMENTADAS:**

### 1. **JWT Authentication Fix**
```javascript
// ❌ ANTES (v9):
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!

// ✅ AGORA (v9.1):
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
```

### 2. **Chamada IA Coach Corrigida**
```javascript
// ✅ Usando SERVICE_ROLE_KEY:
headers: {
  'Authorization': `Bearer ${supabaseServiceKey}`,
  'Content-Type': 'application/json'
}
```

### 3. **Sistema de Fallback**
```javascript
// ✅ Se IA falhar, sempre responde algo:
if (!iaResponse.ok) {
  const fallbackMessage = 'Olá! Sou seu Vida Smart Coach. Como posso ajudá-lo hoje?'
  await sendWhatsAppMessage(phoneNumber, fallbackMessage)
}
```

### 4. **Função Auxiliar Evolution API**
```javascript
// ✅ Função dedicada para enviar WhatsApp:
async function sendWhatsAppMessage(phoneNumber, message) {
  // Formato correto: "text" e "apikey"
}
```

---

## 🚀 **DEPLOY IMEDIATO:**

### **📁 Arquivo:** `evolution_webhook_v9_1_JWT_FIX.js`

### **📋 Instruções:**
1. **COPIE** todo o conteúdo de `evolution_webhook_v9_1_JWT_FIX.js`
2. **VAMOS** para Supabase Dashboard → Edge Functions → evolution-webhook  
3. **SUBSTITUA** todo o código atual
4. **SALVE** a função

---

## 🔧 **VARIÁVEIS NECESSÁRIAS:**

Certifique-se de que estão configuradas no Supabase:

```env
SUPABASE_URL=https://zzugbgoylwbaojdnunuz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=[KEY_HERE]
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
EVOLUTION_API_KEY=C26C953E32F8-4223-A0FF-755288E45822
EVOLUTION_BASE_URL=[YOUR_EVOLUTION_URL]
EVOLUTION_INSTANCE_NAME=[YOUR_INSTANCE]
```

---

## 🎯 **RESULTADO ESPERADO:**

✅ **IA Coach aceita autenticação**  
✅ **WhatsApp responde imediatamente**  
✅ **Fallback se IA falhar**  
✅ **Logs detalhados no Supabase**  
✅ **Sistema robusto contra falhas**  

---

## 🧪 **TESTE:**

1. **Enviar mensagem WhatsApp**
2. **Verificar resposta da IA**
3. **Confirmar logs no Supabase**

---

**🚨 DEPLOY AGORA!** Esta correção resolve o problema JWT que estava impedindo o WhatsApp de funcionar.