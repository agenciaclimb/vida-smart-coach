# 🧪 Plano de Testes - Meu Plano V2

**Data:** 12/11/2025  
**Versão:** 2.0 (com melhorias de UX)  
**Status:** 🔄 Em Teste

---

## 📋 Checklist de Testes

### 1. ✅ **Empty State (Sem Planos)**

#### 1.1 Layout e Visual
- [ ] Card com borda tracejada aparece corretamente
- [ ] Gradiente (verde → azul → roxo) renderiza bem
- [ ] Ícone Sparkles animado com escala/spring physics
- [ ] Título com animação de entrada (fade + slide up)
- [ ] Descrição com delay de animação
- [ ] Indicador de pulso verde animado
- [ ] Responsivo em mobile e desktop

#### 1.2 Botões de Ação
- [ ] Botão "Gerar Meus Planos de Transformação" visível
- [ ] Hover effect (scale 1.05) funcionando
- [ ] Tap effect (scale 0.95) funcionando
- [ ] Gradiente vida-smart aplicado
- [ ] Loading spinner quando gerando
- [ ] Botão "Gerar Plano Manualmente" com outline
- [ ] Modal de geração manual abre corretamente

#### 1.3 Componentes de Contexto
- [ ] GamificationDisplay aparece acima
- [ ] CheckinSystem renderiza corretamente
- [ ] Ambos têm skeletons durante loading

---

### 2. 🏋️ **Plano Físico - PhysicalPlanDisplay**

#### 2.1 Header do Plano
- [ ] Card com gradiente (azul → roxo → rosa)
- [ ] Ícone Dumbbell com backdrop blur
- [ ] Título e descrição visíveis
- [ ] Botão "Dar Feedback" funcionando
- [ ] Modal de feedback abre corretamente

#### 2.2 Barra de Progresso
- [ ] Card com borda lateral azul
- [ ] Ícone de troféu presente
- [ ] Porcentagem calculada corretamente
- [ ] Animação de preenchimento suave (0 → X%)
- [ ] Gradiente na barra (azul → roxo)
- [ ] Mensagem "🎉 Parabéns! Plano completo!" quando 100%
- [ ] Contadores (completados/total) precisos

#### 2.3 Seletor de Semanas
- [ ] Card com ícone Target no título
- [ ] Botões de semana renderizam (Semana 1, 2, 3, 4)
- [ ] Hover effect (scale 1.05) em cada botão
- [ ] Tap effect (scale 0.95) funcionando
- [ ] Semana ativa tem gradiente vida-smart
- [ ] Checkmark "✓" aparece na semana ativa
- [ ] Transição suave ao trocar semana
- [ ] Responsivo (flex-wrap em mobile)

#### 2.4 Accordion de Treinos
- [ ] Lista de treinos da semana ativa
- [ ] Cada treino tem ícone Activity
- [ ] Título (Segunda, Terça, etc.) e nome do treino
- [ ] Accordion abre/fecha corretamente
- [ ] Lista de exercícios dentro do accordion
- [ ] Cada exercício tem checkbox de completar
- [ ] Séries × repetições × descanso exibidos
- [ ] Notas (💡) aparecem quando presentes

#### 2.5 Completar Exercícios
- [ ] Checkbox marca/desmarca corretamente
- [ ] +10 XP adicionado ao completar
- [ ] Toast de sucesso aparece
- [ ] Estado persiste após reload
- [ ] Barra de progresso atualiza em tempo real
- [ ] Animação no checkbox ao marcar
- [ ] Loading state durante processamento

#### 2.6 Feedback do Plano
- [ ] Botão "Dar Feedback" abre modal
- [ ] Textarea aceita texto
- [ ] Validação (não permite vazio)
- [ ] Envio salva no Supabase (plan_feedback)
- [ ] Toast de sucesso após enviar
- [ ] Redireciona para Chat após 1s
- [ ] Mensagem pré-preenchida no chat

---

### 3. 🥗 **Plano Alimentar - NutritionalPlanDisplay**

#### 3.1 Estrutura Geral
- [ ] Header com gradiente verde
- [ ] Ícone Leaf presente
- [ ] Título e descrição corretos
- [ ] Botão de feedback funcionando

