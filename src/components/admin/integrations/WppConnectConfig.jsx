import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useIntegrations } from '@/contexts/data/IntegrationsContext';

const WppConnectConfig = () => {
  const { adminIntegrations, refetchIntegrations } = useIntegrations();
  const [credentials, setCredentials] = useState({ wppUrl: '', wppSession: '', wppSecretKey: '' });
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const updateLocalState = useCallback((integration) => {
    if (integration) {
      setCredentials({
        wppUrl: integration.credentials?.url || '',
        wppSession: integration.credentials?.session || '',
        wppSecretKey: integration.credentials?.token || '',
      });
      setIsConnected(integration.is_connected || false);
    } else {
      setCredentials({ wppUrl: '', wppSession: '', wppSecretKey: '' });
      setIsConnected(false);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    updateLocalState(adminIntegrations.wppconnect);
  }, [adminIntegrations.wppconnect, updateLocalState]);
  

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setCredentials((prev) => ({ ...prev, [id]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const toastId = toast.loading('Salvando credenciais do WPPConnect...');
    try {
      const { data, error } = await supabase.functions.invoke('set-wppconnect-credentials', {
        body: credentials,
      });
      
      if (error) {
        let errorMsg = 'Ocorreu um erro desconhecido.';
        try {
            const errorBody = JSON.parse(error.context.text);
            errorMsg = errorBody.error || errorMsg;
        } catch(err) { /* ignore */ }
         throw new Error(errorMsg);
      }
      
      toast.success(data.message, { id: toastId });
      refetchIntegrations();
    } catch (error) {
      toast.error(`Falha ao salvar: ${error.message}`, { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const renderStatus = () => {
    if (isLoading) return <div className="flex items-center text-sm text-gray-500"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando...</div>;
    if (isConnected) return <div className="flex items-center text-sm text-green-600 font-semibold"><CheckCircle className="mr-2 h-4 w-4" /> Conectado</div>;
    return <div className="flex items-center text-sm text-red-600 font-semibold"><AlertCircle className="mr-2 h-4 w-4" /> Desconectado</div>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Configurar WPPConnect</CardTitle>
          {renderStatus()}
        </div>
        <CardDescription>Conecte sua instância do WPPConnect.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSave}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wppUrl">URL da API</Label>
            <Input id="wppUrl" placeholder="http://localhost:21465" value={credentials.wppUrl} onChange={handleInputChange} required disabled={isSaving || isLoading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wppSession">Nome da Sessão</Label>
            <Input id="wppSession" placeholder="my-session" value={credentials.wppSession} onChange={handleInputChange} required disabled={isSaving || isLoading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wppSecretKey">Chave Secreta (Secret Key)</Label>
            <Input id="wppSecretKey" type="password" placeholder="Sua chave secreta" value={credentials.wppSecretKey} onChange={handleInputChange} required disabled={isSaving || isLoading} />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isSaving || isLoading}>
            {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : 'Salvar Credenciais'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default WppConnectConfig;