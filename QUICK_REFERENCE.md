# ⚡ QUICK REFERENCE - VIDA SMART COACH

**Guia Rápido de Comandos e Status**

---

## 🚀 COMANDOS ESSENCIAIS

### Desenvolvimento
```bash
pnpm dev              # Servidor local (http://localhost:5173)
pnpm build            # Build para produção
pnpm preview          # Preview do build local
```

### Linting & Qualidade
```bash
# Ver warnings
pnpm exec eslint . --ext .js,.jsx,.ts,.tsx

# Corrigir automaticamente
pnpm exec eslint . --ext .js,.jsx,.ts,.tsx --fix

# Verificar apenas um arquivo
pnpm exec eslint src/path/to/file.tsx
```

### Deploy
```bash
pnpm deploy           # Deploy completo (migrate + build + deploy)
vercel                # Deploy rápido (Vercel CLI)
vercel --prod         # Deploy direto para produção
```

### Migrações
```bash
pnpm migrate          # Migrações locais
pnpm migrate:supabase # Migrações no Supabase Cloud
```

### Git
```bash
git status            # Status atual
git add .             # Adicionar todos os arquivos
git commit -m "..."   # Commit
git push              # Push para GitHub
```

---

## 📊 STATUS ATUAL - RESUMO

```
Status Geral:     🟢 OPERACIONAL
Build:            ✅ 6.8s
Warnings:         ⚠️  80 (não críticos)
TypeScript:       25% (47/189 arquivos)
Testes:           ❌ 0 testes
Score:            78/100 🟡
```

---

## 🔝 TOP 4 ARQUIVOS PARA CORRIGIR

```
1. src/contexts/SupabaseAuthContext.jsx          (8 warnings)
2. src/components/auth/AuthProvider.tsx          (7 warnings)
3. src/pages/LandingPage_ClienteFinal.jsx        (7 warnings)
4. src/contexts/data/GamificationContext.jsx     (2 warnings)
```

**Como corrigir:**
```bash
# Abrir arquivo
code src/contexts/SupabaseAuthContext.jsx

# Ver warnings específicos
pnpm exec eslint src/contexts/SupabaseAuthContext.jsx

# Tentar fix automático
pnpm exec eslint src/contexts/SupabaseAuthContext.jsx --fix
```

---

## 📋 WARNINGS POR TIPO

```
Tipo                            Quantidade    %
─────────────────────────────────────────────────
react-hooks/exhaustive-deps     48           60%
no-unused-vars                  18           22.5%
jsx-a11y/anchor-is-valid        12           15%
typescript-eslint/no-unused     2            2.5%
```

---

## 🔗 LINKS RÁPIDOS

### Produção
- 🌐 Site: https://www.appvidasmart.com
- 🗄️ Supabase: https://supabase.com/dashboard/project/zzugbgoylwbaojdnunuz
- 🚀 Vercel: https://vercel.com/agenciaclimb/vida-smart-coach
- 💻 GitHub: https://github.com/agenciaclimb/vida-smart-coach

### Documentação Local
```bash
# Abrir documentos
code DIAGNOSTICO_GERAL_SISTEMA.md      # Diagnóstico completo
code DIAGNOSTICO_TECNICO_ACOES.md      # Ações técnicas
code DASHBOARD_STATUS.md               # Dashboard visual
code RESUMO_EXECUTIVO.md               # Resumo gerencial
code docs/documento_mestre_*.md        # Spec do projeto
```

---

## 🎯 PRÓXIMAS AÇÕES

### Hoje
```bash
# 1. Corrigir warnings automaticamente
pnpm exec eslint . --ext .js,.jsx,.ts,.tsx --fix

# 2. Verificar resultado
pnpm exec eslint . --ext .js,.jsx,.ts,.tsx 2>&1 | tail -10

# 3. Revisar mudanças
git diff

# 4. Commit
git add .
git commit -m "fix: corrige warnings de linting"
git push
```

### Esta Semana
- [ ] Remover 18 variáveis não utilizadas
- [ ] Corrigir 4 arquivos principais
- [ ] Validar .env.local
- [ ] Meta: Reduzir de 80 para < 20 warnings

---

## 🆘 TROUBLESHOOTING

### Build Falha
```bash
rm -rf node_modules dist .vite
pnpm install
pnpm build
```

### Dev Server Não Inicia
```bash
# Verificar porta em uso
lsof -i :5173
kill -9 <PID>

# Ou usar porta diferente
pnpm dev --port 3000
```

### Warnings de TypeScript
```bash
# Verificar config
cat tsconfig.json

# Forçar build sem type check
pnpm build --no-typecheck
```

### Deploy Falha
```bash
# Ver logs do Vercel
vercel logs

# Rollback último deploy
vercel rollback
```

### Supabase Não Conecta
```bash
# Verificar .env.local
cat .env.local | grep VITE_SUPABASE

# Testar conexão
node -e "console.log(process.env.VITE_SUPABASE_URL)"
```

