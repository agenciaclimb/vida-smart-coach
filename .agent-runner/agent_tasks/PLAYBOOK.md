# Como o agente executa
1. Garantir `.env.local` e Documento Mestre atualizados (scripts `sync-env` e `refresh-knowledge` sao executados automaticamente pelo nightly antes de cada ciclo).
2. Rodar as tarefas em ordem: 00_env_check -> 01_vercel_github_link -> 02_supabase_health -> 04_env_drift -> 06_refresh_knowledge -> 05_gamification_audit -> 03_fallback_deploy (apenas se necessario).
3. Registrar todo resultado em `agent_outputs/`.
4. Quando variaveis estiverem faltando, gerar placeholders FIXME e orientar os passos manuais.

## Dicas
- Copie diagnosticos recentes para os blocos `context` dos YAML.
- Execute em modo dry-run primeiro, se o agente suportar.
- Nunca exponha `SERVICE_ROLE_KEY` em artefatos do cliente.
