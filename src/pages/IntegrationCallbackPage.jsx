
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Loader2, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext_FINAL';
import toast from 'react-hot-toast';

const IntegrationCallbackPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { supabase, user } = useAuth();
    const [message, setMessage] = useState('Processando integração...');
    const [isError, setIsError] = useState(false);

    useEffect(() => {
        const handleCallback = async () => {
            const params = new URLSearchParams(location.search);
            const authCode = params.get('code');
            const error = params.get('error');

            const serviceName = localStorage.getItem('integration_service_name');

            if (error) {
                setMessage(`Erro na integração: ${error}`);
                setIsError(true);
                toast.error(`Falha na integração: ${error}`);
                navigate('/dashboard?tab=integrations');
                return;
            }

            if (!authCode || !serviceName) {
                setMessage('Dados de integração incompletos.');
                setIsError(true);
                toast.error('Dados de integração incompletos.');
                navigate('/dashboard?tab=integrations');
                return;
            }

            try {
                setMessage(`Conectando ${serviceName}...`);
                const { data, error: invokeError } = await supabase.functions.invoke('complete-integration', {
                    body: { service_name: serviceName, auth_code: authCode },
                });

                if (invokeError) {
                    throw invokeError;
                }

                if (data.success) {
                    setMessage(`${serviceName} conectado com sucesso!`);
                    toast.success(`${serviceName} conectado com sucesso!`);
                } else {
                    setMessage(`Falha ao conectar ${serviceName}.`);
                    setIsError(true);
                    toast.error(`Falha ao conectar ${serviceName}.`);
                }
            } catch (err) {
                console.error("Erro ao completar integração:", err);
                setMessage(`Erro ao processar integração: ${err.message || err.error_description || err}`);
                setIsError(true);
                toast.error(`Erro ao processar integração: ${err.message || err.error_description || err}`);
            } finally {
                localStorage.removeItem('integration_service_name');
                setTimeout(() => {
                    navigate('/dashboard?tab=integrations');
                }, 3000);
            }
        };

        if (user) {
            handleCallback();
        }
    }, [location.search, navigate, supabase, user]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 text-center"
        >
            <Helmet>
                <title>Integração | Vida Smart Coach</title>
                <meta name="description" content="Página de callback para conclusão de integrações com serviços externos no Vida Smart Coach." />
                <meta property="og:title" content="Integração | Vida Smart Coach" />
                <meta property="og:description" content="Página de callback para conclusão de integrações com serviços externos no Vida Smart Coach." />
            </Helmet>
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className={`p-8 rounded-lg shadow-xl ${isError ? 'bg-red-100 text-red-700' : 'bg-vida-smart-gradient text-white'} flex flex-col items-center gap-4`}
            >
                {isError ? (
                    <XCircle className="w-16 h-16" />
                ) : (
                    <Loader2 className="w-16 h-16 animate-spin" />
                )}
                <h1 className="text-3xl font-bold mt-4">
                    {isError ? 'Ops!' : 'Quase lá!'}
                </h1>
                <p className="text-lg">{message}</p>
                {!isError && <p className="text-sm mt-2">Você será redirecionado em breve.</p>}
            </motion.div>
        </motion.div>
    );
};

export default IntegrationCallbackPage;
