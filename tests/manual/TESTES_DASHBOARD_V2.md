# 🧪 PLANO DE TESTES - DASHBOARD V2.0

**Data:** 12/11/2025  
**Responsável:** Testes Manuais  
**Status:** 🟡 Em Execução  

---

## ✅ CHECKLIST DE TESTES

### 1️⃣ Hero Gamificação (HeroGamification)

**Objetivo:** Validar exibição e animações do hero de gamificação

#### ✅ Dados Exibidos
- [ ] **Nível atual** aparece com número correto
- [ ] **Badge emoji** correspondente ao nível (🔰/✨/🌟/⭐/💎/👑)
- [ ] **Nome do nível** (Iniciante, Aprendiz, Praticante, etc.)
- [ ] **Total de pontos** exibido com "pts"
- [ ] **Barra de progresso XP** com percentual visual correto
- [ ] **Pontos necessários** para próximo nível mostrados
- [ ] **Streak atual** com ícone de fogo 🔥
- [ ] **Recorde de streak** com troféu 🏆

#### ✅ Visual & Cores
- [ ] **Gradiente de fundo** muda conforme o nível:
  - Nível 1-2: gray-500 → gray-600
  - Nível 3-4: blue-500 → blue-600
  - Nível 5-9: green-500 → green-600
  - Nível 10-19: purple-500 → purple-600
  - Nível 20-29: pink-500 → pink-600
  - Nível 30+: amber-500 → amber-600
- [ ] Texto em branco legível sobre gradiente
- [ ] Shadow-xl aplicada ao card

#### ✅ Animações
- [ ] **Fade in + slide** do título do nível (duration 0.5s)
- [ ] **Scale in** do badge de pontos (delay 0.2s)
- [ ] **Barra de progresso** anima de 0 até % atual (duration 0.8s)
- [ ] **Pulse sutil** nos cards de streak (whileHover)
- [ ] Animações suaves sem lag

#### ✅ Mensagens Motivacionais
- [ ] "Sequência incrível! Você é imparável! 🔥" (streak >= 7)
- [ ] "Continue assim! A consistência é tudo! 💪" (streak >= 3)
- [ ] "Falta pouco para o próximo nível! 🚀" (progress >= 80%)
- [ ] "Você já está na metade! Continue! ⭐" (progress >= 50%)
- [ ] "Todo progresso conta. Vamos nessa! 🌟" (fallback)

#### 📊 Testes Específicos
```javascript
// Cenário 1: Usuário novo (nível 1, 0 pts)
gamificationData = { level: 1, total_points: 0, current_streak: 0, longest_streak: 0 }
Esperado: 🔰 Iniciante, gray gradient, "Todo progresso conta"

// Cenário 2: Usuário ativo (nível 5, 4500 pts, streak 7)
gamificationData = { level: 5, total_points: 4500, current_streak: 7, longest_streak: 10 }
Esperado: 🌟 Praticante, green gradient, barra 50%, "Sequência incrível!"

// Cenário 3: Usuário avançado (nível 15, 15800 pts, streak 3)
gamificationData = { level: 15, total_points: 15800, current_streak: 3, longest_streak: 8 }
Esperado: ⭐ Avançado, purple gradient, barra 80%, "Continue assim!"
```

---

### 2️⃣ Check-in CTA (CheckinCTA)

**Objetivo:** Validar formulário de check-in e transições de estado

#### ✅ Estado: Não Completado
- [ ] Card destacado com border colorido
- [ ] Título "Check-in Diário" visível
- [ ] Badge **"+10 XP"** com animação pulse (scale 1→1.1→1)
- [ ] Ícone Calendar animado (rotate + scale)
- [ ] Dica contextual com horário (manhã/tarde/noite)

#### ✅ Formulário
- [ ] **Campo Peso** (opcional, kg)
  - Placeholder "Ex: 75.5"
  - Input numérico com step 0.1
