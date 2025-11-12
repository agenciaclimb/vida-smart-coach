# ✅ CHECKLIST DE EXECUÇÃO - PLANO EXCELÊNCIA WHATSAPP

**Início:** 11/11/2025  
**Prazo:** 15/12/2025 (5 semanas)  
**Status:** 🟡 AGUARDANDO APROVAÇÃO

---

## 📋 SEMANA 1 (11-17/11) - FUNDAÇÃO PARTE 1

### Setup Inicial
- [ ] Obter aprovações de stakeholders
- [ ] Criar branch `feature/whatsapp-excellence`
- [ ] Configurar ambiente de testes E2E
- [ ] Setup CI/CD para testes automáticos

### T1.1: Refatorar `processMessageByStage()` ⏱️ 4h
- [ ] Criar interface `ProcessMessageConfig`
- [ ] Substituir 9 parâmetros por objeto
- [ ] Implementar early returns
- [ ] Extrair lógica em funções auxiliares
- [ ] Implementar Strategy pattern para handlers
- [ ] Testes unitários (100% cobertura)
- [ ] Validar SonarQube (0 issues)

### T1.2: Extrair Detecção de Estágios ⏱️ 6h
- [ ] Criar `src/services/stage-detection/`
- [ ] Implementar `StageDetectionService`
- [ ] Criar `PartnerStageDetector`
- [ ] Criar `SellerStageDetector`
- [ ] Criar `SpecialistStageDetector`
- [ ] Criar `SDRStageDetector`
- [ ] Testes unitários (90%+ cobertura)
- [ ] Documentar cada detector

### T1.3: Simplificar Código ⏱️ 2h
- [ ] Substituir ternários aninhados por maps
- [ ] Trocar `forEach` por `for...of`
- [ ] Usar `replaceAll()` ao invés de `replace()`
- [ ] Usar `structuredClone()` ao invés de `JSON.parse(JSON.stringify())`
- [ ] Validar SonarQube (0 ternários aninhados)

### T1.4: Criar Tabela `conversation_memory` ⏱️ 2h
- [ ] Criar migration `20251111_create_conversation_memory.sql`
- [ ] Definir schema com JSONB para entities
- [ ] Criar índices (user_id, updated_at)
- [ ] Configurar RLS policies
- [ ] Aplicar migration em dev
- [ ] Testar inserção/atualização

### T1.5: Extração de Entidades ⏱️ 4h
- [ ] Criar `supabase/functions/conversation-memory/index.ts`
- [ ] Implementar patterns de detecção (goals, pains, emotions)
- [ ] Função `extractEntities()`
- [ ] Função `updateConversationMemory()`
- [ ] Merge inteligente de entidades
- [ ] Testes com casos reais
- [ ] Deploy Edge Function

### T1.6: Integrar Memória no Fluxo ⏱️ 3h
- [ ] Carregar memória antes de processar mensagem
- [ ] Enriquecer contexto da IA com memória
- [ ] Atualizar memória após resposta
- [ ] Teste E2E: verificar se IA lembra informações
- [ ] Validar performance (não degradar latência)

### T1.7: Validação Pré-Resposta ⏱️ 4h
- [ ] Criar `src/services/response-validator/`
- [ ] Implementar `checkForRepeatedQuestions()`
- [ ] Implementar `checkForIgnoredUserResponse()`
- [ ] Implementar `checkForProgressionStall()`
- [ ] Implementar `calculateSimilarity()` (Levenshtein)
- [ ] Integrar no fluxo principal
- [ ] Teste E2E: validar 0% de repetições

**META SEMANA 1:** ✅ Código limpo, memória funcional, validações ativas

---

## 📋 SEMANA 2 (18-24/11) - FUNDAÇÃO PARTE 2

### T1.8: Progressão Forçada ⏱️ 3h
- [ ] Criar `ProgressionTracker` interface
- [ ] Implementar `enforceProgression()`
- [ ] Regras de avanço forçado (tempo, tópicos, frustração)
- [ ] Integrar no fluxo de estágios
- [ ] Teste E2E: validar transições automáticas

