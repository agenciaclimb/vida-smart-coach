// src/domain/profile/activityLevels.ts
export const ACTIVITY_LEVEL_SLUGS = [
  'sedentary',
  'light',
  'moderate',
  'very_active',
  'super_active',
] as const;

export type ActivityLevelSlug = typeof ACTIVITY_LEVEL_SLUGS[number];

export const ACTIVITY_LEVEL_OPTIONS: { label: string; value: ActivityLevelSlug }[] = [
  { label: 'Sedentário',          value: 'sedentary'   },
  { label: 'Levemente Ativo',     value: 'light'       },
  { label: 'Moderadamente Ativo', value: 'moderate'    },
  { label: 'Muito Ativo',         value: 'very_active' },
  { label: 'Extremamente Ativo',  value: 'super_active'},
];

/** Aceita slug, label PT-BR ou objeto (React-Select) e retorna slug válido, senão null */
export function normalizeActivityLevel(input: any): ActivityLevelSlug | null {
  if (input == null) return null;

  // Se vier como objeto { value, label } (React-Select)
  if (typeof input === 'object') {
    if (input.value && typeof input.value === 'string') {
      const v = input.value.trim().toLowerCase();
      if ((ACTIVITY_LEVEL_SLUGS as readonly string[]).includes(v)) return v as ActivityLevelSlug;
    }
    if (input.label && typeof input.label === 'string') {
      input = input.label;
    } else {
      input = String(input);
    }
  }

  const x = String(input).trim().toLowerCase();

  // Já é slug válido?
  if ((ACTIVITY_LEVEL_SLUGS as readonly string[]).includes(x)) return x as ActivityLevelSlug;

  // Map labels PT-BR → slug
  if (x === 'sedentário' || x === 'sedentario') return 'sedentary';
  if (x === 'levemente ativo') return 'light';
  if (x === 'moderadamente ativo') return 'moderate';
  if (x === 'muito ativo') return 'very_active';
  if (x === 'extremamente ativo') return 'super_active';

  return null;
}