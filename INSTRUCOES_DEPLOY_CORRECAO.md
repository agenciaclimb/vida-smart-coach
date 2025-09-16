# Instruções para Aplicar a Correção da Landing Page

## Problema Identificado ✅
A página inicial https://www.appvidasmart.com/ está redirecionando automaticamente para /login ao invés de mostrar a landing page com as opções de assinatura.

## Correção Implementada ✅
O arquivo `src/App.tsx` foi corrigido para mostrar a LandingPage na rota raiz "/" ao invés de redirecionar para "/login".

## Como Aplicar a Correção em Produção

### Opção 1: Deploy Automático via GitHub (Recomendado)
1. Fazer push das alterações para o repositório GitHub:
   ```bash
   git add .
   git commit -m "fix: corrigir redirecionamento da página inicial para mostrar landing page"
   git push origin main
   ```
2. O Vercel detectará automaticamente as mudanças e fará o deploy
3. Aguardar alguns minutos para o deploy ser concluído

### Opção 2: Deploy Manual via Vercel CLI
1. Instalar Vercel CLI: `npm install -g vercel`
2. Fazer login: `vercel login`
3. No diretório do projeto: `vercel --prod`

### Opção 3: Deploy via Interface do Vercel
1. Acessar https://vercel.com/dashboard
2. Encontrar o projeto "vida-smart-coach"
3. Clicar em "Redeploy" na última versão
4. Ou fazer um novo deploy manual

## Verificação da Correção
Após o deploy, acessar https://www.appvidasmart.com/ e verificar se:
- ✅ A landing page aparece (não redireciona para /login)
- ✅ Mostra as seções: Hero, Benefícios, Como Funciona, Preços, etc.
- ✅ Os botões de assinatura estão visíveis

## Arquivos Modificados
- `src/App.tsx` - Linha 15: Alterado de `<Navigate to="/login" replace />` para `<LandingPage />`

## Status Atual
- ✅ Correção implementada e testada localmente
- ✅ Build funcionando sem erros
- 🔄 Aguardando deploy em produção

---
**Data:** 2025-09-16  
**Hora:** 16:30:00

