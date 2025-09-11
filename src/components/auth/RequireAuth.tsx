import { PropsWithChildren, useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSessionContext, useSupabaseClient } from '@supabase/auth-helpers-react';
import LoadingFallback from '@/components/LoadingFallback';

export default function RequireAuth({ children }: PropsWithChildren) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading, session } = useSessionContext();
  const supabase = useSupabaseClient();
  const [ready, setReady] = useState(false);
  const [checkingSession, setCheckingSession] = useState(false);
  const askedRef = useRef(false);

  // Timeout forçado para evitar loading infinito
  useEffect(() => {
    let t: any;
    
    // Force ready after 3 seconds regardless
    t = setTimeout(() => {
      if (!ready) {
        console.log('RequireAuth: Forcing ready state after timeout');
        setReady(true);
        setCheckingSession(false);
      }
    }, 3000);
    
    if (!isLoading) {
      setReady(true);
    }
    
    return () => clearTimeout(t);
  }, [isLoading, ready]);

  // Redireciona se não houver sessão quando já estiver pronto
  useEffect(() => {
    if (ready && !isLoading && !session && !checkingSession) {
      console.log('RequireAuth: No session found, redirecting to login');
      // Salva a URL atual para redirecionamento após login
      const returnUrl = location.pathname + location.search;
      navigate(`/login?returnUrl=${encodeURIComponent(returnUrl)}`, { replace: true });
    }
  }, [isLoading, ready, session, navigate, location, checkingSession]);

  // Loading state
  if ((isLoading || checkingSession) && !ready) {
    return (
      <LoadingFallback 
        message="Verificando autenticação..."
        timeout={5000}
        onTimeout={() => {
          console.log('RequireAuth: Authentication check timeout, redirecting to login');
          const returnUrl = location.pathname + location.search;
          navigate(`/login?returnUrl=${encodeURIComponent(returnUrl)}`, { replace: true });
        }}
      />
    );
  }

  // Se não há sessão, não renderizar nada (redirecionamento já foi iniciado)
  if (!session) {
    return null;
  }

  return <>{children}</>;
}

