# 🎯 PLANO MESTRE: EXCELÊNCIA NA EXPERIÊNCIA WHATSAPP

**Data de Criação:** 11/11/2025  
**Prioridade:** P0 - ESTRATÉGICO  
**Status:** 📋 PLANEJAMENTO → 🚀 EXECUÇÃO

---

## 🎭 VISÃO ESTRATÉGICA

Transformar o WhatsApp na interface principal do Vida Smart Coach onde **99% das interações acontecem de forma fluida, inteligente e deliciosa**. A IA deve ser uma verdadeira parceira de transformação, não um chatbot genérico.

### PRINCÍPIOS FUNDAMENTAIS

1. **🎭 CONVERSAÇÃO NATURAL:** Eliminar padrões robóticos, loops, repetições
2. **🧠 MEMÓRIA CONTEXTUAL:** IA lembra tudo, nunca perde o fio da conversa
3. **⚡ AÇÃO PROATIVA:** Sugere ações antes do usuário pedir
4. **🎁 GAMIFICAÇÃO INTEGRADA:** Recompensas, conquistas, progresso visível na conversa
5. **🔄 FEEDBACK INSTANTÂNEO:** Toda ação reflete imediatamente no sistema
6. **📊 DADOS ENRIQUECIDOS:** Cada interação melhora o perfil e personalização

---

## 📋 FASE 1: DIAGNÓSTICO E CORREÇÃO CRÍTICA
**Prioridade:** P0  
**Duração:** 1-2 semanas  
**Responsável:** Agente Autônomo + Dev Team

### 1.1. ANÁLISE SONARQUBE E REFATORAÇÃO

**Problemas Identificados:**
- ❌ Complexidade cognitiva alta em 4 funções (27, 21, 24, 18 vs máx 15)
- ❌ 46 issues de qualidade no `ia-coach-chat/index.ts`
- ❌ 9 parâmetros em funções (máx recomendado: 7)
- ❌ Ternários aninhados (dificulta manutenção)
- ❌ Uso de `forEach` ao invés de `for...of` (performance)

**Tarefas:**

#### ✅ T1.1: Refatorar `processMessageByStage()` 
**Complexidade:** 27 → 15  
**Impacto:** Alto  
**Esforço:** 4h

**Abordagem:**
- Converter 9 parâmetros para objeto de configuração
- Implementar early returns
- Extrair lógica em funções auxiliares
- Strategy pattern para handlers de estágio

**Arquivo:** `supabase/functions/ia-coach-chat/index.ts`

```typescript
// ESTRUTURA ALVO
interface ProcessMessageConfig {
  message: string;
  userProfile: UserProfile;
  context: UserContextData;
  stage: ClientStage;
  supabase: SupabaseClient;
  openaiKey: string;
  chatHistory?: ChatMessage[];
  contextPrompt?: string;
  config: StageRuntimeConfig;
}
```

**Critérios de Aceitação:**
- [ ] Complexidade cognitiva < 15
- [ ] Máximo 1 parâmetro (objeto config)
- [ ] Testes unitários com 100% cobertura
- [ ] 0 erros no SonarQube

---

#### ✅ T1.2: Extrair Lógica de Detecção de Estágios
**Complexidade Atual:** Espalhada  
**Impacto:** Médio  
**Esforço:** 6h

**Abordagem:**
- Criar `src/services/stage-detection/`
- Implementar `StageDetectionService` com detectores isolados
- Cada detector implementa interface `StageDetector`
- Sistema de pontuação e confiança

**Estrutura:**
```
src/services/stage-detection/
  ├── index.ts (service principal)
  ├── detectors/
  │   ├── PartnerStageDetector.ts
  │   ├── SellerStageDetector.ts
  │   ├── SpecialistStageDetector.ts
  │   └── SDRStageDetector.ts
  ├── types.ts
  └── __tests__/
      └── stage-detection.test.ts
```

**Critérios de Aceitação:**
- [ ] Detectores isolados e testáveis
- [ ] Cobertura de testes > 90%
- [ ] Métricas de confiança (0-1)
- [ ] Documentação de cada detector

