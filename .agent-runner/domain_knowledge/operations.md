# Operacoes do Agente Vida Smart

## Rotina Noturna
1. 22:55 – execute `powershell -File scripts/sync-env.ps1` e `powershell -File scripts/refresh-knowledge.ps1` (o nightly agora executa ambos automaticamente em cada ciclo, mas mantenha esta etapa para garantir que as variaveis estejam atualizadas antes do inicio da janela).
2. 23:00 – agendamento dispara `npm run agent:nightly`.
3. Durante a janela, o agente alterna OpenAI/Gemini, gera planos, aplica patches, executa validacoes direcionadas e, se `AGENT_REPORT_EACH_CYCLE=1`, produz um resumo imediato via `scripts/agent-report.ps1`.
4. Saida principal: `.agent/out/log.txt`, `agent_outputs/*.md`.

## Checklist Matinal
- `powershell -File scripts/agent-report.ps1` – destaca falhas e ultimos relatorios.
- Conferir `agent_outputs/gamification_audit.md` (quando existir) para pendencias de dashboard.
- Se houver `env_diff_report.md` ou `env_drift_result.md` com `FIXME`, atualizar secrets imediatamente.

## Quando algo falhar
- Se `agent-apply` abortar, revisar log entry com "Validacao" ou "Falha ao aplicar patch".
- Reexecutar tarefa especifica via comando do agente (`agent run --task ...`) apos corrigir o problema.
- Manter `domain_knowledge/` atualizado – adicionar novos arquivos `.md` com licoes aprendidas.

## Variaveis de Validacao
- `AGENT_VALIDATE_FRONTEND`: ex. `pnpm lint && pnpm vitest --run`.
- `AGENT_VALIDATE_SUPABASE`: ex. `pnpm supabase:typecheck` ou script de migracao.
- `AGENT_VALIDATE_SCRIPTS`: ex. `pnpm lint:scripts` ou `pwsh ./scripts/validate.ps1` do projeto principal.
- `AGENT_VALIDATE_COMMAND`: fallback geral usado apos os especificos.

## Monitoramento
- Defina `AGENT_REPORT_EACH_CYCLE=1` para que o nightly gere relatorios a cada iteracao; caso contrario, voce pode rodar o script manualmente pela manha.
- Avalie integrar notificacoes (e-mail/Teams) chamando webhooks personalizados ao detectar linhas com "Falha" no log.