- [ ] **Campo Humor** (obrigatório, 1-5)
  - 5 botões com emojis: 😢 😕 😐 😊 😄
  - Seleção visual clara (bg colorido)
  - Validação: não permite envio sem seleção
- [ ] **Campo Sono** (obrigatório, horas)
  - Placeholder "Horas de sono"
  - Input numérico 0-24
  - Validação: não permite envio vazio
- [ ] Botão **"Completar Check-in"**
  - Disabled até preencher obrigatórios
  - Hover effect (scale)
  - Loading state durante submissão

#### ✅ Estado: Completado
- [ ] Transição animada (AnimatePresence fade)
- [ ] Ícone CheckCircle2 grande (w-20 h-20)
- [ ] Confetti animation (opcional)
- [ ] Mensagem "Check-in realizado!"
- [ ] Badge "+10 XP recebidos" destacado
- [ ] Mensagem "Sua jornada está sendo registrada"

#### ✅ Interações
- [ ] Submissão chama `onSubmit(metric)` com dados corretos
- [ ] Toast de sucesso aparece após submissão
- [ ] Vibração tátil no mobile (se suportado)
- [ ] Estado persiste após reload da página

#### 📊 Testes Específicos
```javascript
// Cenário 1: Tentativa de envio incompleto
humor: null, sleep: ""
Esperado: Botão disabled, não permite submit

// Cenário 2: Preenchimento completo
weight: 75.5, mood: 4 (😊), sleep: 7
Esperado: Submit com sucesso, transição para estado completado, +10 XP

// Cenário 3: Já completado hoje
hasCheckedInToday: true
Esperado: Exibir diretamente estado completado com celebração
```

---

### 3️⃣ Dica Personalizada (PersonalizedTip)

**Objetivo:** Validar personalização e animações da dica IA

#### ✅ Personalização
- [ ] **Nome do usuário** aparece na dica quando disponível
- [ ] Dica muda baseada em **streak atual**:
  - streak >= 7: "Sequência incrível de X dias!"
  - streak < 3: "Comece uma sequência! Um dia de cada vez"
- [ ] Dica muda baseada em **horário do dia**:
  - 5h-12h: "manhã" → "Ótimo momento para treinar!"
  - 12h-18h: "tarde" → sugestão de treino tarde
  - 18h-22h: "noite" → sugestão de treino noite
- [ ] Dica baseada em **horário preferido** (se disponível)
- [ ] Fallback genérico se sem dados

#### ✅ Visual
- [ ] Card com border sutil (border-l-4)
- [ ] Ícone Lightbulb à esquerda
- [ ] Gradiente de cor por tipo de dica:
  - Streak celebration: orange-400 → red-500
  - Time preference: purple-400 → pink-500
  - Morning motivation: amber-400 → orange-500
  - Evening motivation: blue-400 → indigo-500
  - Default: green-400 → emerald-500

#### ✅ Animações
- [ ] **Ícone rotativo** contínuo (rotate 0→10→-10→0, repeat infinity)
- [ ] **Scale pulse** no ícone (1→1.1→1)
- [ ] **Fade in** do card (opacity 0→1, duration 0.6s)
- [ ] Animações suaves sem causar distração

#### 📊 Testes Específicos
```javascript
// Cenário 1: Streak alto, manhã
context = { userName: "João", currentStreak: 10, hour: 8 }
Esperado: "João, sequência incrível de 10 dias! 🔥", gradiente orange

// Cenário 2: Sem streak, tarde
context = { userName: "Maria", currentStreak: 0, hour: 15 }
Esperado: "Comece uma sequência!", dica de treino tarde

// Cenário 3: Horário preferido próximo
context = { preferredTime: { hour: 18 }, hour: 17 }
Esperado: "Seu horário favorito está chegando! Prepare-se para treinar às 18h"
```

---

### 4️⃣ Resumo Semanal (WeeklySummary)

**Objetivo:** Validar cálculos e exibição de dados semanais