---

#### ✅ T1.3: Simplificar Ternários e Loops
**Impacto:** Baixo (manutenibilidade)  
**Esforço:** 2h

**Mudanças:**
- Substituir ternários aninhados por objetos/maps
- Trocar `forEach` por `for...of`
- Usar `replaceAll()` ao invés de `replace()` com regex
- Usar `structuredClone()` ao invés de `JSON.parse(JSON.stringify())`

**Critérios de Aceitação:**
- [ ] 0 ternários com mais de 2 níveis
- [ ] 0 uso de `forEach()`
- [ ] APIs modernas (replaceAll, structuredClone)

---

### 1.2. SISTEMA DE MEMÓRIA CONTEXTUAL

**Objetivo:** IA nunca esquece informações importantes

**Tarefas:**

#### ✅ T1.4: Criar Tabela `conversation_memory`
**Impacto:** Alto  
**Esforço:** 2h

**Migration:**
```sql
CREATE TABLE conversation_memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  entities JSONB NOT NULL DEFAULT '{}'::jsonb,
  conversation_summary TEXT,
  last_topics TEXT[] DEFAULT ARRAY[]::TEXT[],
  pending_actions TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, session_id)
);

CREATE INDEX idx_conversation_memory_user ON conversation_memory(user_id);
```

**Entidades Armazenadas:**
- `user_goals`: array de objetivos mencionados
- `pain_points`: array de dores relatadas
- `preferences`: objeto com preferências
- `mentioned_activities`: atividades citadas
- `emotional_state`: estado emocional inferido

---

#### ✅ T1.5: Implementar Extração de Entidades
**Impacto:** Alto  
**Esforço:** 4h

**Arquivo:** `supabase/functions/conversation-memory/index.ts`

**Patterns para Detecção:**
```typescript
const PATTERNS = {
  goals: /(quero|preciso|gostaria de)\s+(perder peso|ganhar massa|melhorar)/gi,
  pains: /(dificuldade|problema|não consigo|luto com)\s+(\w+)/gi,
  timeframes: /\b(dias|semanas|meses)\b/gi,
  emotions: /(ansioso|motivado|cansado|frustrado|feliz)/gi,
  restrictions: /(alergia|intolerância|não como|evito)\s+(\w+)/gi,
};
```

**Critérios de Aceitação:**
- [ ] Extrai 5+ tipos de entidades
- [ ] Normaliza texto (acentos, case)
- [ ] Merge inteligente (não duplica)
- [ ] Testes com casos reais

---

#### ✅ T1.6: Integrar Memória no Fluxo da IA
**Impacto:** Alto  
**Esforço:** 3h

**Integração:**
```typescript
// Carregar memória antes de processar
const memory = await loadConversationMemory(userId, supabase);

// Enriquecer contexto
const enrichedContext = `
MEMÓRIA:
Objetivos: ${memory.entities.user_goals.join(', ')}
Dores: ${memory.entities.pain_points.join(', ')}
Preferências: ${JSON.stringify(memory.entities.preferences)}

NÃO PERGUNTE sobre informações já coletadas.
`;

// Atualizar após resposta
await updateConversationMemory(userId, message, aiResponse, supabase);
```

---

### 1.3. ANTI-LOOP E ANTI-REPETIÇÃO

**Objetivo:** Eliminar 100% dos loops e repetições

**Tarefas:**

#### ✅ T1.7: Validação Pré-Resposta
**Impacto:** Crítico  
**Esforço:** 4h

**Arquivo:** `src/services/response-validator/index.ts`

**Validações:**
```typescript
interface ValidationCheck {
  name: string;
  check: (response: string, history: ChatMessage[]) => CheckResult;
  severity: 'error' | 'warning';
}

const CHECKS: ValidationCheck[] = [
  {
    name: 'repeated_question',
    check: checkForRepeatedQuestions,
    severity: 'error',
  },
  {
    name: 'ignored_user_response',
    check: checkForIgnoredUserResponse,
    severity: 'error',
  },
  {
    name: 'progression_stall',
    check: checkForProgressionStall,
    severity: 'warning',
  },
  {
    name: 'contradictions',
    check: checkForContradictions,
    severity: 'warning',
  },
];
```

