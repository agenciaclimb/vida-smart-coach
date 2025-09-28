# 🚀 Guia de Deploy no Vercel - Vida Smart Coach

## 📋 Pré-requisitos

### 1. Variáveis de Ambiente Obrigatórias no Vercel
Configure estas variáveis no Vercel Dashboard:

```env
VITE_SUPABASE_URL=https://zzugbgoylwbaojdnunuz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6dWdiZ295bHdiYW9qZG51bnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxODE5MTEsImV4cCI6MjA2OTc1NzkxMX0.8xe_8yAKTq4gWz0tzsYNgHRKvO5G7ZYK58Z2pkxxrmE
VITE_FUNCTIONS_ENABLED=true
```

### 2. Configuração de URLs no Supabase

Acesse o Supabase Dashboard e configure:

**Authentication → URL Configuration:**
- **Site URL:** `https://your-vercel-app.vercel.app` (substitua pela URL real)
- **Redirect URLs:**
  ```
  https://your-vercel-app.vercel.app/auth/callback
  http://localhost:3000/auth/callback
  ```

## 🔧 Processo de Deploy

### 1. Conectar Repositório
1. Acesse [vercel.com](https://vercel.com)
2. Clique em "New Project"
3. Conecte o repositório `agenciaclimb/vida-smart-coach`
4. Selecione a branch `main`

### 2. Configuração do Build
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### 3. Configurar Variáveis de Ambiente
No Vercel Dashboard → Project Settings → Environment Variables:
- Adicione todas as variáveis listadas acima
- Certifique-se de que estão disponíveis para "Production", "Preview" e "Development"

### 4. Deploy
- Clique em "Deploy"
- Aguarde o build completar
- Teste a aplicação na URL fornecida

## 🔍 Validação Pós-Deploy

### ✅ Checklist de Funcionalidades

1. **Cadastro de Usuário:**
   - [ ] Novo usuário consegue se registrar sem erro 500
   - [ ] E-mail de confirmação é enviado
   - [ ] Perfil de usuário é criado automaticamente

2. **Login:**
   - [ ] Login funciona com redirecionamento para dashboard
   - [ ] Sessão é mantida após refresh da página
   - [ ] Logout funciona corretamente

3. **Verificação de E-mail:**
   - [ ] Link de confirmação funciona sem erro 403
   - [ ] Redirecionamento após confirmação funciona
   - [ ] Não há loops de redirecionamento

4. **Guards de Autenticação:**
   - [ ] Páginas protegidas redirecionam para login quando não autenticado
   - [ ] Usuário logado é redirecionado do login para dashboard
   - [ ] ReturnURL funciona após login

## 🚨 Resolução de Problemas

### Erro 500 no Cadastro
1. Verificar se as migrações do Supabase foram aplicadas
2. Executar a migração `20250909000000_final_auth_fix.sql` no Supabase
3. Verificar logs da Edge Function no Supabase Dashboard

### Erro 403 na Verificação de E-mail
1. Verificar se as URLs de redirect estão corretas no Supabase
2. Verificar se o componente `EmailVerifyGuard` está funcionando
3. Checar logs do navegador para erros de token

### Loops de Redirecionamento
1. Limpar localStorage e sessionStorage
2. Verificar se `AuthRedirection` não está conflitando
3. Verificar configuração de cookies/sessão

### Build Fails no Vercel
1. Verificar se todas as dependências estão no `package.json`
2. Verificar se as variáveis de ambiente estão configuradas
3. Checar logs de build no Vercel Dashboard

## 📝 Comandos Úteis

```bash
# Testar build local
npm run build
npm run preview

# Verificar variáveis de ambiente
echo $VITE_SUPABASE_URL

# Limpar cache
npm clean-cache --force
```

## 🔗 Links Importantes

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Supabase Dashboard:** https://supabase.com/dashboard
- **Repositório:** https://github.com/agenciaclimb/vida-smart-coach
- **Documentação Vercel:** https://vercel.com/docs
- **Documentação Supabase:** https://supabase.com/docs

---

**Última atualização:** 09/09/2025  
**Status:** ✅ Configurações implementadas e testadas