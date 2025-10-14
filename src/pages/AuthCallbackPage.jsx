import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';

const sanitizeRedirectPath = (value) => {
  if (!value) return '/dashboard';
  try {
    const candidate = new URL(value, window.location.origin);
    if (candidate.origin !== window.location.origin) return '/dashboard';
    const path = `${candidate.pathname}${candidate.search}${candidate.hash}`;
    return path.startsWith('/') ? path : `/${path}`;
  } catch {
    return value.startsWith('/') ? value : '/dashboard';
  }
};

const extractParams = () => {
  const url = new URL(window.location.href);
  const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));
  const searchParams = url.searchParams;

  const getFirst = (...keys) =>
    keys.reduce((acc, key) => acc ?? searchParams.get(key) ?? hashParams.get(key), null);

  return {
    code: getFirst('code'),
    accessToken: hashParams.get('access_token'),
    refreshToken: hashParams.get('refresh_token'),
    error:
      getFirst('error_description', 'error') ||
      hashParams.get('error_description') ||
      hashParams.get('error'),
    redirectTo: getFirst('next', 'redirectTo'),
  };
};

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState(null);
  const [status, setStatus] = useState('Finalizando autenticação...');
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    const finalizeAuthentication = async () => {
      const { code, accessToken, refreshToken, error, redirectTo } = extractParams();

      if (error) {
        setErrorMessage(error);
        return;
      }

      const targetPath = sanitizeRedirectPath(redirectTo);

      try {
        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (sessionError) throw sessionError;
        } else if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        } else if (accessToken || refreshToken) {
          throw new Error('Resposta de autenticação incompleta recebida. Tente novamente.');
        }

        setStatus('Autenticação concluída. Redirecionando...');
        setTimeout(() => {
          navigate(targetPath, { replace: true });
        }, 400);
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : 'Falha ao completar a autenticação.');
      }
    };

    finalizeAuthentication();
  }, [navigate]);

  if (errorMessage) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-red-50 px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center space-y-4">
          <h1 className="text-xl font-semibold text-red-600">Não foi possível finalizar o login</h1>
          <p className="text-sm text-red-500 break-words">{errorMessage}</p>
          <Button className="w-full" onClick={() => navigate('/login', { replace: true })}>
            Voltar para o login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center items-center h-screen bg-slate-50 px-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-lg text-gray-700">{status}</p>
        <p className="text-sm text-gray-500">Você será redirecionado em instantes.</p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
