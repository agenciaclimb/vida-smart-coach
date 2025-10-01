# Vida Smart Coach - Knowledge Snapshot

## Sistema
- Frontend em React 18 + Vite; estilos com Tailwind/Radix; animações via Framer Motion.
- Backend via Supabase (Postgres + Auth + Edge Functions) e integrações com Stripe, Evolution API (WhatsApp).
- Deploy no Vercel; repositório GitHub; automações via scripts `scripts/` e `supabase/functions/`.

## Módulos Críticos
- `src/components/client/GamificationTabEnhanced.jsx`: dashboard principal do cliente (estado extenso, precisa de cautela). Usa contextos de `src/contexts/data/GamificationContext.jsx`.
- `src/api/` e `src/lib/supabase/`: wrappers de dados; validar quando tocar em Supabase.
- `supabase/migrations/`: migrações SQL; sempre testar com `supabase start` ou scripts dedicados.
- `scripts/apply_*`: utilidades para aplicar patches/migrações; guardar logs em `logs/`.

## Banco de Dados (Supabase)
- Tabelas chave: `user_profiles`, `daily_checkins`, `gamification`, `whatsapp_messages`, `subscription_plans`.
- RLS ativo; funções edge para webhooks (`supabase/functions/evolution-webhook`).
- Verificar políticas ao alterar queries; risco de 401/403 se colunas novas não tiverem policies.

## Operações
- Fluxos de deploy: push para branch monitorada pelo Vercel + fallback `vercel deploy --prod --confirm`.
- Automações de verificação: `agent_tasks/00_env_check.yaml` (env), `01_vercel_github_link.yaml`, `02_supabase_health.yaml`, `04_env_drift.yaml`, `03_fallback_deploy.yaml`.
- `scripts/validate.ps1|.sh`: define validações. Ajustar `AGENT_VALIDATE_COMMAND` para rodar testes do projeto principal (`pnpm vitest`, `pnpm lint`).

## Heurísticas para o Agente
- Sempre sincronizar `.env.local` com o projeto raiz antes de rodar tarefas.
- Quando o LLM gerar patch para arquivos grandes (>500 linhas), preferir aplicar mudanças localizadas (diff com contexto mínimo) e validar manualmente.
- Em Supabase, incluir migrações SQL e atualizar definições Typescript geradas (`supabase/gen/types.ts`) se existirem.
- Documentar cada ciclo no Documento Mestre (`DOC_PATH`), mantendo sessões curtas e datadas.

## Diagnósticos Frequentes
- Supabase health falha: conferir `SUPABASE_URL`, `SUPABASE_ANON_KEY`; usar `02_supabase_health.yaml`.
- Deploy bloqueado: reexecutar `01_vercel_github_link.yaml`, validar `vercel whoami`/`vercel link`.
- Drift de env: rodar `scripts/compare-env.ps1` e copiar relatório para `agent_outputs/`.
- Falhas no apply: se não houver repo Git, apenas gerar patch; caso exista, rodar `npm run validate` antes de `git commit`.

## Fontes de Referência
- Documento mestre: `${DOC_PATH}` (detalha painéis, fluxos de gamificação, roadmap).
- Logs relevantes: `C:\Users\JE\Documents\vida-smart-coach\logs`.
- SQL base: `sql/` e `supabase/migrations/` no projeto principal.
