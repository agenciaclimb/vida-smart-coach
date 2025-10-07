// src/components/RouteGuard-Enhanced.tsx
import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';

// ===============================================
// 🛡️ ROUTE GUARD - PROTEÇÃO CONTRA LOOPS
// ===============================================

interface RouteGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

const MAX_REDIRECTS = 20;
const REDIRECT_WINDOW = 30000; // 30s

export const RouteGuardEnhanced: React.FC<RouteGuardProps> = ({
  children,
  requireAuth = true,
  redirectTo = '/login'
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const redirectCountRef = useRef(0);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    // Se loading===true, renderizar fallback
    if (loading) return;

    const currentPath = location.pathname;

    // Se requer auth mas user===null, redirecionar UMA vez
    if (requireAuth && !user && currentPath !== redirectTo) {
      if (redirectCountRef.current >= MAX_REDIRECTS) {
        console.error('🚨 Máximo de redirects atingido, bloqueando');
        setBlocked(true);
        return;
      }
      redirectCountRef.current++;
      console.log(`🔄 Redirect ${redirectCountRef.current}/${MAX_REDIRECTS} para ${redirectTo}`);
      navigate(redirectTo, { replace: true });
      return;
    }

    // Reset contador em navegação bem-sucedida
    if (redirectCountRef.current > 0) {
      redirectCountRef.current = 0;
    }
  }, [user, loading, location.pathname, requireAuth, redirectTo, navigate]);

  // Se bloqueado por loops
  if (blocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-red-600 mb-4">🛡️ Loop Detectado</h2>
          <p className="text-gray-600 mb-4">Navegação bloqueada para proteção.</p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  // Se loading===true, renderizar fallback
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">🛡️ Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Se user===null e rota protegida, aguardar redirect
  if (requireAuth && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecionando...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default RouteGuardEnhanced;
