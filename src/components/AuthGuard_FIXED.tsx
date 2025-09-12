import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthProvider_FIXED';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  requireAuth = true,
  redirectTo = '/login'
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return; // Aguardar verificação de auth

    const currentPath = location.pathname;
    const isLoginPage = currentPath === '/login' || currentPath === '/';

    if (requireAuth && !user && !isLoginPage) {
      // Usuário não autenticado tentando acessar página protegida
      console.log('🚫 Acesso negado, redirecionando para login');
      const returnUrl = encodeURIComponent(currentPath + location.search);
      navigate(`${redirectTo}?returnUrl=${returnUrl}`, { replace: true });
    } else if (!requireAuth && user && isLoginPage) {
      // Usuário autenticado tentando acessar página de login
      console.log('✅ Usuário já autenticado, redirecionando para dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, location, navigate, requireAuth, redirectTo]);

  // Mostrar loading enquanto verifica auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Se requer auth mas não tem usuário, não renderizar (redirecionamento em andamento)
  if (requireAuth && !user) {
    return null;
  }

  // Se não requer auth mas tem usuário em página de login, não renderizar (redirecionamento em andamento)
  if (!requireAuth && user && (location.pathname === '/login' || location.pathname === '/')) {
    return null;
  }

  return <>{children}</>;
};