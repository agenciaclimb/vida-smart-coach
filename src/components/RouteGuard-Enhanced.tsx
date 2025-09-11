import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/SupabaseAuthContext';

// ===============================================
// 🛡️ ROUTE GUARD ENHANCED - VIDA SMART
// ===============================================
// Guard inteligente que previne loops e monitora comportamento

interface RouteGuardProps {
  children: React.ReactNode;
}

interface GuardStats {
  redirectCount: number;
  lastRedirect: string | null;
  loopDetected: boolean;
  startTime: number;
}

export default function RouteGuardEnhanced({ children }: RouteGuardProps) {
  const { user, loading, initialized } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Estado para monitoramento de loops
  const [guardStats, setGuardStats] = useState<GuardStats>({
    redirectCount: 0,
    lastRedirect: null,
    loopDetected: false,
    startTime: Date.now()
  });
  
  // Ref para controle de execução
  const executionRef = useRef(0);
  const lastLocationRef = useRef<string>('');

  // Configurações
  const MAX_REDIRECTS = 15;
  const LOOP_DETECTION_WINDOW = 30000; // 30 segundos
  const PROTECTED_ROUTES = ['/dashboard', '/profile', '/settings'];
  const AUTH_ROUTES = ['/login', '/register', '/forgot-password'];

  // ===============================================
  // 🔍 UTILITÁRIOS DE ANÁLISE
  // ===============================================
  const isProtectedRoute = (path: string): boolean => {
    return PROTECTED_ROUTES.some(route => path.startsWith(route)) || 
           (!AUTH_ROUTES.includes(path) && path !== '/');
  };

  const isAuthRoute = (path: string): boolean => {
    return AUTH_ROUTES.includes(path);
  };

  const shouldRedirect = (): { redirect: boolean; to?: string; reason?: string } => {
    const currentPath = location.pathname;
    
    // Usuário logado tentando acessar páginas de auth
    if (user && isAuthRoute(currentPath)) {
      return { 
        redirect: true, 
        to: '/dashboard', 
        reason: 'authenticated-user-on-auth-page'
      };
    }
    
    // Usuário não logado tentando acessar páginas protegidas
    if (!user && isProtectedRoute(currentPath)) {
      return { 
        redirect: true, 
        to: '/login', 
        reason: 'unauthenticated-user-on-protected-page'
      };
    }
    
    return { redirect: false };
  };

  // ===============================================
  // 🚨 DETECÇÃO DE LOOP
  // ===============================================
  const detectLoop = (): boolean => {
    const now = Date.now();
    const timeSinceStart = now - guardStats.startTime;
    
    // Se muitos redirects em pouco tempo = loop
    if (guardStats.redirectCount > MAX_REDIRECTS) {
      console.error('🚨 RouteGuard: Loop detectado - muitos redirects!', {
        count: guardStats.redirectCount,
        timeElapsed: timeSinceStart,
        currentPath: location.pathname,
        user: !!user,
        loading
      });
      return true;
    }
    
    // Se oscilando entre mesmas rotas rapidamente = loop
    if (guardStats.redirectCount > 5 && timeSinceStart < LOOP_DETECTION_WINDOW) {
      const frequency = guardStats.redirectCount / (timeSinceStart / 1000);
      if (frequency > 0.5) { // Mais de 1 redirect a cada 2 segundos
        console.error('🚨 RouteGuard: Loop detectado - frequência alta!', {
          frequency: frequency.toFixed(2),
          redirects: guardStats.redirectCount,
          timeWindow: timeSinceStart
        });
        return true;
      }
    }
    
    return false;
  };

  // ===============================================
  // 🔄 LÓGICA PRINCIPAL DE REDIRECIONAMENTO
  // ===============================================
  useEffect(() => {
    // Não executar enquanto carregando ou não inicializado
    if (loading || !initialized) {
      return;
    }

    // Incrementar contador de execução
    executionRef.current += 1;
    const currentExecution = executionRef.current;

    // Log de debug
    console.log(`🛡️ RouteGuard check #${currentExecution}:`, {
      path: location.pathname,
      user: user?.email || 'none',
      loading,
      initialized,
      stats: guardStats
    });

    // Detectar se mudou de página
    const pathChanged = lastLocationRef.current !== location.pathname;
    if (pathChanged) {
      lastLocationRef.current = location.pathname;
    }

    // Verificar se há loop
    if (detectLoop()) {
      setGuardStats(prev => ({ ...prev, loopDetected: true }));
      console.error('🚨 RouteGuard desabilitado devido a loop detectado');
      return;
    }

    // Se loop já foi detectado, não fazer mais redirects
    if (guardStats.loopDetected) {
      console.warn('⚠️ RouteGuard: Em modo de recuperação (loop detectado)');
      return;
    }

    // Verificar se precisa redirecionar
    const { redirect, to, reason } = shouldRedirect();

    if (redirect && to) {
      console.log(`📍 RouteGuard: Redirecionando → ${to} (${reason})`);
      
      // Atualizar estatísticas
      setGuardStats(prev => ({
        ...prev,
        redirectCount: prev.redirectCount + 1,
        lastRedirect: `${location.pathname} → ${to}`
      }));
      
      // Fazer redirecionamento
      navigate(to, { replace: true });
    }

  }, [user, loading, initialized, location.pathname, navigate, guardStats.loopDetected]);

  // ===============================================
  // 🔄 RESET DE ESTATÍSTICAS (após período)
  // ===============================================
  useEffect(() => {
    const resetTimer = setTimeout(() => {
      if (guardStats.redirectCount > 0) {
        console.log('🔄 RouteGuard: Resetando estatísticas após período de estabilidade');
        setGuardStats({
          redirectCount: 0,
          lastRedirect: null,
          loopDetected: false,
          startTime: Date.now()
        });
      }
    }, LOOP_DETECTION_WINDOW);

    return () => clearTimeout(resetTimer);
  }, [guardStats]);

  // ===============================================
  // 🎨 RENDERIZAÇÃO
  // ===============================================

  // Mostrar loading enquanto auth não inicializar
  if (loading || !initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">
            {loading ? 'Verificando autenticação...' : 'Inicializando...'}
          </p>
          <div className="text-xs text-gray-400 mt-2">
            RouteGuard: {executionRef.current} checks
          </div>
        </div>
      </div>
    );
  }

  // Mostrar erro se loop foi detectado
  if (guardStats.loopDetected) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50">
        <div className="text-center max-w-md p-6">
          <div className="text-red-600 text-6xl mb-4">🚨</div>
          <h2 className="text-red-800 text-xl font-semibold mb-2">
            Loop de Redirecionamento Detectado
          </h2>
          <p className="text-red-700 text-sm mb-4">
            O sistema detectou um loop infinito de redirecionamentos. 
            A navegação foi pausada para evitar problemas.
          </p>
          <div className="text-xs text-red-600 bg-red-100 p-3 rounded mb-4">
            <strong>Debug:</strong> {guardStats.redirectCount} redirects detectados
            <br />
            <strong>Último:</strong> {guardStats.lastRedirect}
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
          >
            Recarregar Página
          </button>
        </div>
      </div>
    );
  }

  // Renderizar children normalmente
  return <>{children}</>;
}