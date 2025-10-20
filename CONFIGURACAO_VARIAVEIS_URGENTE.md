# 🚨 CORREÇÃO URGENTE - VARIÁVEIS DE AMBIENTE

## 🔍 **PROBLEMAS IDENTIFICADOS:**

1. ❌ **Evolution API não configurada**: Variáveis Evolution missing
2. ❌ **Invalid JWT**: SERVICE_ROLE_KEY não configurada  
3. ❌ **Invalid API key**: Problema de autenticação

---

## 🔧 **VARIÁVEIS OBRIGATÓRIAS NO SUPABASE:**

### **Acesse:** Supabase Dashboard → Edge Functions → evolution-webhook → Settings

### **Configure essas variáveis:**

```env
SUPABASE_URL=https://zzugbgoylwbaojdnunuz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=[PRECISA SER CONFIGURADA]
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6dWdiZ295bHdiYW9qZG51bnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIxMjcyNDksImV4cCI6MjA0NzcwMzI0OX0.8xe_8yAKTq4gWz0tzsYNgHRKvO5G7ZYK58Z2pkxxrmE

EVOLUTION_API_KEY=C26C953E32F8-4223-A0FF-755288E45822
EVOLUTION_BASE_URL=[SUA_URL_EVOLUTION]
EVOLUTION_INSTANCE_NAME=[SUA_INSTANCIA]
```

---

## 🔑 **COMO OBTER SERVICE_ROLE_KEY:**

### **No Supabase Dashboard:**

1. **Vá para:** Project Settings → API
2. **Procure por:** "service_role" key  
3. **Copie** a chave que começa com `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
4. **Cole** na variável `SUPABASE_SERVICE_ROLE_KEY`

---

## 🌐 **COMO OBTER EVOLUTION VARIABLES:**

### **Na sua instância Evolution API:**

```env
EVOLUTION_BASE_URL=https://seu-evolution.exemplo.com
EVOLUTION_INSTANCE_NAME=nome-da-sua-instancia
EVOLUTION_API_KEY=C26C953E32F8-4223-A0FF-755288E45822
```

---

## 📋 **CHECKLIST CONFIGURAÇÃO:**

```
□ 1. Acessar Supabase Dashboard
□ 2. Ir para Edge Functions → evolution-webhook → Settings  
□ 3. Adicionar SUPABASE_SERVICE_ROLE_KEY
□ 4. Adicionar EVOLUTION_API_KEY
□ 5. Adicionar EVOLUTION_BASE_URL  
□ 6. Adicionar EVOLUTION_INSTANCE_NAME
□ 7. Salvar configurações
□ 8. Re-deploy da função (salvar código novamente)
```

---

## 🧪 **TESTE APÓS CONFIGURAÇÃO:**

1. **Enviar mensagem WhatsApp**
2. **Verificar logs Supabase**
3. **Confirmar resposta da IA**

---

## 🎯 **RESULTADO ESPERADO:**

✅ **Webhook funcionando** (status 200)  
✅ **IA Coach respondendo** (sem 401)  
✅ **Evolution API enviando** (sem erro config)  
✅ **WhatsApp funcionando** (respostas inteligentes)  

---

**🚨 CONFIGURE AS VARIÁVEIS AGORA!** Sem elas o sistema não pode funcionar.