#### 3.2 Refeições
- [ ] Lista de refeições (Café, Almoço, Jantar, Lanches)
- [ ] Accordion funciona para cada refeição
- [ ] Checkboxes para marcar alimentos
- [ ] +5 XP por alimento completado
- [ ] Progresso atualiza

---

### 4. 💆 **Plano Emocional - EmotionalPlanDisplay**

#### 4.1 Estrutura Geral
- [ ] Header com gradiente rosa/roxo
- [ ] Ícone Heart presente
- [ ] Práticas de bem-estar listadas

#### 4.2 Práticas
- [ ] Lista de práticas (meditação, journaling, etc.)
- [ ] Checkboxes funcionam
- [ ] +15 XP por prática
- [ ] Frequência recomendada visível

---

### 5. 🧘 **Plano Espiritual - SpiritualPlanDisplay**

#### 5.1 Estrutura Geral
- [ ] Header com gradiente azul claro
- [ ] Ícone Wind/Droplet presente
- [ ] Práticas espirituais listadas

#### 5.2 Práticas
- [ ] Lista de práticas renderiza
- [ ] Checkboxes funcionam
- [ ] +20 XP por prática
- [ ] Progresso atualiza

---

### 6. 📑 **Sistema de Tabs (4 Áreas)**

#### 6.1 TabsList
- [ ] Grid 4 colunas (Físico, Alimentar, Emocional, Espiritual)
- [ ] Ícones corretos em cada tab
- [ ] Tab ativa tem indicador visual
- [ ] Transição suave ao trocar
- [ ] Responsivo em mobile (scroll horizontal)

#### 6.2 TabsContent
- [ ] Conteúdo correto para cada área
- [ ] Botão "Gerar Novo Plano [Área]" presente
- [ ] Modal de regeneração funciona
- [ ] Mensagem "Plano não disponível" quando vazio

---

### 7. 🎮 **Gamificação Integrada**

#### 7.1 GamificationDisplay
- [ ] Card com gradiente roxo/rosa
- [ ] Total de pontos exibido
- [ ] Nível atual correto
- [ ] Streak days atualizado
- [ ] Barra de progresso para próximo nível
- [ ] Conquistas recentes (badges)
- [ ] Loading skeleton durante carregamento

---

### 8. ✨ **Geração de Planos**

#### 8.1 Geração Automática (IA)
- [ ] Botão "Gerar Meus Planos" visível
- [ ] Valida perfil completo antes
- [ ] Loading spinner durante geração
- [ ] Toast de erro se perfil incompleto
- [ ] Toast de sucesso ao completar
- [ ] +30 XP registrado como atividade
- [ ] 4 planos criados simultaneamente

#### 8.2 Geração Manual
- [ ] Modal abre com select de área
- [ ] Perguntas dinâmicas por área
- [ ] Validação de campos obrigatórios
- [ ] Textarea para perguntas longas
- [ ] Botão "Gerar Plano" submete
- [ ] Loading state durante geração
- [ ] Modal fecha após sucesso

#### 8.3 Regeneração de Plano
- [ ] Botão "Gerar Novo Plano [Área]" aparece
- [ ] Modal com perguntas da área
- [ ] Formulário pré-preenchido (se houver)
- [ ] Regenera apenas a área selecionada
- [ ] Mantém outras áreas intactas

---

### 9. 🎨 **Animações e Micro-interações**

#### 9.1 Empty State
- [ ] Ícone com animação de scale (spring)
- [ ] Título com fade + slide up
- [ ] Descrição com delay progressivo
- [ ] Pulso animado contínuo
- [ ] Botões com hover/tap effects

#### 9.2 Seletor de Semanas
- [ ] Hover: scale 1.05
- [ ] Tap: scale 0.95
- [ ] Checkmark aparece com scale animation
- [ ] Transição de cor suave
- [ ] Layout animation no indicador

#### 9.3 Barra de Progresso
- [ ] Animação de width (0 → X%)
- [ ] Duração: 0.8s
- [ ] Easing: easeOut
- [ ] Mensagem de parabéns com scale
- [ ] Gradiente animado

