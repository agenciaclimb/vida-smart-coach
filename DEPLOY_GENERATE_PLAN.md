# INSTRUÇÕES DE DEPLOY - generate-plan (HOTFIX)

**Branch:** `hotfix/generate-plan-timeout`  
**Commit:** `e7c8355`  
**Data:** 04/12/2025  
**Protocolo:** HOTFIX PROTOCOL 1.0 - Seção 4.4 (Deploy Controlado)

---

## ⚠️ DEPLOY MANUAL NECESSÁRIO

Edge Function `generate-plan` foi otimizada para resolver timeout crítico (>10s).

### MUDANÇAS APLICADAS:
1. ✅ Prompts simplificados (redução 70% tokens)
2. ✅ Timeout 25s adicionado na chamada OpenAI
3. ✅ Testes passando localmente
4. ✅ Lint + TypeCheck OK
5. ✅ Secret scan limpo

---

## 🚀 PROCEDIMENTO DE DEPLOY

### OPÇÃO 1: Via Supabase CLI (Requer Docker)

```bash
# Iniciar Docker Desktop
# Aguardar inicialização completa

# Deploy
npx supabase functions deploy generate-plan

# Verificar deploy
npx supabase functions list
```

### OPÇÃO 2: Via Dashboard Supabase (RECOMENDADO)

#### Passo 1: Acessar Dashboard
1. Ir para: https://supabase.com/dashboard/project/zzugbgoylwbaojdnunuz
2. Menu lateral: **Edge Functions**
3. Localizar função: **generate-plan**

#### Passo 2: Atualizar Código
1. Clicar em **generate-plan**
2. Aba **Code**
3. Copiar código completo do arquivo local: `supabase/functions/generate-plan/index.ts`
4. Colar no editor online
5. Clicar **Save** ou **Deploy**

#### Passo 3: Verificar Environment Variables
Confirmar que essas variáveis estão configuradas:
- ✅ `OPENAI_API_KEY`
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`

---

## ✅ VALIDAÇÃO PÓS-DEPLOY

### 1. Health Check Imediato (< 1 min após deploy)

```bash
node scripts/health-check-functions.mjs
```

**Resultado esperado:**
```
📡 Testando generate-plan... ✅ 200 (5000-7000ms)
```

**Critérios de sucesso:**
- ✅ Status code: 200
- ✅ Latência: < 8s
- ✅ Sem erros no response

---

### 2. Teste Manual (se health check falhar)

```bash
# Windows PowerShell
$headers = @{
  "Authorization" = "Bearer SEU_ANON_KEY_AQUI"
  "Content-Type" = "application/json"
}

$body = @{
  userId = "UUID_USUARIO_TESTE"
  planType = "physical"
} | ConvertTo-Json

Measure-Command {
  $response = Invoke-RestMethod -Uri "https://zzugbgoylwbaojdnunuz.supabase.co/functions/v1/generate-plan" -Method POST -Headers $headers -Body $body
  $response | ConvertTo-Json
}
```

**Validar:**
- [ ] Tempo de resposta < 8s
- [ ] JSON válido retornado
- [ ] Plano com 4 semanas
- [ ] Exercícios completos (5-7 por treino)

---

### 3. Monitoramento (10 min pós-deploy)

#### Logs Supabase:
1. Dashboard > **Logs** > **Edge Functions**
2. Filtrar por: `generate-plan`
3. Buscar por erros nos últimos 10 min

#### Métricas esperadas:
- ✅ Taxa de sucesso: > 95%
- ✅ P50 latência: ~5s
- ✅ P95 latência: < 8s
- ✅ Sem erros 500

---

## 🔄 ROLLBACK (Se necessário)

Se deploy causar problemas:

```bash
# Via CLI
npx supabase functions deploy generate-plan --version VERSAO_ANTERIOR

# Via Dashboard
1. Edge Functions > generate-plan
2. Aba "Deployments"
3. Selecionar versão anterior
4. Clicar "Restore"
```

---

## 📊 CRITÉRIOS "GREEN STATE"

Antes de considerar deploy concluído:

### Técnico:
- [x] Código commitado (e7c8355)
- [x] Testes passando localmente
- [ ] Deploy executado com sucesso
- [ ] Health check passando (3/3 functions)

### Funcional:
- [ ] generate-plan respondendo < 8s
- [ ] Planos sendo gerados corretamente
- [ ] JSON válido em todas respostas
- [ ] Feedbacks sendo processados

### Monitoramento:
- [ ] Logs sem erros nos primeiros 10 min
- [ ] 5+ testes manuais bem-sucedidos
- [ ] Latência P95 < 8s

---

## 📝 PRÓXIMOS PASSOS

Após deploy bem-sucedido:

1. Atualizar #update_log no Documento Mestre
2. Merge branch `hotfix/generate-plan-timeout` → `main`
3. Notificar equipe da correção
4. Continuar com validação completa pós-deploy (WhatsApp, IA, etc)

---

**Status:** AGUARDANDO DEPLOY MANUAL
