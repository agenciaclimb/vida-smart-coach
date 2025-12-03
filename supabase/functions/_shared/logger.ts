// Structured Logger for Supabase Edge Functions
// Usage:
//   import { logger } from '../_shared/logger.ts';
//   logger.info('Webhook received', { userId, phone, event: 'messages.upsert' });
//   logger.error('Failed to call IA', error, { userId, stage, latency: 5000 });

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogContext {
  userId?: string;
  phone?: string;
  stage?: string;
  messageId?: string;
  latency?: number;
  [key: string]: any;
}

class StructuredLogger {
  constructor(private minLevel: LogLevel = LogLevel.INFO) {
    // Em produção, definir minLevel via env var
    const envLevel = Deno.env.get('LOG_LEVEL');
    if (envLevel) {
      this.minLevel = LogLevel[envLevel as keyof typeof LogLevel] ?? LogLevel.INFO;
    }
  }

  log(level: LogLevel, message: string, context?: LogContext) {
    if (level < this.minLevel) return;

    const entry = {
      timestamp: new Date().toISOString(),
      level: LogLevel[level],
      message,
      ...context,
    };

    // Console.log com JSON estruturado (indexável por ferramentas)
    console.log(JSON.stringify(entry));

    // TODO: Enviar para serviço externo (Sentry, Datadog, etc)
    // if (level >= LogLevel.ERROR) {
    //   this.sendToExternalService(entry);
    // }
  }

  debug(message: string, context?: LogContext) {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: LogContext) {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error: Error | any, context?: LogContext) {
    this.log(LogLevel.ERROR, message, {
      ...context,
      error: error?.message || String(error),
      stack: error?.stack,
    });
  }

  // Helper para medir tempo de operações
  startTimer(operation: string): () => number {
    const startTime = Date.now();
    return () => {
      const duration = Date.now() - startTime;
      this.debug(`Timer: ${operation}`, { operation, duration_ms: duration });
      return duration;
    };
  }

  // Helper para adicionar contexto a múltiplos logs
  withContext(context: LogContext): ContextLogger {
    return new ContextLogger(this, context);
  }
}

// Logger com contexto pré-configurado
class ContextLogger {
  constructor(
    private logger: StructuredLogger,
    private context: LogContext
  ) {}

  debug(message: string, additionalContext?: LogContext) {
    this.logger.debug(message, { ...this.context, ...additionalContext });
  }

  info(message: string, additionalContext?: LogContext) {
    this.logger.info(message, { ...this.context, ...additionalContext });
  }

  warn(message: string, additionalContext?: LogContext) {
    this.logger.warn(message, { ...this.context, ...additionalContext });
  }

  error(message: string, error: Error | any, additionalContext?: LogContext) {
    this.logger.error(message, error, { ...this.context, ...additionalContext });
  }

  startTimer(operation: string) {
    return this.logger.startTimer(operation);
  }
}

// Instância singleton
export const logger = new StructuredLogger();

// Export tipos para uso externo
export type { ContextLogger };
