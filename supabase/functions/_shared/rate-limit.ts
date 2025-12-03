// Rate Limiting Utilities
// Protege contra spam e abuso de recursos

export interface RateLimitConfig {
  registeredUserLimit?: number;  // Msgs/min para usuários cadastrados (default: 10)
  anonymousLimit?: number;        // Msgs/min para usuários anônimos (default: 3)
  window?: number;                // Janela de tempo em ms (default: 60000 = 1min)
}

const DEFAULT_CONFIG: Required<RateLimitConfig> = {
  registeredUserLimit: 10,
  anonymousLimit: 3,
  window: 60000,
};

/**
 * Verifica se usuário excedeu rate limit
 * @param supabase - Cliente Supabase
 * @param userId - ID do usuário (null se anônimo)
 * @param phone - Telefone normalizado
 * @param config - Configuração de limites
 * @returns {allowed: boolean, remaining: number, resetIn: number}
 */
export async function checkRateLimit(
  supabase: any,
  userId: string | null,
  phone: string,
  config: RateLimitConfig = {}
): Promise<{ allowed: boolean; remaining: number; resetIn: number; limit: number }> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const limit = userId ? cfg.registeredUserLimit : cfg.anonymousLimit;
  const windowStart = Date.now() - cfg.window;

  // Contar mensagens no período
  const { count, error } = await supabase
    .from('whatsapp_messages')
    .select('*', { count: 'exact', head: true })
    .eq('phone', phone)
    .eq('event', 'messages.upsert')
    .gte('timestamp', windowStart);

  if (error) {
    console.error('[RateLimit] Error checking rate limit:', error);
    // Em caso de erro, permitir (fail-open)
    return { allowed: true, remaining: limit, resetIn: cfg.window, limit };
  }

  const currentCount = count ?? 0;
  const remaining = Math.max(0, limit - currentCount);
  const allowed = currentCount < limit;
  const resetIn = cfg.window; // Sempre cfg.window pois é rolling window

  return { allowed, remaining, resetIn, limit };
}

/**
 * Formata mensagem de rate limit para o usuário
 */
export function getRateLimitMessage(
  remaining: number,
  resetIn: number,
  isRegistered: boolean
): string {
  const resetMinutes = Math.ceil(resetIn / 60000);
  
  if (remaining === 0) {
    return `⏸️ Você está enviando mensagens muito rápido.\n\n` +
           `Por favor, aguarde ${resetMinutes} minuto${resetMinutes > 1 ? 's' : ''} antes de continuar.\n\n` +
           (isRegistered 
             ? `💡 Usuários cadastrados têm limite maior (10 msgs/min).`
             : `💡 Cadastre-se no app para ter limite maior!`);
  }

  return `⚠️ Atenção: Você tem ${remaining} mensagem${remaining > 1 ? 'ns' : ''} restante${remaining > 1 ? 's' : ''} neste minuto.\n\n` +
         `Por favor, evite enviar muitas mensagens rapidamente.`;
}

/**
 * Registra violação de rate limit para análise
 */
export async function logRateLimitViolation(
  supabase: any,
  userId: string | null,
  phone: string,
  limit: number
): Promise<void> {
  try {
    await supabase
      .from('whatsapp_metrics')
      .insert({
        user_id: userId,
        phone,
        message_length: 0,
        total_latency_ms: 0,
        error: 'Rate limit exceeded',
        error_type: 'rate_limit',
      });
  } catch (error) {
    console.error('[RateLimit] Failed to log violation:', error);
  }
}
