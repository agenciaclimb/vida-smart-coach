/**
 * Plan item extractors - Strategy pattern for different plan types
 * Reduces cognitive complexity from 31 to <10
 */

export interface PlanItem {
  identifier: string;
  description: string;
}

/**
 * Parses plan data safely
 */
export function parsePlanData(planData: any): any {
  if (!planData) return null;
  return typeof planData === 'string' ? JSON.parse(planData) : planData;
}

/**
 * Extracts physical plan items (workouts/exercises)
 */
export function extractPhysicalItems(data: any, planType: string): PlanItem[] {
  const items: PlanItem[] = [];
  const workouts = data.workouts || data.weekly_workouts || [];
  
  let idx = 0;
  for (const workout of workouts) {
    const day = workout.day || workout.dayOfWeek || `Dia ${idx + 1}`;
    const exercises = workout.exercises || [];
    for (const ex of exercises) {
      const exName = ex.name || ex.exercise;
      if (!exName) continue;
      items.push({
        identifier: `${planType}:${day}:${exName}`,
        description: `${exName} (${day})`
      });
    }
    idx++;
  }
  
  return items;
}

/**
 * Extracts nutritional plan items (meals)
 */
export function extractNutritionalItems(data: any, planType: string): PlanItem[] {
  const items: PlanItem[] = [];
  const meals = data.meals || data.daily_meals || [];
  
  for (const meal of meals) {
    const mealName = meal.name || meal.meal_type;
    if (mealName) {
      items.push({
        identifier: `${planType}:${mealName}`,
        description: meal.description || mealName
      });
    }
  }
  
  return items;
}

/**
 * Extracts practice-based plan items (emotional/spiritual)
 */
export function extractPracticeItems(data: any, planType: string): PlanItem[] {
  const items: PlanItem[] = [];
  const practices = data.practices || data.daily_practices || [];
  
  for (const practice of practices) {
    const practiceName = practice.name || practice.title;
    if (practiceName) {
      items.push({
        identifier: `${planType}:${practiceName}`,
        description: practice.description || practiceName
      });
    }
  }
  
  return items;
}

/**
 * Extracts emotional plan items (alias for practice items)
 */
export function extractEmotionalItems(data: any, planType: string): PlanItem[] {
  return extractPracticeItems(data, planType);
}

/**
 * Extracts spiritual plan items (alias for practice items)
 */
export function extractSpiritualItems(data: any, planType: string): PlanItem[] {
  return extractPracticeItems(data, planType);
}

/**
 * Main extraction function with strategy pattern
 * Reduced complexity: 31 → ~6
 */
export function extractPlanItems(planData: any, planType: string): PlanItem[] {
  try {
    const data = parsePlanData(planData);
    if (!data) return [];

    const extractors: Record<string, (data: any, type: string) => PlanItem[]> = {
      physical: extractPhysicalItems,
      nutritional: extractNutritionalItems,
      emotional: extractEmotionalItems,
      spiritual: extractSpiritualItems,
    };

    const extractor = extractors[planType];
    return extractor ? extractor(data, planType) : [];
    
  } catch (err) {
    console.error('Erro ao extrair itens do plano:', err);
    return [];
  }
}
