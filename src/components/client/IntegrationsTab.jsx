import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useIntegrations } from '@/contexts/data/IntegrationsContext';
import { useAuth } from '@/contexts/SupabaseAuthContext_FINAL';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const IntegrationsTab = () => {
    const { userIntegrations, toggleUserIntegration, loading: integrationsLoading, updating } = useIntegrations();
    const { supabase } = useAuth();
    
    const handleConnect = async (serviceName) => {
        try {
            if (serviceName === 'google_fit') {
                const { data: adminConfig, error: adminConfigError } = await supabase.functions.invoke('get-google-credentials');

                if (adminConfigError || !adminConfig?.credentials?.clientId) {
                    toast.error("Integração Google Fit não configurada pelo administrador.");
                    return;
                }

                const clientId = adminConfig.credentials.clientId;
                const redirectUri = `${window.location.origin}/auth/integration-callback`;
                const scope = "https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.body.read";
                const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&response_type=code&access_type=offline&prompt=consent`;

                localStorage.setItem('integration_service_name', serviceName);
                window.location.href = authUrl;

            } else if (serviceName === 'google_calendar') {
                 const { data: adminConfig, error: adminConfigError } = await supabase.functions.invoke('get-google-calendar-credentials');

                if (adminConfigError || !adminConfig?.credentials?.clientId) {
                    toast.error("Integração Google Calendar não configurada pelo administrador.");
                    return;
                }

                const clientId = adminConfig.credentials.clientId;
                const redirectUri = `${window.location.origin}/auth/integration-callback`;
                const scope = "https://www.googleapis.com/auth/calendar";
                const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&response_type=code&access_type='offline'&prompt=consent`;
                
                localStorage.setItem('integration_service_name', serviceName);
                window.location.href = authUrl;

            } else {
                toast.error("🚧 Esta integração não está implementada ainda—mas não se preocupe! Você pode solicitá-la no seu próximo prompt! 🚀");
            }
        } catch (error) {
            console.error("Erro ao iniciar conexão:", error);
            toast.error(`Falha ao conectar ${serviceName}. Tente novamente.`);
        }
    };

    const handleDisconnect = async (serviceName) => {
        await toggleUserIntegration(serviceName, false);
    };

    const integrations = [
        { name: 'Google Fit', service: 'google_fit', description: 'Sincronize seus dados de saúde e atividades físicas.' },
        { name: 'Google Calendar', service: 'google_calendar', description: 'Adicione seus treinos e compromissos à sua agenda.' },
        { name: 'WhatsApp', service: 'whatsapp', description: 'Receba lembretes e mensagens diretamente no seu WhatsApp.', disabled: true },
        { name: 'Spotify', service: 'spotify', description: 'Sincronize suas playlists para treinar com a trilha sonora perfeita.', disabled: true },
    ];

    return (
        <TabsContent value="integrations" className="mt-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-8"
            >
                <Card className="shadow-lg bg-vida-smart-gradient text-white">
                    <CardHeader>
                        <CardTitle className="text-2xl">Minhas Integrações</CardTitle>
                        <CardDescription className="text-gray-200">
                            Conecte o Vida Smart Coach aos seus aplicativos favoritos para uma experiência mais completa.
                        </CardDescription>
                    </CardHeader>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {integrations.map((integration) => {
                        const isConnected = userIntegrations?.some(ui => ui.service_name === integration.service && ui.is_connected);
                        const isLoading = updating === integration.service || integrationsLoading;

                        return (
                            <Card key={integration.service} className="flex flex-col justify-between">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        {integration.name}
                                        {isConnected ? (
                                            <CheckCircle2 className="text-green-500 w-5 h-5" />
                                        ) : (
                                            <XCircle className="text-red-500 w-5 h-5" />
                                        )}
                                    </CardTitle>
                                    <CardDescription>{integration.description}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {integration.disabled ? (
                                        <Button className="w-full" disabled>
                                            Em Breve
                                        </Button>
                                    ) : (
                                        isConnected ? (
                                            <Button
                                                variant="outline"
                                                className="w-full text-red-500 border-red-500 hover:text-red-600 hover:border-red-600"
                                                onClick={() => handleDisconnect(integration.service)}
                                                disabled={isLoading}
                                            >
                                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                                Desconectar
                                            </Button>
                                        ) : (
                                            <Button
                                                className="w-full vida-smart-gradient"
                                                onClick={() => handleConnect(integration.service)}
                                                disabled={isLoading}
                                            >
                                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                                Conectar
                                            </Button>
                                        )
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </motion.div>
        </TabsContent>
    );
};

export default IntegrationsTab;