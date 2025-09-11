import { useState, useEffect, useRef } from 'react';

// ===============================================
// 🛡️ SAFE API HOOK - PREVINE LOOPS INFINITOS
// ===============================================

interface ApiCallOptions {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
  enabled?: boolean;
}

interface ApiCallState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  retryCount: number;
}

/**
 * Hook seguro para chamadas API que previne loops infinitos
 */
export function useApiCallSafe<T>(
  apiFunction: () => Promise<T>,
  deps: any[] = [],
  options: ApiCallOptions = {}
): ApiCallState<T> & { refetch: () => void; abort: () => void } {
  
  const {
    maxRetries = 2,
    retryDelay = 1000,
    timeout = 10000,
    enabled = true
  } = options;

  const [state, setState] = useState<ApiCallState<T>>({
    data: null,
    loading: false,
    error: null,
    retryCount: 0
  });

  // Refs para controle
  const abortControllerRef = useRef<AbortController | null>(null);
  const isExecutingRef = useRef(false);
  const lastExecutionRef = useRef(0);
  const mountedRef = useRef(true);

  // Função para abortar requests
  const abort = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    isExecutingRef.current = false;
  };

  // Função principal de execução
  const executeApiCall = async (retryAttempt = 0) => {
    // Prevenir múltiplas execuções simultâneas
    if (isExecutingRef.current) {
      console.log('🚫 API call já em execução, ignorando...');
      return;
    }

    // Prevenir execuções muito frequentes (debounce)
    const now = Date.now();
    if (now - lastExecutionRef.current < 500) {
      console.log('🚫 API call muito frequente, ignorando...');
      return;
    }
    lastExecutionRef.current = now;

    if (!mountedRef.current || !enabled) {
      return;
    }

    console.log(`🔄 Executando API call (tentativa ${retryAttempt + 1}/${maxRetries + 1})`);

    isExecutingRef.current = true;
    
    // Criar novo AbortController
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    // Atualizar estado
    setState(prev => ({
      ...prev,
      loading: true,
      error: retryAttempt === 0 ? null : prev.error,
      retryCount: retryAttempt
    }));

    try {
      // Timeout de segurança
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), timeout);
      });

      // Executar API call com timeout
      const result = await Promise.race([
        apiFunction(),
        timeoutPromise
      ]);

      // Verificar se foi abortado
      if (signal.aborted) {
        console.log('⏹️ API call abortado');
        return;
      }

      if (!mountedRef.current) {
        return;
      }

      // Sucesso
      console.log('✅ API call bem-sucedida');
      setState({
        data: result,
        loading: false,
        error: null,
        retryCount: retryAttempt
      });

    } catch (error: any) {
      if (!mountedRef.current || signal.aborted) {
        return;
      }

      console.error(`❌ API call falhou (tentativa ${retryAttempt + 1}):`, error.message);

      // Verificar se deve tentar novamente
      if (retryAttempt < maxRetries && !signal.aborted) {
        console.log(`🔄 Tentando novamente em ${retryDelay}ms...`);
        
        setTimeout(() => {
          if (mountedRef.current && !signal.aborted) {
            executeApiCall(retryAttempt + 1);
          }
        }, retryDelay * Math.pow(2, retryAttempt)); // Backoff exponencial
      } else {
        // Máximo de tentativas atingido
        console.error('💀 Máximo de tentativas atingido, parando...');
        setState({
          data: null,
          loading: false,
          error: error.message || 'Erro na API',
          retryCount: retryAttempt
        });
      }
    } finally {
      isExecutingRef.current = false;
    }
  };

  // Função de refetch manual
  const refetch = () => {
    console.log('🔄 Refetch manual solicitado');
    abort(); // Abortar request atual se houver
    executeApiCall(0);
  };

  // Efeito para executar automaticamente
  useEffect(() => {
    if (enabled) {
      executeApiCall(0);
    }

    return () => {
      abort();
    };
  }, [...deps, enabled]);

  // Cleanup na desmontagem
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      abort();
    };
  }, []);

  return {
    ...state,
    refetch,
    abort
  };
}