**Lógica de Similaridade:**
```typescript
function calculateSimilarity(text1: string, text2: string): number {
  // Levenshtein distance + normalização
  const distance = levenshtein(normalize(text1), normalize(text2));
  const maxLen = Math.max(text1.length, text2.length);
  return 1 - (distance / maxLen);
}
```

---

#### ✅ T1.8: Sistema de Progressão Forçada
**Impacto:** Alto  
**Esforço:** 3h

**Rastreamento:**
```typescript
interface ProgressionTracker {
  stage: string;
  substage: number;
  questionsAsked: string[];
  topicsCovered: string[];
  lastProgressAt: string;
  stagnationCount: number;
}
```

**Regras de Avanço Forçado:**
- Mais de 5 minutos no mesmo substágio
- 3+ perguntas sobre o mesmo tópico
- 75% dos tópicos obrigatórios cobertos
- Usuário demonstra frustração

---

## 📋 FASE 2: ENRIQUECIMENTO DA EXPERIÊNCIA
**Prioridade:** P1  
**Duração:** 2 semanas  
**Responsável:** Agente Autônomo + UX Team

### 2.1. PROATIVIDADE CONTEXTUAL

#### ✅ T2.1: Implementar Sistema de Regras Proativas
**Impacto:** Alto  
**Esforço:** 6h

**Arquivo:** `supabase/functions/proactive-engine/index.ts`

**Regras Implementadas:**
1. **Morning Motivation** (7-9h, sem check-in)
2. **Workout Reminder** (15-30min antes)
3. **Celebrate Streak** (múltiplos de 7 dias)
4. **Hydration Reminder** (2h+ sem água)
5. **Plan Adjustment** (3+ atividades puladas)
6. **Evening Check-in** (20-22h)
7. **Reward Opportunity** (XP alto ou milestone)
8. **Rest Day Suggestion** (7+ dias consecutivos)

**Migration:**
```sql
CREATE TABLE proactive_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  rule TEXT NOT NULL,
  message TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_response TEXT,
  response_at TIMESTAMPTZ
);
```

---

#### ✅ T2.2: Cooldown e Anti-Spam
**Impacto:** Médio  
**Esforço:** 2h

**Lógica:**
- Máximo 3 mensagens proativas/dia
- Cooldown por regra (variável: 1h a 24h)
- Respeitar horário de sono (22h-7h)
- Não enviar se usuário está em conversa ativa

---

### 2.2. GAMIFICAÇÃO VISÍVEL NO WHATSAPP

#### ✅ T2.3: Formatação Rica de Mensagens
**Impacto:** Alto  
**Esforço:** 4h

**Templates:**
```typescript
const GAMIFICATION_TEMPLATES = {
  activity_completed: `
✅ *Atividade concluída!*

🎯 +{xp_earned} XP
⚡ Nível {level} | {progress}% para próximo
🔥 {streak} dias seguidos

{level_up_celebration}
{new_badge_announcement}
  `,
  
  streak_milestone: `
🔥 *{streak} DIAS DE STREAK!* 🔥

Você está IMPARÁVEL! 💪

🎁 Bônus: +{bonus_xp} XP
📊 Total: {total_xp} XP
  `,
  
  level_up: `
🎊 *LEVEL UP!* 🎊

Você subiu para o *Nível {new_level}*!

🆕 Novas recompensas desbloqueadas
🎁 Veja o que você pode resgatar agora
  `,
};
```

---

#### ✅ T2.4: Celebrações Automáticas
**Impacto:** Médio  
**Esforço:** 3h

**Gatilhos:**
- Level Up → Confetti + mensagem especial
- Streak milestone (7, 14, 30, 60 dias) → Badge + XP bônus
- Primeira atividade completada → Mensagem de encorajamento
- Meta semanal atingida → Celebração + sugestão de nova meta

