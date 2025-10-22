# 🚨 ROTEIRO CRÍTICO DE ROTAÇÃO DE CHAVES

**Status**: ⚠️ AÇÃO IMEDIATA NECESSÁRIA  
**Data**: 22 de outubro de 2025  
**Prioridade**: P0 (Crítica de Segurança)

---

## 📋 Contexto

Múltiplas chaves de API e tokens foram expostos no repositório através de arquivos `.env` commitados. Embora esses arquivos tenham sido removidos do repositório, as chaves expostas **devem ser consideradas comprometidas** e **DEVEM ser rotacionadas imediatamente**.

---

## 🔐 Chaves Comprometidas que DEVEM ser Rotacionadas

### 1. **SUPABASE** (CRÍTICO)
- ❌ `SUPABASE_SERVICE_ROLE_KEY`: `sb_secret_F3H...REDACTED`
- ❌ `SUPABASE_ANON_KEY`: `eyJhbGciOiJIUzI1NiI...REDACTED`
- ❌ `SUPABASE_ACCESS_TOKEN`: `sbp_a1b8110d9a32...REDACTED`
- ❌ `SUPABASE_DB_PASSWORD`: `[REDACTED]`

**Impacto**: Acesso total ao banco de dados, RLS bypass, leitura/escrita de todos os dados

### 2. **OPENAI** (CRÍTICO)
- ❌ `OPENAI_API_KEY`: `sk-proj-PIcYjlNBKZS...REDACTED`

**Impacto**: Uso não autorizado da API, custos inesperados

### 3. **GOOGLE** (ALTO)
- ❌ `GOOGLE_API_KEY`: `AIzaSyAzQDjarpj...REDACTED`

**Impacto**: Uso não autorizado de serviços Google, custos

### 4. **EVOLUTION API / WhatsApp** (ALTO)
- ❌ `EVOLUTION_API_KEY`: `bad6ff73-1582-...REDACTED`
- ❌ `EVOLUTION_API_SECRET`: `C26C953E32F6...REDACTED`
- ❌ `EVOLUTION_API_TOKEN`: `C26C953E32F6...REDACTED`
- ❌ `EVOLUTION_INSTANCE_ID`: `d8cfea03-bf0f...REDACTED`
- ❌ `EVOLUTION_WEBHOOK_TOKEN`: `C26C953E32F6...REDACTED`

**Impacto**: Envio não autorizado de mensagens WhatsApp, acesso a conversas

### 5. **STRIPE** (CRÍTICO)
- ❌ `STRIPE_SECRET_KEY`: `sk_live_51OmPLv...REDACTED`
- ❌ `STRIPE_WEBHOOK_SECRET`: `whsec_ShzORaVlj...REDACTED`

**Impacto**: Acesso a pagamentos, criação de charges, reembolsos não autorizados

### 6. **VERCEL** (ALTO)
- ❌ `VERCEL_TOKEN`: `d84VvbmjafzM...REDACTED`

**Impacto**: Deploy não autorizado, acesso a variáveis de ambiente

### 7. **NEXTAUTH** (MÉDIO)
- ❌ `NEXTAUTH_SECRET`: `DwxtnpSM+5O+c8N...REDACTED`
- ❌ `NEXT_PUBLIC_AGENT_KEY`: `ag3nt_ADMIN...REDACTED`

**Impacto**: Falsificação de sessões, acesso não autorizado

---

## ✅ Checklist de Rotação (na ordem)

### Fase 1: Rotação Imediata (Fazer AGORA)

- [ ] **1.1 SUPABASE Service Role Key**
  1. Acesse: https://supabase.com/dashboard/project/zzugbgoylwbaojdnunuz/settings/api
  2. Em "Service role key", clique em "Reset"
  3. Copie a nova chave
  4. Atualize em `.env.local` local
  5. Atualize na Vercel (Environment Variables)

- [ ] **1.2 SUPABASE Database Password**
  1. Acesse: https://supabase.com/dashboard/project/zzugbgoylwbaojdnunuz/settings/database
  2. Clique em "Reset database password"
  3. Copie a nova senha
  4. Atualize em `.env.local` local

- [ ] **1.3 STRIPE Secret Key**
  1. Acesse: https://dashboard.stripe.com/apikeys
  2. Em "Secret key", clique em "Roll key"
  3. Copie a nova chave
  4. Atualize em `.env.local` local
  5. Atualize na Vercel (Environment Variables)

- [ ] **1.4 STRIPE Webhook Secret**
  1. Acesse: https://dashboard.stripe.com/webhooks
  2. Encontre o webhook para produção
  3. Clique em "Roll secret"
  4. Copie o novo secret
  5. Atualize na Vercel (Environment Variables)

