import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';

export default function AuthRedirection() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useUser();
  const supabase = useSupabaseClient();

  useEffect(() => {
    const onAuthPages = ['/login', '/register'].includes(location.pathname);
    if (user && onAuthPages) navigate('/dashboard', { replace: true });
  }, [user, location.pathname, navigate]);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((ev) => {
      if (ev === 'SIGNED_IN') navigate('/dashboard', { replace: true });
      if (ev === 'SIGNED_OUT') navigate('/login', { replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase, navigate]);

  return null;
}
