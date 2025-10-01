# Vida Smart Agent

Este repo contem utilitarios para automatizar rotinas do projeto Vida Smart Coach.

## Setup rapido
1. Instale dependencias: `npm install`.
2. Crie `.env` (ou copie `.env.example`) com as variaveis:
   - `PROVIDER`, `OPENAI_API_KEY`, `OPENAI_MODEL`
   - `GEMINI_API_KEY`, `GEMINI_MODEL`
   - `GIT_COMMIT_AUTHOR_NAME`, `GIT_COMMIT_AUTHOR_EMAIL`
   - `DOC_PATH` apontando para o documento mestre monitorado pelo agente
   - (Opcional) `AGENT_VALIDATE_*` para validar dominios especificos (ver abaixo)
3. Guarde segredos reais apenas nos arquivos locais (.env, .env.local). Nunca exponha SERVICE_ROLE no cliente.

## Fluxo de execucao manual
- Atualizar env/knowledge: `powershell -File scripts/sync-env.ps1` e `powershell -File scripts/refresh-knowledge.ps1`
- Gerar plano e patch: `npm run agent:plan`
- Aplicar patch e validar: `npm run agent:apply`
- Loop continuo (bash): `npm run agent:loop`
- Loop continuo (PowerShell): `npm run agent:loop:ps`

A saida do LLM fica em `.agent/out` (plan.md, patch.diff, log.txt).

## Pacote de tarefas estruturadas
O diretorio `agent_tasks/` concentra instrucoes em YAML (00_env_check ate 06_refresh_knowledge + 05_gamification_audit) e um `PLAYBOOK.md` com a ordem sugerida. Copie diagnosticos recentes para os blocos `context` de cada YAML para que o agente ja inicie com pistas concretas. Relatorios devem ser escritos em `agent_outputs/`.

Os arquivos `.yaml`, o `PLAYBOOK.md` e os resumos em `domain_knowledge/` sao lidos automaticamente por `agent-plan`, que injeta esse contexto no prompt antes de chamar o LLM (com limite de tamanho para evitar excesso de tokens). Atualize sempre que descobrir um novo fluxo ou incidente relevante.

Scripts uteis:
- `scripts/sync-env.ps1`: copia `.env.local` do projeto principal.
- `scripts/refresh-knowledge.ps1`: extrai trecho fresco do Documento Mestre para `domain_knowledge/doc_excerpt.md`.
- `scripts/compare-env.ps1`: compara `.env.example` com `.env.vercel` e gera `agent_outputs/env_drift_result.md`.
- `domain_knowledge/overview.md`: snapshot da arquitetura, heuristicas e tabelas criticas.
- `domain_knowledge/testing.md`: guia de testes rapidos que o agente pode disparar.
- `domain_knowledge/operations.md`: rotina noturna, checklist matinal e configuracao de validacoes.
- `scripts/agent-report.ps1`: resumo de log/outputs para acompanhar ciclos noturnos.

## Monitoramento e validacoes
- Defina `AGENT_VALIDATE_FRONTEND`, `AGENT_VALIDATE_SUPABASE`, `AGENT_VALIDATE_SCRIPTS` e/ou `AGENT_VALIDATE_COMMAND` no `.env` para executar comandos de teste antes dos commits.
- Use `AGENT_REPORT_EACH_CYCLE=1` para que o nightly gere um resumo ao final de cada iteracao.
- Rodar `powershell -File scripts/agent-report.ps1` pela manha garante que falhas aparecam em destaque.

## Janela automatica 23h-7h
Use `npm run agent:nightly` para manter o agente executando apenas entre 23:00 e 07:00. O script `scripts/vida-agent-nightly.ps1` alterna OpenAI e Gemini, roda os scripts de sincronizacao/knowledge antes de cada ciclo e hiberna fora da janela. Ajuste a janela com parametros `--StartHour`, `--EndHour`, `--PauseSeconds`. Defina `AGENT_REPORT_EACH_CYCLE=1` para ver relatorios durante o ciclo.

### Agendamento no Windows Task Scheduler
Execute em um PowerShell com privilegios adequados:
```
schtasks /Create /TN "VidaSmartAgentNightly" /TR "powershell -NoProfile -ExecutionPolicy Bypass -File `"%CD%\scripts\vida-agent-nightly.ps1`"" /SC DAILY /ST 23:00 /RL LIMITED
```
O processo continuara ativo e, fora da janela, o script dormira ate a proxima execucao valida.

## Validacao
O agente usa `scripts/validate.ps1` (ou `.sh`) para validar antes do commit. Ajuste esse script para rodar builds, testes ou linters reais do projeto principal.
- Defina `AGENT_VALIDATE_COMMAND` para rodar verificacoes adicionais (por exemplo `pnpm test` ou `npm run lint`).
- Opcional: `AGENT_VALIDATE_FRONTEND`, `AGENT_VALIDATE_SUPABASE`, `AGENT_VALIDATE_SCRIPTS` permitem validar dominios especificos conforme os arquivos tocados.
- Caso `DOC_PATH` nao exista, o script apenas emite um aviso para revisao manual.

