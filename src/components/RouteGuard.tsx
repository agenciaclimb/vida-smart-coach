import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/SupabaseAuthContext';

interface RouteGuardProps {
  children: React.ReactNode;
}

export default function RouteGuard({ children }: RouteGuardProps) {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const hits = useRef(0);

  useEffect(() => {
    if (loading) return;
    
    hits.current += 1;
    if (hits.current > 20) {
      console.error('Guard loop detectado — abort');
      return;
    }
    
    const onAuthPages = ['/login', '/register'].includes(loc.pathname);
    
    if (user && onAuthPages) {
      console.log('📍 Usuário logado em página de auth → redirecionando para dashboard');
      nav('/dashboard', { replace: true });
    }
    
    if (!user && !onAuthPages) {
      console.log('📍 Usuário não logado em página protegida → redirecionando para login');
      nav('/login', { replace: true });
    }
  }, [user, loading, loc.pathname, nav]);

  return <>{children}</>;
}