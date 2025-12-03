// Circuit Breaker Pattern
// Protege contra falhas em cascata abrindo o circuito após threshold de falhas

export enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Rejecting calls, using fallback
  HALF_OPEN = 'HALF_OPEN' // Testing if service recovered
}

export interface CircuitBreakerOptions {
  threshold?: number;      // Falhas antes de abrir (default: 5)
  timeout?: number;        // Tempo antes de tentar HALF_OPEN (default: 30000ms)
  resetTimeout?: number;   // Tempo em HALF_OPEN antes de fechar (default: 10000ms)
  name?: string;          // Nome para logging
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures = 0;
  private successes = 0;
  private lastFailTime = 0;
  private readonly threshold: number;
  private readonly timeout: number;
  private readonly resetTimeout: number;
  private readonly name: string;

  constructor(options: CircuitBreakerOptions = {}) {
    this.threshold = options.threshold ?? 5;
    this.timeout = options.timeout ?? 30000;
    this.resetTimeout = options.resetTimeout ?? 10000;
    this.name = options.name ?? 'CircuitBreaker';
  }

  async execute<T>(
    fn: () => Promise<T>,
    fallback: () => T | Promise<T>
  ): Promise<{ result: T; fromFallback: boolean }> {
    // Se OPEN, verificar se deve tentar HALF_OPEN
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailTime > this.timeout) {
        console.log(`[${this.name}] Transitioning to HALF_OPEN (testing recovery)`);
        this.state = CircuitState.HALF_OPEN;
        this.successes = 0;
      } else {
        console.warn(`[${this.name}] Circuit OPEN - using fallback (failures: ${this.failures})`);
        const result = await Promise.resolve(fallback());
        return { result, fromFallback: true };
      }
    }

    try {
      const result = await fn();
      
      // Sucesso
      this.onSuccess();
      return { result, fromFallback: false };

    } catch (error) {
      // Falha
      this.onFailure();
      console.error(`[${this.name}] Operation failed (${this.failures}/${this.threshold})`, error);
      
      const result = await Promise.resolve(fallback());
      return { result, fromFallback: true };
    }
  }

  private onSuccess() {
    this.failures = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successes++;
      
      // Se conseguiu sucesso em HALF_OPEN, fechar o circuito
      if (this.successes >= 1) { // Pode ajustar para exigir múltiplos sucessos
        console.log(`[${this.name}] Circuit CLOSED (recovered)`);
        this.state = CircuitState.CLOSED;
        this.successes = 0;
      }
    }
  }

  private onFailure() {
    this.failures++;
    this.lastFailTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      // Falhou em HALF_OPEN, volta para OPEN
      console.error(`[${this.name}] Circuit reopened (failed during recovery test)`);
      this.state = CircuitState.OPEN;
      this.successes = 0;
    } else if (this.failures >= this.threshold) {
      // Atingiu threshold, abrir circuito
      console.error(`[${this.name}] Circuit OPENED (${this.failures} consecutive failures)`);
      this.state = CircuitState.OPEN;
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  getStats() {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailTime: this.lastFailTime,
    };
  }

  // Forçar reset (útil para testes ou manutenção)
  reset() {
    console.log(`[${this.name}] Manual reset`);
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.lastFailTime = 0;
  }
}

// Instâncias globais para serviços críticos
export const iaCoachCircuitBreaker = new CircuitBreaker({
  threshold: 5,
  timeout: 30000,
  name: 'IACoach'
});

export const evolutionApiCircuitBreaker = new CircuitBreaker({
  threshold: 5,
  timeout: 30000,
  name: 'EvolutionAPI'
});
