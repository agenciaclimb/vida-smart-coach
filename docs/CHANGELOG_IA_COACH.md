# Changelog - IA Coach System

## Histórico de Alterações da Integração IA Coach + WhatsApp

### 2025-10-22 - Documentação de Regras Críticas
**Tipo:** Documentação  
**Autor:** Sistema (pós-incidentes recorrentes)

**Mudanças:**
- Criado seção 3.3 no Documento Mestre com regras críticas de configuração
- Documentado fluxo completo WhatsApp → Evolution API → IA Coach
- Especificado regras de normalização de telefone (problema recorrente)
- Documentado sistema de anti-duplicação de mensagens
- Definido checklist de validação pós-deploy
- Criado template de commit para mudanças em IA Coach

**Motivação:**
Após múltiplos incidentes de desconfigurações causando downtime da IA no WhatsApp.

**Impacto:**
- Prevenção de erros recorrentes
- Processo claro de validação antes/após mudanças
- Redução de tempo de diagnóstico em falhas

---

### 2025-10-15 - Correção de Normalização de Telefone
**Tipo:** Bugfix  
**Commit:** `fix(evolution-webhook): corrige normalização de telefone`

**Problema:**
Usuários cadastrados não sendo identificados, recebendo mensagens genéricas.

**Causa Raiz:**
Normalização inconsistente entre formato WhatsApp (`+5516981459950@s.whatsapp.net`) e banco (`5516981459950`).

**Solução:**
```typescript
function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9]/g, "");
}
```

**Validação:**
- Testes com 5 usuários reais
- Taxa de identificação: 0% → 100%

---

### 2025-10-10 - Sistema de Detecção de Emergências
**Tipo:** Feature  
**Commit:** `feat(ia-coach): adiciona detecção de emergências`

**Implementação:**
- Keywords: suicid, morrer, acabar com tudo, machucar
- Resposta automática com CVV 188
- Log em tabela separada para follow-up

**Testes:**
- 10 cenários de teste com frases de emergência
- Latência adicional: < 50ms
- Nenhum falso negativo em testes

---

### 2025-10-05 - Anti-Duplicação de Mensagens
**Tipo:** Feature  
**Commit:** `feat(evolution-webhook): implementa cache de mensagens`

**Problema:**
Evolution API enviando webhooks duplicados, IA respondendo 2x.

**Solução:**
In-memory cache com TTL de 5min, baseado em `data.key.id`.

**Impacto:**
- Duplicatas: 15% → 0%
- Melhor experiência do usuário

---

### 2025-09-20 - Migração para gpt-4o-mini
**Tipo:** Otimização  
**Commit:** `perf(ia-coach): migra de gpt-4 para gpt-4o-mini`

**Motivação:**
Redução de custos sem perda significativa de qualidade.

**Resultados:**
- Custo por interação: -70%
- Latência média: 2.8s → 1.9s
- Qualidade (user feedback): 4.2/5 → 4.1/5 (aceitável)

**Validação:**
- 100 conversas comparativas (A/B test)
- Aprovação da equipe após 2 semanas de monitoramento

---

## Template para Novas Entradas

```markdown
### YYYY-MM-DD - Título da Mudança
**Tipo:** [Feature/Bugfix/Otimização/Documentação]  
**Commit:** `tipo(escopo): descrição`

**Problema/Motivação:**
[Descrever o que motivou a mudança]

**Solução/Implementação:**
[Descrever como foi resolvido]

**Validação:**
- [x] Testes automatizados
- [x] Testes manuais
- [x] Monitoramento de 24h

**Impacto:**
[Métricas de antes/depois]
```

---

## Métricas Atuais (Outubro 2025)

**Performance:**
- Latência média: 1.9s
- Taxa de erro: < 0.5%
- Uptime: 99.8%

**Qualidade:**
- User satisfaction: 4.1/5
- Taxa de identificação: 100%
- Duplicatas: 0%

**Custos:**
- Custo por interação: $0.003
- Custo mensal (5000 interações): ~$15
