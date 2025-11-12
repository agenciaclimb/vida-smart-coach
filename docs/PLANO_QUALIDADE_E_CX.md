# Plano de Qualidade e Experiência (Nov/2025)

## 1. Insights acionáveis do Documento Mestre
- `Próximas Prioridades` reforçam que a base da Sprint 2 é validar edge functions críticas, aplicar migrations de recompensas/unified XP e completar testes E2E em WhatsApp e calendário (docs/documento_mestre_vida_smart_coach_final.md:49).
- A diretriz estratégica de manter 99% da experiência no WhatsApp se repete em múltiplos pontos e depende da paridade do painel e do sistema de recompensas (docs/documento_mestre_vida_smart_coach_final.md:2176, docs/documento_mestre_vida_smart_coach_final.md:2225, docs/documento_mestre_vida_smart_coach_final.md:2336, docs/documento_mestre_vida_smart_coach_final.md:3239).
- Há registros recentes de regressão na IA (loops de perguntas e falta de consumo de feedbacks) que impactam diretamente o engajamento omnichannel (docs/documento_mestre_vida_smart_coach_final.md:2007, docs/documento_mestre_vida_smart_coach_final.md:2403).

## 2. Sonar + esteira de qualidade
1. `sonar-project.properties` define fontes (`src`, `supabase/functions`, `api`, `scripts`), exclusões e o caminho padrão de cobertura `coverage/lcov.info`.
2. A pipeline `ci.yml` agora executa lint, type-check, testes unitários e, em seguida, um job dedicado `sonar` roda `pnpm test:coverage` e dispara o GitHub Action oficial do Sonar.
3. Configure o projeto no SonarCloud (ou Sonar self-hosted) e crie um token com permissão *Execute Analysis*. Salve-o como `SONAR_TOKEN` em `Settings > Secrets > Actions`.
4. Opcionalmente defina `SONAR_HOST_URL` se estiver usando um servidor próprio; o arquivo de propriedades já aponta para `https://sonarcloud.io`.
5. Execução local: `pnpm test:coverage` seguido de `sonar-scanner` (CLI oficial) consome o mesmo arquivo de propriedades. Documente o binário do scanner em `$PATH` ou chame-o via Docker (`docker run sonarsource/sonar-scanner-cli ...`).
6. Para garantir fail-fast, utilize *Quality Gates* no Sonar exigindo `coverage >= 80%` e `new_code_smells = 0`. A pipeline falhará automaticamente quando o gate for vermelho.

## 3. Incrementos imediatos de CX
1. **Resolver loops e heurísticas da IA Coach** – priorizar a validação Specialist/Seller e o consumo de feedbacks antes de qualquer nova feature para eliminar as repetições mencionadas no documento mestre (docs/documento_mestre_vida_smart_coach_final.md:2007, docs/documento_mestre_vida_smart_coach_final.md:2403).
2. **Finalizar Fase 5.1 (XP + Recompensas + Calendário)** – sem isso, o objetivo de manter 99% da experiência no WhatsApp fica comprometido; alinhar squads de migrações/back-end e front (docs/documento_mestre_vida_smart_coach_final.md:2176, docs/documento_mestre_vida_smart_coach_final.md:3239).
3. **Testes E2E obrigatórios para WhatsApp, IA e calendário** – reutilizar os scripts já listados no repositório (`scripts/test_whatsapp_flow.mjs`, etc.) e incorporar a execução desses testes no pipeline antes do deploy (coerente com o P0 descrito na seção de prioridades docs/documento_mestre_vida_smart_coach_final.md:49).
4. **Instrumentação de jornada** – adicionar telemetria de abandono (onboarding checklist, GuidedTour e prompts WhatsApp descritos na Ciclo 8) para saber onde os usuários travam e retroalimentar a IA. Usar Supabase para logar eventos por estagio e canal.

## 4. Próximos passos sugeridos
1. Definir owners para o Quality Gate (responsável por analisar findings do Sonar a cada PR) e para o backlog de CX (PM/UX).
2. Acrescentar testes de contrato para as funções `ia-coach-chat`, `reward-redeem` e `generate-plan`, cobrindo os cenários P0 descritos no documento mestre.
3. Medir NPS pós-conversa e atrelar respostas ao feedback loop para provar que as correções de IA reduzem os loops indesejados.
