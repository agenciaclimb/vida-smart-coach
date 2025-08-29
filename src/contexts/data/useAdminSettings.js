
import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';

const useAdminSettings = (supabase, invokeFn, setLoading) => {
  const [aiSettings, setAiSettings] = useState({ system_prompt: '' });
  const [activeProvider, setActiveProvider] = useState('evolution_api');
  const [evolutionCredentials, setEvolutionCredentials] = useState({ token: '', instanceName: '' });
  const [wppConnectCredentials, setWppConnectCredentials] = useState({ wppUrl: '', wppSession: '', wppSecretKey: '' });
  const [googleFitCredentials, setGoogleFitCredentials] = useState({ clientId: '', clientSecret: '' });
  const [googleCalendarCredentials, setGoogleCalendarCredentials] = useState({ clientId: '', clientSecret: '' });

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const [
        aiData,
        providerData,
        evoCreds,
        wppCreds,
        googleFitCreds,
        googleCalCreds
      ] = await Promise.all([
        supabase.from('ai_settings').select('*').single(),
        invokeFn('get-active-provider'),
        invokeFn('get-evolution-credentials'),
        invokeFn('get-wppconnect-credentials'),
        invokeFn('get-google-credentials'),
        invokeFn('get-google-calendar-credentials')
      ]);

      if (aiData.data) setAiSettings(aiData.data);
      if (providerData) setActiveProvider(providerData.provider);
      if (evoCreds?.credentials) setEvolutionCredentials(evoCreds.credentials);
      if (wppCreds?.credentials) setWppConnectCredentials(wppCreds.credentials);
      if (googleFitCreds?.credentials) setGoogleFitCredentials(googleFitCreds.credentials);
      if (googleCalCreds?.credentials) setGoogleCalendarCredentials(googleCalCreds.credentials);

    } catch (error) {
      console.error("Erro ao buscar configurações:", error);
      toast.error(`Falha ao carregar configurações: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [supabase, invokeFn, setLoading]);

  const saveAiSettings = useCallback(async (settings) => {
    setLoading(true);
    const { error } = await supabase.from('ai_settings').update(settings).eq('id', settings.id);
    if (error) {
      toast.error("Erro ao salvar configurações de IA.");
    } else {
      toast.success("Configurações de IA salvas!");
      await fetchSettings();
    }
    setLoading(false);
  }, [supabase, setLoading, fetchSettings]);

  const handleSetActiveProvider = useCallback(async (provider) => {
    try {
      setLoading(true);
      await invokeFn('set-active-provider', { provider });
      setActiveProvider(provider);
      toast.success(`Provedor ativo alterado para ${provider}!`);
    } catch (e) {
      toast.error(`Falha ao alterar provedor: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [invokeFn, setLoading]);

  return {
    aiSettings,
    saveAiSettings,
    activeProvider,
    handleSetActiveProvider,
    evolutionCredentials,
    setEvolutionCredentials,
    wppConnectCredentials,
    setWppConnectCredentials,
    googleFitCredentials,
    setGoogleFitCredentials,
    googleCalendarCredentials,
    setGoogleCalendarCredentials,
    fetchSettings,
  };
};

export default useAdminSettings;