---

### 2.3. AÇÕES RÁPIDAS VIA BOTÕES

#### ✅ T2.5: Implementar Botões Interativos
**Impacto:** Alto  
**Esforço:** 5h

**API Evolution:** Lista de botões por estágio

**Botões por Estágio:**

**SDR:**
- 🎯 Fazer diagnóstico
- ℹ️ Saber mais
- 📞 Falar com humano

**Specialist:**
- 🏋️ Falar sobre físico
- 🥗 Falar sobre alimentação
- 🧠 Falar sobre emocional
- ✨ Falar sobre espiritual

**Seller:**
- 🆓 Testar grátis 7 dias
- 💎 Ver planos
- ❓ Tirar dúvidas

**Partner:**
- ✅ Fazer check-in
- 📋 Ver plano hoje
- 💧 Registrar água
- 📊 Ver progresso
- 🎁 Ver recompensas

---

#### ✅ T2.6: Handlers de Ações
**Impacto:** Alto  
**Esforço:** 6h

**Arquivo:** `supabase/functions/quick-actions/index.ts`

**Ações Implementadas:**
```typescript
const ACTION_HANDLERS = {
  START_DIAGNOSIS: handleStartDiagnosis,
  DO_CHECKIN: handleCheckin,
  LOG_WATER: handleLogWater,
  VIEW_TODAY_PLAN: handleViewTodayPlan,
  VIEW_PROGRESS: handleViewProgress,
  ADJUST_PLAN: handleAdjustPlan,
  VIEW_REWARDS: handleViewRewards,
  REDEEM_REWARD: handleRedeemReward,
};
```

**Respostas:**
- Ação executada no banco
- Confirmação visual
- Próxima ação sugerida

---

## 📋 FASE 3: TESTES ABRANGENTES
**Prioridade:** P0  
**Duração:** 1 semana  
**Responsável:** QA + Agente Autônomo

### 3.1. SUITE DE TESTES E2E

#### ✅ T3.1: Configurar Ambiente de Testes
**Impacto:** Crítico  
**Esforço:** 4h

**Ferramentas:**
- Jest + Testing Library
- WhatsApp Simulator (mock)
- Supabase Test Client
- Faker.js (dados)

**Estrutura:**
```
tests/
  ├── e2e/
  │   ├── whatsapp-journey.test.ts
  │   ├── stage-transitions.test.ts
  │   ├── gamification.test.ts
  │   └── proactive-messages.test.ts
  ├── integration/
  │   ├── conversation-memory.test.ts
  │   ├── stage-detection.test.ts
  │   └── quick-actions.test.ts
  ├── unit/
  │   ├── validators.test.ts
  │   ├── formatters.test.ts
  │   └── utils.test.ts
  └── helpers/
      ├── WhatsAppSimulator.ts
      ├── TestUserFactory.ts
      └── fixtures.ts
```

---

#### ✅ T3.2: Testes de Jornada Completa
**Impacto:** Crítico  
**Esforço:** 8h

**Cenários:**

**Jornada Feliz - Novo Usuário:**
1. Primeira mensagem → SDR acolhe
2. 4 perguntas SPIN → Avança para Specialist
3. Diagnóstico 4 pilares → Planos gerados
4. Aceita teste grátis → Seller envia link
5. Cadastro → Partner inicia
6. Primeira atividade → Gamificação

**Jornada com Ajustes:**
1. Usuário ativo reclama de plano
2. Specialist coleta feedback
3. Plano regenerado automaticamente
4. Confirmação → Volta para Partner

**Jornada com Proatividade:**
1. Usuário sem check-in matinal
2. IA envia lembrete 8h
3. Usuário responde → Check-in registrado
4. IA celebra streak

---

#### ✅ T3.3: Testes de Edge Cases
**Impacto:** Alto  
**Esforço:** 4h

