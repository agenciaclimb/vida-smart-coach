# Semana 1 (11-17/11) - Fundação

## Entregas realizadas
- `stage-detection`: extraído para serviço próprio com confidência + métricas, usado por todos os estágios (supabase/functions/ia-coach-chat/stage-detection.ts).
- `conversation-guard`: camada anti-loop inicial identificando prompts repetidos/baixa confiança e registrando `issues/hints` no metadata/debug.
- `conversation-memory`: snapshot diário (`session_id` = data), carga e atualização automática após cada resposta; entidades (objetivos, dores, restrições, preferências, atividades, estado emocional) são inseridas no contexto da IA.
- `ia-coach-chat`: fluxo central passou a incluir detecção + guard + memória no metadata e nos logs debug; integrates context prompt com memórias e guarda as métricas para observabilidade.

## Passos seguintes (Semana 1-2)
1. Finalizar migration da tabela `conversation_memory` + scripts de backfill.
2. Evoluir extração de entidades com testes e cobertura >80% (T1.5) + normalização (acentos, case).
3. Promover o guard para tomar ações (ex.: forçar stage, mutar perguntas) e registrar métricas em `conversation_metrics`.
4. Incluir suite de testes unitários/integrados (stage detection, guard, memória) e publicar no pipeline CI.
