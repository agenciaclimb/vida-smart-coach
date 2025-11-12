/**
 * Gamification Display - Visual Gamification for WhatsApp
 * 
 * Formats gamification data into beautiful, engaging messages
 * with emojis, progress bars, and rankings.
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

export interface GamificationData {
  xp_total: number;
  level: number;
  xp_for_next_level: number;
  xp_progress_percent: number;
  current_streak: number;
  longest_streak: number;
  total_activities: number;
}

/**
 * Generate XP summary after check-in
 */
export function formatXPSummary(data: GamificationData, xpEarned: number): string {
  const { xp_total, level, xp_for_next_level, xp_progress_percent } = data;
  
  const progressBar = createProgressBar(xp_progress_percent);
  const levelBadge = getLevelBadge(level);
  
  return `
✨ *+${xpEarned} XP conquistados!*

${levelBadge} *Nível ${level}*
🏆 Total: *${xp_total.toLocaleString()} XP*
${progressBar} ${xp_progress_percent}%
⬆️ Próximo nível: ${xp_for_next_level} XP
`.trim();
}

/**
 * Generate streak celebration message
 */
export function formatStreakCelebration(streak: number): string {
  const streakEmoji = getStreakEmoji(streak);
  const message = getStreakMessage(streak);
  
  return `
${streakEmoji} *SEQUÊNCIA DE ${streak} DIAS!* ${streakEmoji}

${message}
`.trim();
}

/**
 * Generate achievement unlock message
 */
export function formatAchievementUnlock(achievement: {
  name: string;
  description: string;
  xp_reward: number;
}): string {
  return `
🎖️ *CONQUISTA DESBLOQUEADA!*

✨ *${achievement.name}*
📝 ${achievement.description}
🏆 +${achievement.xp_reward} XP

Parabéns! Continue assim! 💪
`.trim();
}

/**
 * Generate weekly ranking summary
 */
export async function formatWeeklyRanking(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  // Get top 3 from ranking
  const { data: topUsers } = await supabase
    .from('v_weekly_ranking')
    .select('*')
    .order('rank', { ascending: true })
    .limit(3);

  // Get current user position
  const { data: userRank } = await supabase
    .from('v_weekly_ranking')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!topUsers || topUsers.length === 0) {
    return '📊 Ranking semanal ainda não disponível.';
  }

  let message = '🏆 *TOP 3 DA SEMANA*\n\n';

  topUsers.forEach((user, index) => {
    const medal = ['🥇', '🥈', '🥉'][index];
    const name = user.first_name || 'Anônimo';
    const xp = user.weekly_xp?.toLocaleString() || '0';
    message += `${medal} ${name}: ${xp} XP\n`;
  });

  if (userRank && userRank.rank > 3) {
    message += `\n📍 Você: #${userRank.rank} (${userRank.weekly_xp?.toLocaleString()} XP)`;
  } else if (userRank) {
    message += `\n\n🌟 Você está no TOP 3! Continue assim!`;
  }

  return message.trim();
}

/**
 * Generate goal progress visualization
 */
export function formatGoalProgress(goal: {
  name: string;
  current: number;
  target: number;
  unit?: string;
}): string {
  const { name, current, target, unit = '' } = goal;
  const percent = Math.min(100, Math.round((current / target) * 100));
  const progressBar = createProgressBar(percent);
  
  return `
🎯 *${name}*
${progressBar} ${percent}%
📊 ${current}${unit} / ${target}${unit}
`.trim();
}

/**
 * Generate badges showcase
 */
export async function formatUserBadges(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  const { data: userAchievements } = await supabase
    .from('user_achievements')
    .select(`
      achievement_id,
      unlocked_at,
      achievements (
        name,
        icon
      )
    `)
    .eq('user_id', userId)
    .order('unlocked_at', { ascending: false })
    .limit(5);

  if (!userAchievements || userAchievements.length === 0) {
    return '🎖️ Você ainda não desbloqueou conquistas. Continue se dedicando!';
  }

  let message = '🎖️ *SUAS CONQUISTAS*\n\n';

  userAchievements.forEach((ua: any) => {
    const achievement = ua.achievements;
    if (achievement) {
      message += `${achievement.icon} ${achievement.name}\n`;
    }
  });

  return message.trim();
}

