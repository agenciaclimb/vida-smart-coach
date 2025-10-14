
import React from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Copy, Users, Gift } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/components/auth/AuthProvider';

const ReferralTab = () => {
  const { user } = useAuth();
  const { referredClients, loading } = useData();
  const baseUrl = import.meta.env.VITE_APP_BASE_URL || window.location.origin;
  const referralCode = user?.profile?.ref_code || user?.profile?.affiliate_code || user?.id || '';
  const referralLink = referralCode ? `${baseUrl}/login?tab=register&ref=${encodeURIComponent(referralCode)}` : '';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success('Link de indicação copiado!');
  };

  return (
    <TabsContent value="referral" className="mt-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="shadow-lg transition-all duration-300 hover:shadow-xl">
          <CardHeader>
            <CardTitle>Indique e Ganhe</CardTitle>
            <CardDescription>
              Compartilhe seu link de indicação e ganhe pontos para cada novo cliente que se cadastrar!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="p-6 rounded-lg bg-gradient-to-r from-primary to-purple-600 text-white">
              <h3 className="text-xl font-bold">Seu Link de Indicação Exclusivo</h3>
              <p className="text-purple-200 mt-1">Compartilhe este link com seus amigos e familiares.</p>
              <div className="flex items-center mt-4 gap-2">
                <Input
                  readOnly
                  value={referralLink || 'Complete seu perfil para gerar o link'}
                  className="bg-white/20 text-white placeholder:text-purple-200 border-purple-400 focus-visible:ring-white"
                />
                <Button onClick={copyToClipboard} variant="secondary" size="icon" disabled={!referralLink}>
                  <Copy className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total de Indicados</CardTitle>
                  <Users className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{referredClients?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">Clientes que se cadastraram com seu link.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Pontos Ganhos</CardTitle>
                  <Gift className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(referredClients?.length || 0) * 100}</div>
                  <p className="text-xs text-muted-foreground">100 pontos por cada indicação bem-sucedida.</p>
                </CardContent>
              </Card>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Suas Indicações</h3>
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead className="text-right">Data de Cadastro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center">Carregando...</TableCell>
                      </TableRow>
                    ) : referredClients && referredClients.length > 0 ? (
                      referredClients.map((client) => (
                        <TableRow key={client.id}>
                          <TableCell className="font-medium">{client.full_name}</TableCell>
                          <TableCell>{client.plan}</TableCell>
                          <TableCell className="text-right">
                            {new Date(client.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center h-24">
                          Você ainda não tem nenhuma indicação. Compartilhe seu link!
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </TabsContent>
  );
};

export default ReferralTab;