### T3.1: Configurar Testes E2E ⏱️ 4h
- [ ] Instalar Jest + Testing Library
- [ ] Criar `WhatsAppSimulator` mock
- [ ] Criar `TestUserFactory`
- [ ] Setup fixtures e helpers
- [ ] Configurar CI para rodar testes
- [ ] Primeiro teste "hello world"

### T3.2: Testes de Jornada (Parcial) ⏱️ 8h
- [ ] Teste: Jornada SDR (primeira mensagem → 4 perguntas SPIN)
- [ ] Teste: Transição SDR → Specialist
- [ ] Teste: Specialist cobre 4 pilares
- [ ] Teste: Transição Specialist → Seller
- [ ] Teste: Seller envia link de cadastro
- [ ] Teste: Partner celebra conquistas
- [ ] Validar 0 loops em todas as jornadas

### T3.5: Testes Anti-Loop ⏱️ 4h
- [ ] Teste: IA não repete perguntas em 10 mensagens
- [ ] Teste: IA reconhece todas as respostas do usuário
- [ ] Teste: Progressão em todos os estágios
- [ ] Teste: Detecção de estagnação funciona
- [ ] Teste: Validação pré-resposta bloqueia repetições
- [ ] Dashboard de métricas de qualidade

**META SEMANA 2:** ✅ Sistema anti-loop completo, testes básicos passando

---

## 📋 SEMANA 3 (25/11-01/12) - ENRIQUECIMENTO PARTE 1

### T2.1: Sistema Proativo ⏱️ 6h
- [ ] Criar `supabase/functions/proactive-engine/`
- [ ] Implementar 8 regras proativas:
  - [ ] Morning Motivation (7-9h)
  - [ ] Workout Reminder (15-30min antes)
  - [ ] Celebrate Streak (múltiplos de 7)
  - [ ] Hydration Reminder (2h+ sem água)
  - [ ] Plan Adjustment (3+ puladas)
  - [ ] Evening Check-in (20-22h)
  - [ ] Reward Opportunity (alto XP)
  - [ ] Rest Day (7+ dias consecutivos)
- [ ] Criar migration `proactive_messages`
- [ ] Integrar no webhook WhatsApp
- [ ] Teste E2E: cada regra dispara corretamente

### T2.2: Cooldown Anti-Spam ⏱️ 2h
- [ ] Implementar limite 3 msgs proativas/dia
- [ ] Cooldown por regra (1h-24h)
- [ ] Respeitar horário de sono (22h-7h)
- [ ] Não enviar se conversa ativa
- [ ] Dashboard de mensagens proativas

### T2.3: Formatação Rica ⏱️ 4h
- [ ] Criar templates de gamificação:
  - [ ] `activity_completed` (XP, nível, streak)
  - [ ] `streak_milestone` (celebração + bônus)
  - [ ] `level_up` (parabéns + novas recompensas)
  - [ ] `reward_available` (lista de recompensas)
- [ ] Função `formatGamificationMessage()`
- [ ] Integrar no fluxo de respostas
- [ ] Teste visual: validar formatação

### T2.4: Celebrações Automáticas ⏱️ 3h
- [ ] Gatilho: Level Up → Confetti + msg especial
- [ ] Gatilho: Streak 7/14/30/60 → Badge + XP bônus
- [ ] Gatilho: Primeira atividade → Encorajamento
- [ ] Gatilho: Meta semanal → Nova meta sugerida
- [ ] Teste E2E: cada celebração dispara

### T2.5: Botões Interativos ⏱️ 5h
- [ ] Pesquisar API Evolution para botões
- [ ] Implementar botões por estágio:
  - [ ] SDR: Diagnóstico, Saber mais
  - [ ] Specialist: 4 pilares
  - [ ] Seller: Testar grátis, Ver planos
  - [ ] Partner: Check-in, Plano, Água, Progresso
- [ ] Função `addQuickActions()`
- [ ] Integrar no webhook WhatsApp
- [ ] Teste manual: clicar cada botão

**META SEMANA 3:** ✅ Proatividade funcional, gamificação rica, botões básicos

---

## 📋 SEMANA 4 (02-08/12) - ENRIQUECIMENTO PARTE 2