#### ✅ Dados dos 4 Pilares
- [ ] **Físico (Treinos)** 💪
  - Ícone Dumbbell azul
  - Current/Goal corretos (ex: 3/5)
  - Unidade "treinos"
  - Progress bar azul (blue-500)
  - Percentual visual correto
- [ ] **Nutricional** 🥗
  - Ícone Apple verde
  - Current/Goal corretos (ex: 18/21)
  - Unidade "refeições"
  - Progress bar verde (green-500)
- [ ] **Bem-estar** 💖
  - Ícone Heart rosa
  - Current/Goal corretos (ex: 4/7)
  - Unidade "práticas"
  - Progress bar rosa (pink-500)
- [ ] **Hidratação** 💧
  - Ícone Droplet ciano
  - Current/Goal corretos (ex: 5/7)
  - Unidade "dias"
  - Progress bar ciano (cyan-500)

#### ✅ Meta Global
- [ ] **Cálculo correto**: (total_current / total_goal) * 100
- [ ] **Progress bar com gradiente** (green → emerald)
- [ ] **Percentual exibido** ao lado da barra
- [ ] Animação de preenchimento (duration 1.5s)

#### ✅ Feedback Motivacional
- [ ] **90%+**: "Incrível! Você está arrasando! 🎉"
- [ ] **75-89%**: "Excelente trabalho! Continue assim! 🌟"
- [ ] **50-74%**: "Bom progresso! Falta pouco! 💪"
- [ ] **25-49%**: "Vamos com tudo essa semana! 🚀"
- [ ] **<25%**: "Cada passo conta. Vamos lá! 💙"

#### ✅ Integração com useDashboardStats
- [ ] Hook busca atividades dos últimos 7 dias
- [ ] Categorização correta por `activity_key`:
  - workoutKeys: treino, workout, exercise
  - nutritionKeys: meal, nutrition, food, refeicao
  - wellbeingKeys: meditation, yoga, mindfulness, meditacao
  - hydrationKeys: water, hydration, agua
- [ ] Conta atividades únicas por dia (não duplica)
- [ ] Loading state exibido enquanto carrega

#### 📊 Testes Específicos
```javascript
// Cenário 1: Semana completa
weeklyData = {
  workouts: { current: 5, goal: 5 },
  nutrition: { current: 21, goal: 21 },
  wellbeing: { current: 7, goal: 7 },
  hydration: { current: 7, goal: 7 }
}
Esperado: 100% global, "Incrível! Você está arrasando! 🎉"

// Cenário 2: Semana média
weeklyData = {
  workouts: { current: 3, goal: 5 },
  nutrition: { current: 15, goal: 21 },
  wellbeing: { current: 4, goal: 7 },
  hydration: { current: 5, goal: 7 }
}
Esperado: ~67% global, "Bom progresso! Falta pouco! 💪"

// Cenário 3: Início de semana
weeklyData = {
  workouts: { current: 1, goal: 5 },
  nutrition: { current: 5, goal: 21 },
  wellbeing: { current: 0, goal: 7 },
  hydration: { current: 2, goal: 7 }
}
Esperado: ~20% global, "Cada passo conta. Vamos lá! 💙"
```

---

### 5️⃣ Action Cards (ActionCard)

**Objetivo:** Validar aparência, animações e navegação dos cards

#### ✅ 4 Cards Principais
- [ ] **Chat Coach** 💬
  - Gradiente: blue-500 → indigo-600
  - Badge "Online" (green dot)
  - Ícone MessageSquare
  - Navega para `/coach`
- [ ] **Meus Planos** 📋
  - Gradiente: purple-500 → pink-600
  - Badge dinâmico (ex: "3 ativos")
  - Ícone ClipboardList
  - Navega para `/plans`
- [ ] **Atividades** ✅
  - Gradiente: green-500 → emerald-600
  - Badge "Ativo"
  - Ícone CheckSquare
  - Navega para `/activities`
- [ ] **Comunidade** 👥
  - Gradiente: orange-500 → red-600
  - Badge "3 novos" (notificações)
  - Ícone Users
  - Navega para `/community`

