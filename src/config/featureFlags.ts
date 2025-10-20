export const featureFlags = {
  auroraV1: (import.meta.env.VITE_AURORA_V1 ?? 'false').toLowerCase() === 'true',
} as const;

export type FeatureFlags = typeof featureFlags;
