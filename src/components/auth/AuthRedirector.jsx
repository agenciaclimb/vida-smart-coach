
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const AuthRedirector = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) {
      return; 
    }

    if (user && user.profile && (location.pathname === '/login' || location.pathname === '/register')) {
      const userRole = user.profile.role;
      let targetPath = '/dashboard'; // Default for client

      if (userRole === 'admin') {
        targetPath = '/admin';
      } else if (userRole === 'partner') {
        targetPath = '/painel-parceiro';
      }
      
      navigate(targetPath, { replace: true });
    }
  }, [user, loading, navigate, location.pathname]);

  return null;
};

export default AuthRedirector;