**Casos:**
- Mensagens muito longas (>1000 chars)
- Emojis e caracteres especiais
- Mensagens fora de contexto
- Usuário cancelando ação
- Múltiplas mensagens rápidas
- Erros de API
- Timeout de rede
- Usuário offline/online

---

#### ✅ T3.4: Testes de Performance
**Impacto:** Alto  
**Esforço:** 3h

**Métricas:**
- Latência < 1.5s (p95)
- Throughput > 100 msgs/min
- Memória estável (<500MB)
- 10+ mensagens consecutivas sem degradação

---

#### ✅ T3.5: Testes de Anti-Loop
**Impacto:** Crítico  
**Esforço:** 4h

**Validações:**
- 0 perguntas repetidas em 10 mensagens
- Reconhecimento de respostas do usuário
- Progressão em todos os estágios
- Detecção de estagnação

---

### 3.2. TESTES MANUAIS

#### ✅ T3.6: Checklist de Validação Manual
**Impacto:** Alto  
**Esforço:** 4h

**Checklist:**
- [ ] Conversa natural (não robótica)
- [ ] Memória funcionando entre sessões
- [ ] Proatividade no horário certo
- [ ] Botões interativos funcionais
- [ ] Gamificação visível
- [ ] Celebrações apropriadas
- [ ] Transições de estágio suaves
- [ ] Ajuste de plano funcional

---

## 📋 FASE 4: MONITORAMENTO E MÉTRICAS
**Prioridade:** P1  
**Duração:** Contínuo  
**Responsável:** DevOps + Data Team

### 4.1. DASHBOARD DE MÉTRICAS

#### ✅ T4.1: Criar Tabela `conversation_metrics`
**Impacto:** Alto  
**Esforço:** 2h

**Schema:**
```sql
CREATE TABLE conversation_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  session_id TEXT NOT NULL,
  stage TEXT NOT NULL,
  
  -- Performance
  response_time_ms INTEGER NOT NULL,
  tokens_used INTEGER,
  
  -- Qualidade
  loop_detected BOOLEAN DEFAULT false,
  repetition_detected BOOLEAN DEFAULT false,
  
  -- Engajamento
  messages_exchanged INTEGER NOT NULL,
  user_initiated BOOLEAN NOT NULL,
  action_taken BOOLEAN DEFAULT false,
  action_type TEXT,
  
  -- Progressão
  stage_changed BOOLEAN DEFAULT false,
  new_stage TEXT,
  topics_covered TEXT[],
  
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_metrics_user ON conversation_metrics(user_id, timestamp DESC);
CREATE INDEX idx_metrics_stage ON conversation_metrics(stage, timestamp DESC);
CREATE INDEX idx_metrics_quality ON conversation_metrics(loop_detected, repetition_detected);
```

---

#### ✅ T4.2: Implementar Coleta Automática
**Impacto:** Alto  
**Esforço:** 3h

**Arquivo:** `supabase/functions/metrics-collector/index.ts`

**Pontos de Coleta:**
- Após cada interação
- Ao detectar problema (loop/repetição)
- Ao mudar de estágio
- Ao executar ação

---

#### ✅ T4.3: Dashboard Grafana
**Impacto:** Médio  
**Esforço:** 6h

**Painéis:**
1. **Performance**
   - Latência média/p95/p99
   - Throughput (msgs/min)
   - Taxa de erro

2. **Qualidade**
   - Loops detectados/dia
   - Repetições detectadas/dia
   - Taxa de progressão travada

3. **Engajamento**
   - Mensagens por usuário/dia
   - Taxa de resposta
   - Ações executadas

4. **Conversão**
   - SDR → Specialist
   - Specialist → Seller
   - Seller → Partner

---

### 4.2. ALERTAS AUTOMÁTICOS

#### ✅ T4.4: Configurar Alertas Críticos
**Impacto:** Alto  
**Esforço:** 3h

**Alertas:**
- 🔴 **Crítico:** >10 loops/hora
- 🔴 **Crítico:** Latência p95 > 3s
- 🟠 **Alto:** Taxa de erro > 5%
- 🟠 **Alto:** >20 repetições/dia
- 🟡 **Médio:** Queda de 20% em conversão