/**
 * Generate complete profile summary
 */
export async function formatProfileSummary(
  supabase: SupabaseClient,
  userId: string,
  gamificationData: GamificationData
): Promise<string> {
  const {
    xp_total,
    level,
    current_streak,
    longest_streak,
    total_activities,
  } = gamificationData;

  const levelBadge = getLevelBadge(level);
  const streakEmoji = getStreakEmoji(current_streak);

  // Get badges count
  const { count: badgesCount } = await supabase
    .from('user_achievements')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  return `
👤 *SEU PERFIL VIDA SMART*

${levelBadge} *Nível ${level}*
🏆 ${xp_total.toLocaleString()} XP
${streakEmoji} Sequência: ${current_streak} dias
🔥 Recorde: ${longest_streak} dias
✅ ${total_activities} atividades
🎖️ ${badgesCount || 0} conquistas

Continue assim! 💪✨
`.trim();
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create ASCII progress bar
 */
function createProgressBar(percent: number, length: number = 10): string {
  const filled = Math.round((percent / 100) * length);
  const empty = length - filled;
  
  const filledChar = '█';
  const emptyChar = '░';
  
  return filledChar.repeat(filled) + emptyChar.repeat(empty);
}

/**
 * Get level badge emoji
 */
function getLevelBadge(level: number): string {
  if (level >= 50) return '👑';
  if (level >= 30) return '💎';
  if (level >= 20) return '⭐';
  if (level >= 10) return '🌟';
  if (level >= 5) return '✨';
  return '🔰';
}

/**
 * Get streak emoji
 */
function getStreakEmoji(streak: number): string {
  if (streak >= 30) return '🔥🔥🔥';
  if (streak >= 14) return '🔥🔥';
  if (streak >= 7) return '🔥';
  if (streak >= 3) return '⚡';
  return '✨';
}

/**
 * Get streak celebration message
 */
function getStreakMessage(streak: number): string {
  if (streak >= 30) {
    return 'IMPRESSIONANTE! 30 dias de pura dedicação! Você é imparável! 🚀';
  }
  if (streak >= 21) {
    return 'WOW! 3 semanas consecutivas! Você está construindo hábitos sólidos! 💪';
  }
  if (streak >= 14) {
    return 'PARABÉNS! 2 semanas seguidas! A transformação já está acontecendo! ✨';
  }
  if (streak >= 7) {
    return 'ÓTIMO! 1 semana completa! Continue assim, você está no caminho certo! 🌟';
  }
  if (streak >= 3) {
    return 'MUITO BEM! 3 dias seguidos! A consistência está começando! ⚡';
  }
  return 'Continue assim! Cada dia conta! 💚';
}

/**
 * Get XP range description
 */
export function getXPRangeDescription(xp: number): string {
  if (xp >= 10000) return 'Mestre da Transformação';
  if (xp >= 5000) return 'Guerreiro Dedicado';
  if (xp >= 2500) return 'Explorador Consistente';
  if (xp >= 1000) return 'Iniciante Promissor';
  return 'Novo na Jornada';
}

/**
 * Generate motivational message based on progress
 */
export function getMotivationalMessage(data: GamificationData): string {
  const { xp_progress_percent, current_streak, level } = data;

  // Based on progress to next level
  if (xp_progress_percent >= 90) {
    return '🎯 Você está QUASE no próximo nível! Só mais um pouquinho!';
  }
  if (xp_progress_percent >= 75) {
    return '💪 Falta pouco para o próximo nível! Continue firme!';
  }
  if (xp_progress_percent >= 50) {
    return '✨ Você já está na metade do caminho! Não desista agora!';
  }

  // Based on streak
  if (current_streak >= 7) {
    return `🔥 ${current_streak} dias consecutivos! Sua dedicação é inspiradora!`;
  }
  if (current_streak >= 3) {
    return '⚡ A consistência está pagando! Continue assim!';
  }

  // Based on level
  if (level >= 10) {
    return '⭐ Nível ' + level + '! Você é um exemplo de dedicação!';
  }
  if (level >= 5) {
    return '🌟 Você já evoluiu muito! A jornada está só começando!';
  }

  return '💚 Cada passo conta! Você está no caminho certo!';
}