### Fase 2: APIs de Terceiros (Dentro de 24h)

- [ ] **2.1 OPENAI API Key**
  1. Acesse: https://platform.openai.com/api-keys
  2. Revogue a chave antiga: `sk-proj-PIcYjlNBKZS...`
  3. Crie uma nova chave
  4. Atualize em `.env.local` local
  5. Atualize na Vercel (Environment Variables)

- [ ] **2.2 GOOGLE API Key**
  1. Acesse: https://console.cloud.google.com/apis/credentials
  2. Encontre a chave `AIzaSyAzQDjarpj...`
  3. Delete a chave antiga
  4. Crie uma nova chave
  5. Atualize em `.env.local` local
  6. Atualize na Vercel (Environment Variables)

- [ ] **2.3 EVOLUTION API Tokens**
  1. Acesse seu painel da Evolution API
  2. Revogue/recrie as credenciais da instância `d8cfea03-bf0f...`
  3. Atualize todas as variáveis `EVOLUTION_*` em `.env.local`
  4. Atualize na Vercel (Environment Variables)

### Fase 3: Infraestrutura (Dentro de 48h)

- [ ] **3.1 VERCEL Token**
  1. Acesse: https://vercel.com/account/tokens
  2. Revogue o token `d84VvbmjafzM...`
  3. Crie um novo token
  4. Atualize em `.env.local` local

- [ ] **3.2 NEXTAUTH Secret**
  1. Gere um novo secret: `openssl rand -base64 32`
  2. Atualize `NEXTAUTH_SECRET` em `.env.local`
  3. Atualize na Vercel (Environment Variables)

- [ ] **3.3 NEXT_PUBLIC_AGENT_KEY**
  1. Gere uma nova chave forte (senha aleatória)
  2. Atualize `NEXT_PUBLIC_AGENT_KEY` em `.env.local`
  3. Atualize na Vercel (Environment Variables)

---

## 🔧 Como Atualizar na Vercel

```bash
# Via CLI (recomendado)
vercel env rm SUPABASE_SERVICE_ROLE_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production

# Via Dashboard
# 1. Acesse: https://vercel.com/agenciaclimb/vida-smart-coach/settings/environment-variables
# 2. Encontre a variável
# 3. Clique em "..." -> "Edit"
# 4. Cole o novo valor
# 5. Salve e redeploy
```

---

## ⚠️ Após a Rotação

- [ ] Teste local com as novas chaves
- [ ] Deploy para produção
- [ ] Teste em produção:
  - [ ] Login funciona
  - [ ] Checkboxes salvam
  - [ ] Gráficos carregam
  - [ ] Webhook WhatsApp responde
  - [ ] Pagamentos Stripe funcionam

- [ ] Monitore logs por 24-48h para erros relacionados a autenticação

---

## 📊 Validação Final

Execute este checklist após a rotação:

```bash
# 1. Teste Supabase
curl https://zzugbgoylwbaojdnunuz.supabase.co/rest/v1/user_profiles \
  -H "apikey: <NEW_ANON_KEY>" \
  -H "Authorization: Bearer <NEW_ANON_KEY>"

# 2. Teste OpenAI
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer <NEW_OPENAI_KEY>"

# 3. Teste Stripe
curl https://api.stripe.com/v1/customers \
  -u <NEW_STRIPE_KEY>:

# 4. Acesse a aplicação e faça login
# 5. Complete uma atividade (checkbox)
# 6. Envie mensagem WhatsApp e receba resposta IA
```

---

## 🆘 Em Caso de Problemas

1. **App não funciona após rotação**: 
   - Verifique se TODAS as variáveis foram atualizadas na Vercel
   - Faça redeploy forçado: `vercel --prod --force`

2. **Webhook WhatsApp não responde**:
   - Verifique se as credenciais Evolution API foram atualizadas
   - Teste o endpoint: `/functions/v1/evolution-webhook`

3. **Erro de autenticação Supabase**:
   - Confirme que RLS está usando a nova Service Role Key
   - Limpe cache do navegador

---

## 📝 Log de Execução

Marque aqui conforme executa:

- [ ] Fase 1 iniciada em: ____/____/____
- [ ] Fase 1 concluída em: ____/____/____
- [ ] Fase 2 iniciada em: ____/____/____
- [ ] Fase 2 concluída em: ____/____/____
- [ ] Fase 3 iniciada em: ____/____/____
- [ ] Fase 3 concluída em: ____/____/____
- [ ] Validação final OK em: ____/____/____

---

**⚠️ LEMBRETE FINAL**: Não commite este arquivo após preencher com as novas chaves. Mantenha apenas o template.
