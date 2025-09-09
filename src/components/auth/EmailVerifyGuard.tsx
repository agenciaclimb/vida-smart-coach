import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/core/supabase';
import { toast } from 'react-hot-toast';

export default function EmailVerifyGuard() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const code = params.get('code') || params.get('token_hash');
    const type = params.get('type'); // 'signup' | 'magiclink' | 'recovery'...

    // Sem código na URL? Não chama verify.
    if (!code || !type) return;

    const handleVerification = async () => {
      try {
        console.log('Attempting verification with:', { code: code.substring(0, 10) + '...', type });
        
        const { data, error } = await supabase.auth.verifyOtp({
          type: type as any,
          token_hash: code,
        });

        if (error) {
          console.error('Verification error:', error);
          // Se o erro for de token inválido ou expirado, mostrar mensagem específica
          if (error.message?.includes('expired') || error.message?.includes('invalid')) {
            toast.error('Link de verificação expirado ou inválido. Tente fazer login novamente.');
            navigate('/login', { replace: true });
          } else {
            toast.error('Erro na verificação. Tente novamente.');
            navigate('/login', { replace: true });
          }
          return;
        }

        if (data.user) {
          console.log('Verification successful for user:', data.user.id);
          toast.success('E-mail verificado com sucesso!');
          navigate('/dashboard', { replace: true });
        }
      } catch (err) {
        console.error('Unexpected verification error:', err);
        toast.error('Erro inesperado na verificação.');
        navigate('/login', { replace: true });
      }
    };

    handleVerification();
  }, [params, navigate]);

  return null;
}