#### ✅ Visual
- [ ] **Gradientes vibrantes** sem banding
- [ ] **Shadow** sutil (shadow-md) por padrão
- [ ] **Badge** no canto superior direito
  - Backdrop blur (bg-white/20)
  - Texto branco legível
  - Posição absolute correta
- [ ] **Ícone** centralizado, tamanho adequado (w-12 h-12)
- [ ] **Título** bold e legível
- [ ] **Descrição** text-sm com opacidade 0.9

#### ✅ Animações Hover
- [ ] **Scale 1.05** no hover do card
- [ ] **Lift -4px** (translateY) no hover
- [ ] **Shadow aumenta** para shadow-2xl
- [ ] **Ícone rotaciona 360°** no hover (duration 0.5s)
- [ ] **Arrow →** aparece/anima no hover
- [ ] Animações com spring physics suaves

#### ✅ Navegação
- [ ] Clique no card navega para rota correta
- [ ] Cursor pointer visível
- [ ] WhileTap scale 0.98 (feedback tátil)
- [ ] Navegação instantânea sem delay

#### 📊 Testes Específicos
```javascript
// Cenário 1: Hover em cada card
Ação: Mouse over em cada um dos 4 cards
Esperado: Scale up, lift, shadow, ícone rotaciona, arrow aparece

// Cenário 2: Click e navegação
Ação: Clicar em "Chat Coach"
Esperado: WhileTap scale 0.98, navega para /coach

// Cenário 3: Badge dinâmico
hasPlans: true, plansCount: 5
Esperado: Badge "5 ativos" aparece no card Meus Planos
```

---

### 6️⃣ Hook useDashboardStats

**Objetivo:** Validar busca e processamento de dados reais

#### ✅ Busca no Supabase
- [ ] Query correta: `daily_activities` com `.gte('created_at', sevenDaysAgo)`
- [ ] Filtro por `user_id` do contexto Auth
- [ ] Ordenação por data (mais recentes primeiro)
- [ ] Tratamento de erros (try/catch)

#### ✅ Categorização de Atividades
- [ ] **workoutKeys** identifica: treino, workout, exercise, corrida, musculacao
- [ ] **nutritionKeys** identifica: meal, nutrition, food, refeicao, dieta
- [ ] **wellbeingKeys** identifica: meditation, yoga, mindfulness, meditacao, respiracao
- [ ] **hydrationKeys** identifica: water, hydration, agua, hidratacao
- [ ] Atividades não categorizadas vão para "other"
- [ ] Case-insensitive matching funciona

#### ✅ Cálculos
- [ ] **Conta única por dia/categoria** (não duplica)
- [ ] **Goals padrão** corretos: workouts: 5, nutrition: 21, wellbeing: 7, hydration: 7
- [ ] **completionsCount** conta plan_completions distintos
- [ ] **interactionsCount** conta interações coach
- [ ] **hasPlans** detecta user_plans ativos

#### ✅ Estados
- [ ] **loading: true** durante fetch
- [ ] **loading: false** após dados carregados
- [ ] **error** capturado e logado
- [ ] **weeklyData** retorna estrutura correta
- [ ] **reload()** function disponível para atualização manual

#### 📊 Testes Específicos
```javascript
// Cenário 1: Usuário com 7 dias de dados
daily_activities = [
  { created_at: '2025-11-12', activity_key: 'treino_perna' },
  { created_at: '2025-11-12', activity_key: 'meal_almoco' },
  { created_at: '2025-11-11', activity_key: 'water_intake' },
  // ... mais 4 dias
]
Esperado: workouts: {current: 1}, nutrition: {current: 1}, hydration: {current: 1}

// Cenário 2: Usuário novo (sem dados)
daily_activities = []
Esperado: workouts: {current: 0}, todos goals padrão, loading: false

// Cenário 3: Erro no fetch
Supabase retorna erro
Esperado: console.error logado, loading: false, weeklyData com valores padrão
```

