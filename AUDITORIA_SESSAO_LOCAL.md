# 🔍 AUDITORIA DE SESSÃO LOCAL - VIDA SMART

## 🎯 **DETECTAR LIMPEZA INDEVIDA DE STORAGE**

### **PROBLEMA:** 
Script/middleware da unificação SSO pode estar zerando o `localStorage` após login

---

## 🧪 **TESTE PASSO A PASSO:**

### **1. Preparação:**
1. Abra **aba anônima** (Ctrl+Shift+N)
2. Vá para: `https://www.appvidasmart.com/login`
3. Abra **DevTools** (F12)
4. Vá para: **Application** → **Local Storage** → `https://www.appvidasmart.com`

### **2. Antes do Login:**
Verifique se já existe a chave:
```
<SUPABASE_AUTH_TOKEN>
```
- ✅ **Não deve existir** (aba anônima limpa)

### **3. Durante o Login:**
1. **Faça login** com suas credenciais
2. **IMEDIATAMENTE** após clicar "Entrar"
3. **Verifique Local Storage novamente**
4. **Procure a chave:** `<SUPABASE_AUTH_TOKEN>`

### **4. Análise dos Resultados:**

#### **✅ CENÁRIO NORMAL:**
```json
Key: <SUPABASE_AUTH_TOKEN>
Value: {
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6dWdiZ295bHdiYW9qZG51bnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxODE5MTEsImV4cCI6MjA2OTc1NzkxMX0.8xe_8yAKTq4gWz0tzsYNgHRKvO5G7ZYK58Z2pkxxrmE",
  "refresh_token": "v1.M2YzNjMxNGEtZjM5Yi00...",
  "expires_at": 1694123456,
  "user": {
    "id": "12345678-1234-1234-1234-123456789012",
    "email": "user@exemplo.com"
  }
}
```
**Status:** ✅ Sessão criada e persistida

#### **❌ CENÁRIO PROBLEMÁTICO 1:**
```
Key: <SUPABASE_AUTH_TOKEN>
Value: (chave existe mas some em 1-2 segundos)
```
**Status:** 🚨 **Script está limpando storage**

#### **❌ CENÁRIO PROBLEMÁTICO 2:**
```
(Chave nunca é criada)
```
**Status:** 🚨 **Login não está persistindo sessão**

#### **❌ CENÁRIO PROBLEMÁTICO 3:**
```json
Key: <SUPABASE_AUTH_TOKEN>  
Value: {
  "access_token": null,
  "refresh_token": null,
  "expires_at": null
}
```
**Status:** 🚨 **Sessão criada mas inválida**

---

## 🔍 **INVESTIGAÇÃO ADICIONAL:**

### **Se a chave SOME após criação:**

#### **1. Verificar Console:**
- Procure por mensagens como:
  - "Clearing auth storage"
  - "SSO cleanup"
  - "Auth state reset"
  - Erros relacionados a storage

#### **2. Verificar Network:**
- Procure por requests que retornam:
  - 401 Unauthorized
  - 403 Forbidden
  - Responses que indicam "session expired"

#### **3. Script de Monitoramento:**
Cole no Console para monitorar mudanças:
```javascript
// Monitor de mudanças no localStorage
const originalSetItem = localStorage.setItem;
const originalRemoveItem = localStorage.removeItem;
const originalClear = localStorage.clear;

localStorage.setItem = function(key, value) {
  if (key.includes('sb-') || key.includes('supabase')) {
    console.log('🔄 localStorage SET:', key, value.substring(0, 50) + '...');
  }
  return originalSetItem.apply(this, arguments);
};

localStorage.removeItem = function(key) {
  if (key.includes('sb-') || key.includes('supabase')) {
    console.log('🗑️ localStorage REMOVE:', key);
  }
  return originalRemoveItem.apply(this, arguments);
};

localStorage.clear = function() {
  console.log('🧹 localStorage CLEAR - TUDO LIMPO!');
  return originalClear.apply(this, arguments);
};

console.log('✅ Monitor de localStorage ativado');
```

---

## 📊 **DIAGNÓSTICO:**

### **Se sessão persiste:**
✅ Problema não é limpeza de storage

### **Se sessão some imediatamente:**
🚨 **Causa provável:**
- Middleware da Horizons limpando storage
- Conflito entre múltiplos providers de auth
- Script de "unificação" removendo dados

### **Se sessão nunca é criada:**
🚨 **Causa provável:**
- Keys/projeto incorretos (voltar ao ponto A)
- Erro na configuração do Supabase
- CORS/network bloqueando persistência

---

## 🛠️ **PRÓXIMOS PASSOS:**

Baseado no resultado desta auditoria:
1. **Se storage OK** → Ir para verificação SQL (ponto C)
2. **Se storage limpo** → Identificar script que limpa
3. **Se sessão inválida** → Verificar JWT settings no Supabase