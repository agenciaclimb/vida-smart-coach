export type StageRuntimeConfig = {
  enableStageHeuristics: boolean;
  debugStageMetrics: boolean;
};

export function getEnvFlag(name: string, defaultValue: boolean): boolean {
  const raw = (Deno.env.get(name) || '').trim().toLowerCase();
  if (['1', 'true', 'on', 'yes'].includes(raw)) return true;
  if (['0', 'false', 'off', 'no'].includes(raw)) return false;
  return defaultValue;
}

export function resolveStageRuntimeConfig(): StageRuntimeConfig {
  return {
    enableStageHeuristics: getEnvFlag('ENABLE_STAGE_HEURISTICS_V2', true),
    debugStageMetrics: getEnvFlag('DEBUG_STAGE_METRICS', false),
  };
}

export const DEFAULT_STAGE_RUNTIME_CONFIG: StageRuntimeConfig = {
  enableStageHeuristics: true,
  debugStageMetrics: false,
};
