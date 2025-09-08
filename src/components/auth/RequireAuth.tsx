import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useSupabaseClient } from '@supabase/auth-helpers-react';

export default function RequireAuth({ children }: { children: JSX.Element }) {
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const location = useLocation();
  const supabase = useSupabaseClient();

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setHasSession(!!session);
      setReady(true);
    });
    return () => { mounted = false; };
  }, []);

  if (!ready) return null; // spinner opcional
  if (!hasSession) return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  return children;
}

