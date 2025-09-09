import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'react-hot-toast';
import { supabase } from '@/core/supabase';
import { Loader2, ExternalLink } from 'lucide-react';
import IntegrationCard from './integrations/IntegrationCard';
import EvolutionApiConfig from './integrations/EvolutionApiConfig';
import WppConnectConfig from './integrations/WppConnectConfig';
import GoogleFitConfig from './integrations/GoogleFitConfig';
import GoogleCalendarConfig from './integrations/GoogleCalendarConfig';
import { useIntegrations } from '@/contexts/data/IntegrationsContext';

const IntegrationsTab = () => {
  const { adminIntegrations, loading, refetchIntegrations } = useIntegrations();
  const [activeProvider, setActiveProvider] = React.useState('evolution_api');
  const [loadingProvider, setLoadingProvider] = React.useState(true);

  const fetchActiveProvider = React.useCallback(async () => {
    setLoadingProvider(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-active-provider');
      if (error) throw error;
      setActiveProvider(data.provider);
    } catch (error) {
      toast.error("Falha ao buscar provedor de WhatsApp ativo.");
      console.error(error);
    } finally {
      setLoadingProvider(false);
    }
  }, []);

  React.useEffect(() => {
    fetchActiveProvider();
  }, [fetchActiveProvider]);

  const handleProviderChange = async (isEvolution) => {
    const newProvider = isEvolution ? 'evolution_api' : 'wppconnect';
    if (newProvider === activeProvider) return;

    const toastId = toast.loading(`Ativando ${newProvider}...`);
    try {
       const { error } = await supabase.functions.invoke('set-active-provider', {
        body: { provider: newProvider },
      });
      if(error) throw error;
      
      toast.success(`${newProvider} definido como provedor ativo!`, { id: toastId });
      setActiveProvider(newProvider);
      refetchIntegrations();
    } catch (error) {
      const errorMessage = error.context?.error_description || error.message || 'Ocorreu um erro desconhecido.';
      toast.error(`Falha ao alterar provedor: ${errorMessage}`, { id: toastId });
    }
  };

  if (loading) {
    return (
      <TabsContent value="integrations" className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </TabsContent>
    );
  }

  return (
    <TabsContent value="integrations" className="mt-6">
      <div className="space-y-8">
        <IntegrationCard
          title="Integração com WhatsApp"
          description="Gerencie suas conexões com provedores de WhatsApp para automações e comunicação."
        >
          <div className="space-y-4">
            <Label>Provedor de WhatsApp Ativo</Label>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="provider-switch"
                  checked={activeProvider === 'evolution_api'}
                  onCheckedChange={handleProviderChange}
                  disabled={loadingProvider}
                  aria-label="Trocar provedor de WhatsApp"
                />
                <Label htmlFor="provider-switch">
                  {loadingProvider ? 'Carregando...' : activeProvider === 'evolution_api' ? 'Evolution API' : 'WPPConnect'}
                </Label>
              </div>
              {loadingProvider && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
            <p className="text-sm text-slate-500">
              Selecione qual provedor de API do WhatsApp será usado para enviar e receber mensagens.
            </p>
          </div>
        </IntegrationCard>

        {activeProvider === 'evolution_api' && <EvolutionApiConfig />}
        {activeProvider === 'wppconnect' && <WppConnectConfig />}

        <IntegrationCard
          title="Integração com Stripe"
          description="Gerencie pagamentos, assinaturas e planos diretamente pela plataforma."
        >
          <div className="space-y-3">
            <p className="text-slate-600">
              A integração com o Stripe é configurada de forma segura através de variáveis de ambiente no seu projeto. Isso garante que suas chaves de API nunca fiquem expostas no painel.
            </p>
            <p className="text-sm text-slate-500 bg-slate-100 p-3 rounded-md">
              Para que os pagamentos funcionem, a chave publicável do Stripe (`VITE_STRIPE_PUBLISHABLE_KEY`) deve ser configurada no ambiente do seu projeto. Os webhooks do Stripe também são essenciais para atualizar o status dos planos dos clientes automaticamente após o pagamento.
            </p>
            <div className="mt-4">
              <a href="https://dashboard.stripe.com/" target="_blank" rel="noopener noreferrer">
                <Button variant="outline">
                  Acessar Painel do Stripe
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </a>
            </div>
          </div>
        </IntegrationCard>

        <GoogleFitConfig />
        <GoogleCalendarConfig />

      </div>
    </TabsContent>
  );
};

export default IntegrationsTab;
