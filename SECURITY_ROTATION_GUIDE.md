# 🔐 Guia de Rotação de Credenciais

**Status**: Procedimento recomendado  
**Data**: 22 de outubro de 2025  
**Prioridade**: P0 (Segurança)

---

## 📋 Contexto

Este guia orienta como rotacionar credenciais comprometidas **sem expor segredos no repositório**. 

⚠️ **IMPORTANTE**: Nunca coloque valores reais neste arquivo. Use apenas placeholders genéricos como `<NEW_KEY>` ou `<ROTATED_VALUE>`.

---

## 🔐 Categorias de Credenciais

### 1. **SUPABASE** (CRÍTICO)
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_DB_PASSWORD`

**Impacto**: Acesso total ao banco de dados, RLS bypass, leitura/escrita de todos os dados

### 2. **OPENAI** (CRÍTICO)
- `OPENAI_API_KEY`

**Impacto**: Uso não autorizado da API, custos inesperados

### 3. **GOOGLE** (ALTO)
- `GOOGLE_API_KEY`

**Impacto**: Uso não autorizado de serviços Google, custos

### 4. **EVOLUTION API / WhatsApp** (ALTO)
- `EVOLUTION_API_KEY`
- `EVOLUTION_API_SECRET`
- `EVOLUTION_API_TOKEN`
- `EVOLUTION_INSTANCE_ID`
- `EVOLUTION_WEBHOOK_TOKEN`

**Impacto**: Envio não autorizado de mensagens WhatsApp, acesso a conversas

### 5. **STRIPE** (CRÍTICO)
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

**Impacto**: Acesso a pagamentos, criação de charges, reembolsos não autorizados

### 6. **VERCEL** (ALTO)
- `VERCEL_TOKEN`

**Impacto**: Deploy não autorizado, acesso a variáveis de ambiente

### 7. **NEXTAUTH** (MÉDIO)
- `NEXTAUTH_SECRET`
- `NEXT_PUBLIC_AGENT_KEY`

**Impacto**: Falsificação de sessões, acesso não autorizado

---

## ✅ Processo de Rotação (3 Fases)

### Fase 1: Rotação Imediata (Críticos - Fazer AGORA)

#### 1.1 SUPABASE Service Role Key
1. Acesse o dashboard do projeto Supabase
2. Navegue para Settings → API
3. Em "Service role key", clique em "Reset"
4. Copie a nova chave
5. Atualize em `.env.local` (local)
6. Atualize na Vercel → Environment Variables
7. Redeploy da aplicação

#### 1.2 SUPABASE Database Password
1. Acesse Settings → Database
2. Clique em "Reset database password"
3. Copie a nova senha
4. Atualize em `.env.local` (local)

#### 1.3 STRIPE Secret Key
1. Acesse: https://dashboard.stripe.com/apikeys
2. Em "Secret key", clique em "Roll key"
3. Copie a nova chave
4. Atualize em `.env.local` (local)
5. Atualize na Vercel → Environment Variables
6. Redeploy da aplicação

#### 1.4 STRIPE Webhook Secret
1. Acesse: https://dashboard.stripe.com/webhooks
2. Encontre o webhook para produção
3. Clique em "Roll secret"
4. Copie o novo secret
5. Atualize na Vercel → Environment Variables
6. Redeploy da aplicação

---

### Fase 2: APIs de Terceiros (Dentro de 24h)

#### 2.1 OPENAI API Key
1. Acesse: https://platform.openai.com/api-keys
2. Revogue a chave antiga
3. Crie uma nova chave
4. Atualize em `.env.local` (local)
5. Atualize na Vercel → Environment Variables
6. Redeploy da aplicação

#### 2.2 GOOGLE API Key
1. Acesse: https://console.cloud.google.com/apis/credentials
2. Delete a chave antiga
3. Crie uma nova chave com as mesmas restrições
4. Atualize em `.env.local` (local)
5. Atualize na Vercel → Environment Variables
6. Redeploy da aplicação

#### 2.3 EVOLUTION API Tokens
1. Acesse seu painel da Evolution API
2. Revogue/recrie as credenciais da instância
3. Atualize **todas** as variáveis `EVOLUTION_*` em `.env.local`
4. Atualize na Vercel → Environment Variables
5. Redeploy da aplicação

---

### Fase 3: Infraestrutura (Dentro de 48h)

#### 3.1 VERCEL Token
1. Acesse: https://vercel.com/account/tokens
2. Revogue o token antigo
3. Crie um novo token
4. Atualize em `.env.local` (local)
5. Atualize em pipelines/integrações se aplicável

#### 3.2 NEXTAUTH Secret
1. Gere um novo secret forte:
   ```bash
   openssl rand -base64 32
   ```
2. Atualize `NEXTAUTH_SECRET` em `.env.local`
3. Atualize na Vercel → Environment Variables
4. Redeploy da aplicação

#### 3.3 NEXT_PUBLIC_AGENT_KEY
1. Gere uma nova chave forte (senha aleatória segura)
2. Atualize `NEXT_PUBLIC_AGENT_KEY` em `.env.local`
3. Atualize na Vercel → Environment Variables
4. Redeploy da aplicação

---

## 🔧 Como Atualizar Variáveis na Vercel

### Via Dashboard
1. Acesse as configurações do projeto
2. Vá em Environment Variables
3. Encontre a variável que deseja atualizar
4. Clique em "..." → "Edit"
5. Cole o novo valor
6. Salve e faça redeploy

### Via CLI
```bash
# Remover variável antiga
vercel env rm NOME_DA_VARIAVEL production

