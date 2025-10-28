# ✅ CHECKLIST DE IMPLEMENTAÇÃO - Roadmap UX/Gamificação

**Projeto:** Vida Smart Coach  
**Início:** 23/10/2025  
**Owner:** JE  

---

## 🔴 SPRINT 1: Quick Wins (23/10 - 06/11)

### Semana 1 (23-29/10)

#### 🗂️ Database & Backend
- [x] Criar migration `create_plan_completions_table.sql` ✅ (20251023)
- [x] Testar migration localmente ✅
- [x] Deploy migration no Supabase produção ✅
- [x] Criar RLS policies para `plan_completions` ✅
- [x] Validar policies com usuário teste ✅

#### 🎣 Hooks & Utils
- [x] Criar `src/hooks/usePlanCompletions.js` ✅
- [x] Implementar `toggleCompletion` function ✅
- [x] Implementar `getProgress` function ✅
- [x] Adicionar toast notifications ✅
- [x] Integrar com `useGamification` (addDailyActivity) ✅

#### 🎨 Componentes UI
- [x] Criar `src/components/ui/CompletionCheckbox.jsx` ✅ (Ciclo 28)
- [x] Adicionar animações com framer-motion ✅
- [x] Criar `src/components/ui/ProgressCard.jsx` ✅ (CompletionProgress)
- [x] Implementar trend indicators (up/down/stable) ✅
- [x] Criar `src/components/client/OverallProgressDashboard.jsx` ✅ (DashboardTab)

#### 🔌 Integração com Planos
- [x] Integrar checkboxes em `PhysicalPlanDisplay` ✅
- [x] Integrar checkboxes em `NutritionalPlanDisplay` ✅
- [x] Integrar checkboxes em `EmotionalPlanDisplay` ✅
- [x] Integrar checkboxes em `SpiritualPlanDisplay` ✅
- [x] Adicionar progress bar em cada display ✅

#### 🧪 Testes
- [x] Testar marcar/desmarcar checkbox ✅
- [x] Validar pontos sendo gerados corretamente ✅
- [x] Verificar persistência no banco ✅
- [x] Testar progress % em cada plano ✅
- [x] Validar dashboard agregado ✅

---

### Semana 2 (30/10 - 06/11)

#### 🎭 Animações
- [x] Instalar `framer-motion` e `canvas-confetti` ✅
- [x] Criar `src/utils/confetti.js` ✅ (Ciclo 28)
- [x] Implementar confete ao completar missão ✅
- [x] Criar `AnimatedMissionCard.jsx` ✅ (CompletionCheckbox)
- [ ] Implementar `AnimatedCounter` component ⚠️ (rollback por bug)

#### 🔥 Streak Counter
- [x] Criar query de check-ins consecutivos ✅
- [x] Implementar `src/components/client/StreakCounter.jsx` ✅ (Ciclo 27)
- [x] Adicionar animação de chama proporcional ✅
- [x] Criar badges de milestone (7, 14, 30, 90 dias) ✅
- [x] Implementar alerta de risco de quebra ✅

#### 🎨 Visual Polish
- [ ] Atualizar design tokens (padding, spacing) ⏳
- [ ] Implementar gradientes contextuais ⏳
- [ ] Melhorar hierarquia tipográfica ⏳
- [ ] Padronizar border-radius ⏳
- [ ] Revisar responsividade mobile ⏳

#### 🚀 Deploy & Validação
- [x] Build local sem erros ✅
- [x] Commit changes (git) ✅ (a1fc9ca, 14563a7)
- [x] Push para GitHub ✅
- [x] Deploy Vercel produção ✅
- [ ] Validar em produção com usuário real 🔄 (pós-hotfix)
- [ ] Coletar feedback inicial ⏳

---

## 🟡 SPRINT 2: Recompensas (07/11 - 20/11)

### Semana 3 (07-13/11)

#### 🗂️ Database Recompensas
- [ ] Criar migration `create_rewards_system.sql`
- [ ] Tabela `rewards` (name, category, cost_xp, tier_required)
- [ ] Tabela `user_rewards` (redemptions)
- [ ] RLS policies para ambas tabelas
- [ ] Seed de recompensas (20+ items)

#### ⚙️ Backend Logic
- [ ] Criar RPC `deduct_user_xp`
- [ ] Implementar validação de XP suficiente
- [ ] Sistema de stock management
- [ ] Logs de transações de XP
- [ ] Tabela de auditoria (opcional)

#### 🏪 UI Loja de Recompensas
- [ ] Criar `src/components/client/RewardsStore.jsx`
- [ ] Header com saldo de XP
- [ ] Filtros por categoria
- [ ] Grid de recompensas
- [ ] Dialog de confirmação de resgate
- [ ] Integração com backend

---

### Semana 4 (14-20/11)

#### 🏅 Sistema de Badges
- [ ] Criar tabela `user_badges`
- [ ] Implementar lógica de unlock automático
- [ ] Badge display component
- [ ] Coleção de badges no perfil
- [ ] Notificação ao desbloquear

#### 🦸 Narrativa de Jornada
- [ ] Definir tiers (Aprendiz → Inspiração)
- [ ] Implementar cálculo de tier por nível
- [ ] UI de tier atual + progresso
- [ ] Lista de benefícios por tier
- [ ] Unlock de features por tier

#### 🧪 Testes & Validação
- [ ] Testar resgate de recompensa
- [ ] Validar dedução de XP
- [ ] Verificar badges desbloqueando
- [ ] Testar tier progression
- [ ] Deploy produção

---

## 🟡 SPRINT 3: Social & Desafios (21/11 - 04/12)

