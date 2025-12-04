# ⚡ QUICK REFERENCE - VIDA SMART COACH

**Guia Rápido de Comandos e Status**  
**Atualizado:** 29/11/2025

---

## 🚀 COMANDOS ESSENCIAIS

### Desenvolvimento
\`\`\`bash
pnpm dev              # Servidor local (http://localhost:5173)
pnpm build            # Build para produção
pnpm preview          # Preview do build local
\`\`\`

### Linting & Qualidade
\`\`\`bash
# Ver warnings
pnpm exec eslint . --ext .js,.jsx,.ts,.tsx

# Corrigir automaticamente
pnpm exec eslint . --ext .js,.jsx,.ts,.tsx --fix

# Verificar apenas um arquivo
pnpm exec eslint src/path/to/file.tsx
\`\`\`

### Deploy
\`\`\`bash
pnpm deploy           # Deploy completo (migrate + build + deploy)
vercel                # Deploy rápido (Vercel CLI)
vercel --prod         # Deploy direto para produção
\`\`\`

### Git
\`\`\`bash
git status            # Status atual
git add .             # Adicionar todos os arquivos
git commit -m "..."   # Commit
git push              # Push para GitHub
\`\`\`

---

## 📊 STATUS ATUAL - RESUMO

\`\`\`
Status Geral:     🟢 OPERACIONAL
Build:            ✅ 8.59s
Warnings:         ⚠️  80 (não críticos)
TypeScript:       25% (47/189 arquivos)
Testes:           ❌ 0 testes
Edge Functions:   ✅ 19 funções
Migrações SQL:    ✅ 38 aplicadas
Score:            78/100 🟡
\`\`\`

---

## 🔝 TOP 4 ARQUIVOS PARA CORRIGIR

\`\`\`
1. src/contexts/SupabaseAuthContext.jsx          (8 warnings)
2. src/components/auth/AuthProvider.tsx          (7 warnings)
3. src/pages/LandingPage_ClienteFinal.jsx        (7 warnings)
4. src/pages/PartnersPage_Corrigida.jsx          (5 warnings)
\`\`\`

**Como corrigir:**
\`\`\`bash
# Abrir arquivo
code src/contexts/SupabaseAuthContext.jsx

# Ver warnings específicos
pnpm exec eslint src/contexts/SupabaseAuthContext.jsx

# Tentar fix automático
pnpm exec eslint src/contexts/SupabaseAuthContext.jsx --fix
\`\`\`

---

## 📋 WARNINGS POR TIPO

\`\`\`
Tipo                            Quantidade    %
─────────────────────────────────────────────────
react-hooks/exhaustive-deps     48           60%
no-unused-vars                  18           22.5%
jsx-a11y/anchor-is-valid        9            11.25%
typescript-eslint/no-unused     5            6.25%
\`\`\`

---

## 🔗 LINKS RÁPIDOS

### Produção
- 🌐 Site: https://www.appvidasmart.com
- 🗄️ Supabase: https://supabase.com/dashboard
- 🚀 Vercel: https://vercel.com
- 💻 GitHub: https://github.com/agenciaclimb/vida-smart-coach

### Documentação Local
\`\`\`bash
# Abrir documentos
code DIAGNOSTICO_GERAL_SISTEMA.md      # Diagnóstico completo
code DASHBOARD_STATUS.md               # Dashboard visual
code RESUMO_EXECUTIVO.md               # Resumo gerencial
\`\`\`

---

## 🎯 PRÓXIMAS AÇÕES

### Hoje
\`\`\`bash
# 1. Corrigir warnings automaticamente
pnpm exec eslint . --ext .js,.jsx,.ts,.tsx --fix

# 2. Verificar resultado
pnpm exec eslint . --ext .js,.jsx,.ts,.tsx 2>&1 | tail -10

# 3. Revisar mudanças
git diff
\`\`\`

### Esta Semana
- [ ] Remover 18 variáveis não utilizadas
- [ ] Corrigir 4 arquivos principais
- [ ] Validar .env.local
- [ ] Meta: Reduzir de 80 para < 20 warnings

---

## 🆘 TROUBLESHOOTING

### Build Falha
\`\`\`bash
rm -rf node_modules dist .vite
pnpm install
pnpm build
\`\`\`

### Dev Server Não Inicia
\`\`\`bash
# Verificar porta em uso
lsof -i :5173
kill -9 <PID>

# Ou usar porta diferente
pnpm dev --port 3000
\`\`\`

### Deploy Falha
\`\`\`bash
# Ver logs do Vercel
vercel logs

# Rollback último deploy
vercel rollback
\`\`\`

---

## 🔢 NÚMEROS IMPORTANTES

\`\`\`
Arquivos Total:       189
- TypeScript:         47 (25%)
- JavaScript:         142 (75%)

Bundle Size:          340.54 KB (gzipped)
Build Time:           8.59s
Warnings:             80
Migrações SQL:        38
Edge Functions:       19
Docs (.md):           41
UI Components:        23
\`\`\`

---

**Última Atualização:** 29/11/2025  
**Status:** 🟢 Ativo
