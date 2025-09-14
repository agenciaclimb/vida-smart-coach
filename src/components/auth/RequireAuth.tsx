import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';

export default function RequireAuth() {
  const location = useLocation();
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) {
    const returnUrl = location.pathname + location.search;
    return <Navigate to={`/login?returnUrl=${encodeURIComponent(returnUrl)}`} replace />;
  }
  return <Outlet />;
}