### T2.6: Handlers de Ações ⏱️ 6h
- [ ] Criar `supabase/functions/quick-actions/`
- [ ] Implementar handlers:
  - [ ] `handleStartDiagnosis()` → muda estágio
  - [ ] `handleCheckin()` → registra check-in
  - [ ] `handleLogWater()` → incrementa contador
  - [ ] `handleViewTodayPlan()` → resumo do dia
  - [ ] `handleViewProgress()` → estatísticas
  - [ ] `handleAdjustPlan()` → inicia ajuste
  - [ ] `handleViewRewards()` → lista recompensas
  - [ ] `handleRedeemReward()` → processa resgate
- [ ] Teste E2E: cada ação executa corretamente
- [ ] Validar registro no banco

### T3.2: Completar Testes de Jornada ⏱️ 8h
- [ ] Teste: Jornada com ajustes de plano
- [ ] Teste: Jornada com proatividade
- [ ] Teste: Múltiplas sessões com memória
- [ ] Teste: Usuário frustra e IA ajusta
- [ ] Teste: Gamificação em toda jornada
- [ ] Teste: Botões em toda jornada
- [ ] Cobertura E2E: >80%

### T3.3: Testes Edge Cases ⏱️ 4h
- [ ] Teste: Mensagens longas (>1000 chars)
- [ ] Teste: Emojis e caracteres especiais
- [ ] Teste: Mensagens fora de contexto
- [ ] Teste: Usuário cancela ação
- [ ] Teste: Múltiplas mensagens rápidas
- [ ] Teste: Erros de API (retry)
- [ ] Teste: Timeout de rede
- [ ] Teste: Usuário offline/online

### T3.4: Testes de Performance ⏱️ 3h
- [ ] Teste: Latência p95 < 1.5s
- [ ] Teste: Throughput > 100 msgs/min
- [ ] Teste: Memória estável (<500MB)
- [ ] Teste: 10+ msgs consecutivas sem degradação
- [ ] Teste: 100 usuários simultâneos
- [ ] Benchmark comparativo (antes/depois)
- [ ] Identificar gargalos se houver

**META SEMANA 4:** ✅ Ações funcionais, suite de testes completa (90%+)

---

## 📋 SEMANA 5 (09-15/12) - MONITORAMENTO E DEPLOY

### T4.1: Tabela de Métricas ⏱️ 2h
- [ ] Criar migration `conversation_metrics`
- [ ] Schema com métricas (performance, qualidade, engajamento)
- [ ] Índices (user_id, stage, timestamp)
- [ ] RLS policies
- [ ] Aplicar migration em dev/prod

### T4.2: Coleta Automática ⏱️ 3h
- [ ] Criar `supabase/functions/metrics-collector/`
- [ ] Função `collectMetrics()`
- [ ] Pontos de coleta:
  - [ ] Após cada interação
  - [ ] Ao detectar loop/repetição
  - [ ] Ao mudar de estágio
  - [ ] Ao executar ação
- [ ] Teste: validar inserção de métricas
- [ ] Deploy Edge Function

### T4.3: Dashboard Grafana ⏱️ 6h
- [ ] Instalar Grafana + conectar Supabase
- [ ] Painel 1: Performance (latência, throughput, erros)
- [ ] Painel 2: Qualidade (loops, repetições, estagnação)
- [ ] Painel 3: Engajamento (msgs/user, respostas, ações)
- [ ] Painel 4: Conversão (SDR→Specialist→Seller→Partner)
- [ ] Configurar refresh automático (30s)

### T4.4: Alertas Automáticos ⏱️ 3h
- [ ] Configurar alertas críticos:
  - [ ] 🔴 >10 loops/hora → Slack #alerts
  - [ ] 🔴 Latência p95 >3s → Slack + PagerDuty
  - [ ] 🟠 Taxa de erro >5% → Slack
  - [ ] 🟠 >20 repetições/dia → Slack
  - [ ] 🟡 Queda 20% conversão → Email
- [ ] Testar disparo de cada alerta
- [ ] Documentar runbook de resposta

### T3.6: Validação Manual ⏳ 4h
- [ ] Checklist de validação:
  - [ ] Conversa natural (não robótica)
  - [ ] Memória entre sessões
  - [ ] Proatividade no horário
  - [ ] Botões funcionais
  - [ ] Gamificação visível
  - [ ] Celebrações apropriadas
  - [ ] Transições suaves
  - [ ] Ajuste de plano funcional
