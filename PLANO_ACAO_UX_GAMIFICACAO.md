# 🎯 PLANO DE AÇÃO: UX/UI E GAMIFICAÇÃO AVANÇADA
**Projeto:** Vida Smart Coach  
**Responsável:** JE (agenciaclimb)  
**Data de criação:** 22/10/2025  
**Status:** Em Planejamento  

---

## 📋 ÍNDICE
1. [Contexto e Objetivos](#contexto-e-objetivos)
2. [Estratégia de Implementação (3 Níveis)](#estratégia-de-implementação)
3. [Sprints Detalhados](#sprints-detalhados)
4. [Checklist de Implementação](#checklist-de-implementação)
5. [Métricas de Sucesso](#métricas-de-sucesso)
6. [Riscos e Mitigações](#riscos-e-mitigações)

---

## 🎯 CONTEXTO E OBJETIVOS

### Diagnóstico Atual
**Problemas Identificados:**
- ❌ Visual estático e pouco inspirador — falta dinamismo e feedback visual imediato
- ❌ Gamificação superficial — pontos e níveis sem recompensas tangíveis ou narrativa envolvente
- ❌ Ausência de progressão visual clara — difícil ver evolução ao longo do tempo
- ❌ Falta de personalização — experiência genérica para todos os usuários
- ❌ Baixo engajamento emocional — interface funcional mas não inspiradora

**Integração Atual Verificada:**
- ✅ IA carrega `activePlans` e `gamification` para contexto
- ✅ PlanTab exibe gamificação (pontos, nível, conquistas)
- ✅ Pontos gerados em eventos específicos (+30 planos, +50 IA)
- ❌ **Gaps críticos:**
  - Sem tracking de conclusão de tarefas (checkboxes)
  - Sem indicador visual de progresso (%)
  - Feedback não fecha loop com IA
  - IA não sugere itens específicos dos planos

### Objetivos Estratégicos
1. **Aumentar engajamento diário** em 40% (medido por DAU/MAU)
2. **Reduzir churn** em 25% nos primeiros 30 dias
3. **Aumentar tempo médio no app** de 5min para 12min/dia
4. **Melhorar NPS** de usuários em 15 pontos
5. **Criar diferenciação competitiva** com gamificação profunda

---

## 🏗️ ESTRATÉGIA DE IMPLEMENTAÇÃO

### 🔴 NÍVEL 1: Quick Wins (1-2 semanas)
**Objetivo:** Melhorias rápidas com alto impacto visual

**Impacto Esperado:** ⭐⭐⭐⭐⭐  
**Esforço Técnico:** ⚙️⚙️  
**ROI:** Alto  

**Entregas:**
- Animações e micro-interações
- Streak counter visual
- Progress bars animadas
- Dashboard de progresso aprimorado
- Sistema de feedback imediato

---

### 🟡 NÍVEL 2: Game Changers (2-4 semanas)
**Objetivo:** Funcionalidades que diferenciam no mercado

**Impacto Esperado:** ⭐⭐⭐⭐⭐  
**Esforço Técnico:** ⚙️⚙️⚙️⚙️  
**ROI:** Muito Alto  

**Entregas:**
- Loja de recompensas (marketplace)
- Narrativa de jornada do herói (tiers)
- Desafios temporários
- Comparação social saudável

---

### 🟢 NÍVEL 3: Inovações Disruptivas (4-8 semanas)
**Objetivo:** Liderança de mercado com IA avançada

**Impacto Esperado:** ⭐⭐⭐⭐⭐  
**Esforço Técnico:** ⚙️⚙️⚙️⚙️⚙️  
**ROI:** Estratégico (longo prazo)  

**Entregas:**
- IA preditiva e recomendações
- Visualizações avançadas (charts, heatmaps)
- Integrações externas (wearables)
- Hub comunitário

---

## 📅 SPRINTS DETALHADOS

### 🏃 SPRINT 1-2: Quick Wins Essenciais (Semana 1-2)
**Prioridade:** P0 — Bloqueador para outras features  
**Data Início:** 23/10/2025  
**Data Fim:** 06/11/2025  

#### Backlog do Sprint

| Task | Descrição | Impacto | Esforço | Responsável | Status |
|------|-----------|---------|---------|-------------|--------|
| **QW-01** | Checkboxes de conclusão + gamificação | 🔥🔥🔥🔥🔥 | ⚙️⚙️⚙️ | JE | 📋 Pendente |
| **QW-02** | Indicadores visuais de progresso | 🔥🔥🔥🔥🔥 | ⚙️⚙️ | JE | 📋 Pendente |
| **QW-03** | Animações com framer-motion | 🔥🔥🔥 | ⚙️⚙️ | JE | 📋 Pendente |
| **QW-04** | Toast notifications celebrativas | 🔥🔥🔥 | ⚙️ | JE | 📋 Pendente |
| **QW-05** | Streak counter com chama 🔥 | 🔥🔥🔥 | ⚙️ | JE | 📋 Pendente |
| **QW-06** | Aprimoramento visual dos cards | 🔥🔥 | ⚙️⚙️ | JE | 📋 Pendente |

#### QW-01: Checkboxes de Conclusão + Gamificação
**Prioridade:** P0 (Crítica)  
**Estimativa:** 8 horas  

**Passos de Implementação:**
1. **Banco de Dados**
   ```sql
   -- Migration: create_plan_completions_table.sql
   CREATE TABLE plan_completions (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
     plan_type TEXT NOT NULL CHECK (plan_type IN ('physical', 'nutritional', 'emotional', 'spiritual')),
     item_type TEXT NOT NULL CHECK (item_type IN ('exercise', 'workout', 'meal', 'routine', 'practice', 'goal')),
     item_identifier TEXT NOT NULL, -- ex: "week_1_workout_0_exercise_2"
     completed_at TIMESTAMPTZ DEFAULT NOW(),
     points_awarded INTEGER DEFAULT 0,
     
     -- Índices
     UNIQUE(user_id, plan_type, item_identifier),
     INDEX idx_plan_completions_user_date (user_id, completed_at),
     INDEX idx_plan_completions_type (user_id, plan_type)
   );
   
   -- RLS Policies
   ALTER TABLE plan_completions ENABLE ROW LEVEL SECURITY;
   
   CREATE POLICY "Users can view own completions"
     ON plan_completions FOR SELECT
     USING (auth.uid() = user_id);
   
   CREATE POLICY "Users can insert own completions"
     ON plan_completions FOR INSERT
     WITH CHECK (auth.uid() = user_id);
   ```

2. **Hook de Completions**
   ```typescript
   // src/hooks/usePlanCompletions.js
   import { useState, useEffect } from 'react';
   import { supabase } from '@/lib/supabase';
   import { useGamification } from './useGamification';
   import { toast } from 'sonner';
   
   export function usePlanCompletions(userId, planType) {
     const [completions, setCompletions] = useState({});
     const { addDailyActivity } = useGamification();
     
     // Carregar completions
     useEffect(() => {
       if (!userId || !planType) return;
       
       const fetchCompletions = async () => {
         const { data, error } = await supabase
           .from('plan_completions')
           .select('item_identifier, completed_at')
           .eq('user_id', userId)
           .eq('plan_type', planType);
         
         if (!error && data) {
           const completionsMap = {};
           data.forEach(c => {
             completionsMap[c.item_identifier] = true;
           });
           setCompletions(completionsMap);
         }
       };
       
       fetchCompletions();
     }, [userId, planType]);
     
     const toggleCompletion = async (itemIdentifier, itemType) => {
       const isCompleted = completions[itemIdentifier];
       
       if (isCompleted) {
         // Remover conclusão
         const { error } = await supabase
           .from('plan_completions')
           .delete()
           .eq('user_id', userId)
           .eq('plan_type', planType)
           .eq('item_identifier', itemIdentifier);
         
         if (!error) {
           setCompletions(prev => {
             const updated = { ...prev };
             delete updated[itemIdentifier];
             return updated;
           });
           toast.info('Marcado como não concluído');
         }
       } else {
         // Adicionar conclusão
         const points = getPointsForItemType(itemType);
         
         const { error } = await supabase
           .from('plan_completions')
           .insert({
             user_id: userId,
             plan_type: planType,
             item_type: itemType,
             item_identifier: itemIdentifier,
             points_awarded: points
           });
         
         if (!error) {
           setCompletions(prev => ({ ...prev, [itemIdentifier]: true }));
           
           // Adicionar pontos
           await addDailyActivity(
             `${planType}_${itemType}_completed`,
             points,
             { item: itemIdentifier }
           );
           
           toast.success(`🎉 Concluído! +${points} XP`, {
             description: getCelebrationMessage(itemType)
           });
         }
       }
     };
     
     const getProgress = (totalItems) => {
       const completed = Object.keys(completions).length;
       const percentage = totalItems > 0 ? (completed / totalItems) * 100 : 0;
       return { completed, total: totalItems, percentage: Math.round(percentage) };
     };
     
     return { completions, toggleCompletion, getProgress };
   }
   
   function getPointsForItemType(itemType) {
     const pointsMap = {
       exercise: 5,
       workout: 10,
       meal: 5,
       routine: 8,
       practice: 8,
       goal: 15
     };
     return pointsMap[itemType] || 5;
   }
   
   function getCelebrationMessage(itemType) {
     const messages = {
       exercise: 'Ótimo trabalho! Continue assim! 💪',
       workout: 'Treino concluído! Você é incrível! 🏆',
       meal: 'Alimentação em dia! Parabéns! 🥗',
       routine: 'Rotina completa! Você está evoluindo! 🌟',
       practice: 'Prática concluída! Muito bem! 🧘',
       goal: 'Meta alcançada! Você é uma inspiração! 🎯'
     };
     return messages[itemType] || 'Parabéns pela conclusão!';
   }
   ```

3. **Componente Checkbox**
   ```typescript
   // src/components/client/CompletionCheckbox.jsx
   import { motion } from 'framer-motion';
   import { Check } from 'lucide-react';
   import { Checkbox } from '@/components/ui/checkbox';
   
   export function CompletionCheckbox({ 
     isCompleted, 
     onToggle, 
     label,
     itemType 
   }) {
     return (
       <div className="flex items-center space-x-3 group">
         <Checkbox
           checked={isCompleted}
           onCheckedChange={onToggle}
           className="h-5 w-5"
         />
         
         <motion.label
           className={`flex-1 cursor-pointer transition-all ${
             isCompleted 
               ? 'text-muted-foreground line-through' 
               : 'text-foreground group-hover:text-primary'
           }`}
           whileTap={{ scale: 0.98 }}
           onClick={onToggle}
         >
           {label}
         </motion.label>
         
         {isCompleted && (
           <motion.div
             initial={{ scale: 0, rotate: -180 }}
             animate={{ scale: 1, rotate: 0 }}
             className="text-green-500"
           >
             <Check className="h-4 w-4" />
           </motion.div>
         )}
       </div>
     );
   }
   ```

4. **Integração em PhysicalPlanDisplay**
   ```typescript
   // Adicionar ao PhysicalPlanDisplay em PlanTab.jsx
   import { usePlanCompletions } from '@/hooks/usePlanCompletions';
   import { CompletionCheckbox } from './CompletionCheckbox';
   
   function PhysicalPlanDisplay({ plan }) {
     const { user } = useAuth();
     const { completions, toggleCompletion, getProgress } = usePlanCompletions(
       user?.id,
       'physical'
     );
     
     const totalExercises = calculateTotalExercises(plan);
     const progress = getProgress(totalExercises);
     
     // No header, adicionar progress bar:
     <div className="mb-4">
       <div className="flex justify-between text-sm mb-2">
         <span>Progresso Geral</span>
         <span className="font-semibold">{progress.percentage}%</span>
       </div>
       <Progress value={progress.percentage} className="h-2" />
       <p className="text-xs text-muted-foreground mt-1">
         {progress.completed} de {progress.total} exercícios completados
       </p>
     </div>
     
     // Em cada exercício:
     <CompletionCheckbox
       isCompleted={completions[`week_${selectedWeek}_workout_${workoutIdx}_exercise_${exIdx}`]}
       onToggle={() => toggleCompletion(
         `week_${selectedWeek}_workout_${workoutIdx}_exercise_${exIdx}`,
         'exercise'
       )}
       label={`${exercise.sets}x${exercise.reps} ${exercise.name}`}
       itemType="exercise"
     />
   }
   ```

**Definição de Pronto:**
- [ ] Migration `plan_completions` criada e testada
- [ ] RLS policies configuradas e validadas
- [ ] Hook `usePlanCompletions` implementado
- [ ] Componente `CompletionCheckbox` criado com animação
- [ ] Integração nos 4 displays de planos (Physical, Nutritional, Emotional, Spiritual)
- [ ] Progress bar exibindo % correto
- [ ] Pontos sendo gerados corretamente
- [ ] Toast notifications funcionando
- [ ] Testes E2E: marcar/desmarcar, verificar pontos, verificar persistência

---

#### QW-02: Indicadores Visuais de Progresso
**Prioridade:** P0 (Crítica)  
**Estimativa:** 4 horas  

**Passos de Implementação:**
1. **Componente ProgressCard**
   ```typescript
   // src/components/client/ProgressCard.jsx
   import { motion } from 'framer-motion';
   import { Progress } from '@/components/ui/progress';
   import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
   
   export function ProgressCard({ 
     title, 
     icon, 
     percentage, 
     completed, 
     total,
     trend // 'up' | 'down' | 'stable'
   }) {
     const getTrendIcon = () => {
       switch(trend) {
         case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
         case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
         default: return <Minus className="h-4 w-4 text-gray-400" />;
       }
     };
     
     return (
       <motion.div
         whileHover={{ y: -2 }}
         className="bg-card rounded-lg p-4 border border-border"
       >
         <div className="flex items-center justify-between mb-3">
           <div className="flex items-center gap-2">
             <span className="text-2xl">{icon}</span>
             <h3 className="font-semibold text-sm">{title}</h3>
           </div>
           {getTrendIcon()}
         </div>
         
         <div className="space-y-2">
           <div className="flex justify-between items-end">
             <motion.span 
               className="text-3xl font-bold"
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
             >
               {percentage}%
             </motion.span>
             <span className="text-xs text-muted-foreground">
               {completed}/{total}
             </span>
           </div>
           
           <motion.div
             initial={{ scaleX: 0 }}
             animate={{ scaleX: 1 }}
             transition={{ duration: 1, ease: "easeOut" }}
             style={{ transformOrigin: "left" }}
           >
             <Progress value={percentage} className="h-2" />
           </motion.div>
         </div>
       </motion.div>
     );
   }
   ```

2. **Dashboard de Progresso Geral**
   ```typescript
   // src/components/client/OverallProgressDashboard.jsx
   import { ProgressCard } from './ProgressCard';
   import { usePlanCompletions } from '@/hooks/usePlanCompletions';
   
   export function OverallProgressDashboard({ userId }) {
     const physicalProgress = usePlanCompletions(userId, 'physical').getProgress();
     const nutritionalProgress = usePlanCompletions(userId, 'nutritional').getProgress();
     const emotionalProgress = usePlanCompletions(userId, 'emotional').getProgress();
     const spiritualProgress = usePlanCompletions(userId, 'spiritual').getProgress();
     
     const overallPercentage = Math.round(
       (physicalProgress.percentage + 
        nutritionalProgress.percentage + 
        emotionalProgress.percentage + 
        spiritualProgress.percentage) / 4
     );
     
     return (
       <div className="space-y-4">
         <h2 className="text-2xl font-bold">Seu Progresso Geral</h2>
         
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
           <ProgressCard
             title="Físico"
             icon="💪"
             percentage={physicalProgress.percentage}
             completed={physicalProgress.completed}
             total={physicalProgress.total}
             trend="up"
           />
           
           <ProgressCard
             title="Alimentar"
             icon="🥗"
             percentage={nutritionalProgress.percentage}
             completed={nutritionalProgress.completed}
             total={nutritionalProgress.total}
             trend="up"
           />
           
           <ProgressCard
             title="Emocional"
             icon="❤️"
             percentage={emotionalProgress.percentage}
             completed={emotionalProgress.completed}
             total={emotionalProgress.total}
             trend="stable"
           />
           
           <ProgressCard
             title="Espiritual"
             icon="🧘"
             percentage={spiritualProgress.percentage}
             completed={spiritualProgress.completed}
             total={spiritualProgress.total}
             trend="up"
           />
         </div>
         
         <motion.div
           className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-lg p-6 text-white"
           whileHover={{ scale: 1.02 }}
         >
           <h3 className="text-lg font-semibold mb-2">Progresso Total</h3>
           <div className="flex items-end gap-4">
             <motion.span
               className="text-5xl font-bold"
               initial={{ scale: 0 }}
               animate={{ scale: 1 }}
               transition={{ type: "spring", stiffness: 200 }}
             >
               {overallPercentage}%
             </motion.span>
             <p className="text-sm opacity-90 mb-2">
               dos 4 pilares do bem-estar
             </p>
           </div>
         </motion.div>
       </div>
     );
   }
   ```

**Definição de Pronto:**
- [ ] Componente `ProgressCard` criado com animações
- [ ] Dashboard de progresso geral implementado
- [ ] Cálculo de % correto por plano
- [ ] Agregação dos 4 pilares funcionando
- [ ] Animações de preenchimento suaves
- [ ] Trend indicators funcionando
- [ ] Responsivo em mobile/tablet/desktop
- [ ] Integrado na tela de Dashboard principal

---

#### QW-03: Animações com Framer Motion
**Prioridade:** P1  
**Estimativa:** 6 horas  

**Passos de Implementação:**
1. **Instalar dependências**
   ```bash
   npm install framer-motion canvas-confetti
   ```

2. **Confete Component**
   ```typescript
   // src/components/ui/confetti.tsx
   import { useEffect } from 'react';
   import confetti from 'canvas-confetti';
   
   export function triggerConfetti() {
     const duration = 2 * 1000;
     const animationEnd = Date.now() + duration;
     const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
     
     function randomInRange(min: number, max: number) {
       return Math.random() * (max - min) + min;
     }
     
     const interval: NodeJS.Timeout = setInterval(function() {
       const timeLeft = animationEnd - Date.now();
       
       if (timeLeft <= 0) {
         return clearInterval(interval);
       }
       
       const particleCount = 50 * (timeLeft / duration);
       
       confetti({
         ...defaults,
         particleCount,
         origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
       });
       confetti({
         ...defaults,
         particleCount,
         origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
       });
     }, 250);
   }
   ```

3. **Animated Mission Card**
   ```typescript
   // src/components/client/AnimatedMissionCard.jsx
   import { motion, AnimatePresence } from 'framer-motion';
   import { Card } from '@/components/ui/card';
   import { Button } from '@/components/ui/button';
   import { Check } from 'lucide-react';
   import { triggerConfetti } from '@/components/ui/confetti';
   
   export function AnimatedMissionCard({ mission, onComplete }) {
     const handleComplete = () => {
       triggerConfetti();
       onComplete();
     };
     
     return (
       <motion.div
         layout
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         exit={{ opacity: 0, x: -100 }}
         whileHover={{ 
           y: -4, 
           boxShadow: "0 12px 24px rgba(0,0,0,0.1)" 
         }}
         transition={{ duration: 0.2 }}
       >
         <Card className="p-6">
           {/* Icon com gradiente */}
           <div className="flex items-start gap-4">
             <motion.div
               className="mission-icon-gradient"
               whileHover={{ rotate: 360 }}
               transition={{ duration: 0.6 }}
             >
               <div className={`
                 w-12 h-12 rounded-full 
                 bg-gradient-to-br from-blue-500 to-purple-600
                 flex items-center justify-center text-2xl
               `}>
                 {mission.icon}
               </div>
             </motion.div>
             
             <div className="flex-1">
               <h3 className="font-semibold text-lg mb-1">{mission.title}</h3>
               <p className="text-sm text-muted-foreground mb-4">
                 {mission.description}
               </p>
               
               {/* Progress Bar Animada */}
               <div className="mb-4">
                 <div className="flex justify-between text-xs mb-1">
                   <span>Progresso</span>
                   <span className="font-semibold">
                     {mission.progress}/{mission.total}
                   </span>
                 </div>
                 <div className="h-2 bg-secondary rounded-full overflow-hidden">
                   <motion.div
                     className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                     initial={{ width: 0 }}
                     animate={{ 
                       width: `${(mission.progress / mission.total) * 100}%` 
                     }}
                     transition={{ duration: 1, ease: "easeOut" }}
                   />
                 </div>
               </div>
               
               <div className="flex items-center justify-between">
                 <Button
                   onClick={handleComplete}
                   variant="default"
                   className="gap-2"
                 >
                   <Check className="h-4 w-4" />
                   Marcar como concluída
                 </Button>
                 
                 <motion.div
                   className="text-sm font-semibold text-primary"
                   initial={{ scale: 0 }}
                   animate={{ scale: 1 }}
                   transition={{ type: "spring", stiffness: 500 }}
                 >
                   +{mission.points} XP
                 </motion.div>
               </div>
             </div>
           </div>
         </Card>
       </motion.div>
     );
   }
   ```

4. **Animated Counter**
   ```typescript
   // src/components/ui/animated-counter.tsx
   import { motion, useSpring, useTransform } from 'framer-motion';
   import { useEffect } from 'react';
   
   export function AnimatedCounter({ 
     value, 
     duration = 1,
     className = "" 
   }) {
     const spring = useSpring(0, { duration: duration * 1000 });
     const display = useTransform(spring, (current) =>
       Math.round(current).toLocaleString()
     );
     
     useEffect(() => {
       spring.set(value);
     }, [spring, value]);
     
     return (
       <motion.span className={className}>
         {display}
       </motion.span>
     );
   }
   ```

**Definição de Pronto:**
- [ ] framer-motion e canvas-confetti instalados
- [ ] Confete funcionando ao completar missões
- [ ] Cards com hover effects suaves
- [ ] Progress bars com animação de preenchimento
- [ ] Contador de pontos animado
- [ ] Transições suaves entre estados
- [ ] Performance otimizada (60fps)

---

#### QW-04: Toast Notifications Celebrativas
**Prioridade:** P1  
**Estimativa:** 2 horas  

**Passos:**
1. Criar variantes de toast personalizadas com Sonner
2. Adicionar sons opcionais (com toggle no Settings)
3. Mensagens contextuais por tipo de conquista
4. Action buttons nos toasts

**Definição de Pronto:**
- [ ] Toast personalizados implementados
- [ ] Sons opcionais configuráveis
- [ ] Mensagens variadas por contexto
- [ ] Action buttons funcionais
- [ ] Acessibilidade (screen readers)

---

#### QW-05: Streak Counter com Chama 🔥
**Prioridade:** P1  
**Estimativa:** 3 horas  

**Passos:**
1. Query de check-ins consecutivos no Supabase
2. Componente `StreakCounter` com animação de chama
3. Badges por milestones (7, 14, 30, 90 dias)
4. Notificação quando streak está em risco

**Definição de Pronto:**
- [ ] Cálculo de streak correto
- [ ] Animação de chama proporcional ao streak
- [ ] Badges de milestone
- [ ] Alerta de risco de quebra

---

#### QW-06: Aprimoramento Visual dos Cards
**Prioridade:** P2  
**Estimativa:** 4 horas  

**Passos:**
1. Atualizar padding e espaçamento (design tokens)
2. Implementar gradientes contextuais
3. Melhorar tipografia (hierarquia clara)
4. Border-radius consistente

**Definição de Pronto:**
- [ ] Design system atualizado
- [ ] Cards com novo visual
- [ ] Tipografia hierárquica
- [ ] Responsividade mantida

---

### 🏃 SPRINT 3-4: Sistema de Recompensas (Semana 3-4)
**Prioridade:** P0  
**Data Início:** 07/11/2025  
**Data Fim:** 20/11/2025  

#### Backlog do Sprint

| Task | Descrição | Impacto | Esforço | Responsável | Status |
|------|-----------|---------|---------|-------------|--------|
| **GC-01** | Banco de dados de recompensas | 🔥🔥🔥🔥🔥 | ⚙️⚙️⚙️ | JE | 📋 Pendente |
| **GC-02** | UI da loja de recompensas | 🔥🔥🔥🔥🔥 | ⚙️⚙️⚙️ | JE | 📋 Pendente |
| **GC-03** | Sistema de resgate de pontos | 🔥🔥🔥🔥 | ⚙️⚙️ | JE | 📋 Pendente |
| **GC-04** | Badges visuais e coleções | 🔥🔥🔥 | ⚙️⚙️ | JE | 📋 Pendente |
| **GC-05** | Narrativa de tiers (jornada) | 🔥🔥🔥 | ⚙️⚙️ | JE | 📋 Pendente |

#### GC-01: Banco de Dados de Recompensas
**Estimativa:** 6 horas  

```sql
-- Migration: create_rewards_system.sql
CREATE TABLE rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('digital', 'content', 'service', 'badge')),
  cost_xp INTEGER NOT NULL CHECK (cost_xp > 0),
  icon TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  stock INTEGER, -- NULL = unlimited
  tier_required TEXT CHECK (tier_required IN ('iniciante', 'praticante', 'veterano', 'expert', 'mestre')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_rewards_active (is_active, category)
);

CREATE TABLE user_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES rewards(id),
  redeemed_at TIMESTAMPTZ DEFAULT NOW(),
  xp_spent INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'cancelled')),
  
  INDEX idx_user_rewards_user (user_id, redeemed_at),
  INDEX idx_user_rewards_status (status)
);

-- RLS
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active rewards"
  ON rewards FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Users can view own redemptions"
  ON user_rewards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can redeem rewards"
  ON user_rewards FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

**Seeds de Recompensas:**
```sql
INSERT INTO rewards (name, description, category, cost_xp, icon, tier_required) VALUES
  -- Digitais
  ('Sessão Extra IA Coach', 'Conversa de 15 minutos com IA Coach sobre qualquer assunto', 'digital', 500, '💬', NULL),
  ('Relatório Personalizado', 'PDF detalhado com análise de progresso e insights', 'digital', 1000, '📊', 'praticante'),
  ('Tema Premium "Energia"', 'Visual exclusivo com gradientes energéticos', 'digital', 300, '🎨', NULL),
  
  -- Conteúdo
  ('E-book Nutrição Avançada', 'Guia completo com 50 receitas saudáveis', 'content', 800, '📚', 'praticante'),
  ('Plano de Treino Avançado', 'Programa de 12 semanas para hipertrofia', 'content', 1200, '💪', 'veterano'),
  ('Vídeo-aula Meditação', 'Série de 5 vídeos de meditação guiada', 'content', 600, '🧘', NULL),
  
  -- Badges
  ('Badge Guerreiro da Saúde', 'Badge exclusivo no perfil', 'badge', 300, '🏅', NULL),
  ('Badge Mestre do Equilíbrio', 'Badge raro para equilibrar 4 pilares', 'badge', 2000, '⚖️', 'mestre'),
  
  -- Serviços
  ('Consultoria 1:1 Premium', 'Sessão de 30min com especialista real', 'service', 3000, '👨‍⚕️', 'expert'),
  ('Ajuste de Plano Personalizado', 'Coach ajusta plano baseado em feedback', 'service', 1500, '🎯', 'veterano');
```

---

#### GC-02: UI da Loja de Recompensas
**Estimativa:** 8 horas  

```typescript
// src/components/client/RewardsStore.jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useGamification } from '@/hooks/useGamification';
import { toast } from 'sonner';

export function RewardsStore() {
  const { user } = useAuth();
  const { gamificationData } = useGamification();
  const [rewards, setRewards] = useState([]);
  const [selectedReward, setSelectedReward] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  
  useEffect(() => {
    fetchRewards();
  }, []);
  
  const fetchRewards = async () => {
    const { data, error } = await supabase
      .from('rewards')
      .select('*')
      .eq('is_active', true)
      .order('cost_xp');
    
    if (!error && data) {
      setRewards(data);
    }
  };
  
  const handleRedeem = async (reward) => {
    if (gamificationData.total_points < reward.cost_xp) {
      toast.error('XP insuficiente', {
        description: `Você precisa de ${reward.cost_xp - gamificationData.total_points} XP a mais`
      });
      return;
    }
    
    setLoading(true);
    
    // Inserir redemption
    const { error } = await supabase
      .from('user_rewards')
      .insert({
        user_id: user.id,
        reward_id: reward.id,
        xp_spent: reward.cost_xp
      });
    
    if (!error) {
      // Deduzir pontos (implementar function no Supabase)
      await supabase.rpc('deduct_user_xp', {
        p_user_id: user.id,
        p_xp_amount: reward.cost_xp
      });
      
      toast.success('Resgate realizado! 🎉', {
        description: 'Você receberá em breve sua recompensa'
      });
      
      setSelectedReward(null);
      // Recarregar gamification data
    } else {
      toast.error('Erro ao resgatar recompensa');
    }
    
    setLoading(false);
  };
  
  const filteredRewards = filter === 'all' 
    ? rewards 
    : rewards.filter(r => r.category === filter);
  
  return (
    <div className="space-y-6">
      {/* Header com saldo */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Loja de Recompensas</h2>
        <div className="flex items-center gap-4">
          <div>
            <p className="text-sm opacity-90">Seus Pontos</p>
            <p className="text-4xl font-bold">{gamificationData.total_points} XP</p>
          </div>
          <div className="flex-1" />
          <div className="text-right">
            <p className="text-sm opacity-90">Nível</p>
            <p className="text-2xl font-bold">{gamificationData.level}</p>
          </div>
        </div>
      </div>
      
      {/* Filtros */}
      <div className="flex gap-2">
        <Button 
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          Todas
        </Button>
        <Button 
          variant={filter === 'digital' ? 'default' : 'outline'}
          onClick={() => setFilter('digital')}
        >
          Digitais
        </Button>
        <Button 
          variant={filter === 'content' ? 'default' : 'outline'}
          onClick={() => setFilter('content')}
        >
          Conteúdo
        </Button>
        <Button 
          variant={filter === 'service' ? 'default' : 'outline'}
          onClick={() => setFilter('service')}
        >
          Serviços
        </Button>
        <Button 
          variant={filter === 'badge' ? 'default' : 'outline'}
          onClick={() => setFilter('badge')}
        >
          Badges
        </Button>
      </div>
      
      {/* Grid de recompensas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRewards.map(reward => (
          <motion.div
            key={reward.id}
            whileHover={{ y: -4 }}
            onClick={() => setSelectedReward(reward)}
          >
            <Card className="p-6 cursor-pointer hover:border-primary transition-colors">
              <div className="text-4xl mb-3">{reward.icon}</div>
              <h3 className="font-semibold mb-2">{reward.name}</h3>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {reward.description}
              </p>
              
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-lg font-bold">
                  {reward.cost_xp} XP
                </Badge>
                
                {reward.tier_required && (
                  <Badge variant="outline" className="text-xs">
                    {reward.tier_required}
                  </Badge>
                )}
              </div>
              
              {gamificationData.total_points < reward.cost_xp && (
                <p className="text-xs text-red-500 mt-2">
                  Faltam {reward.cost_xp - gamificationData.total_points} XP
                </p>
              )}
            </Card>
          </motion.div>
        ))}
      </div>
      
      {/* Dialog de confirmação */}
      <Dialog open={!!selectedReward} onOpenChange={() => setSelectedReward(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resgatar Recompensa?</DialogTitle>
          </DialogHeader>
          
          {selectedReward && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-6xl mb-2">{selectedReward.icon}</div>
                <h3 className="text-xl font-bold">{selectedReward.name}</h3>
                <p className="text-muted-foreground">{selectedReward.description}</p>
              </div>
              
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span>Custo:</span>
                  <span className="font-bold">{selectedReward.cost_xp} XP</span>
                </div>
                <div className="flex justify-between">
                  <span>Saldo atual:</span>
                  <span className="font-bold">{gamificationData.total_points} XP</span>
                </div>
                <div className="flex justify-between mt-2 pt-2 border-t">
                  <span>Saldo após resgate:</span>
                  <span className="font-bold text-primary">
                    {gamificationData.total_points - selectedReward.cost_xp} XP
                  </span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setSelectedReward(null)}
                >
                  Cancelar
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => handleRedeem(selectedReward)}
                  disabled={loading || gamificationData.total_points < selectedReward.cost_xp}
                >
                  {loading ? 'Resgatando...' : 'Confirmar Resgate'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

**Definição de Pronto:**
- [ ] Migration rewards e user_rewards criadas
- [ ] Seeds de recompensas populadas
- [ ] UI da loja implementada
- [ ] Filtros funcionando
- [ ] Dialog de confirmação
- [ ] Dedução de XP ao resgatar
- [ ] Validações de tier e XP
- [ ] Histórico de resgates
- [ ] RPC `deduct_user_xp` implementada

---

### 🏃 SPRINT 5-6: Desafios e Social (Semana 5-6)
**Prioridade:** P1  
**Data Início:** 21/11/2025  
**Data Fim:** 04/12/2025  

*(Detalhamento similar aos sprints anteriores)*

---

### 🏃 SPRINT 7-10: Inovações IA e Analytics (Semana 7-10)
**Prioridade:** P2  
**Data Início:** 05/12/2025  
**Data Fim:** 01/01/2026  

*(Detalhamento similar aos sprints anteriores)*

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### Pré-Requisitos Técnicos
- [ ] Node.js 18+ instalado
- [ ] Dependências atualizadas: `npm install`
- [ ] Supabase CLI instalado: `npm install -g supabase`
- [ ] Variáveis de ambiente configuradas

### Bibliotecas a Instalar
```bash
npm install framer-motion canvas-confetti recharts date-fns
```

### Migrations a Criar
- [ ] `create_plan_completions_table.sql`
- [ ] `create_rewards_system.sql`
- [ ] `create_challenges_system.sql`
- [ ] `create_social_circles.sql`
- [ ] `create_feedback_loop.sql`

### Componentes a Criar
- [ ] `CompletionCheckbox.jsx`
- [ ] `ProgressCard.jsx`
- [ ] `OverallProgressDashboard.jsx`
- [ ] `AnimatedMissionCard.jsx`
- [ ] `AnimatedCounter.tsx`
- [ ] `StreakCounter.jsx`
- [ ] `RewardsStore.jsx`
- [ ] `ChallengeCard.jsx`
- [ ] `SocialCircles.jsx`

### Hooks a Criar
- [ ] `usePlanCompletions.js`
- [ ] `useRewards.js`
- [ ] `useChallenges.js`
- [ ] `useStreakTracking.js`

### Edge Functions a Criar/Modificar
- [ ] `ia-coach-chat`: adicionar contexto de feedback e planos do dia
- [ ] `process-plan-feedback`: processar feedback e regenerar
- [ ] `deduct-user-xp`: RPC para deduzir pontos

---

## 📊 MÉTRICAS DE SUCESSO

### KPIs Principais
| Métrica | Baseline | Meta Sprint 2 | Meta Sprint 4 | Meta Sprint 10 |
|---------|----------|---------------|---------------|----------------|
| **DAU/MAU** | 0.25 | 0.30 | 0.35 | 0.40 |
| **Sessão média (min)** | 5 | 7 | 9 | 12 |
| **Taxa de conclusão diária** | 30% | 45% | 60% | 75% |
| **Churn 30 dias** | 40% | 35% | 30% | 25% |
| **NPS** | 42 | 47 | 52 | 57 |
| **Resgates/mês (por usuário)** | 0 | 0.5 | 1.2 | 2.0 |

### Métricas de Engajamento
- **Completions por usuário/semana:** >15
- **Streak médio:** >7 dias
- **Resgates de recompensas:** >1 por mês
- **Participação em desafios:** >60% dos ativos
- **Interações sociais:** >3 por semana

### Métricas Técnicas
- **Performance:** <100ms para animações
- **Bundle size:** <5MB após otimizações
- **Lighthouse Score:** >90
- **Crash rate:** <0.1%

---

## ⚠️ RISCOS E MITIGAÇÕES

### Risco 1: Performance com Animações
**Probabilidade:** Média  
**Impacto:** Alto  
**Mitigação:**
- Usar `useMemo` e `useCallback` para otimizar re-renders
- Implementar virtualização em listas longas
- Lazy loading de componentes pesados
- Profiling com React DevTools

### Risco 2: Complexidade do Sistema de Pontos
**Probabilidade:** Alta  
**Impacto:** Médio  
**Mitigação:**
- Criar tabela de auditoria (`points_transactions`)
- Implementar testes automatizados para cálculos
- Dashboard admin para debugging de pontos
- Documentação clara de regras de negócio

### Risco 3: Abuso do Sistema de Recompensas
**Probabilidade:** Média  
**Impacto:** Alto  
**Mitigação:**
- Rate limiting em resgates (max X por dia)
- Validação server-side rigorosa
- Logs de atividades suspeitas
- Sistema de flags/banimento

### Risco 4: Gamificação Tóxica (Competição Negativa)
**Probabilidade:** Baixa  
**Impacto:** Crítico  
**Mitigação:**
- Rankings apenas em círculos privados pequenos
- Foco em progresso pessoal vs. comparação
- Mensagens sempre positivas
- Opção de desativar features sociais

### Risco 5: Escopo Muito Ambicioso
**Probabilidade:** Alta  
**Impacto:** Alto  
**Mitigação:**
- Seguir estritamente priorização P0 > P1 > P2
- MVPs incrementais com validação
- Sprints curtos (1-2 semanas)
- Revisão semanal de escopo

---

## 🎯 PRÓXIMOS PASSOS IMEDIATOS

### Esta Semana (22-28/10/2025)
1. ✅ Registrar melhorias no documento mestre
2. ✅ Criar plano de ação detalhado
3. [ ] Revisar e aprovar plano com stakeholders
4. [ ] Criar migrations `plan_completions`
5. [ ] Implementar hook `usePlanCompletions`
6. [ ] Desenvolver componente `CompletionCheckbox`

### Próxima Semana (29/10-05/11/2025)
1. [ ] Integrar checkboxes nos 4 displays de planos
2. [ ] Implementar progress tracking visual
3. [ ] Criar dashboard de progresso geral
4. [ ] Adicionar animações básicas (framer-motion)
5. [ ] Deploy e validação em produção

### Sprint 3 (07-20/11/2025)
1. [ ] Iniciar sistema de recompensas
2. [ ] Criar loja de benefícios
3. [ ] Implementar narrativa de jornada
4. [ ] Sistema de badges

---

**Última atualização:** 22/10/2025  
**Revisão necessária:** Semanal  
**Owner:** JE (agenciaclimb)