**Canais:**
- Slack #alerts-ia-coach
- Email (on-call)
- PagerDuty (críticos)

---

## 📊 CRONOGRAMA DE EXECUÇÃO

### **Semana 1 (11-17/11) - Fundação**
- [ ] T1.1: Refatorar `processMessageByStage` (4h)
- [ ] T1.2: Extrair detecção de estágios (6h)
- [ ] T1.3: Simplificar código (2h)
- [ ] T1.4: Criar tabela memória (2h)
- [ ] T1.5: Extração de entidades (4h)
- [ ] T1.6: Integrar memória (3h)
- [ ] T1.7: Validação pré-resposta (4h)

**Total:** 25h  
**Entregas:** Código limpo, memória funcional, validações ativas

---

### **Semana 2 (18-24/11) - Anti-Loop + Testes Básicos**
- [ ] T1.8: Progressão forçada (3h)
- [ ] T3.1: Configurar testes (4h)
- [ ] T3.2: Testes de jornada (8h - parcial)
- [ ] T3.5: Testes anti-loop (4h)

**Total:** 19h  
**Entregas:** Sistema anti-loop completo, testes básicos

---

### **Semana 3 (25/11-01/12) - Enriquecimento**
- [ ] T2.1: Sistema proativo (6h)
- [ ] T2.2: Cooldown anti-spam (2h)
- [ ] T2.3: Formatação rica (4h)
- [ ] T2.4: Celebrações (3h)
- [ ] T2.5: Botões interativos (5h)

**Total:** 20h  
**Entregas:** Proatividade + Gamificação WhatsApp

---

### **Semana 4 (02-08/12) - Ações + Testes**
- [ ] T2.6: Handlers de ações (6h)
- [ ] T3.2: Completar testes jornada (8h)
- [ ] T3.3: Testes edge cases (4h)
- [ ] T3.4: Testes performance (3h)

**Total:** 21h  
**Entregas:** Ações funcionais, suite completa de testes

---

### **Semana 5 (09-15/12) - Monitoramento + Deploy**
- [ ] T4.1: Tabela de métricas (2h)
- [ ] T4.2: Coleta automática (3h)
- [ ] T4.3: Dashboard Grafana (6h)
- [ ] T4.4: Alertas (3h)
- [ ] T3.6: Validação manual (4h)
- [ ] Deploy gradual (10% → 50% → 100%)

**Total:** 18h  
**Entregas:** Monitoramento completo, deploy em produção

---

## 📊 MÉTRICAS DE SUCESSO

### **KPIs Técnicos**
| Métrica | Baseline | Meta | Status |
|---------|----------|------|--------|
| Complexidade cognitiva | 27 | <15 | ⏳ |
| Code smells críticos | 46 | 0 | ⏳ |
| Cobertura de testes | 30% | >90% | ⏳ |
| Latência p95 | 2.5s | <1.5s | ⏳ |
| Taxa de loops | 5% | 0% | ⏳ |
| Taxa de repetições | 10% | 0% | ⏳ |

### **KPIs de Experiência**
| Métrica | Baseline | Meta | Status |
|---------|----------|------|--------|
| NPS | 45 | >60 | ⏳ |
| Taxa de conclusão onboarding | 60% | >80% | ⏳ |
| Engajamento diário | 25% | >40% | ⏳ |
| Tempo de resposta usuário | 45s | <30s | ⏳ |
| Retenção D7 | 35% | >50% | ⏳ |

### **KPIs de Conversão**
| Funil | Baseline | Meta | Status |
|-------|----------|------|--------|
| SDR → Specialist | 50% | >60% | ⏳ |
| Specialist → Seller | 40% | >50% | ⏳ |
| Seller → Partner | 20% | >30% | ⏳ |
| CAC | R$ 150 | <R$ 100 | ⏳ |
| LTV | R$ 200 | >R$ 300 | ⏳ |

---