### Semana 5 (21-27/11)

#### 🎯 Sistema de Desafios
- [ ] Criar tabela `challenges`
- [ ] Tabela `user_challenges` (participação)
- [ ] Tipos de desafio (semanal, mensal, sazonal)
- [ ] Lógica de progresso de desafio
- [ ] UI de desafios ativos

#### 👥 Círculos Sociais
- [ ] Criar tabela `social_circles`
- [ ] Tabela `circle_members` (até 5 por grupo)
- [ ] Lógica de convite
- [ ] Ranking privado do círculo
- [ ] Feed de conquistas do grupo

---

### Semana 6 (28/11 - 04/12)

#### 🎨 UI Social
- [ ] Componente `ChallengeCard`
- [ ] Dashboard de desafios ativos
- [ ] Leaderboard do círculo
- [ ] Feed de atividades
- [ ] Sistema de notificações sociais

#### 🧪 Testes Finais
- [ ] Testar desafio completo end-to-end
- [ ] Validar círculos sociais
- [ ] Verificar rankings
- [ ] Deploy produção
- [ ] Coletar métricas (DAU/MAU, NPS)

---

## 🟢 SPRINT 4-7: Inovações (05/12 - 01/01)

### Features Principais
- [ ] IA preditiva (análise de padrões)
- [ ] Radar Chart dos 4 pilares
- [ ] Heatmap de consistência (365 dias)
- [ ] Relatório mensal PDF
- [ ] Integração Apple Health
- [ ] Integração Google Fit
- [ ] Hub comunitário (feed público)
- [ ] Sistema de mentoria

*(Detalhamento será feito conforme progressão)*

---

## 📊 MARCOS E VALIDAÇÕES

### Marco 1: Sprint 1 Completo (06/11)
**Critérios:**
- [ ] Checkboxes funcionais em 4 planos
- [ ] Pontos sendo gerados corretamente
- [ ] Progress tracking visual operacional
- [ ] Confete e animações funcionando
- [ ] Engajamento diário aumentou 20%+

### Marco 2: Sprint 2 Completo (20/11)
**Critérios:**
- [ ] Loja de recompensas operacional
- [ ] >50% usuários visitaram a loja
- [ ] >20% fizeram primeiro resgate
- [ ] Sistema de badges funcionando
- [ ] NPS aumentou +5 pontos

### Marco 3: Sprint 3 Completo (04/12)
**Critérios:**
- [ ] Desafios semanais ativos
- [ ] >60% participação em desafios
- [ ] Círculos sociais operacionais
- [ ] Engajamento diário 35%+
- [ ] Churn 30d reduzido para 30%

### Marco 4: Roadmap Completo (01/01/2026)
**Critérios:**
- [ ] Todas features dos 3 níveis implementadas
- [ ] DAU/MAU atingiu 40%
- [ ] Sessão média 12min+
- [ ] Churn reduzido para 25%
- [ ] NPS atingiu 57+

---

## 🚨 BLOCKERS E DEPENDÊNCIAS

### Dependências Técnicas
- [ ] Supabase CLI instalado
- [ ] framer-motion instalado
- [ ] canvas-confetti instalado
- [ ] recharts instalado (para gráficos)
- [ ] Variáveis de ambiente configuradas

### Dependências de Negócio
- [ ] Definição de recompensas (quais oferecer)
- [ ] Precificação em XP (economia do sistema)
- [ ] Regras de desafios (temas, frequência)
- [ ] Guidelines de comunidade (moderação)

### Riscos Conhecidos
- ⚠️ Performance com muitas animações
- ⚠️ Complexidade do sistema de pontos
- ⚠️ Abuso de recompensas
- ⚠️ Gamificação tóxica (competição negativa)
- ⚠️ Escopo muito ambicioso

---

## 📈 TRACKING DE MÉTRICAS

### Baseline Atual (Pré-implementação)
- DAU/MAU: 25%
- Sessão média: 5min
- Taxa conclusão: 30%
- Churn 30d: 40%
- NPS: 42

### Meta Sprint 2 (06/11)
- DAU/MAU: 30%
- Sessão média: 7min
- Taxa conclusão: 45%
- Churn 30d: 35%
- NPS: 47

### Meta Sprint 4 (20/11)
- DAU/MAU: 35%
- Sessão média: 9min
- Taxa conclusão: 60%
- Churn 30d: 30%
- NPS: 52

### Meta Final (01/01)
- DAU/MAU: 40%
- Sessão média: 12min
- Taxa conclusão: 75%
- Churn 30d: 25%
- NPS: 57

---

## 📝 NOTAS E DECISÕES

### Decisões Arquiteturais
- ✅ Usar Supabase para persistência de completions
- ✅ framer-motion para animações (performance)
- ✅ Server-side validation para pontos (segurança)
- ✅ RLS policies para dados sensíveis
- ✅ Lazy loading para componentes pesados

### Decisões de UX
- ✅ Checkboxes ao invés de botões (menos fricção)
- ✅ Confete apenas em conquistas significativas
- ✅ Progress bars com animação de 1s
- ✅ Toast com action buttons (ver progresso)
- ✅ Rankings apenas em círculos privados pequenos

### Decisões de Negócio
- ✅ XP não expira (ownership permanente)
- ✅ Recompensas não têm prazo de validade
- ✅ Círculos limitados a 5 pessoas (qualidade > quantidade)
- ✅ Desafios sempre opcionais (não obrigatórios)
- ✅ Opção de desativar features sociais

---

**Última atualização:** 22/10/2025  
**Status geral:** 🟡 Em Planejamento  
**Próximo checkpoint:** 29/10/2025 (fim Semana 1)
