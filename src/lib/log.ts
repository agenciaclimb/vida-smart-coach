/**
 * Observability Framework - Logging and Error Tracking
 * 
 * Provides centralized logging with multiple output targets:
 * - Console (development)
 * - localStorage (client-side persistence)  
 * - External services (production monitoring)
 * 
 * Usage:
 * import { log } from '@/lib/log';
 * 
 * log.info('User logged in', { userId: user.id });
 * log.error('API call failed', error, { endpoint: '/api/users' });
 * log.debug('State updated', { newState });
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: Error;
  stack?: string;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;
  private maxStorageEntries = 1000;
  private storageKey = 'vida-smart-logs';

  /**
   * Log debug information (development only)
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      this.log('debug', message, undefined, context);
    }
  }

  /**
   * Log informational messages
   */
  info(message: string, context?: LogContext): void {
    this.log('info', message, undefined, context);
  }

  /**
   * Log warnings
   */
  warn(message: string, context?: LogContext): void {
    this.log('warn', message, undefined, context);
  }

  /**
   * Log errors with optional Error object
   */
  error(message: string, error?: Error, context?: LogContext): void {
    this.log('error', message, error, context);
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, error?: Error, context?: LogContext): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error,
      stack: error?.stack
    };

    // Console output
    this.logToConsole(entry);

    // LocalStorage persistence
    this.logToStorage(entry);

    // External service logging (production only)
    if (!this.isDevelopment && level === 'error') {
      this.logToExternal(entry);
    }
  }

  /**
   * Console output with appropriate styling
   */
  private logToConsole(entry: LogEntry): void {
    const styles = {
      debug: 'color: #6B7280; font-weight: normal',
      info: 'color: #3B82F6; font-weight: normal', 
      warn: 'color: #F59E0B; font-weight: bold',
      error: 'color: #DC2626; font-weight: bold'
    };

    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}]`;
    
    if (entry.context || entry.error) {
      console.group(`%c${prefix} ${entry.message}`, styles[entry.level]);
      
      if (entry.context) {
        console.log('Context:', entry.context);
      }
      
      if (entry.error) {
        console.error('Error:', entry.error);
      }
      
      console.groupEnd();
    } else {
      console.log(`%c${prefix} ${entry.message}`, styles[entry.level]);
    }
  }

  /**
   * LocalStorage persistence for debugging
   */
  private logToStorage(entry: LogEntry): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      const logs: LogEntry[] = stored ? JSON.parse(stored) : [];
      
      // Add new entry
      logs.push(entry);
      
      // Maintain max entries limit
      if (logs.length > this.maxStorageEntries) {
        logs.splice(0, logs.length - this.maxStorageEntries);
      }
      
      localStorage.setItem(this.storageKey, JSON.stringify(logs));
    } catch (e) {
      // Storage might be full or unavailable
      console.warn('Failed to persist log to storage:', e);
    }
  }

  /**
   * External service logging (production error tracking)
   */
  private logToExternal(entry: LogEntry): void {
    // In production, integrate with services like Sentry, LogRocket, etc.
    // For now, we'll just prepare the payload structure
    
    const payload = {
      message: entry.message,
      level: entry.level,
      timestamp: entry.timestamp,
      url: window.location.href,
      userAgent: navigator.userAgent,
      context: entry.context,
      stack: entry.stack
    };

    // Example integration points:
    // - Sentry.captureException(entry.error)
    // - fetch('/api/logs', { method: 'POST', body: JSON.stringify(payload) })
    // - Analytics service event tracking
    
    console.log('External logging payload:', payload);
  }

  /**
   * Retrieve stored logs for debugging
   */
  getLogs(level?: LogLevel): LogEntry[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      const logs: LogEntry[] = stored ? JSON.parse(stored) : [];
      
      return level ? logs.filter(log => log.level === level) : logs;
    } catch (e) {
      console.warn('Failed to retrieve logs from storage:', e);
      return [];
    }
  }

  /**
   * Clear stored logs
   */
  clearLogs(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (e) {
      console.warn('Failed to clear logs from storage:', e);
    }
  }

  /**
   * Export logs as downloadable file
   */
  exportLogs(): void {
    const logs = this.getLogs();
    const blob = new Blob([JSON.stringify(logs, null, 2)], { 
      type: 'application/json' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vida-smart-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Singleton instance
export const log = new Logger();

// Development helper to access logs from browser console
if (import.meta.env.DEV) {
  (window as any).vidaSmartLogs = {
    get: (level?: LogLevel) => log.getLogs(level),
    clear: () => log.clearLogs(),
    export: () => log.exportLogs()
  };
  
  console.log('💡 Debug: Access logs with window.vidaSmartLogs');
}

// Error boundary integration helper
export const logError = (error: Error, errorInfo?: any) => {
  log.error('React Error Boundary', error, {
    componentStack: errorInfo?.componentStack,
    errorBoundary: true
  });
};

// Performance monitoring helpers
export const logPerformance = {
  start: (operation: string) => {
    const startTime = performance.now();
    return {
      end: (context?: LogContext) => {
        const duration = performance.now() - startTime;
        log.info(`Performance: ${operation}`, {
          ...context,
          duration: `${duration.toFixed(2)}ms`,
          operation
        });
      }
    };
  },

  measure: (name: string, fn: () => any) => {
    const timer = logPerformance.start(name);
    const result = fn();
    timer.end();
    return result;
  }
};

export default log;