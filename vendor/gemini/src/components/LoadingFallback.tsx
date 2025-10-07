import React, { useEffect, useState } from 'react';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LoadingFallbackProps {
  message?: string;
  timeout?: number;
  onTimeout?: () => void;
}

export default function LoadingFallback({ 
  message = "Carregando...", 
  timeout = 10000,
  onTimeout 
}: LoadingFallbackProps) {
  const [showTimeout, setShowTimeout] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(prev => prev + 100);
    }, 100);

    const timeoutId = setTimeout(() => {
      setShowTimeout(true);
      onTimeout?.();
    }, timeout);

    return () => {
      clearInterval(interval);
      clearTimeout(timeoutId);
    };
  }, [timeout, onTimeout]);

  const progress = Math.min((elapsed / timeout) * 100, 100);

  if (showTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Carregamento Demorado
          </h2>
          <p className="text-gray-600 mb-4">
            O aplicativo está demorando mais que o esperado para carregar.
          </p>
          <div className="space-y-3">
            <Button 
              onClick={() => window.location.reload()} 
              className="w-full"
              variant="default"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Recarregar Página
            </Button>
            <Button 
              onClick={() => window.location.href = '/login'} 
              className="w-full"
              variant="outline"
            >
              Ir para Login
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            Se o problema persistir, entre em contato com o suporte.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
        <p className="text-gray-600 mb-4">{message}</p>
        <div className="w-64 bg-gray-200 rounded-full h-2 mx-auto">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {Math.round(elapsed / 1000)}s / {timeout / 1000}s
        </p>
      </div>
    </div>
  );
}