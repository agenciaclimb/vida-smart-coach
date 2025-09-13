import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/core/supabase';

const AuthRedirector = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      const hasSession = !!data?.session;
      if (hasSession && (location.pathname === '/login' || location.pathname === '/register')) {
        navigate('/dashboard', { replace: true });
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => {
      if (sess) navigate('/dashboard', { replace: true });
    });
    return () => {
      isMounted = false;
      sub?.subscription?.unsubscribe();
    };
  }, [location.pathname, navigate]);

  return null;
};

export default AuthRedirector;
