# 🔧 DIAGNÓSTICO TÉCNICO - AÇÕES IMEDIATAS

**Data:** 14 de Outubro de 2025  
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

#### 📄 Arquivo: `src/contexts/SupabaseAuthContext.jsx` (8 warnings)

**Problema:** Dependências incorretas em hooks

**Correção:**
```javascript
// ❌ ANTES
useCallback(() => {
  // código
}, [supabase]); // supabase não deve ser dependência

// ✅ DEPOIS
useCallback(() => {
  // código
}, []); // remover supabase das dependências
```

**Comandos:**
```bash
# Abrir arquivo
code src/contexts/SupabaseAuthContext.jsx

# Verificar warnings específicos
pnpm exec eslint src/contexts/SupabaseAuthContext.jsx
```

---

#### 📄 Arquivo: `src/components/auth/AuthProvider.tsx` (7 warnings)

**Problema:** Missing dependency 'supabase.auth'

**Correção:**
```typescript
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
}, [supabase.auth]); // adicionar dependência
// OU usar useMemo para estabilizar referência
```

---

#### 📄 Arquivo: `src/pages/LandingPage_ClienteFinal.jsx` (7 warnings)

**Problemas:**
1. Imports não utilizados
2. Variables não utilizadas
3. Links sem href

**Correções:**
```javascript
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
```

---

#### 📄 Arquivo: `src/contexts/data/GamificationContext.jsx` (2 warnings)

**Problema:** Missing dependencies em hooks

**Correção:**
```javascript
// Adicionar todas as funções que são chamadas dentro do hook
// nas dependências ou envolver em useCallback
```

---

### 2. Script de Correção Automática

```bash
#!/bin/bash
# save as: fix-warnings.sh

echo "🔧 Corrigindo warnings automaticamente..."

# Tentar correção automática
pnpm exec eslint . --ext .js,.jsx,.ts,.tsx --fix

# Verificar resultado
echo ""
echo "📊 Resultado:"
pnpm exec eslint . --ext .js,.jsx,.ts,.tsx 2>&1 | tail -5

echo ""
echo "✅ Correções aplicadas! Revisar mudanças com:"
echo "   git diff"
```

**Executar:**
```bash
chmod +x fix-warnings.sh
./fix-warnings.sh
```

---

### 3. Remover Variáveis Não Utilizadas (18 ocorrências)

**Lista de variáveis para remover:**

| Arquivo | Variável | Linha |
|---------|----------|-------|
| `EmergencyDashboard.tsx` | `BarChart3` | 3 |
| `EmergencyDashboard.tsx` | `navigate` | 7 |
| `LandingPage_ClienteFinal.jsx` | `useEffect` | 1 |
| `LandingPage_ClienteFinal.jsx` | `isMenuOpen` | 5 |
| `LandingPage_ClienteFinal.jsx` | `setIsMenuOpen` | 5 |
| `PartnerDashboard.jsx` | `commissionSummary` | 18 |
| `CommunityContext.jsx` | `toast` | 3 |
| (outros 11) | ... | ... |

**Script de verificação:**
```bash
# Encontrar todas as variáveis não utilizadas
pnpm exec eslint . --ext .js,.jsx,.ts,.tsx 2>&1 | \
  grep "is defined but never used" | \
  awk '{print $1}' | \
  sort -u

# Para cada uma, abrir arquivo e remover
```

---

## 🟡 AÇÕES MÉDIO PRAZO (Próximas 2 Semanas)

### 4. Converter Componentes UI para TypeScript

**Ordem de conversão (por complexidade):**

#### Fase 1 - Simples (1-2 dias)
- [ ] `badge.jsx` → `badge.tsx`
- [ ] `label.jsx` → `label.tsx`
- [ ] `progress.jsx` → `progress.tsx`
- [ ] `switch.jsx` → `switch.tsx`

**Template de conversão:**
```typescript
// badge.tsx
import * as React from "react"
import { type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    // implementação
  }
)
Badge.displayName = "Badge"

export { Badge, type BadgeProps }
```

#### Fase 2 - Médio (2-3 dias)
- [ ] `accordion.jsx` → `accordion.tsx`
- [ ] `alert-dialog.jsx` → `alert-dialog.tsx`
- [ ] `dialog.jsx` → `dialog.tsx`
- [ ] `popover.jsx` → `popover.tsx`

#### Fase 3 - Complexo (3-4 dias)
- [ ] `select.jsx` → `select.tsx`
- [ ] `tabs.jsx` → `tabs.tsx`
- [ ] `toast.jsx` → `toast.tsx`
- [ ] `tooltip.jsx` → `tooltip.tsx`

---

### 5. Implementar Testes Básicos

#### Instalar Vitest

```bash
# Instalar dependências
pnpm add -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom jsdom

# Criar configuração
cat > vitest.config.ts << 'EOF'
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
EOF

# Criar setup
mkdir -p src/test
cat > src/test/setup.ts << 'EOF'
import '@testing-library/jest-dom'
EOF
```

#### Adicionar Scripts de Teste