---

## 📞 COMANDOS DE EMERGÊNCIA

### Sistema Travado
```bash
pm2 restart all
pm2 logs
```

### Limpar Tudo
```bash
rm -rf node_modules dist .vite
pnpm install
```

### Resetar Branch
```bash
git fetch origin
git reset --hard origin/main
```

### Verificar Saúde
```bash
# Build
pnpm build

# Linting
pnpm exec eslint . --ext .js,.jsx,.ts,.tsx 2>&1 | tail -5

# Git
git status

# Supabase (se CLI configurado)
pnpm exec supabase status
```

---

## 🔢 NÚMEROS IMPORTANTES

```
Arquivos Total:       189
- TypeScript:         47 (25%)
- JavaScript:         142 (75%)

Bundle Size:          340 KB (gzipped)
Build Time:           6.8s
Warnings:             80
Migrações SQL:        38
Edge Functions:       9
Docs:                 37
```

---

## 📅 CRONOGRAMA RECOMENDADO

### Semana 1 (Hoje - 21/10)
- Corrigir warnings principais
- Score: 78 → 82

### Semanas 2-3 (21/10 - 04/11)
- Implementar testes
- Converter componentes UI
- Score: 82 → 88

### Semanas 4-7 (04/11 - 02/12)
- Concluir TypeScript
- Otimizar bundle
- Score: 88 → 94

---

## 💾 BACKUP & RESTORE

### Criar Backup
```bash
# Backup do código
git archive --format=zip HEAD > backup-$(date +%Y%m%d).zip

# Backup do .env
cp .env.local .env.backup-$(date +%Y%m%d)
```

### Restaurar de Backup
```bash
# Do arquivo
unzip backup-20251014.zip -d restore/

# Do git
git checkout <commit-hash>
```

---

## 🔐 VARIÁVEIS DE AMBIENTE

### Produção (.env.production)
```bash
VITE_SUPABASE_URL=https://zzugbgoylwbaojdnunuz.supabase.co
VITE_SUPABASE_ANON_KEY=<anon_key>
VITE_APP_BASE_URL=https://www.appvidasmart.com
VITE_APP_ENV=production
VITE_STRIPE_PUBLIC_KEY=pk_live_...
```

### Desenvolvimento (.env.local)
```bash
VITE_SUPABASE_URL=https://zzugbgoylwbaojdnunuz.supabase.co
VITE_SUPABASE_ANON_KEY=<anon_key>
VITE_APP_BASE_URL=http://localhost:5173
VITE_APP_ENV=development
VITE_DEBUG_MODE=true
VITE_STRIPE_PUBLIC_KEY=pk_test_...
```

---

## 📊 MÉTRICAS DE QUALIDADE

```
Categoria                 Atual    Meta     Status
──────────────────────────────────────────────────
Build Pass                ✅       ✅       🟢
Warnings                  80       < 10     🔴
TypeScript                25%      80%      🔴
Test Coverage             0%       70%      🔴
Bundle Size (gz)          340 KB   250 KB   🟡
Build Time                6.8s     < 10s    🟢
Documentação              90/100   90/100   🟢
──────────────────────────────────────────────────
Score Geral               78/100   90/100   🟡
```

---

## 🎓 PADRÕES DE CÓDIGO

### Naming
```typescript
// Componentes: PascalCase
const UserProfile = () => {...}

// Hooks: camelCase com use prefix
const useAuth = () => {...}

// Constantes: UPPER_SNAKE_CASE
const API_BASE_URL = "..."

// Variáveis: camelCase
const userName = "..."
```

### Imports
```typescript
// Ordem dos imports
import React from 'react'              // 1. External
import { Button } from '@/components'  // 2. Internal
import './styles.css'                  // 3. Styles
```

### TypeScript
```typescript
// Props interface
interface ButtonProps {
  label: string
  onClick: () => void
  disabled?: boolean
}

// Component
const Button: React.FC<ButtonProps> = ({ label, onClick, disabled }) => {
  return <button onClick={onClick} disabled={disabled}>{label}</button>
}
```

---

## ⚙️ CONFIGURAÇÕES

### VSCode Recomendadas
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

### Extensions Úteis
- ESLint
- Prettier
- TypeScript Error Translator
- GitLens
- Tailwind CSS IntelliSense

---

## 📚 RECURSOS ADICIONAIS

### Documentação
- React: https://react.dev
- TypeScript: https://www.typescriptlang.org
- Vite: https://vitejs.dev
- Supabase: https://supabase.com/docs
- Tailwind: https://tailwindcss.com

### Comunidade
- Discord Supabase
- Stack Overflow
- GitHub Issues

---

**Última Atualização:** 14/10/2025  
**Versão:** 1.0  
**Mantido por:** Equipe Vida Smart Coach
