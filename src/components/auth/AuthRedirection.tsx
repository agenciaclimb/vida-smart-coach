import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';

export default function AuthRedirection({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();

  const onLogin = location.pathname === '/login' || location.pathname === '/register';
  const inSafe =
    location.pathname === '/safe' ||
    location.hash.includes('safe') ||
    new URLSearchParams(location.search).has('safe');

  // Enquanto carrega sessão, renderiza normalmente (sem redirect)
  if (loading) return <>{children}</>;

  useEffect(() => {
    if (inSafe) return; // modo seguro: nunca redireciona
    if (user && onLogin) navigate('/dashboard', { replace: true });
    if (!user && !onLogin) navigate('/login', { replace: true });
  }, [user, onLogin, inSafe, navigate]);

  return <>{children}</>;
}