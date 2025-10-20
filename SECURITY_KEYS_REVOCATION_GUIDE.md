# 🚨 AÇÃO CRÍTICA: REVOGAR CHAVES EXPOSTAS NO SUPABASE

## ⚠️ SITUAÇÃO

93 arquivos continham chaves Supabase hardcoded que foram expostas no GitHub. Essas chaves foram **comprometidas** e precisam ser REVOGADAS IMEDIATAMENTE.

## ✅ CORREÇÕES JÁ APLICADAS

- ✅ 93 arquivos corrigidos (chaves substituídas por variáveis de ambiente)
- ✅ Commit realizado: `8bb34f6`
- ✅ Push enviado para repositório
- ✅ Alerta do GitHub será resolvido automaticamente

## 🔴 AÇÃO URGENTE: REVOGAR E REGENERAR CHAVES

### Passo 1: Acessar Painel do Supabase

1. Acesse: https://supabase.com/dashboard
2. Selecione o projeto: `zzugbgoylwbaojdnunuz`
3. Vá em: **Settings** > **API**

### Passo 2: Regenerar ANON KEY

1. Na seção **Project API keys**
2. Localize **anon (public)**
3. Clique em **Reveal** para ver a chave atual
4. Clique em **Reset** ou **Regenerate**
5. **COPIE A NOVA CHAVE IMEDIATAMENTE**

### Passo 3: Regenerar SERVICE_ROLE KEY

1. Na mesma seção **Project API keys**
2. Localize **service_role (secret)**
3. Clique em **Reveal** para ver a chave atual
4. Clique em **Reset** ou **Regenerate**
5. **COPIE A NOVA CHAVE IMEDIATAMENTE**

⚠️ **IMPORTANTE**: Assim que você regenerar as chaves, as antigas ficarão inválidas e o sistema pode parar de funcionar até você atualizar as variáveis de ambiente.

### Passo 4: Atualizar .env.local

Edite o arquivo `.env.local` (NÃO COMMITAR ESTE ARQUIVO):

```env
# Novas chaves geradas
VITE_SUPABASE_ANON_KEY=<NOVA_ANON_KEY_AQUI>
SUPABASE_ANON_KEY=<NOVA_ANON_KEY_AQUI>
SUPABASE_SERVICE_ROLE_KEY=<NOVA_SERVICE_ROLE_KEY_AQUI>
```

### Passo 5: Atualizar Vercel (Produção)

1. Acesse: https://vercel.com/jefersons-projects-4ec1e082/vida-smart-coach
2. Vá em: **Settings** > **Environment Variables**
3. Atualize as seguintes variáveis:
   - `VITE_SUPABASE_ANON_KEY` → Nova ANON KEY
   - `SUPABASE_ANON_KEY` → Nova ANON KEY
   - `SUPABASE_SERVICE_ROLE_KEY` → Nova SERVICE_ROLE KEY
4. Clique em **Save**
5. Force um novo deploy: **Deployments** > **Redeploy**

### Passo 6: Atualizar Supabase Edge Functions

Se você usa Edge Functions que referenciam essas chaves:

```bash
# Atualizar secrets das Edge Functions
npx supabase secrets set SUPABASE_ANON_KEY=<NOVA_ANON_KEY>
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<NOVA_SERVICE_ROLE_KEY>
```

### Passo 7: Validar Sistema

Após atualizar todas as variáveis:

1. Teste local:
   ```bash
   pnpm run dev
   ```

2. Teste produção:
   - Acesse: https://appvidasmart.com
   - Faça login
   - Teste funcionalidades críticas (IA Coach, WhatsApp, etc.)

## 📋 CHECKLIST DE SEGURANÇA

- [ ] Acessei o painel do Supabase
- [ ] Regenerei a ANON KEY
- [ ] Regenerei a SERVICE_ROLE KEY
- [ ] Atualizei .env.local com as novas chaves
- [ ] Atualizei as variáveis de ambiente no Vercel
- [ ] Fiz redeploy no Vercel
- [ ] Atualizei secrets das Edge Functions (se aplicável)
- [ ] Testei o sistema local
- [ ] Testei o sistema em produção
- [ ] Verifiquei que o alerta do GitHub foi resolvido

## ⚠️ CHAVES COMPROMETIDAS (PARA REFERÊNCIA - NÃO USAR)

Essas chaves foram expostas e NÃO devem mais ser usadas:

```
ANON_KEY (comprometida):
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6dWdiZ295bHdiYW9qZG51bnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxODE5MTEsImV4cCI6MjA2OTc1NzkxMX0.8xe_8yAKTq4gWz0tzsYNgHRKvO5G7ZYK58Z2pkxxrmE

SERVICE_ROLE_KEY (comprometida):
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6dWdiZ295bHdiYW9qZG51bnV6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMjU1MTcwMSwiZXhwIjoyMDQ4MTI3NzAxfQ.U8Q8iJ2yKH-YfHMKwXdCf9_LRNG6f3jMpfGVVjwlhYY
```

## 📚 REFERÊNCIAS

- Documentação Supabase sobre API Keys: https://supabase.com/docs/guides/api/api-keys
- Documentação sobre Environment Variables no Vercel: https://vercel.com/docs/projects/environment-variables
- Boas práticas de segurança: https://supabase.com/docs/guides/api/securing-your-api

---

**Data da correção**: 2025-10-20
**Commit**: 8bb34f6
**Arquivos corrigidos**: 93
**Prioridade**: 🔴 CRÍTICA