- [ ] Testar com 5 usuários reais (beta)
- [ ] Coletar feedback qualitativo
- [ ] Ajustes finais se necessário

### Deploy Gradual 🚀
- [ ] Deploy 10% (50-100 usuários)
- [ ] Monitorar 24h (métricas, alertas, feedback)
- [ ] Deploy 50% (500-1000 usuários)
- [ ] Monitorar 48h
- [ ] Deploy 100% (todos os usuários)
- [ ] Comunicação oficial: "Nova Experiência WhatsApp"
- [ ] Post-mortem meeting
- [ ] Documentar lições aprendidas

**META SEMANA 5:** ✅ Monitoramento completo, deploy 100% bem-sucedido

---

## 🎯 MÉTRICAS DE SUCESSO (Checklist Final)

### Técnicas
- [ ] Complexidade cognitiva < 15 (todas as funções)
- [ ] 0 code smells críticos no SonarQube
- [ ] Cobertura de testes > 90%
- [ ] Latência p95 < 1.5s
- [ ] Taxa de loops = 0%
- [ ] Taxa de repetições = 0%

### Experiência
- [ ] NPS > 60
- [ ] Taxa de conclusão onboarding > 80%
- [ ] Engajamento diário > 40%
- [ ] Tempo de resposta usuário < 30s
- [ ] Retenção D7 > 50%

### Conversão
- [ ] SDR → Specialist > 60%
- [ ] Specialist → Seller > 50%
- [ ] Seller → Partner > 30%
- [ ] Conversão total > 9%
- [ ] LTV > R$ 300
- [ ] CAC < R$ 100

---

## 📊 TRACKING DE PROGRESSO

### Semana 1
- [ ] 7 tarefas concluídas
- [ ] Fundação Parte 1: 100%
- [ ] Reunião de checkpoint: sexta 17/11

### Semana 2
- [ ] 4 tarefas concluídas
- [ ] Fundação Parte 2: 100%
- [ ] Reunião de checkpoint: sexta 24/11

### Semana 3
- [ ] 5 tarefas concluídas
- [ ] Enriquecimento Parte 1: 100%
- [ ] Reunião de checkpoint: sexta 01/12

### Semana 4
- [ ] 4 tarefas concluídas
- [ ] Enriquecimento Parte 2: 100%
- [ ] Reunião de checkpoint: sexta 08/12

### Semana 5
- [ ] 5 tarefas concluídas
- [ ] Monitoramento + Deploy: 100%
- [ ] Reunião final: domingo 15/12
- [ ] Celebração do time 🎉

---

## 🚨 CRITÉRIOS DE GO/NO-GO

Antes de avançar para próxima fase, validar:

### Fase 1 → Fase 2
- [ ] 0 code smells críticos
- [ ] Complexidade < 15
- [ ] Memória funcional
- [ ] Validação pré-resposta ativa
- [ ] 0 loops nos testes

### Fase 2 → Fase 3
- [ ] 8 regras proativas funcionando
- [ ] Gamificação visível
- [ ] Botões implementados
- [ ] Handlers de ações testados

### Fase 3 → Deploy
- [ ] Cobertura > 90%
- [ ] 0 bugs críticos
- [ ] Performance < 1.5s
- [ ] QA approval
- [ ] Stakeholders approval

---

## 📞 CONTATOS E RESPONSÁVEIS

- **Tech Lead:** [Nome] - Código e arquitetura
- **QA Lead:** [Nome] - Testes e qualidade
- **UX Designer:** [Nome] - Experiência do usuário
- **Product Owner:** [Nome] - Priorização e aprovações
- **DevOps:** [Nome] - Deploy e monitoramento

---

**🎯 FOCO:** Uma tarefa por vez, qualidade antes de velocidade  
**🚀 LEMA:** "Feito direito da primeira vez"  
**💪 OBJETIVO:** Transformar a experiência WhatsApp do Vida Smart Coach

---

**Criado por:** Agente Autônomo Sênior  
**Data:** 11/11/2025  
**Status:** ✅ PRONTO PARA EXECUÇÃO
