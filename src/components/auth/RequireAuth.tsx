import { PropsWithChildren, useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSessionContext, useSupabaseClient } from '@supabase/auth-helpers-react';
import { Loader2 } from 'lucide-react';

export default function RequireAuth({ children }: PropsWithChildren) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading, session } = useSessionContext();
  const supabase = useSupabaseClient();
  const [ready, setReady] = useState(false);
  const [checkingSession, setCheckingSession] = useState(false);
  const askedRef = useRef(false);

  // Se carregar demais, força checar a sessão
  useEffect(() => {
    let t: any;
    if (isLoading && !askedRef.current) {
      askedRef.current = true;
      setCheckingSession(true);
      
      // Tenta resolver imediatamente
      supabase.auth.getSession()
        .then(({ data: { session: currentSession }, error }) => {
          if (error) {
            console.error('Error checking session:', error);
          }
          console.log('RequireAuth session check:', !!currentSession);
        })
        .finally(() => {
          setReady(true);
          setCheckingSession(false);
        });
      
      // Fallback de 5s para não travar
      t = setTimeout(() => {
        setReady(true);
        setCheckingSession(false);
      }, 5000);
    } else if (!isLoading) {
      setReady(true);
    }
    
    return () => clearTimeout(t);
  }, [isLoading, supabase]);

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Se não há sessão, não renderizar nada (redirecionamento já foi iniciado)
  if (!session) {
    return null;
  }

  return <>{children}</>;
}

