
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { TabsContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, AlertTriangle, QrCode, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '@/core/supabase';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const WhatsappConnectTab = () => {
  const { user } = useAuth();
  const [qrCode, setQrCode] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, loading, qrcode, connected, error
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [activeProvider, setActiveProvider] = useState(null);

  const fetchActiveProvider = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-active-provider');
      if (error) throw new Error("Falha ao buscar provedor ativo.");
      setActiveProvider(data.provider);
      return data.provider;
    } catch (err) {
      toast.error(err.message);
      setStatus('error');
      setErrorMessage("Não foi possível determinar o provedor de WhatsApp ativo. Verifique suas configurações de integração.");
      return null;
    }
  }, []);

  useEffect(() => {
    if(user) {
        fetchActiveProvider();
    }
  }, [fetchActiveProvider, user]);


  const generateQrCode = useCallback(async () => {
    if (!user) {
      toast.error("Sessão inválida. Por favor, faça login novamente.");
      return;
    }
    setStatus('loading');
    setQrCode(null);
    setErrorMessage('');
    
    const provider = activeProvider || await fetchActiveProvider();
    if (!provider) return;

    const functionName = provider === 'wppconnect' ? 'wppconnect-qr' : 'evolution-qr';
    setStatusMessage(`Conectando com a ${provider === 'wppconnect' ? 'WPPConnect' : 'Evolution API'}...`);

    try {
      const { data, error } = await supabase.functions.invoke(functionName);

      if (error) {
        let errorMsg = `Falha ao gerar QR Code para ${provider}.`;
        try {
            const errorContext = JSON.parse(error.context);
            errorMsg = errorContext.error || errorMsg;
        } catch(e) {
            // could not parse
        }
        throw new Error(errorMsg);
      }

      if (data.status === 'qrcode') {
        setQrCode(data.qrCode);
        setStatus('qrcode');
        setStatusMessage('Escaneie o QR Code com seu celular.');
      } else if (data.status === 'connected') {
        setStatus('connected');
        setStatusMessage(data.message || 'Conexão estabelecida com sucesso!');
      } else if (data.status === 'pending') {
        setStatus('qrcode');
        setQrCode(null);
        setStatusMessage(data.message || 'Aguardando geração do QR Code. Tente novamente em alguns segundos.');
        toast(data.message || 'Aguardando geração do QR Code.', { icon: '⏳' });
      } else {
        setStatus('error');
        setErrorMessage(data.message || 'Ocorreu um erro inesperado.');
      }
    } catch (err) {
      setStatus('error');
      setErrorMessage(err.message);
      toast.error(err.message);
    }
  }, [user, fetchActiveProvider, activeProvider]);

  const renderContent = () => {
    if (activeProvider === null && status !== 'error') {
       return (
          <div className="text-center p-8">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-lg font-semibold">Verificando provedor...</p>
          </div>
        );
    }
    
    switch (status) {
      case 'loading':
        return (
          <div className="text-center p-8">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-lg font-semibold">{statusMessage}</p>
            <p className="text-sm text-muted-foreground">Aguarde um momento...</p>
          </div>
        );
      case 'qrcode':
        return (
          <div className="text-center p-8">
            <h3 className="text-2xl font-bold mb-4">Escaneie para Conectar</h3>
            <p className="text-muted-foreground mb-6">{statusMessage}</p>
            {qrCode ? (
              <div className="bg-white p-4 inline-block rounded-lg shadow-md">
                <img src={qrCode} alt="QR Code para conectar WhatsApp" className="w-64 h-64" />
              </div>
            ) : (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
            )}
            <Button onClick={generateQrCode} className="mt-6" variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Gerar Novo QR Code
            </Button>
          </div>
        );
      case 'connected':
        return (
          <div className="text-center p-8">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
            <h3 className="mt-4 text-2xl font-bold">Conectado!</h3>
            <p className="text-muted-foreground mt-2">{statusMessage}</p>
          </div>
        );
      case 'error':
        return (
          <div className="text-center p-8 bg-red-50 rounded-lg">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
            <h3 className="mt-4 text-xl font-bold text-red-800">Ocorreu um Erro</h3>
            <p className="text-red-700 mt-2">{errorMessage}</p>
            <Button onClick={generateQrCode} className="mt-6">
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar Novamente
            </Button>
          </div>
        );
      case 'idle':
      default:
        return (
          <div className="text-center p-8">
            <QrCode className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-xl font-bold">Conectar ao WhatsApp</h3>
            <p className="text-muted-foreground mt-2 mb-6">
              Seu provedor ativo é <span className="font-bold text-primary">{activeProvider === 'wppconnect' ? 'WPPConnect' : 'Evolution API'}</span>.
              <br/>
              Clique no botão para gerar o QR Code.
            </p>
            <Button onClick={generateQrCode} className="vida-smart-gradient text-white text-lg py-6 px-8" disabled={!activeProvider}>
              Gerar QR Code
            </Button>
          </div>
        );
    }
  };

  return (
    <TabsContent value="whatsapp" className="mt-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="shadow-md transition-all duration-300 hover:shadow-xl max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Conexão WhatsApp</CardTitle>
            <CardDescription>
              Conecte sua conta do WhatsApp para habilitar o envio de mensagens e a automação com a IA.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderContent()}
          </CardContent>
        </Card>
      </motion.div>
    </TabsContent>
  );
};

export default WhatsappConnectTab;