# Adicionar nova variável
vercel env add NOME_DA_VARIAVEL production
# (será solicitado o valor)

# Redeploy
vercel --prod
```

---

## ⚠️ Checklist Pós-Rotação

### Testes Locais
- [ ] Teste local com as novas chaves
- [ ] Verifique se não há erros no console
- [ ] Teste funcionalidades críticas localmente

### Deploy e Validação
- [ ] Deploy para produção realizado
- [ ] Aguarde build e deploy completarem

### Testes em Produção
- [ ] Login funciona corretamente
- [ ] Checkboxes salvam e atualizam XP
- [ ] Gráficos de progresso carregam
- [ ] Webhook WhatsApp responde
- [ ] Sistema de pagamentos Stripe funciona
- [ ] IA Coach responde via WhatsApp/Web

### Monitoramento
- [ ] Monitore logs por 24-48h
- [ ] Verifique erros relacionados a autenticação
- [ ] Confirme que não há tentativas de uso das chaves antigas

---

## 📊 Comandos de Validação

```bash
# 1. Teste Supabase (substitua <NEW_ANON_KEY>)
curl https://your-project.supabase.co/rest/v1/user_profiles \
  -H "apikey: <NEW_ANON_KEY>" \
  -H "Authorization: Bearer <NEW_ANON_KEY>"

# 2. Teste OpenAI (substitua <NEW_OPENAI_KEY>)
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer <NEW_OPENAI_KEY>"

# 3. Teste Stripe (substitua <NEW_STRIPE_KEY>)
curl https://api.stripe.com/v1/customers \
  -u <NEW_STRIPE_KEY>:
```

---

## 🆘 Troubleshooting

### App não funciona após rotação
**Sintomas**: Erros 401, 403 ou falhas de autenticação

**Soluções**:
1. Verifique se **TODAS** as variáveis foram atualizadas na Vercel
2. Confirme que o redeploy foi concluído com sucesso
3. Faça redeploy forçado: `vercel --prod --force`
4. Limpe cache do navegador e tente novamente

### Webhook WhatsApp não responde
**Sintomas**: Mensagens não são processadas

**Soluções**:
1. Verifique se as credenciais Evolution API foram atualizadas
2. Teste o endpoint de webhook manualmente
3. Verifique logs da Edge Function
4. Confirme que a instância Evolution está ativa

### Erro de autenticação Supabase
**Sintomas**: "Invalid JWT" ou "Invalid API key"

**Soluções**:
1. Confirme que RLS está usando a nova Service Role Key
2. Verifique se a ANON_KEY foi atualizada no frontend
3. Limpe cache do navegador
4. Faça logout/login novamente

### Stripe webhooks falhando
**Sintomas**: Eventos não são processados

**Soluções**:
1. Verifique se o webhook secret foi atualizado
2. Teste o endpoint de webhook manualmente
3. Confirme que a URL do webhook está correta
4. Verifique logs no dashboard do Stripe

---

## 📝 Log de Execução

Marque conforme executa cada fase:

### Fase 1 (Críticos)
- [ ] Iniciada em: ____/____/____ às ____:____
- [ ] SUPABASE Service Role Key rotacionada
- [ ] SUPABASE Database Password rotacionada
- [ ] STRIPE Secret Key rotacionada
- [ ] STRIPE Webhook Secret rotacionado
- [ ] Concluída em: ____/____/____ às ____:____

### Fase 2 (APIs Terceiros)
- [ ] Iniciada em: ____/____/____ às ____:____
- [ ] OPENAI API Key rotacionada
- [ ] GOOGLE API Key rotacionada
- [ ] EVOLUTION API Tokens rotacionados
- [ ] Concluída em: ____/____/____ às ____:____

### Fase 3 (Infraestrutura)
- [ ] Iniciada em: ____/____/____ às ____:____
- [ ] VERCEL Token rotacionado
- [ ] NEXTAUTH Secret rotacionado
- [ ] NEXT_PUBLIC_AGENT_KEY rotacionado
- [ ] Concluída em: ____/____/____ às ____:____

### Validação Final
- [ ] Testes locais OK em: ____/____/____
- [ ] Deploy produção OK em: ____/____/____
- [ ] Testes produção OK em: ____/____/____
- [ ] Monitoramento 24h OK em: ____/____/____

---

## 🔒 Boas Práticas de Segurança

1. **Nunca commite credenciais reais**
   - Use sempre `.env.local` para desenvolvimento
   - Mantenha `.env.example` apenas com placeholders
   - Adicione `.env*` ao `.gitignore` (exceto `.env.example`)

2. **Use placeholders seguros em documentação**
   - ❌ Ruim: `sk-live-51abc123...`
   - ✅ Bom: `<STRIPE_SECRET_KEY>`

3. **Rotação preventiva**
   - Considere rotacionar chaves a cada 90 dias
   - Rotacione imediatamente se houver suspeita de exposição
   - Documente todas as rotações

4. **Monitoramento**
   - Configure alertas para falhas de autenticação
   - Monitore uso de APIs para detectar anomalias
   - Revise logs regularmente

5. **Acesso restrito**
   - Limite quem tem acesso às credenciais
   - Use diferentes chaves para dev/staging/prod
   - Implemente princípio do menor privilégio

---

**⚠️ OBSERVAÇÕES IMPORTANTES**:
- Este arquivo é seguro para commit pois contém apenas placeholders
- Nunca adicione valores reais de chaves aqui
- Se precisar documentar valores reais, use um gerenciador de senhas externo
- Em caso de exposição confirmada, trate todas as chaves como comprometidas
