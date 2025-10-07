// src/hooks/useApiCall-SafeGuard.ts
import { useState, useRef, useCallback } from 'react';

// ===============================================
// 🛡️ HOOK ANTI-LOOP COM DEDUPLICAÇÃO AVANÇADA
// ===============================================

interface ApiCallOptions {
  maxRetries?: number;
  timeout?: number;
  enabled?: boolean;
}

// Cache global de requests em andamento (deduplicação)
const inflightRequests = new Map<string, Promise<any>>();
let globalInflightCount = 0;

/**
 * Hook seguro com deduplicação, AbortController, debounce e backoff exponencial
 */
export function useApiCallSafeGuard() {
  const [inflightCount, setInflightCount] = useState(0);
  const abortControllersRef = useRef(new Set<AbortController>());
  const lastCallRef = useRef(0);

  const call = useCallback(async <T>(
    fn: () => Promise<T>,
    options: ApiCallOptions = {}
  ): Promise<T> => {
    const { maxRetries = 2, timeout = 10000, enabled = true } = options;

    if (!enabled) {
      throw new Error('API call disabled');
    }

    // Debounce 500ms
    const now = Date.now();
    if (now - lastCallRef.current < 500) {
      throw new Error('API call too frequent');
    }
    lastCallRef.current = now;

    // Gerar chave para deduplicação (simplificada)
    const fnString = fn.toString();
    const key = `${fnString.slice(0, 100)}_${JSON.stringify(options)}`;

    // Se já existe request idêntico, retornar promise existente
    if (inflightRequests.has(key)) {
      console.log('🔄 Reusando request em andamento:', key.slice(0, 50));
      return inflightRequests.get(key)!;
    }

    // AbortController para este request
    const controller = new AbortController();
    abortControllersRef.current.add(controller);

    // Atualizar contadores
    globalInflightCount++;
    setInflightCount(globalInflightCount);

    // Função de retry com backoff exponencial
    const executeWithRetry = async (attempt = 0): Promise<T> => {
      try {
        // Timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('timeout')), timeout);
        });

        const result = await Promise.race([fn(), timeoutPromise]);

        if (controller.signal.aborted) {
          throw new Error('aborted');
        }

        return result;
      } catch (error: any) {
        if (controller.signal.aborted) {
          throw error;
        }

        if (attempt < maxRetries && error.message !== 'timeout') {
          const delay = 400 * Math.pow(2, attempt) + Math.random() * 200; // Jitter
          console.log(`🔄 Retry ${attempt + 1}/${maxRetries} em ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return executeWithRetry(attempt + 1);
        }

        throw error;
      }
    };

    // Executar request
    const promise = executeWithRetry()
      .finally(() => {
        // Cleanup
        inflightRequests.delete(key);
        abortControllersRef.current.delete(controller);
        globalInflightCount--;
        setInflightCount(globalInflightCount);
      });

    // Adicionar ao cache de deduplicação
    inflightRequests.set(key, promise);

    return promise;
  }, []);

  const abortAll = useCallback(() => {
    abortControllersRef.current.forEach(controller => controller.abort());
    abortControllersRef.current.clear();
    inflightRequests.clear();
    globalInflightCount = 0;
    setInflightCount(0);
  }, []);

  return { call, inflightCount, abortAll };
}