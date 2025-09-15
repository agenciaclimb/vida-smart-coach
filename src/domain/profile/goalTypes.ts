// src/domain/profile/goalTypes.ts
export const GOAL_TYPE_SLUGS = [
  'lose_weight',
  'gain_muscle',
  'maintain_weight',
  'improve_fitness',
  'general_health',
] as const;

export type GoalTypeSlug = typeof GOAL_TYPE_SLUGS[number];

export const GOAL_TYPE_OPTIONS: { label: string; value: GoalTypeSlug }[] = [
  { label: 'Perder Peso',               value: 'lose_weight'    },
  { label: 'Ganhar Massa Muscular',     value: 'gain_muscle'    },
  { label: 'Manter Peso Atual',         value: 'maintain_weight'},
  { label: 'Melhorar Condicionamento',  value: 'improve_fitness'},
  { label: 'Saúde Geral',               value: 'general_health' },
];

/** Aceita slug, label PT-BR ou objeto e retorna slug válido, senão null */
export function normalizeGoalType(input: any): GoalTypeSlug | null {
  if (input == null) return null;

  // Se vier como objeto { value, label }
  if (typeof input === 'object') {
    if (input.value && typeof input.value === 'string') {
      const v = input.value.trim().toLowerCase();
      if ((GOAL_TYPE_SLUGS as readonly string[]).includes(v)) return v as GoalTypeSlug;
    }
    if (input.label && typeof input.label === 'string') {
      input = input.label;
    } else {
      input = String(input);
    }
  }

  const x = String(input).trim().toLowerCase();

  // Já é slug válido?
  if ((GOAL_TYPE_SLUGS as readonly string[]).includes(x)) return x as GoalTypeSlug;

  // Map labels PT-BR → slug
  if (x === 'perder peso' || x === 'perder_peso') return 'lose_weight';
  if (x === 'ganhar massa muscular' || x === 'ganhar_massa') return 'gain_muscle';
  if (x === 'manter peso atual' || x === 'manter_peso') return 'maintain_weight';
  if (x === 'melhorar condicionamento' || x === 'melhorar_condicionamento') return 'improve_fitness';
  if (x === 'saúde geral' || x === 'saude_geral') return 'general_health';

  return null;
}