#### 9.4 Cards e Accordions
- [ ] Cards com animação de entrada (fade + y)
- [ ] Accordion abre/fecha suavemente
- [ ] Checkboxes com transition
- [ ] Hover states em botões

---

### 10. 📱 **Responsividade**

#### 10.1 Mobile (<768px)
- [ ] Empty state ocupa largura total
- [ ] Botões empilham verticalmente
- [ ] Seletor de semanas com flex-wrap
- [ ] Tabs com scroll horizontal
- [ ] Modal full-height
- [ ] Padding adequado

#### 10.2 Tablet (768px - 1024px)
- [ ] Layout intermediário funcional
- [ ] Tabs em grid 4 colunas
- [ ] Seletor de semanas em linha
- [ ] Botões em flexbox horizontal

#### 10.3 Desktop (>1024px)
- [ ] Layout otimizado
- [ ] Sem scroll horizontal desnecessário
- [ ] Hover states visíveis
- [ ] Animações fluidas

---

### 11. ♿ **Acessibilidade**

#### 11.1 ARIA
- [ ] role="button" em cards clicáveis
- [ ] aria-label em checkboxes
- [ ] aria-selected em tabs
- [ ] aria-live em feedbacks
- [ ] aria-busy durante loading

#### 11.2 Teclado
- [ ] Tab navega pelos botões
- [ ] Enter/Space ativa botões
- [ ] Escape fecha modais
- [ ] Focus visible em elementos

#### 11.3 Screen Readers
- [ ] Labels descritivos
- [ ] Status de progresso anunciado
- [ ] Botões com texto claro
- [ ] Ícones decorativos com aria-hidden

---

### 12. 🔄 **Estados de Loading**

#### 12.1 Skeletons
- [ ] PlanHeaderSkeleton durante carregamento
- [ ] PlanWeeksSkeleton para seletor
- [ ] PlanWorkoutsSkeleton para lista
- [ ] PlanGamificationSkeleton para gamificação
- [ ] Todos com animate-pulse

#### 12.2 Loading Spinners
- [ ] Spinner em botão durante geração
- [ ] Spinner em GamificationDisplay
- [ ] Mensagem de "Carregando..."

---

### 13. 🐛 **Testes de Erro**

#### 13.1 Erros de API
- [ ] Toast de erro quando Supabase falha
- [ ] Retry disponível
- [ ] Mensagem clara do erro
- [ ] Não quebra a interface

#### 13.2 Dados Inválidos
- [ ] Plano sem weeks não quebra
- [ ] Plano sem exercises mostra vazio
- [ ] Plano sem plan_data mostra mensagem
- [ ] currentPlans null tratado

#### 13.3 Validações
- [ ] Perfil incompleto bloqueia geração
- [ ] Feedback vazio não envia
- [ ] Formulário manual valida campos

---

## 🎯 Critérios de Aceitação

### Obrigatórios (Bloqueantes)
- ✅ Empty state renderiza sem erros
- ✅ Planos carregam corretamente
- ✅ Checkboxes marcam/desmarcam
- ✅ XP é adicionado ao completar
- ✅ Progresso calcula corretamente
- ✅ Animações não causam lag
- ✅ Responsivo em mobile/desktop

### Desejáveis (Não-bloqueantes)
- ✅ Todas as animações suaves
- ✅ Micro-interações presentes
- ✅ Accessibility completa
- ✅ Skeletons durante loading
- ✅ Empty states com qualidade

---

## 📊 Métricas de Sucesso

| Métrica | Target | Status |
|---------|--------|--------|
| Tempo de carregamento | < 2s | 🔄 |
| FPS durante animações | 60 | 🔄 |
| Taxa de erro | < 1% | 🔄 |
| Lighthouse Accessibility | 90+ | 🔄 |
| Completude de testes | 100% | 🔄 |

---

## 🚀 Próximos Passos

1. [ ] Executar todos os testes acima
2. [ ] Documentar bugs encontrados
3. [ ] Corrigir bugs críticos
4. [ ] Re-testar após correções
5. [ ] Deploy para produção
6. [ ] Monitorar métricas pós-deploy

---

**Testador:** GitHub Copilot  
**Ambiente:** Desenvolvimento Local  
**Browser:** Chrome Latest
