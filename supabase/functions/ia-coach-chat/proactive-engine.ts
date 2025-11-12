/**
 * Proactive Engine - Intelligent Proactive Messaging System
 * 
 * Detects 8 contextual triggers and sends proactive messages to users
 * with intelligent cooldown and frequency management.
 * 
 * Rules:
 * 1. inactive_24h: User inactive >24h → Friendly reminder
 * 2. progress_stagnant: No completions 3+ days → Specific suggestions
 * 3. repeated_difficulties: Same activity failed 3x → Plan adjustment offer
 * 4. milestone_achieved: XP multiple of 1000 → Celebration
 * 5. checkin_missed: Daily not done by 8pm → Motivational nudge
 * 6. streak_at_risk: Streak >7 days without today's activity → Preventive alert
 * 7. xp_threshold: XP accumulated >5000 → Reward suggestion
 * 8. success_pattern: 7+ consecutive days → Positive reinforcement
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

export type ProactiveMessageType =
  | 'inactive_24h'
  | 'progress_stagnant'
  | 'repeated_difficulties'
  | 'milestone_achieved'
  | 'checkin_missed'
  | 'streak_at_risk'
  | 'xp_threshold'
  | 'success_pattern';

export interface ProactiveContext {
  userId: string;
  userData: any;
  contextData: any;
}

export interface ProactiveMessage {
  type: ProactiveMessageType;
  message: string;
  metadata: Record<string, any>;
}

/**
 * Check if user qualifies for any proactive message
 */
export async function checkProactiveOpportunity(
  supabase: SupabaseClient,
  context: ProactiveContext
): Promise<ProactiveMessage | null> {
  const { userId, userData, contextData } = context;

  // Check each rule in priority order
  const checks = [
    checkStreakAtRisk,
    checkMilestoneAchieved,
    checkXPThreshold,
    checkCheckinMissed,
    checkSuccessPattern,
    checkRepeatedDifficulties,
    checkProgressStagnant,
    checkInactive24h,
  ];

  for (const check of checks) {
    const result = await check(supabase, context);
    if (result) {
      // Verify cooldown before returning
      const canSend = await canSendProactiveMessage(supabase, userId, result.type);
      if (canSend) {
        return result;
      }
    }
  }

  return null;
}

/**
 * Check if proactive message can be sent (respects cooldown)
 */
async function canSendProactiveMessage(
  supabase: SupabaseClient,
  userId: string,
  messageType: ProactiveMessageType
): Promise<boolean> {
  const { data, error } = await supabase.rpc('can_send_proactive_message', {
    p_user_id: userId,
    p_message_type: messageType,
  });

  if (error) {
    console.error('Error checking proactive cooldown:', error);
    return false;
  }

  return data === true;
}

/**
 * Record proactive message in database
 */
export async function recordProactiveMessage(
  supabase: SupabaseClient,
  userId: string,
  message: ProactiveMessage
): Promise<void> {
  const { error } = await supabase.from('proactive_messages').insert({
    user_id: userId,
    message_type: message.type,
    message_content: message.message,
    metadata: message.metadata,
  });

  if (error) {
    console.error('Error recording proactive message:', error);
  }
}

/**
 * Mark proactive message as responded
 */
export async function markProactiveMessageResponded(
  supabase: SupabaseClient,
  userId: string,
  messageType: ProactiveMessageType
): Promise<void> {
  // Get most recent message of this type
  const { data: messages } = await supabase
    .from('proactive_messages')
    .select('id')
    .eq('user_id', userId)
    .eq('message_type', messageType)
    .eq('response_received', false)
    .order('sent_at', { ascending: false })
    .limit(1);

  if (messages && messages.length > 0) {
    await supabase
      .from('proactive_messages')
      .update({
        response_received: true,
        response_at: new Date().toISOString(),
      })
      .eq('id', messages[0].id);
  }
}

// ============================================================================
// PROACTIVE RULES - Each returns ProactiveMessage or null
// ============================================================================

/**
 * Rule 1: User inactive >24h
 */
