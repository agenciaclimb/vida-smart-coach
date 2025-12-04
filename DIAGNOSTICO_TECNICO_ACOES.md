# 🔧 DIAGNÓSTICO TÉCNICO - AÇÕES IMEDIATAS

**Data:** 29 de Novembro de 2025  
**Tipo:** Plano de Ação Técnico  
**Prioridade:** Alta

---

## 🎯 RESUMO EXECUTIVO - 30 SEGUNDOS

**Status:** 🟢 Sistema Operacional  
**Problemas Críticos:** 0  
**Warnings:** 80 (não bloqueantes)  
**Ação Imediata:** Corrigir warnings de linting em 4 arquivos principais

---

## 🔴 AÇÕES IMEDIATAS (Hoje/Esta Semana)

### 1. Corrigir Top 4 Arquivos com Warnings

#### 📄 Arquivo: \`src/contexts/SupabaseAuthContext.jsx\` (8 warnings)

**Problema:** Dependências incorretas em hooks

**Correção:**
\`\`\`javascript
// ❌ ANTES
useCallback(() => {
  // código
}, [supabase]); // supabase não deve ser dependência

// ✅ DEPOIS
useCallback(() => {
  // código
}, []); // remover supabase das dependências
\`\`\`

---

#### 📄 Arquivo: \`src/components/auth/AuthProvider.tsx\` (7 warnings)

**Problema:** Missing dependency 'supabase.auth'

**Correção:**
\`\`\`typescript
// ❌ ANTES
useEffect(() => {
  const { data: authListener } = supabase.auth.onAuthStateChange(() => {
    // código
  });
}, []); // faltando supabase.auth

// ✅ DEPOIS
useEffect(() => {
  const { data: authListener } = supabase.auth.onAuthStateChange(() => {
    // código
  });
}, []); // eslint-disable-next-line react-hooks/exhaustive-deps
// Nota: supabase é estável (outer scope)
\`\`\`

---

#### 📄 Arquivo: \`src/pages/LandingPage_ClienteFinal.jsx\` (7 warnings)

**Problemas:**
1. Imports não utilizados
2. Variables não utilizadas
3. Links sem href

**Correções:**
\`\`\`javascript
// ❌ ANTES
import { useState, useEffect } from 'react'; // useEffect não usado
const [isMenuOpen, setIsMenuOpen] = useState(false); // não usado

<a href="#">Link</a> // href inválido

// ✅ DEPOIS
import { useState } from 'react'; // remover useEffect
// Remover isMenuOpen se não for usado

<a href="/pagina-destino">Link</a> // href válido
// OU
<button onClick={handleClick}>Link</button> // usar button
\`\`\`

---

### 2. Script de Correção Automática

\`\`\`bash
#!/bin/bash
# Corrigir warnings automaticamente

echo "🔧 Corrigindo warnings automaticamente..."

# Tentar correção automática
pnpm exec eslint . --ext .js,.jsx,.ts,.tsx --fix

# Verificar resultado
echo ""
echo "📊 Resultado:"
pnpm exec eslint . --ext .js,.jsx,.ts,.tsx 2>&1 | tail -5
\`\`\`

---

## 🟡 AÇÕES MÉDIO PRAZO (Próximas 2 Semanas)

### 3. Converter Componentes UI para TypeScript

**Ordem de conversão (por complexidade):**

#### Fase 1 - Simples (1-2 dias)
- [ ] \`badge.jsx\` → \`badge.tsx\`
- [ ] \`label.jsx\` → \`label.tsx\`
- [ ] \`progress.jsx\` → \`progress.tsx\`
- [ ] \`switch.jsx\` → \`switch.tsx\`

#### Fase 2 - Médio (2-3 dias)
- [ ] \`accordion.jsx\` → \`accordion.tsx\`
- [ ] \`alert-dialog.jsx\` → \`alert-dialog.tsx\`
- [ ] \`dialog.jsx\` → \`dialog.tsx\`
- [ ] \`popover.jsx\` → \`popover.tsx\`

#### Fase 3 - Complexo (3-4 dias)
- [ ] \`select.jsx\` → \`select.tsx\`
- [ ] \`tabs.jsx\` → \`tabs.tsx\`
- [ ] \`toast.jsx\` → \`toast.tsx\`
- [ ] \`tooltip.jsx\` → \`tooltip.tsx\`

---

### 4. Implementar Testes Básicos

#### Instalar Vitest

\`\`\`bash
# Instalar dependências
pnpm add -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom jsdom

# Criar configuração
cat > vitest.config.ts << 'VITECONFIG'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
VITECONFIG
\`\`\`

---

## 📋 CHECKLIST DE VERIFICAÇÃO

### Diária
- [ ] Build passa sem erros: \`pnpm build\`
- [ ] Warnings de linting não aumentaram
- [ ] Commits seguem conventional commits

### Semanal
- [ ] Executar \`pnpm audit\`
- [ ] Revisar warnings de linting
- [ ] Atualizar documentação se necessário

### Mensal
- [ ] Atualizar dependências: \`pnpm update\`
- [ ] Revisar bundle size
- [ ] Análise de performance

---

## 📊 MÉTRICAS DE SUCESSO

### Curto Prazo (1 semana)
- ✅ Warnings reduzidos de 80 para < 20
- ✅ Top 4 arquivos sem warnings
- ✅ Build time < 10s

### Médio Prazo (2 semanas)
- ✅ 50% dos componentes UI em TypeScript
- ✅ Framework de testes implementado
- ✅ > 10 testes unitários passando

### Longo Prazo (1 mês)
- ✅ 90% do código em TypeScript
- ✅ Bundle size < 300 KB gzipped
- ✅ Coverage > 60%
- ✅ Zero warnings de linting

---

**Última Atualização:** 29/11/2025  
**Próxima Revisão:** 06/12/2025  
**Status:** 🟢 Ativo
