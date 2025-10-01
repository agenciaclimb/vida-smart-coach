# Test Strategy Snapshot

## Frontend
- Executar `pnpm vitest` para testes unitários; adicionar cenários para componentes tocados.
- Usar `pnpm lint` (ou `npm run lint`) antes de commits que alterem TypeScript/JSX.
- Para UI crítica (GamificationTabEnhanced), validar com Storybook ou capturas existentes no documento mestre.

## Backend / Supabase
- Rodar scripts em `scripts/apply_*` usando ambiente de testes.
- Para novas migrações, executar `supabase migration up` local e verificar rollback.
- Health check: `curl -fsSL "$env:SUPABASE_URL/auth/v1/health" -H "apikey: $env:SUPABASE_ANON_KEY"`.

## End-to-End
- Script `vida-smart-e2e.sh` cobre fluxo principal (login, dashboard, notificações). Ajustar para flag `--dry-run` quando integrando ao agente.
- Smoke tests: `scripts/p2_stripe_smoke.ps1`, `scripts/p2_finalize.ps1` (Stripe).

## Regressão Manual
- Verificar login Supabase (dashboard web) após ajustes em auth.
- Validar webhook Evolution API com requests simulados (`supabase/functions/evolution-webhook/simulate.js`).

## Automação do Agente
- Defina `AGENT_VALIDATE_COMMAND="pnpm lint && pnpm vitest --run"` para rodar localmente.
- Salvar logs adicionais em `.agent/out/log.txt` com contexto do teste executado.
