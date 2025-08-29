
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Loader2 } from 'lucide-react';

const LoadingFallback = () => (
    <div className="flex justify-center items-center h-screen bg-slate-50">
      <div className="text-center">
        <Loader2 className="animate-spin h-12 w-12 text-primary" />
        <p className="mt-4 text-lg text-gray-700">Verificando autenticação...</p>
      </div>
    </div>
);

const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return <LoadingFallback />;
  }

  if (!user || !user.profile) {
    return <Navigate to={`/login?redirect=${location.pathname}`} replace />;
  }

  const userRole = user.profile.role;

  if (roles && !roles.includes(userRole)) {
    const defaultDashboard = {
        admin: '/admin',
        partner: '/painel-parceiro',
        client: '/dashboard'
    }[userRole] || '/';
    return <Navigate to={defaultDashboard} replace />;
  }

  return children;
};

export default PrivateRoute;
