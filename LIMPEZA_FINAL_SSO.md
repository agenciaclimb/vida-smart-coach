# 🧹 LIMPEZA FINAL DE RESÍDUOS SSO - VIDA SMART

## 🎯 **PROBLEMA:**
Tentativa de SSO/unificação deixou resíduos que interferem na sessão Supabase

---

## ✅ **CHECKLIST DE LIMPEZA VERCEL**

### **1. Variáveis de Ambiente para REMOVER:**
Acesse: `https://vercel.com/jeffersons/projects/vida-smart-coach/settings/environment-variables`

**REMOVER TODAS estas (se existirem):**
```
❌ AUTH0_SECRET
❌ AUTH0_BASE_URL  
❌ AUTH0_ISSUER_BASE_URL
❌ AUTH0_CLIENT_ID
❌ AUTH0_CLIENT_SECRET
❌ AUTH0_SCOPE
❌ AUTH0_DOMAIN

❌ NEXTAUTH_SECRET
❌ NEXTAUTH_URL
❌ NEXTAUTH_JWT_SECRET

❌ NEXT_PUBLIC_AUTH0_*
❌ NEXT_PUBLIC_CLERK_*
❌ NEXT_PUBLIC_FIREBASE_*

❌ CLERK_SECRET_KEY
❌ CLERK_FRONTEND_API

❌ FIREBASE_*
❌ GOOGLE_CLIENT_*
❌ FACEBOOK_CLIENT_*
❌ GITHUB_CLIENT_*

❌ JWT_SECRET
❌ SESSION_SECRET
❌ COOKIE_SECRET
```

### **2. Manter APENAS estas:**
```
✅ VITE_SUPABASE_URL
✅ VITE_SUPABASE_ANON_KEY
✅ (outras específicas do seu negócio, não relacionadas a auth)
```

---

## 🔧 **CONFIGURAÇÕES SUPABASE AUTH**

### **1. URL Settings no Supabase:**
Acesse: `https://supabase.com/dashboard/project/zzugbgoylwbaojdnunuz/auth/settings`

**Site URL:**
```
https://www.appvidasmart.com
```

**Redirect URLs (adicionar todas):**
```
https://www.appvidasmart.com
https://www.appvidasmart.com/
https://www.appvidasmart.com/login
https://www.appvidasmart.com/dashboard
https://www.appvidasmart.com/**
```

### **2. Auth Settings:**
```
✅ Enable email confirmations: OFF (para desenvolvimento)
✅ Enable secure email change: ON  
✅ Double confirm email changes: OFF
✅ JWT expiry: 3600 (1 hora)
✅ Refresh token rotation: ON
✅ Reuse interval: 10
```

### **3. Providers (DESABILITAR SSO):**
Se tentaram configurar SSO, **DESABILITAR todos os providers externos:**
```
❌ Google: OFF
❌ GitHub: OFF  
❌ Facebook: OFF
❌ Apple: OFF
❌ Azure: OFF
❌ Todos outros: OFF
```

**Manter apenas:**
```
✅ Email: ON (auth tradicional)
```

---

## 📱 **VERIFICAÇÃO NO APP**

### **1. Imports no código:**
Verificar se há imports órfãos:
```typescript
// REMOVER se existirem:
import { Auth0Provider } from '@auth0/auth0-react';
import { ClerkProvider } from '@clerk/nextjs';
import { signIn, signOut } from 'next-auth/react';
import { getAuth } from 'firebase/auth';

// MANTER apenas:
import { getSupabase } from '../lib/supabase-singleton';
```

### **2. Providers no App.tsx:**
Remover providers múltiplos:
```typescript
// ANTES (problemático):
<Auth0Provider>
  <ClerkProvider>
    <AuthProvider>
      <App />
    </AuthProvider>
  </ClerkProvider>
</Auth0Provider>

// DEPOIS (correto):
<AuthProvider>
  <App />
</AuthProvider>
```

### **3. Middleware/Scripts de SSO:**
Procurar e remover:
```typescript
// Procurar por arquivos como:
// middleware.ts
// auth-config.js  
// sso-setup.js
// unify-auth.js

// E remover lógica de:
// - Limpeza de localStorage de outros providers
// - Migração de sessões
// - Unificação de contas
```

---

## 🧹 **LIMPEZA DE BROWSER/CACHE**

### **1. Para Desenvolvedores:**
Execute no console do navegador:
```javascript
// Limpeza manual completa
localStorage.clear();
sessionStorage.clear();
indexedDB.databases().then(dbs => {
  dbs.forEach(db => indexedDB.deleteDatabase(db.name));
});

// Limpar caches específicos
caches.keys().then(keys => {
  keys.forEach(key => caches.delete(key));
});
```

### **2. Para Usuários Finais:**
Orientar usuários a:
1. **Ctrl + Shift + R** (hard refresh)
2. **Modo anônimo** para teste
3. **Limpar dados do site** (Chrome: Configurações → Privacidade → Limpar dados)

---

## 🔍 **DETECÇÃO DE CONFLITOS ATIVOS**

### **Script de Diagnóstico:**
Execute no console para verificar conflitos:
```javascript
console.log('🔍 Diagnóstico de Auth Conflicts:');

// Verificar variáveis globais de outros providers
const conflicts = [];

if (window.auth0) conflicts.push('Auth0 detectado');
if (window.Clerk) conflicts.push('Clerk detectado');  
if (window.firebase) conflicts.push('Firebase detectado');
if (window.NextAuth) conflicts.push('NextAuth detectado');

// Verificar localStorage
Object.keys(localStorage).forEach(key => {
  if (key.includes('auth0') || 
      key.includes('clerk') || 
      key.includes('firebase') ||
      key.includes('nextauth')) {
    conflicts.push(`LocalStorage: ${key}`);
  }
});

if (conflicts.length > 0) {
  console.error('❌ Conflitos detectados:', conflicts);
} else {
  console.log('✅ Nenhum conflito de auth detectado');
}

// Verificar Supabase
if (window.supabase || localStorage.getItem('<SUPABASE_AUTH_TOKEN>')) {
  console.log('✅ Supabase detectado corretamente');
} else {
  console.warn('⚠️ Supabase não detectado');
}
```

---

## 🎯 **RESULTADO ESPERADO:**

### **ANTES da limpeza:**
- ❌ Múltiplos sistemas de auth ativos
- ❌ Conflitos de localStorage
- ❌ Sessão Supabase interferindo com outros

### **DEPOIS da limpeza:**  
- ✅ Apenas Supabase ativo
- ✅ localStorage limpo de providers antigos
- ✅ Sessão estável e única
- ✅ Redirecionamentos funcionando

---

## ⚡ **ORDEM DE EXECUÇÃO:**

1. **Limpar Vercel** (remover variáveis conflitantes)
2. **Configurar Supabase** (URLs + desabilitar SSO)
3. **Limpar código** (remover imports + providers antigos)
4. **Redeploy** 
5. **Teste em aba anônima**

**Essa limpeza deve eliminar os resíduos do SSO que estão causando conflito com a sessão Supabase!**