async function checkInactive24h(
  supabase: SupabaseClient,
  context: ProactiveContext
): Promise<ProactiveMessage | null> {
  const { userId, userData } = context;

  // Check last activity
  const { data: lastActivity } = await supabase
    .from('conversation_memory')
    .select('created_at')
    .eq('user_id', userId)
    .eq('role', 'user')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!lastActivity) return null;

  const hoursSinceActivity = (Date.now() - new Date(lastActivity.created_at).getTime()) / (1000 * 60 * 60);

  if (hoursSinceActivity >= 24) {
    const firstName = userData.first_name || 'amigo(a)';
    return {
      type: 'inactive_24h',
      message: `Oi ${firstName}! 👋 Notei que você está um pouco afastado(a). Como estão as coisas? Lembre-se: pequenos passos todo dia fazem toda a diferença! 💪`,
      metadata: { hours_inactive: Math.floor(hoursSinceActivity) },
    };
  }

  return null;
}

/**
 * Rule 2: No completions in 3+ days
 */
async function checkProgressStagnant(
  supabase: SupabaseClient,
  context: ProactiveContext
): Promise<ProactiveMessage | null> {
  const { userId, userData } = context;

  // Check last completion
  const { data: lastCompletion } = await supabase
    .from('daily_activities')
    .select('completed_at')
    .eq('user_id', userId)
    .eq('is_completed', true)
    .order('completed_at', { ascending: false })
    .limit(1)
    .single();

  if (!lastCompletion) return null;

  const daysSinceCompletion = (Date.now() - new Date(lastCompletion.completed_at).getTime()) / (1000 * 60 * 60 * 24);

  if (daysSinceCompletion >= 3) {
    const firstName = userData.first_name || 'amigo(a)';
    return {
      type: 'progress_stagnant',
      message: `${firstName}, percebi que faz alguns dias sem registrar atividades. 🤔 Quer que eu ajuste seu plano para algo mais compatível com sua rotina atual? Estou aqui para te apoiar! 🌟`,
      metadata: { days_stagnant: Math.floor(daysSinceCompletion) },
    };
  }

  return null;
}

/**
 * Rule 3: Same activity failed 3+ times
 */
async function checkRepeatedDifficulties(
  supabase: SupabaseClient,
  context: ProactiveContext
): Promise<ProactiveMessage | null> {
  const { userId, userData } = context;

  // Check for repeated failures in feedback
  const { data: feedbacks } = await supabase
    .from('plan_feedback')
    .select('feedback, item_pillar')
    .eq('user_id', userId)
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false });

  if (!feedbacks || feedbacks.length < 3) return null;

  // Look for repeated difficulty keywords
  const difficultyKeywords = ['difícil', 'não consigo', 'complicado', 'pesado', 'cansativo', 'muito'];
  const difficultPillars: Record<string, number> = {};

  for (const fb of feedbacks) {
    const hasDifficulty = difficultyKeywords.some(kw => fb.feedback?.toLowerCase().includes(kw));
    if (hasDifficulty && fb.item_pillar) {
      difficultPillars[fb.item_pillar] = (difficultPillars[fb.item_pillar] || 0) + 1;
    }
  }

  const mostDifficultPillar = Object.entries(difficultPillars)
    .sort(([, a], [, b]) => b - a)[0];

  if (mostDifficultPillar && mostDifficultPillar[1] >= 3) {
    const firstName = userData.first_name || 'amigo(a)';
    const pillarName = {
      physical: 'físico',
      nutritional: 'nutricional',
      emotional: 'emocional',
      spiritual: 'espiritual',
    }[mostDifficultPillar[0]] || mostDifficultPillar[0];

    return {
      type: 'repeated_difficulties',
      message: `${firstName}, notei que você está com dificuldades no pilar ${pillarName}. 💙 Que tal ajustarmos seu plano para algo mais adequado? Vamos juntos encontrar o que funciona melhor para você! ✨`,
      metadata: { difficult_pillar: mostDifficultPillar[0], count: mostDifficultPillar[1] },
    };
  }

  return null;
}

/**
 * Rule 4: XP milestone achieved (multiple of 1000)
 */
async function checkMilestoneAchieved(
  supabase: SupabaseClient,
  context: ProactiveContext
): Promise<ProactiveMessage | null> {
  const { userId, userData, contextData } = context;

  const totalXP = contextData?.gamification?.total_points || 0;

  // Check if recently crossed a 1000 XP milestone
  if (totalXP >= 1000 && totalXP % 1000 < 100) {
    // Only trigger if within 100 XP of milestone (recent achievement)
    const milestone = Math.floor(totalXP / 1000) * 1000;
    const firstName = userData.first_name || 'amigo(a)';

    return {
      type: 'milestone_achieved',
      message: `🎉 INCRÍVEL, ${firstName}! Você acabou de atingir ${milestone} XP! 🏆 Sua dedicação está transformando sua vida. Continue assim, você é uma inspiração! 💫`,
      metadata: { milestone, total_xp: totalXP },
    };
  }

  return null;
}

