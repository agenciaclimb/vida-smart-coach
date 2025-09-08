import { PropsWithChildren, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionContext, useSupabaseClient } from '@supabase/auth-helpers-react';

export default function RequireAuth({ children }: PropsWithChildren) {
  const navigate = useNavigate();
  const { isLoading, session } = useSessionContext();
  const supabase = useSupabaseClient();
  const [ready, setReady] = useState(false);
  const askedRef = useRef(false);

  // Se carregar demais, força checar a sessão
  useEffect(() => {
    let t: any;
    if (isLoading && !askedRef.current) {
      askedRef.current = true;
      // tenta resolver imediatamente
      supabase.auth.getSession().finally(() => setReady(true));
      // fallback de 3s para não travar
      t = setTimeout(() => setReady(true), 3000);
    }
    return () => clearTimeout(t);
  }, [isLoading, supabase]);

  // Redireciona se não houver sessão quando já estiver pronto
  useEffect(() => {
    if (!isLoading && ready && !session) {
      navigate('/login', { replace: true });
    }
  }, [isLoading, ready, session, navigate]);

  if (isLoading && !ready) return <div style={{ padding: 24 }}>Carregando...</div>;
  if (!session) return null; // evitar flicker rápido antes do redirect

  return <>{children}</>;
}

