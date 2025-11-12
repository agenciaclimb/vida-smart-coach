# Configuração do SonarQube - Vida Smart Coach

## Visão Geral

Este projeto está configurado para análise de qualidade de código usando **SonarQube Cloud** com **Connected Mode** no VS Code.

## Configuração Atual

### SonarQube Cloud
- **Organização**: `vida-smart-coach`
- **Project Key**: `agenciaclimb_vida-smart-coach`
- **Connection ID**: `agenciaclimb130850`
- **URL**: https://sonarcloud.io

### Arquivos de Configuração

1. **sonar-project.properties** - Configuração do projeto SonarQube
2. **.vscode/settings.json** - Connected Mode do VS Code
3. **vitest.config.ts** - Configuração de cobertura de testes

## Como Usar

### Análise Local no VS Code

A extensão **SonarQube for IDE** está instalada e configurada em Connected Mode. Ela analisa automaticamente:

- **JavaScript/TypeScript** (src/, supabase/functions/, api/, scripts/)
- **React Components** (.jsx, .tsx)
- **Edge Functions** do Supabase
- **Scripts de migração**

**Recursos disponíveis:**
- ✅ Análise em tempo real enquanto você digita
- ✅ Sugestões de correção automática
- ✅ Sincronização com regras do SonarQube Cloud
- ✅ Integração com ESLint

### Comandos NPM Disponíveis

```bash
# Análise de código com ESLint
pnpm lint

# Gerar relatório JSON para SonarQube
pnpm lint:sonar

# Executar testes com cobertura
pnpm test:coverage

# CI completo (lint + typecheck + secret scan)
pnpm ci

# Análise completa do SonarQube (requer sonar-scanner instalado)
pnpm sonar
```

### Verificar Problemas no VS Code

1. Abra o painel **Problems** (Ctrl+Shift+M)
2. Problemas do SonarQube aparecem com o prefixo `SonarLint`
3. Clique em um problema para ver detalhes e sugestões de correção

### Executar Análise Manual

Se você tiver o `sonar-scanner` instalado globalmente:

```bash
pnpm sonar
```

Ou usando npx:

```bash
npx sonar-scanner
```

## Exclusões Configuradas

### Arquivos Excluídos da Análise
- `**/*.test.*` - Arquivos de teste
- `**/*.spec.*` - Specs
- `**/*.stories.*` - Storybook stories
- `**/*.md` - Documentação Markdown
- `**/*.sql` - Scripts SQL
- `**/dist/**` - Build output
- `**/node_modules/**` - Dependências
- `**/coverage/**` - Relatórios de cobertura
- `supabase/migrations/**` - Migrations (apenas SQL)

### Arquivos de Teste Incluídos
- Testes são analisados separadamente para métricas de cobertura
- Cobertura exportada em `coverage/lcov.info`

## Integração com CI/CD

### GitHub Actions

O arquivo `.github/workflows/ci.yml` já está configurado para executar:

1. **Lint** - ESLint com relatório JSON
2. **TypeCheck** - Verificação de tipos TypeScript
3. **Secret Scan** - Detecção de secrets expostos
4. **Tests** - Suite de testes com cobertura

### SonarQube Cloud Analysis

Para ativar análise automática no SonarQube Cloud:

1. Configure o secret `SONAR_TOKEN` no GitHub
2. Adicione step no workflow:

```yaml
- name: SonarCloud Scan
  uses: SonarSource/sonarcloud-github-action@master
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

## Quality Gates

### Padrões Configurados

- **Cobertura de Código**: Relatório gerado em `coverage/lcov.info`
- **Code Smells**: Alertas sobre padrões problemáticos
- **Bugs**: Detecção de bugs potenciais
- **Vulnerabilidades**: Análise de segurança
- **Security Hotspots**: Áreas que requerem revisão de segurança

### Regras Ativas

O projeto usa as regras padrão do SonarQube para:
- **JavaScript/TypeScript**: Boas práticas e padrões modernos
- **React**: Hooks, performance, acessibilidade
- **Security**: OWASP Top 10, injection, XSS, etc.

## Troubleshooting

### Connected Mode não funciona

1. Verifique se está logado no SonarQube Cloud:
   - Abra Command Palette (Ctrl+Shift+P)
   - Digite "SonarLint: Show All Locations"
   - Verifique se a conexão está ativa

2. Re-bind do projeto:
   ```
   Command Palette > SonarLint: Update all project bindings to SonarQube/SonarCloud
   ```

### Análise não aparece

1. Salve o arquivo (Ctrl+S)
2. Reabra o arquivo
3. Force análise: `Command Palette > SonarLint: Analyze current file`

### Muitos falsos positivos

1. Configure regras específicas em `.vscode/settings.json`:
   ```json
   "sonarlint.rules": {
     "typescript:S1234": {
       "level": "off"
     }
   }
   ```

2. Ou adicione comentário no código:
   ```typescript
   // NOSONAR: justificativa
   ```

## Links Úteis

- [SonarQube Cloud Dashboard](https://sonarcloud.io/project/overview?id=agenciaclimb_vida-smart-coach)
- [SonarLint Documentation](https://docs.sonarsource.com/sonarlint/vs-code/)
- [SonarQube Rules Reference](https://rules.sonarsource.com/)

## Suporte

Para problemas com SonarQube:
1. Verifique logs: `Output > SonarLint`
2. Consulte documentação oficial
3. Abra issue no repositório do projeto
