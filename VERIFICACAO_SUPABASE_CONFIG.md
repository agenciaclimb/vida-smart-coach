# 🔧 VERIFICAÇÃO CRÍTICA - PROJETO/KEYS SUPABASE

## 🎯 **BLOQUEADOR #1: Conflito de Projeto/Keys**

### **PROBLEMA IDENTIFICADO:**
- **Hipótese:** `VITE_SUPABASE_URL` aponta para Projeto A, mas `VITE_SUPABASE_ANON_KEY` é do Projeto B
- **Sintoma:** Sessão "expira" imediatamente após criação
- **Causa:** SSO/unificação pode ter misturado credenciais

---

## ✅ **VERIFICAÇÃO OBRIGATÓRIA**

### **1. No Supabase Dashboard:**
1. Acesse: `https://supabase.com/dashboard/project/zzugbgoylwbaojdnunuz/settings/api`
2. **CONFIRME:**
   - **Project URL:** `https://zzugbgoylwbaojdnunuz.supabase.co`
   - **Anon Key:** `eyJhbGciOiJIUzI1...` (copie a chave completa)

### **2. No Vercel Environment Variables:**
1. Acesse: `https://vercel.com/jeffersons/projects/vida-smart-coach/settings/environment-variables`
2. **VERIFIQUE SE BATEM:**
   ```
   VITE_SUPABASE_URL = https://zzugbgoylwbaojdnunuz.supabase.co
   VITE_SUPABASE_ANON_KEY = <mesma anon key do Supabase>
   ```

### **3. Se NÃO bater:**
- ❌ **Trocar imediatamente**
- 🔄 **Redeploy obrigatório**
- ✅ **Teste novamente**

---

## 🔍 **SCRIPT DE VERIFICAÇÃO RÁPIDA**

Abra Console do navegador e execute:
```javascript
// Verificar configuração atual
console.log('🔧 Config Check:', {
  url: import.meta.env.VITE_SUPABASE_URL,
  hasKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
  keyPrefix: import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 10) + '...'
});

// Deve exibir:
// url: "https://zzugbgoylwbaojdnunuz.supabase.co"
// hasKey: true
// keyPrefix: "eyJhbGciOi..."
```

---

## 🚨 **SINAIS DE PROBLEMA:**

### **URL Incorreta:**
- ❌ URL diferente de `zzugbgoylwbaojdnunuz.supabase.co`
- ❌ URL de outro projeto/ambiente

### **Key Incorreta:**
- ❌ Anon key de projeto diferente
- ❌ Service key ao invés de anon key
- ❌ Key expirada ou inválida

### **Ambientes Misturados:**
- ❌ Production usa keys de Development
- ❌ Keys de projetos de teste em produção

---

## ✅ **CORREÇÃO:**

Se encontrar inconsistência:

1. **Copiar credenciais corretas do Supabase**
2. **Atualizar Vercel com as corretas**
3. **Redeploy imediato**
4. **Teste em aba anônima**

**Este é o primeiro e mais comum causa do problema de sessão expirada pós-SSO!**