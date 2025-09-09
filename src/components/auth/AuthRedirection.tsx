import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';

export default function AuthRedirection() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useUser();
  const supabase = useSupabaseClient();

  useEffect(() => {
    // Não redirecionar se estiver na página de callback ou verificação
    const isCallbackPage = ['/auth/callback', '/auth/integration-callback'].includes(location.pathname);
    if (isCallbackPage) return;

    // Se há parâmetros de verificação de email, não redirecionar
    const hasVerificationParams = location.search.includes('code=') || location.search.includes('token_hash=');
    if (hasVerificationParams) return;

    const onAuthPages = ['/login', '/register'].includes(location.pathname);
    
    // Se o usuário está logado e está em páginas de auth, redirecionar para dashboard
    if (user && onAuthPages) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, location.pathname, location.search, navigate]);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, session?.user?.id);
      
      // Não redirecionar durante verificação de email
      const hasVerificationParams = location.search.includes('code=') || location.search.includes('token_hash=');
      if (hasVerificationParams) return;

      if (event === 'SIGNED_IN' && session) {
        // Só redirecionar se não estiver já no dashboard
        if (location.pathname !== '/dashboard') {
          navigate('/dashboard', { replace: true });
        }
      }
      
      if (event === 'SIGNED_OUT') {
        // Só redirecionar para login se não estiver em páginas públicas
        const publicPages = ['/', '/login', '/register', '/contato', '/parceiros', '/store'];
        if (!publicPages.includes(location.pathname) && !location.pathname.startsWith('/product/')) {
          navigate('/login', { replace: true });
        }
      }
    });
    
    return () => sub.subscription.unsubscribe();
  }, [supabase, navigate, location.pathname, location.search]);

  return null;
}
