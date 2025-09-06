
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';
import { supabase } from '../../../core/supabase';
import { Loader2, Info } from 'lucide-react';
import IntegrationCard from './IntegrationCard';
import { useIntegrations } from '@/contexts/data/IntegrationsContext';

const GoogleFitConfig = () => {
  const { adminIntegrations, refetchIntegrations } = useIntegrations();
  const [credentials, setCredentials] = useState({ clientId: '', clientSecret: '' });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (adminIntegrations.google_fit) {
      setCredentials({
        clientId: adminIntegrations.google_fit.credentials?.clientId || '',
        clientSecret: adminIntegrations.google_fit.credentials?.clientSecret || '',
      });
    }
    setFetching(false);
  }, [adminIntegrations.google_fit]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!credentials.clientId || !credentials.clientSecret) {
      toast.error('Client ID e Client Secret são obrigatórios.');
      return;
    }
    setLoading(true);
    const toastId = toast.loading('Salvando credenciais...');
    try {
      const { error } = await supabase.functions.invoke('set-google-credentials', {
        body: credentials,
      });
      if (error) throw error;
      toast.success('Credenciais do Google Fit salvas com sucesso!', { id: toastId });
      refetchIntegrations();
    } catch (error) {
      toast.error(`Falha ao salvar: ${error.message}`, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const redirectUri = `${window.location.origin}/auth/integration-callback`;

  return (
    <IntegrationCard
      title="Integração com Google Fit"
      description="Permita que seus clientes sincronizem dados de atividades físicas e saúde."
    >
      <form onSubmit={handleSave} className="space-y-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 flex items-start space-x-3">
          <Info className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Instruções de Configuração</p>
            <p>
              Para obter suas credenciais, acesse o{' '}
              <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="font-medium underline">
                Google Cloud Console
              </a>
              , crie um projeto, ative a API do Google Fit e crie credenciais de "ID do cliente OAuth".
            </p>
            <p className="mt-2">
              Adicione a seguinte URL aos seus "URIs de redirecionamento autorizados":
            </p>
            <div className="mt-1 bg-blue-100 p-2 rounded">
              <code className="text-xs break-all">{redirectUri}</code>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="clientId">Google Client ID</Label>
          <Input
            id="clientId"
            name="clientId"
            type="text"
            value={credentials.clientId}
            onChange={handleChange}
            placeholder="Seu Google Client ID"
            disabled={loading || fetching}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="clientSecret">Google Client Secret</Label>
          <Input
            id="clientSecret"
            name="clientSecret"
            type="password"
            value={credentials.clientSecret}
            onChange={handleChange}
            placeholder="Seu Google Client Secret"
            disabled={loading || fetching}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={loading || fetching}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {loading ? 'Salvando...' : 'Salvar Credenciais'}
          </Button>
        </div>
      </form>
    </IntegrationCard>
  );
};

export default GoogleFitConfig;
