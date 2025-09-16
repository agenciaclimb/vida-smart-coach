// src/utils/checkinHelpers.ts
// 🎯 Helper único para montar payload do check-in com fallbacks seguros

export interface CheckinInput {
  weight?: number;
  mood_score?: number;
  mood?: number;
  sleep_hours?: number;
  water_glasses?: number;  // campo que existe na tabela
}

export interface CheckinPayload {
  user_id: string;
  date: string;
  weight: number | null;
  mood: number | null;
  sleep_hours: number | null;
  water_glasses: number; // SEMPRE tem valor (fallback 0)
  created_at: string;
}

/**
 * Helper único para montar o payload do check-in
 * GARANTE que water_intake sempre tenha um valor válido (fallback 0)
 */
export function buildDailyCheckinPayload(
  userId: string,
  input: CheckinInput
): CheckinPayload {
  const { weight, mood, mood_score, sleep_hours, water_glasses } = input;
  
  const today = new Date().toISOString().split('T')[0];
  
  return {
    user_id: userId,
    date: today,
    weight: weight ? parseFloat(weight.toString()) : null,
    mood: mood_score ? parseInt(mood_score.toString()) : (mood ? parseInt(mood.toString()) : null),
    sleep_hours: sleep_hours ? parseFloat(sleep_hours.toString()) : null,
    water_glasses: Number.isFinite(water_glasses) ? water_glasses! : 0, // fallback crítico
    created_at: new Date().toISOString()
  };
}

/**
 * Validação básica dos dados de entrada
 */
export function validateCheckinInput(input: CheckinInput): { 
  isValid: boolean; 
  errors: string[] 
} {
  const errors: string[] = [];
  
  // Validações opcionais (podem ser null)
  if (input.weight !== undefined && (input.weight < 1 || input.weight > 1000)) {
    errors.push('Peso deve estar entre 1 e 1000 kg');
  }
  
  if (input.mood !== undefined && (input.mood < 1 || input.mood > 5)) {
    errors.push('Humor deve estar entre 1 e 5');
  }
  
  if (input.mood_score !== undefined && (input.mood_score < 1 || input.mood_score > 5)) {
    errors.push('Score do humor deve estar entre 1 e 5');
  }
  
  if (input.sleep_hours !== undefined && (input.sleep_hours < 0 || input.sleep_hours > 24)) {
    errors.push('Horas de sono devem estar entre 0 e 24');
  }
  
  if (input.water_glasses !== undefined && input.water_glasses < 0) {
    errors.push('Número de copos de água não pode ser negativo');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}