---

### 7️⃣ Responsividade

**Objetivo:** Validar layout em diferentes tamanhos de tela

#### ✅ Mobile (375px - 767px)
- [ ] **Hero Gamification**
  - Título reduz para text-3xl
  - Badge pontos empilha abaixo em telas < 400px
  - Progress bar mantém largura responsiva
  - Streaks ficam em coluna (flex-col) < 500px
- [ ] **Check-in CTA**
  - Form fields ocupam 100% width
  - Botões humor reduzem size (3rem → 2.5rem)
  - Padding ajustado (p-4 → p-3)
- [ ] **Weekly Summary**
  - Progress items em coluna (space-y-3)
  - Labels truncam se necessário
  - Meta global em coluna
- [ ] **Action Cards**
  - Grid 1 coluna (grid-cols-1)
  - Cards ocupam largura total
  - Espaçamento adequado (gap-4)
- [ ] **Scrolling vertical** suave
- [ ] **Textos legíveis** sem zoom

#### ✅ Tablet (768px - 1023px)
- [ ] **Grid 2 colunas** nos Action Cards
- [ ] **Hero mantém layout horizontal**
- [ ] **Check-in form** inline com inputs lado a lado
- [ ] **Weekly Summary** 2 colunas de progress items

#### ✅ Desktop (1024px+)
- [ ] **Layout completo** com toda hierarquia visível
- [ ] **Grid 4 colunas** nos Action Cards (se tiver 4+)
- [ ] **Espaçamentos generosos** (p-6, gap-6)
- [ ] **Max-width container** para não esticar demais (max-w-7xl)
- [ ] **Sidebar** (se houver) coexiste sem conflito

#### 📊 Testes Específicos
```
DevTools Responsive Mode:
1. iPhone SE (375x667) - Validar todos componentes
2. iPad (768x1024) - Validar grid 2 colunas
3. MacBook Pro (1440x900) - Validar layout completo
4. 4K (3840x2160) - Validar max-width não estica demais
```

---

### 8️⃣ Animações Framer Motion

**Objetivo:** Validar performance e suavidade das animações

#### ✅ Animações de Entrada
- [ ] **HeroGamification**: fade + slide up (duration 0.5s)
- [ ] **CheckinCTA**: fade in (duration 0.4s)
- [ ] **PersonalizedTip**: fade in com delay (0.6s)
- [ ] **WeeklySummary**: slide up staggered (cada item +0.1s delay)
- [ ] **ActionCards**: grid fade in staggered

#### ✅ Animações Interativas
- [ ] **Hover cards**: scale 1.05 + lift smooth
- [ ] **Click buttons**: scale 0.98 whileTap
- [ ] **Progress bars**: width animate ease-out
- [ ] **Badge XP pulse**: scale 1→1.1→1 infinite (2s duration)
- [ ] **Ícone dica**: rotate + scale repeat

#### ✅ Transições de Estado
- [ ] **AnimatePresence** no check-in (fade out → fade in)
- [ ] **Exit animations** quando componente desmonta
- [ ] **Layout animations** quando ordem muda (se aplicável)

#### ✅ Performance
- [ ] **60 FPS** consistente (Chrome DevTools Performance)
- [ ] **Sem jank** durante animações
- [ ] **GPU acceleration** ativo (will-change CSS)
- [ ] **Animações pausam** quando tab não está visível
- [ ] **Reduced motion** respeitado (prefers-reduced-motion CSS)

#### 📊 Testes Específicos
```
Chrome DevTools > Performance:
1. Iniciar gravação
2. Navegar para /dashboard
3. Hover em todos cards
4. Submit check-in
5. Parar gravação
Esperado: FPS Graph sempre em 60fps, sem quedas
```

---

### 9️⃣ Integração com Contextos

**Objetivo:** Validar comunicação entre componentes e contextos