```json
// package.json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

#### Criar Primeiro Teste

```typescript
// src/components/ui/__tests__/button.test.tsx
import { render, screen } from '@testing-library/react'
import { Button } from '../button'

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('handles click events', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    screen.getByText('Click me').click()
    expect(handleClick).toHaveBeenCalledOnce()
  })
})
```

**Executar:**
```bash
pnpm test
```

---

## 🟢 AÇÕES LONGO PRAZO (Próximo Mês)

### 6. Otimização de Bundle

#### Análise Atual
- Bundle JS: 1,182 KB (340 KB gzipped)
- Target: < 250 KB gzipped

#### Estratégias

**1. Code Splitting por Rota:**
```typescript
// App.tsx
import { lazy, Suspense } from 'react'

// ❌ ANTES
import ClientDashboard from './pages/ClientDashboard'
import PartnerDashboard from './pages/PartnerDashboard'

// ✅ DEPOIS
const ClientDashboard = lazy(() => import('./pages/ClientDashboard'))
const PartnerDashboard = lazy(() => import('./pages/PartnerDashboard'))

// Usar com Suspense
<Suspense fallback={<LoadingFallback />}>
  <ClientDashboard />
</Suspense>
```

**2. Tree Shaking:**
```bash
# Analisar bundle
pnpm add -D rollup-plugin-visualizer

# Adicionar em vite.config.js
import { visualizer } from 'rollup-plugin-visualizer'

export default {
  plugins: [
    visualizer({ open: true })
  ]
}

# Build e ver relatório
pnpm build
```

**3. Imports Específicos:**
```typescript
// ❌ ANTES
import * as Icons from 'lucide-react' // importa TODOS os ícones

// ✅ DEPOIS
import { User, Settings, Bell } from 'lucide-react' // só o necessário
```

---

### 7. Melhorias de Segurança

#### Audit de Dependências
```bash
# Verificar vulnerabilidades
pnpm audit

# Corrigir automaticamente
pnpm audit --fix

# Atualizar dependências com vulnerabilidades
pnpm update
```

#### Validar .env.local
```bash
# Criar script de validação
cat > scripts/validate-env.mjs << 'EOF'
import fs from 'fs'

const envContent = fs.readFileSync('.env.local', 'utf-8')

// Verificar sintaxe inválida
const invalidSyntax = envContent.match(/\$env:/g)
if (invalidSyntax) {
  console.error('❌ Sintaxe inválida encontrada: $env:')
  process.exit(1)
}

// Verificar chaves duplicadas
const lines = envContent.split('\n').filter(l => l.trim() && !l.startsWith('#'))
const keys = lines.map(l => l.split('=')[0])
const duplicates = keys.filter((k, i) => keys.indexOf(k) !== i)

if (duplicates.length > 0) {
  console.error('❌ Chaves duplicadas:', [...new Set(duplicates)])
  process.exit(1)
}

console.log('✅ .env.local válido')
EOF

# Executar
node scripts/validate-env.mjs
```

---

## 📋 CHECKLIST DE VERIFICAÇÃO

### Diária
- [ ] Build passa sem erros: `pnpm build`
- [ ] Warnings de linting não aumentaram
- [ ] Commits seguem conventional commits
- [ ] PRs têm descrição clara

### Semanal
- [ ] Executar `pnpm audit`
- [ ] Revisar warnings de linting
- [ ] Verificar coverage de testes (quando implementado)
- [ ] Atualizar documentação se necessário

### Mensal
- [ ] Atualizar dependências: `pnpm update`
- [ ] Revisar bundle size
- [ ] Análise de performance
- [ ] Rotação de secrets (se necessário)

---

## 🆘 TROUBLESHOOTING COMUM

### Build Falha

```bash
# Limpar cache e reinstalar
rm -rf node_modules .vite dist
pnpm install
pnpm build
```

### Warnings de TypeScript

```bash
# Verificar configuração
cat tsconfig.json

# Ajustar strict mode se necessário
# "strict": false (atual)
# "strict": true (recomendado quando 100% TypeScript)
```

### Supabase CLI Não Funciona

```bash
# Verificar .env.local
cat .env.local | grep SUPABASE

# Validar sintaxe (sem $env:)
# Formato correto: CHAVE=valor

# Testar conexão
pnpm exec supabase status
```

---

## 📊 MÉTRICAS DE SUCESSO

### Curto Prazo (1 semana)
- ✅ Warnings reduzidos de 80 para < 20
- ✅ Top 4 arquivos sem warnings
- ✅ Build time < 7s

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

## 📞 CONTATOS E RECURSOS

**Documentação Principal:**
- Documento Mestre: `docs/documento_mestre_vida_smart_coach_final.md`
- Diagnóstico Completo: `DIAGNOSTICO_GERAL_SISTEMA.md`

**Links Úteis:**
- Supabase Dashboard: https://supabase.com/dashboard
- Vercel Dashboard: https://vercel.com
- GitHub Repo: https://github.com/agenciaclimb/vida-smart-coach

**Comandos Rápidos:**
```bash
pnpm dev          # Desenvolvimento
pnpm build        # Build
pnpm exec eslint . --fix  # Fix linting
```

---

**Última Atualização:** 14/10/2025  
**Próxima Revisão:** 21/10/2025  
**Status:** 🟢 Ativo
