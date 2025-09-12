import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/SupabaseAuthContext_FINAL';
import { toast } from 'react-hot-toast';
import { CheckCircle, Loader2, ArrowRight } from 'lucide-react';

const SuccessPage = () => {
  const { user, refetchUser } = useAuth();
  const [status, setStatus] = useState('processing');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      toast.error('ID de sessão inválido.');
      navigate('/');
      return;
    }

    const verifySession = async () => {
      if (!user) return;

      try {
        // Em um cenário real, você chamaria um backend para verificar a sessão do Stripe
        // e obter os detalhes da assinatura para então atualizar o perfil do usuário.
        // Aqui, vamos simular essa verificação e atualizar o perfil.
        
        // Simulação: obter plano da assinatura (em um caso real, viria do webhook ou API call)
        // Por enquanto, vamos assumir que o plano pode ser inferido ou que o webhook já atualizou.
        // A melhor prática é o webhook do Stripe atualizar o plano do usuário.
        // Esta página serve como confirmação para o usuário.
        
        // Forçamos uma atualização do perfil do usuário para pegar o novo plano que o webhook (hipotético) atualizou.
        await refetchUser();

        setStatus('success');
        toast.success('Pagamento confirmado! Bem-vindo(a) ao seu novo plano!');

      } catch (error) {
        console.error('Erro ao verificar a sessão:', error);
        toast.error('Houve um problema ao confirmar sua assinatura.');
        setStatus('error');
      }
    };

    if (user) {
      verifySession();
    }

  }, [user, location, navigate, refetchUser]);

  return (
    <>
      <Helmet>
        <title>Sucesso! - Vida Smart</title>
        <meta name="description" content="Sua assinatura foi confirmada com sucesso." />
      </Helmet>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg text-center bg-white p-8 md:p-12 rounded-2xl shadow-lg border border-gray-200">
          {status === 'processing' && (
            <>
              <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-6" />
              <h1 className="text-3xl font-bold text-gray-800 mb-3">Processando seu Pagamento</h1>
              <p className="text-gray-600">Estamos confirmando os detalhes da sua assinatura. Por favor, aguarde um momento.</p>
            </>
          )}
          {status === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
              <h1 className="text-3xl font-bold text-gray-800 mb-3">Pagamento Realizado com Sucesso!</h1>
              <p className="text-gray-600 mb-8">Sua assinatura está ativa! Você está pronto para iniciar sua jornada de transformação com o Vida Smart.</p>
              <Link to="/dashboard" className="inline-flex items-center justify-center vida-smart-gradient text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:scale-105 transition-transform duration-300">
                Ir para o meu Painel
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </>
          )}
          {status === 'error' && (
            <>
              <CheckCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
              <h1 className="text-3xl font-bold text-gray-800 mb-3">Ocorreu um Erro</h1>
              <p className="text-gray-600 mb-8">Não foi possível confirmar sua assinatura no momento. Por favor, entre em contato com o suporte.</p>
              <Link to="/contato" className="inline-flex items-center justify-center bg-red-500 text-white font-bold py-3 px-8 rounded-lg hover:bg-red-600 transition-colors">
                Contatar Suporte
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default SuccessPage;