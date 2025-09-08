import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';

export default function AuthRedirection() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useUser();
  const supabase = useSupabaseClient();

  // Se já está logado, não ficar em /login ou /register
  useEffect(() => {
    const onLoginPages = location.pathname === '/login' || location.pathname === '/register';
    if (user && onLoginPages) navigate('/dashboard', { replace: true });
  }, [user, location.pathname, navigate]);

  // Reagir a mudanças de sessão (login/logout)
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') navigate('/dashboard', { replace: true });
      if (event === 'SIGNED_OUT') navigate('/login', { replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase, navigate]);

  return null;
}
