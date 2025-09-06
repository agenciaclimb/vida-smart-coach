
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';
import { supabase } from '../../../core/supabase';
import { AlertCircle, CheckCircle, Loader2, QrCode, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useIntegrations } from '@/contexts/data/IntegrationsContext';

const EvolutionApiConfig = () => {
  const { adminIntegrations, refetchIntegrations } = useIntegrations();
  const [credentials, setCredentials] = useState({ token: '', instanceName: '' });
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [qrStatus, setQrStatus] = useState('idle'); // idle, loading, qrcode, connected, error
  const [qrError, setQrError] = useState('');

  const updateLocalState = useCallback((integration) => {
    if (integration) {
      setCredentials({
        token: integration.credentials?.token || '',
        instanceName: integration.credentials?.instanceName || '',
      });
      setIsConnected(integration.is_connected || false);
      setQrStatus(integration.is_connected ? 'connected' : 'idle');
    } else {
        setCredentials({ token: '', instanceName: '' });
        setIsConnected(false);
        setQrStatus('idle');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    updateLocalState(adminIntegrations.evolution_api);
  }, [adminIntegrations.evolution_api, updateLocalState]);

  const handleSaveCredentials = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setQrStatus('idle');
    setQrError('');
    const toastId = toast.loading('Salvando e validando credenciais...');
    
    try {
        const { data, error } = await supabase.functions.invoke('set-evolution-credentials', {
            body: credentials,
        });

        if (error) {
            let errorMsg = 'Ocorreu um erro desconhecido.';
            try {
                const errorContext = JSON.parse(error.context.text)
                errorMsg = errorContext.error || errorMsg;
            } catch(e) { /* ignore */ }
            throw new Error(errorMsg);
        }

        toast.success(data.message, { id: toastId });
        setIsConnected(data.is_connected);
        if(data.is_connected) {
          setQrStatus('connected');
        } else {
          setQrStatus('idle');
          toast.info("Credenciais salvas. Agora gere o QR Code para conectar.", { duration: 4000 })
        }
        refetchIntegrations();
    } catch(error) {
        toast.error(`Falha ao salvar: ${error.message}`, { id: toastId });
        setQrStatus('error');
        setQrError(error.message);
    } finally {
        setIsSaving(false);
    }
  };
  
  const generateQrCode = async () => {
    setQrStatus('loading');
    setQrError('');
    setQrCode(null);
    const toastId = toast.loading('Gerando QR Code...');

    try {
      const { data, error } = await supabase.functions.invoke('evolution-qr');

      if (error) {
        let errorMsg = 'Falha ao gerar QR Code.';
        try {
            const errorContext = JSON.parse(error.context.text);
            errorMsg = errorContext.error || errorMsg;
        } catch(e) { /* ignore */ }
        throw new Error(errorMsg);
      }

      if (data.status === 'qrcode') {
        setQrCode(data.qrCode);
        setQrStatus('qrcode');
        toast.success("Escaneie o QR Code com seu celular.", { id: toastId, duration: 6000 });
      } else if (data.status === 'connected') {
        setIsConnected(true);
        setQrStatus('connected');
        toast.success("WhatsApp já está conectado!", { id: toastId });
        refetchIntegrations();
      } else {
        throw new Error(data.error || 'Ocorreu um erro inesperado ao gerar QR Code.');
      }
    } catch(err) {
      toast.error(err.message, { id: toastId });
      setQrStatus('error');
      setQrError(err.message);
    }
  };


  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setCredentials((prev) => ({ ...prev, [id]: value }));
  };


  const renderStatus = () => {
    if (isLoading) return <div className="flex items-center text-sm text-gray-500"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando...</div>;
    if (isConnected) return <div className="flex items-center text-sm text-green-600 font-semibold"><CheckCircle className="mr-2 h-4 w-4" /> Conectado</div>;
    return <div className="flex items-center text-sm text-red-600 font-semibold"><AlertCircle className="mr-2 h-4 w-4" /> Desconectado</div>;
  };

  const renderQrContent = () => {
    switch (qrStatus) {
      case 'loading':
        return <div className="text-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="mt-2">Aguarde...</p></div>;
      case 'qrcode':
        return qrCode ? (
          <div className="text-center">
            <p className="mb-2 font-semibold">Escaneie o código com seu WhatsApp:</p>
            <img alt="QR Code para conectar WhatsApp" className="w-48 h-48 mx-auto bg-white p-2 rounded-lg shadow-md" src={qrCode} />
          </div>
        ) : (
           <div className="text-center text-gray-500">
             <AlertCircle className="mx-auto h-16 w-16" />
             <p className="mt-4 font-bold text-lg">Falha ao Carregar QR Code</p>
             <p className="text-sm max-w-xs mx-auto">Tente gerar novamente.</p>
           </div>
        );
      case 'connected':
        return (
          <div className="text-center text-green-600">
            <CheckCircle className="mx-auto h-16 w-16" />
            <p className="mt-4 font-bold text-lg">Conexão Ativa!</p>
            <p>Seu WhatsApp está conectado com sucesso.</p>
          </div>
        );
      case 'error':
        return (
          <div className="text-center text-red-600">
            <AlertCircle className="mx-auto h-16 w-16" />
            <p className="mt-4 font-bold text-lg">Erro ao Conectar</p>
            <p className="text-sm max-w-xs mx-auto">{qrError}</p>
          </div>
        );
      case 'idle':
      default:
        return (
          <div className="text-center">
            <QrCode className="mx-auto h-16 w-16 text-gray-400" />
            <p className="mt-4 text-gray-600">Salve as credenciais e clique em 'Gerar QR Code'.</p>
          </div>
        );
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Configurar Evolution API</CardTitle>
            {renderStatus()}
          </div>
          <CardDescription>Conecte sua instância da Evolution API para automações de WhatsApp.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSaveCredentials}>
          <CardContent className="space-y-4">
            <Alert variant="default" className="bg-blue-50 border-blue-200">
              <AlertDescription className="text-blue-800">
                A URL da API para o serviço cloud é fixa (https://api.evoapicloud.com) e será usada automaticamente. Insira apenas a sua API Key e o ID da Instância.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label htmlFor="token">API Key (Token)</Label>
              <Input id="token" type="password" placeholder="Seu token da Evolution API" value={credentials.token} onChange={handleInputChange} required disabled={isLoading || isSaving} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instanceName">ID da Instância</Label>
              <Input id="instanceName" placeholder="ID da sua instância" value={credentials.instanceName} onChange={handleInputChange} required disabled={isLoading || isSaving} />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading || isSaving || !credentials.token || !credentials.instanceName}>
              {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : 'Salvar e Validar Credenciais'}
            </Button>
          </CardFooter>
        </form>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Status da Conexão</CardTitle>
          <CardDescription>Use esta área para escanear o QR Code e monitorar o status da conexão.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center min-h-[240px]">
          {renderQrContent()}
        </CardContent>
        <CardFooter className="justify-center">
          <Button onClick={generateQrCode} disabled={qrStatus === 'loading' || isConnected || isLoading || isSaving || !credentials.token || !credentials.instanceName}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Gerar QR Code
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default EvolutionApiConfig;
