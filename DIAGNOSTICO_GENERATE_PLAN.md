# DIAGNÓSTICO: generate-plan Edge Function Timeout

**Data:** 04/12/2025  
**Status:** 🔴 CRÍTICO - Timeout constante (>10s)  
**Protocolo:** HOTFIX PROTOCOL 1.0 - Seção 4.2 (Diagnóstico da causa raiz)

---

## 🔍 CAUSA RAIZ IDENTIFICADA

### Problema Principal: Prompts Extremamente Longos

A Edge Function `generate-plan` está enviando **prompts gigantescos** para a OpenAI API:

1. **Prompt Physical:** ~200 linhas de JSON estruturado detalhado
2. **Prompt Nutritional:** ~150 linhas com 4 semanas completas
3. **Prompt Emotional:** ~100 linhas com técnicas detalhadas
4. **Prompt Spiritual:** ~100 linhas com práticas diárias

**Modelo usado:** `gpt-4o-mini`

### Análise de Tempo

```
Tempo esperado: < 5s
Tempo real: > 10s (TIMEOUT)
Latência média outras functions: ~1.2s
```

### Fatores Contribuintes

1. **Tokens excessivos no prompt** (estimativa: 3.000-5.000 tokens)
2. **response_format: json_object** força estrutura rígida (mais lento)
3. **Temperature 0.4** (baixa, mas não é o problema principal)
4. **4 tipos de planos diferentes** (physical, nutritional, emotional, spiritual)
5. **Feedbacks pendentes** adicionam mais contexto ao prompt

### Por que está demorando?

- OpenAI API leva mais tempo para gerar JSON estruturado complexo
- Prompts longos aumentam tempo de processamento
- gpt-4o-mini é rápido, mas JSON complexo adiciona overhead
- Feedback loops adicionam contexto extra ao prompt

---

## 💡 SOLUÇÕES POSSÍVEIS (Ordenadas por Impacto/Esforço)

### ✅ SOLUÇÃO 1: Simplificar Prompts (RÁPIDO - 20 min)

**Impacto:** ALTO  
**Esforço:** BAIXO  
**Risco:** BAIXO

**Ação:**
- Reduzir exemplos JSON de 4 semanas para 2 semanas
- Remover repetições e instruções redundantes
- Manter apenas diretrizes essenciais
- Reduzir de ~200 linhas para ~100 linhas

**Estimativa de redução:** 40-50% no tempo de resposta

---

### ✅ SOLUÇÃO 2: Aumentar Timeout da Edge Function (IMEDIATO - 2 min)

**Impacto:** MÉDIO (alivia sintoma, não resolve causa)  
**Esforço:** MUITO BAIXO  
**Risco:** BAIXO

**Ação:**
```typescript
// No arquivo index.ts, adicionar timeout configurado
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s ao invés de 10s

const response = await fetch("https://api.openai.com/v1/chat/completions", {
  signal: controller.signal,
  // ... resto
});
clearTimeout(timeoutId);
```

**Estimativa:** Permite função completar sem timeout (não otimiza velocidade)

---

### ⚠️ SOLUÇÃO 3: Dividir em Micro-Gerações (MÉDIO - 1h)

**Impacto:** MUITO ALTO  
**Esforço:** ALTO  
**Risco:** MÉDIO

**Ação:**
- Gerar estrutura básica primeiro (5-7s)
- Enriquecer com detalhes em segunda chamada (5-7s)
- Total: 10-14s, mas mais confiável

**Problema:** Adiciona complexidade

---

### ⚠️ SOLUÇÃO 4: Streaming Response (COMPLEXO - 2-3h)

**Impacto:** ALTO  
**Esforço:** MUITO ALTO  
**Risco:** ALTO

**Ação:**
- Usar `stream: true` na OpenAI API
- Processar JSON incrementalmente
- Requer refatoração significativa

**Problema:** Frontend precisa lidar com streaming

---

## 🎯 RECOMENDAÇÃO IMEDIATA

### Aplicar SOLUÇÃO 1 + SOLUÇÃO 2 em paralelo

**Plano de Ação:**

1. **[2 min]** Aumentar timeout para 25s (workaround temporário)
2. **[20 min]** Simplificar todos os 4 prompts (physical, nutritional, emotional, spiritual)
3. **[10 min]** Testar localmente com `curl` simulando chamada real
4. **[5 min]** Deploy e validar com health check

**Tempo total:** ~40 minutos  
**Redução esperada:** De >10s para ~5-7s (dentro do aceitável)

---

## 📊 VALIDAÇÃO

### Antes da correção:
```bash
📡 Testando generate-plan... ❌ TIMEOUT (10013ms)
```

### Depois da correção (esperado):
```bash
📡 Testando generate-plan... ✅ 200 (5000-7000ms)
```

### Critérios de Sucesso:
- ✅ Latência < 8s
- ✅ Taxa de sucesso > 95%
- ✅ JSON válido retornado
- ✅ Planos mantêm qualidade (4 semanas, exercícios completos)

---

## 🚨 PRÓXIMOS PASSOS (Protocolo 4.3)

1. Criar branch: `hotfix/generate-plan-timeout`
2. Implementar SOLUÇÃO 1 + 2
3. Testar localmente
4. Deploy controlado
5. Validar com health check
6. Atualizar #update_log

---

**Status:** DIAGNÓSTICO COMPLETO - PRONTO PARA CORREÇÃO
