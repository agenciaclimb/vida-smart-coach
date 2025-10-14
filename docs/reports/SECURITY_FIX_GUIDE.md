# 🔒 Guia de Correção de Segurança - Vida Smart Coach

## Problemas Identificados

O Security Advisor do Supabase identificou os seguintes problemas críticos:

### 🚨 Security Definer Views (6 erros)
- `public.community_feed`
- `public.app_plans`
- `public.comentarios`
- `public.recompensas`
- `public.planos_old`
- `public.planos`

**Problema:** Views definidas com `SECURITY DEFINER` podem escalar privilégios indevidamente.

### 🚨 RLS Disabled in Public (2 erros)
- `public.error_logs`
- `public.supabase_migrations`

**Problema:** Tabelas no schema público sem Row Level Security podem ser acessadas publicamente via API.

## Solução Implementada

### 📁 Arquivos Criados

1. **`supabase/migrations/20250917010000_fix_security_issues.sql`**
   - Migração completa que corrige todos os problemas
   - Recria views sem `SECURITY DEFINER`
   - Habilita RLS nas tabelas públicas
   - Adiciona políticas de segurança adequadas

2. **`apply_security_fix.js`**
   - Script Node.js para aplicar as correções
   - Executa a migração de forma segura
   - Verifica se as correções foram aplicadas

## Como Aplicar as Correções

### Opção 1: Via Script Automatizado (Recomendado)

```bash
# 1. Configurar variáveis de ambiente
export SUPABASE_URL="sua_url_do_supabase"
export SUPABASE_SERVICE_KEY="sua_service_key"

# 2. Executar o script
node apply_security_fix.js
```

### Opção 2: Via Supabase CLI

```bash
# 1. Aplicar migração
supabase db push

# 2. Ou aplicar migração específica
supabase migration up --target 20250917010000
```

### Opção 3: Via SQL Editor (Manual)

1. Acesse o SQL Editor no painel do Supabase
2. Copie o conteúdo de `supabase/migrations/20250917010000_fix_security_issues.sql`
3. Execute o SQL no editor
4. Verifique se não há erros

## Verificação das Correções

Após aplicar as correções:

1. **Acesse o Security Advisor:**
   - Vá para `Advisors > Security Advisor` no painel do Supabase
   - Clique em "Refresh" para atualizar os resultados

2. **Verifique os resultados:**
   - Os 6 erros de "Security Definer View" devem estar resolvidos
   - Os 2 erros de "RLS Disabled in Public" devem estar resolvidos

3. **Teste as funcionalidades:**
   - Verifique se as views ainda retornam dados corretamente
   - Teste o acesso às tabelas via API
   - Confirme que apenas usuários autorizados podem acessar dados sensíveis

## O que Foi Corrigido

### ✅ Views Recriadas (sem SECURITY DEFINER)
- **community_feed:** Exibe posts publicados da comunidade
- **app_plans:** Mostra planos ativos da aplicação
- **comentarios:** Lista comentários não deletados
- **recompensas:** Exibe recompensas disponíveis
- **planos/planos_old:** Mostram planos de assinatura ativos

### ✅ RLS Habilitado
- **error_logs:** Apenas administradores podem ver logs de erro
- **supabase_migrations:** Apenas administradores podem ver migrações

### ✅ Políticas de Segurança
- Políticas restritivas para cada tabela
- Acesso baseado em roles de usuário
- Proteção contra acesso não autorizado

## Troubleshooting

### Erro: "Variáveis de ambiente não encontradas"
```bash
# Verifique se as variáveis estão definidas
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_KEY

# Se não estiverem, defina-as:
export SUPABASE_URL="https://seu-projeto.supabase.co"
export SUPABASE_SERVICE_KEY="sua_service_key_aqui"
```

### Erro: "Permissão negada"
- Verifique se está usando a `SUPABASE_SERVICE_KEY` (não a anon key)
- Confirme se a service key tem permissões de administrador

### Views não funcionam após correção
- Execute `ANALYZE` nas tabelas base
- Verifique se as tabelas base existem
- Confirme se as políticas RLS estão corretas

## Próximos Passos

1. **Monitoramento:** Configure alertas para novos problemas de segurança
2. **Auditoria:** Revise regularmente o Security Advisor
3. **Documentação:** Mantenha este guia atualizado com novas correções
4. **Testes:** Execute testes de segurança periodicamente

## Contato

Se encontrar problemas ou tiver dúvidas sobre as correções de segurança, consulte:
- Documentação do Supabase sobre RLS
- Security Advisor do Supabase
- Logs de erro da aplicação

