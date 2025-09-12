
import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext_FINAL';
import { useData } from '@/contexts/DataContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Copy, Users, DollarSign, Link, LogOut, Loader2, LayoutDashboard, Send, AlertCircle } from 'lucide-react';
import ClientHeader from '@/components/client/ClientHeader';
import { toast } from 'react-hot-toast';
import PayoutsTab from '@/components/partner/PayoutsTab';

const PartnerDashboard = () => {
  const { user, signOut } = useAuth();
  const { partnerProfile, referredClients, commissionSummary, loading } = useData();
  const [activeTab, setActiveTab] = useState('overview');

  const handleLogout = async () => {
    await signOut();
    toast.success("Você saiu com sucesso!");
  };

  const referralLink = useMemo(() => {
    if (partnerProfile?.affiliate_code) {
      return `${window.location.origin}/register?ref=${partnerProfile.affiliate_code}`;
    }
    return '';
  }, [partnerProfile]);

  const copyReferralLink = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      toast.success('Link de indicação copiado!');
    } else {
      toast.error('Código de afiliação não disponível.');
    }
  };

  const totalCommission = useMemo(() => {
    return referredClients.reduce((sum, client) => sum + (client.commission_value || 0), 0);
  }, [referredClients]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="animate-spin rounded-full h-12 w-12 text-primary mx-auto" />
          <p className="mt-4 text-lg text-gray-700 dark:text-gray-300">Carregando painel do parceiro...</p>
        </div>
      </div>
    );
  }

  if (!user || user.profile?.role !== 'partner') {
    return (
      <div className="flex justify-center items-center min-h-screen bg-red-50 dark:bg-gray-900">
         <Card className="w-96 text-center p-6 bg-white dark:bg-gray-800 shadow-xl">
          <CardHeader>
            <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
            <CardTitle className="text-red-600 dark:text-red-400 mt-4">Acesso Negado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-300">Você não tem permissão para acessar este painel. Por favor, faça login com uma conta de parceiro.</p>
             <Button onClick={() => window.location.href = '/login'} className="mt-6 w-full">Ir para o Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <>
      <Helmet>
        <title>Painel do Parceiro - Vida Smart</title>
        <meta name="description" content="Acompanhe suas indicações e ganhos no painel de parceiros do Vida Smart." />
      </Helmet>
      <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50 dark:bg-gray-900">
        <motion.aside
          initial={{ x: -200, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="hidden lg:flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-lg p-6"
        >
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-primary">Vida Smart</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Painel do Parceiro</p>
          </div>
          <Tabs orientation="vertical" value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-grow">
            <TabsList className="flex flex-col items-start h-auto p-0 bg-transparent">
              <TabsTrigger value="overview" className="w-full justify-start text-lg py-3 px-4 rounded-lg hover:bg-gray-100 data-[state=active]:bg-primary data-[state=active]:text-white transition-all mb-2 dark:hover:bg-gray-700 dark:data-[state=active]:bg-primary">
                <LayoutDashboard className="mr-3 h-5 w-5" /> Visão Geral
              </TabsTrigger>
              <TabsTrigger value="referrals" className="w-full justify-start text-lg py-3 px-4 rounded-lg hover:bg-gray-100 data-[state=active]:bg-primary data-[state=active]:text-white transition-all mb-2 dark:hover:bg-gray-700 dark:data-[state=active]:bg-primary">
                <Users className="mr-3 h-5 w-5" /> Indicações
              </TabsTrigger>
              <TabsTrigger value="payouts" className="w-full justify-start text-lg py-3 px-4 rounded-lg hover:bg-gray-100 data-[state=active]:bg-primary data-[state=active]:text-white transition-all mb-2 dark:hover:bg-gray-700 dark:data-[state=active]:bg-primary">
                <Send className="mr-3 h-5 w-5" /> Saques
              </TabsTrigger>
            </TabsList>
            <div className="mt-auto pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button onClick={handleLogout} variant="ghost" className="w-full justify-start text-lg py-3 px-4 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-all">
                <LogOut className="mr-3 h-5 w-5" /> Sair
              </Button>
            </div>
          </Tabs>
        </motion.aside>

        <main className="flex-1 flex flex-col overflow-hidden">
          <ClientHeader user={user} onLogout={handleLogout} />
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
              <TabsContent value="overview" className="mt-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  <Card className="shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Seu Link de Indicação</CardTitle>
                      <Link className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg font-bold flex items-center justify-between">
                        <span className="truncate">{partnerProfile?.affiliate_code || 'Gerando...'}</span>
                        <Button variant="ghost" size="icon" onClick={copyReferralLink}>
                          <Copy className="h-5 w-5" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Compartilhe para indicar novos clientes.</p>
                    </CardContent>
                  </Card>
                   <Card className="shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Clientes Indicados</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{referredClients.length}</div>
                      <p className="text-xs text-muted-foreground mt-1">Total de clientes que usaram seu código.</p>
                    </CardContent>
                  </Card>
                  <Card className="shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Comissão Total (Mês)</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{`R$ ${totalCommission.toFixed(2).replace('.', ',')}`}</div>
                      <p className="text-xs text-muted-foreground mt-1">Baseado nos planos dos clientes indicados.</p>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="referrals" className="mt-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 rounded-2xl bg-card text-card-foreground shadow-lg"
                >
                  <h2 className="text-2xl font-bold mb-4">Minhas Indicações</h2>
                  {referredClients.length === 0 ? (
                    <p className="text-muted-foreground">Nenhum cliente indicado ainda. Compartilhe seu link!</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome do Cliente</TableHead>
                          <TableHead>Plano</TableHead>
                          <TableHead>Comissão</TableHead>
                          <TableHead>Data de Cadastro</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {referredClients.map((client) => (
                          <TableRow key={client.id}>
                            <TableCell className="font-medium">{client.full_name}</TableCell>
                            <TableCell>{client.plan}</TableCell>
                            <TableCell className="text-green-600 dark:text-green-400 font-semibold">
                              R$ {client.commission_value.toFixed(2).replace('.',',')}
                            </TableCell>
                            <TableCell>{new Date(client.created_at).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </motion.div>
              </TabsContent>
               <TabsContent value="payouts" className="mt-6">
                 <PayoutsTab partnerId={user.id} availableCommission={totalCommission} />
               </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </>
  );
};

export default PartnerDashboard;
