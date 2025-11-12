# Correções Urgentes - Plano Tab

## Problemas Identificados:
1. ❌ Modal confuso (transparência/layout)
2. ❌ Abas Alimentar, Emocional, Espiritual com tela branca
3. ❌ Melhorias visuais não aparecendo

## Soluções:

### 1. Modal - Linha 455
```jsx
// ANTES (confuso):
<DialogContent className="p-0 sm:p-6 sm:max-w-lg w-full sm:rounded-xl rounded-none h-[100dvh] sm:h-auto overflow-y-auto">

// DEPOIS (limpo):
<DialogContent className="bg-white p-6 sm:max-w-lg w-full rounded-xl shadow-2xl overflow-y-auto max-h-[90vh]">
```

### 2. NutritionalPlanDisplay - Adicionar animações (linha 928+)
- Copiar estrutura do PhysicalPlanDisplay
- Adicionar motion.div no header
- Adicionar barra de progresso animada
- Adicionar card com borda lateral

### 3. EmotionalPlanDisplay - Adicionar animações  
- Mesma estrutura visual
- Gradiente rosa/roxo

### 4. SpiritualPlanDisplay - Adicionar animações
- Gradiente azul claro
- Mesma estrutura

## Prioridade: ALTA
Implementar agora!