#### ✅ GamificationContext
- [ ] **useGamification()** retorna dados corretos:
  - level, total_points, current_streak, longest_streak
- [ ] **Atualização em tempo real** após ações
- [ ] **addPoints()** incrementa total_points
- [ ] **updateStreak()** atualiza current/longest_streak
- [ ] **Loading state** durante fetch inicial

#### ✅ CheckinsContext
- [ ] **hasCheckedInToday** retorna boolean correto
- [ ] **addDailyMetric()** salva check-in no banco
- [ ] **CheckinCTA** reflete estado imediatamente após submit
- [ ] **Persistência** após reload da página

#### ✅ AuthContext
- [ ] **userName** disponível para personalização
- [ ] **userId** usado em queries do Supabase
- [ ] **Redirect para login** se não autenticado
- [ ] **Profile data** carregado corretamente

#### ✅ useDashboardStats Hook
- [ ] **Integra com Supabase** corretamente
- [ ] **Passa dados** para WeeklySummary
- [ ] **Reload()** recarrega dados quando chamado
- [ ] **Loading state** sincronizado

#### 📊 Testes Específicos
```javascript
// Cenário 1: Ação aumenta XP
Ação: Completar check-in (+10 XP)
Esperado: HeroGamification atualiza total_points imediatamente

// Cenário 2: Streak atualiza
Ação: Check-in em dia consecutivo
Esperado: current_streak incrementa, mensagem "Sequência incrível!" aparece

// Cenário 3: Dados persistem
Ação: Recarregar página (F5)
Esperado: Todos dados mantidos, não reseta para defaults
```

---

### 🔟 Bugs e Melhorias

**Objetivo:** Documentar problemas encontrados e sugestões

#### 🐛 Bugs Encontrados
- [ ] Bug #1: ___________________
  - **Descrição**: 
  - **Passos para reproduzir**:
  - **Comportamento esperado**:
  - **Prioridade**: Alta/Média/Baixa

- [ ] Bug #2: ___________________
  - **Descrição**: 
  - **Passos para reproduzir**:
  - **Comportamento esperado**:
  - **Prioridade**: Alta/Média/Baixa

#### 💡 Melhorias Sugeridas
- [ ] Melhoria #1: ___________________
  - **Descrição**: 
  - **Benefício esperado**:
  - **Prioridade**: Alta/Média/Baixa

- [ ] Melhoria #2: ___________________
  - **Descrição**: 
  - **Benefício esperado**:
  - **Prioridade**: Alta/Média/Baixa

#### ♿ Acessibilidade
- [ ] **Contraste de cores** adequado (WCAG AA mínimo)
- [ ] **Navegação por teclado** funciona (Tab, Enter, Esc)
- [ ] **Screen reader** lê conteúdo corretamente
- [ ] **Focus indicators** visíveis em todos elementos interativos
- [ ] **ARIA labels** presentes em ícones
- [ ] **Alt text** em imagens (se houver)

---

## 📊 RESUMO EXECUTIVO

**Total de Testes:** 150+ checkpoints  
**Categorias:** 10  
**Prioridade:**
- 🔴 P0 (Crítico): Funcionalidades core (Hero, Check-in, Stats)
- 🟡 P1 (Alto): Animações, responsividade
- 🟢 P2 (Médio): Acessibilidade, otimizações

**Tempo Estimado:** 2-3 horas de testes manuais completos

---

## 📝 INSTRUÇÕES DE USO

1. **Abrir Dashboard**: `http://localhost:5173/dashboard`
2. **Abrir DevTools**: F12 (Chrome/Edge/Firefox)
3. **Ativar Responsive Mode**: Ctrl+Shift+M (Cmd+Shift+M no Mac)
4. **Testar cada seção** seguindo checkpoints acima
5. **Marcar ✅** itens validados
6. **Documentar 🐛** bugs encontrados
7. **Registrar 💡** sugestões de melhoria

---

**Status Final:** ⬜ Aguardando Execução

**Atualizado em:** 12/11/2025 10:35
