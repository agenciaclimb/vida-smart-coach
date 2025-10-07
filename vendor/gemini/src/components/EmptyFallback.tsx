import React from 'react';
import { AlertCircle, Home, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyFallbackProps {
  message?: string;
  showActions?: boolean;
}

export default function EmptyFallback({ 
  message = "Página não encontrada ou não carregou corretamente",
  showActions = true 
}: EmptyFallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center max-w-md mx-auto">
        <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Conteúdo Indisponível
        </h1>
        <p className="text-gray-600 mb-6">
          {message}
        </p>
        {showActions && (
          <div className="space-y-3">
            <Button 
              onClick={() => window.location.reload()} 
              className="w-full"
              variant="default"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
            <Button 
              onClick={() => window.location.href = '/'} 
              className="w-full"
              variant="outline"
            >
              <Home className="h-4 w-4 mr-2" />
              Ir para Home
            </Button>
            <Button 
              onClick={() => window.location.href = '/login'} 
              className="w-full"
              variant="ghost"
            >
              Fazer Login
            </Button>
          </div>
        )}
        <div className="mt-6 text-xs text-gray-500">
          <p>Se o problema persistir, contate o suporte técnico.</p>
          <p className="mt-1">Vida Smart Coach v1.0</p>
        </div>
      </div>
    </div>
  );
}