## 🚨 RISCOS E MITIGAÇÕES

### **Risco 1: Refatoração Quebrar Funcionalidades**
**Probabilidade:** Média  
**Impacto:** Alto  
**Mitigação:**
- Testes abrangentes antes e depois
- Deploy gradual com rollback
- Feature flags para novas features

### **Risco 2: Performance Degradar com Novas Features**
**Probabilidade:** Baixa  
**Impacto:** Médio  
**Mitigação:**
- Benchmark em cada PR
- Testes de carga contínuos
- Profiling de código crítico

### **Risco 3: Usuários Não Adotarem Botões**
**Probabilidade:** Baixa  
**Impacto:** Baixo  
**Mitigação:**
- A/B testing (com vs sem botões)
- Educação gradual dos usuários
- Botões + texto livre (híbrido)

### **Risco 4: Memória Contextual Consumir Muito Storage**
**Probabilidade:** Média  
**Impacto:** Baixo  
**Mitigação:**
- Limite de 30 dias de histórico
- Compressão de dados antigos
- Arquivamento após inatividade

---

## 🎯 PRÓXIMOS PASSOS IMEDIATOS

### **Esta Semana (11-17/11)**
1. ✅ Criar este plano mestre
2. ⏳ Aprovar com stakeholders
3. ⏳ Configurar ambiente de testes
4. ⏳ Iniciar T1.1: Refatoração de `processMessageByStage`
5. ⏳ Iniciar T1.4: Tabela de memória

### **Próxima Semana (18-24/11)**
1. Completar refatorações críticas (T1.1-T1.3)
2. Implementar memória contextual completa (T1.4-T1.6)
3. Implementar validações anti-loop (T1.7)
4. Executar primeiros testes E2E

### **Mês 1 (Novembro)**
- ✅ Fundação sólida: código limpo, testes, anti-loop
- ✅ Deploy gradual das melhorias
- ✅ Coletar feedback inicial
- ✅ Ajustes baseados em dados

### **Mês 2 (Dezembro)**
- ✅ Enriquecimento: proatividade, gamificação, ações rápidas
- ✅ Otimização de performance
- ✅ A/B testing de experiências
- ✅ Expansão gradual (100% usuários)

### **Mês 3 (Janeiro/2026)**
- ✅ Lançamento oficial da "Nova Experiência WhatsApp"
- ✅ Monitoramento contínuo e iterações
- ✅ Análise de impacto em métricas de negócio
- ✅ Planejamento da Fase 2 (features avançadas)

---

## 📚 RECURSOS E REFERÊNCIAS

### **Documentação Técnica**
- [SonarQube Quickfixes](./SONARQUBE_QUICKFIXES.md)
- [Validação E2E Rewards](../VALIDACAO_E2E_REWARDS.md)
- [Guia Deploy Fase 5.1](../GUIA_DEPLOY_FASE_5_1.md)

### **Arquivos Críticos**
- `supabase/functions/ia-coach-chat/index.ts` - Lógica principal da IA
- `supabase/functions/evolution-webhook/index.ts` - Integração WhatsApp
- `supabase/functions/generate-plan/index.ts` - Geração de planos

### **Ferramentas**
- SonarQube Cloud: https://sonarcloud.io/project/overview?id=agenciaclimb_vida-smart-coach
- Grafana Dashboard: (a configurar)
- Sentry: (a configurar)

---

## ✅ APROVAÇÕES

| Stakeholder | Role | Status | Data |
|-------------|------|--------|------|
| Product Owner | Aprovação final | ⏳ | - |
| Tech Lead | Viabilidade técnica | ⏳ | - |
| UX Designer | Experiência do usuário | ⏳ | - |
| QA Lead | Estratégia de testes | ⏳ | - |

---

**STATUS:** 📋 AGUARDANDO APROVAÇÃO  
**CRIADO POR:** Agente Autônomo Sênior  
**DATA:** 11/11/2025  
**VERSÃO:** 1.0  
**PRÓXIMA REVISÃO:** 18/11/2025