/**
 * Rule 5: Daily check-in missed (after 8pm)
 */
async function checkCheckinMissed(
  supabase: SupabaseClient,
  context: ProactiveContext
): Promise<ProactiveMessage | null> {
  const { userId, userData } = context;

  // Check time (only after 8pm)
  const hourBrasilia = new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo', hour: '2-digit', hour12: false });
  if (parseInt(hourBrasilia) < 20) return null;

  // Check if user did any activity today
  const today = new Date().toISOString().split('T')[0];
  const { data: todayActivities } = await supabase
    .from('daily_activities')
    .select('id')
    .eq('user_id', userId)
    .gte('completed_at', `${today}T00:00:00`)
    .limit(1);

  if (!todayActivities || todayActivities.length === 0) {
    const firstName = userData.first_name || 'amigo(a)';
    return {
      type: 'checkin_missed',
      message: `${firstName}, ainda dá tempo! ⏰ Que tal registrar pelo menos uma atividade hoje? Mesmo pequenos passos contam para manter seu ritmo! 🌟`,
      metadata: { date: today },
    };
  }

  return null;
}

/**
 * Rule 6: Streak at risk (7+ days, no activity today)
 */
async function checkStreakAtRisk(
  supabase: SupabaseClient,
  context: ProactiveContext
): Promise<ProactiveMessage | null> {
  const { userId, userData, contextData } = context;

  const currentStreak = contextData?.gamification?.current_streak || 0;

  if (currentStreak >= 7) {
    // Check if user did activity today
    const today = new Date().toISOString().split('T')[0];
    const { data: todayActivities } = await supabase
      .from('daily_activities')
      .select('id')
      .eq('user_id', userId)
      .gte('completed_at', `${today}T00:00:00`)
      .limit(1);

    if (!todayActivities || todayActivities.length === 0) {
      const firstName = userData.first_name || 'amigo(a)';
      return {
        type: 'streak_at_risk',
        message: `🔥 ${firstName}! Sua sequência de ${currentStreak} dias está em risco! 😱 Não deixe todo esse progresso escapar. Uma atividade simples já mantém sua chama acesa! 💪`,
        metadata: { current_streak: currentStreak },
      };
    }
  }

  return null;
}

/**
 * Rule 7: High XP threshold (>5000) - suggest rewards
 */
async function checkXPThreshold(
  supabase: SupabaseClient,
  context: ProactiveContext
): Promise<ProactiveMessage | null> {
  const { userId, userData, contextData } = context;

  const totalXP = contextData?.gamification?.total_points || 0;

  if (totalXP >= 5000) {
    // Check if user has redeemed anything recently
    const { data: recentRedemptions } = await supabase
      .from('reward_redemptions')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .limit(1);

    if (!recentRedemptions || recentRedemptions.length === 0) {
      const firstName = userData.first_name || 'amigo(a)';
      return {
        type: 'xp_threshold',
        message: `✨ ${firstName}, você tem ${totalXP} XP acumulados! 🎁 Que tal trocar por uma recompensa incrível? Consultas, e-books, descontos... Você merece! 🌟`,
        metadata: { total_xp: totalXP },
      };
    }
  }

  return null;
}

/**
 * Rule 8: Success pattern (7+ consecutive days)
 */
async function checkSuccessPattern(
  supabase: SupabaseClient,
  context: ProactiveContext
): Promise<ProactiveMessage | null> {
  const { userId, userData, contextData } = context;

  const currentStreak = contextData?.gamification?.current_streak || 0;

  // Check if just reached 7, 14, 21, 30 days (milestones)
  const milestones = [7, 14, 21, 30];
  if (milestones.includes(currentStreak)) {
    const firstName = userData.first_name || 'amigo(a)';
    return {
      type: 'success_pattern',
      message: `🌟 ${firstName}, ${currentStreak} dias consecutivos! 🎊 Você está provando que transformação real acontece com consistência. Seu futuro eu está muito orgulhoso! 💚`,
      metadata: { streak: currentStreak },
    };
  }

  return null;
}
