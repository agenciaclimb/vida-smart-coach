import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';

export default function AuthRedirection() {
  const navigate = useNavigate();
  const location = useLocation();
  const supabase = useSupabaseClient();
  const user = useUser();

  // Se já está logado, não fique na página de login/register
  useEffect(() => {
    const onLoginPages =
      location.pathname === '/login' || location.pathname === '/register';
    if (user && onLoginPages) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, location.pathname, navigate]);

  // Reagir a mudanças de sessão (login/logout)
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate('/dashboard', { replace: true });
      }
      if (event === 'SIGNED_OUT') {
        navigate('/login', { replace: true });
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase, navigate]);

  return null;
}

