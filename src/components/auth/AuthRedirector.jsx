import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/core/supabase';

const AuthRedirector = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (data?.session && pathname.startsWith('/login')) {
        navigate('/dashboard', { replace: true });
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => {
      if (sess) navigate('/dashboard', { replace: true });
    });
    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe();
    };
  }, [pathname, navigate]);

  return null;
};

export default AuthRedirector;
