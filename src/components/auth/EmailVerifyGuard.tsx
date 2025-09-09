import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

export default function EmailVerifyGuard() {
  const [params] = useSearchParams();
  const supabase = useSupabaseClient();
  const navigate = useNavigate();

  useEffect(() => {
    const code = params.get('code') || params.get('token_hash');
    const type = params.get('type'); // 'signup' | 'magiclink' | 'recovery'...

    // Sem código na URL? Não chama verify.
    if (!code || !type) return;

    (async () => {
      const { error } = await supabase.auth.verifyOtp({
        type: type as any,
        token_hash: code,
      });
      // opcional: trate o erro/sucesso aqui
      navigate('/dashboard', { replace: true });
    })();
  }, [params, supabase, navigate]);

  return null;
}

