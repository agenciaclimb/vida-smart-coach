
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Users, ShoppingCart, Send, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useAdmin } from '@/contexts/data/AdminContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { TabsContent } from '@/components/ui/tabs';

const StatCard = ({ title, value, icon, description }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

const PayoutActionDialog = ({ request, onUpdate }) => {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [action, setAction] = useState(null);
  const { updatePayoutStatus } = useAdmin();
  const [loading, setLoading] = useState(false);

  const handleAction = async () => {
    if (!action) return;
    setLoading(true);
    try {
      await updatePayoutStatus(request.id, action, notes);
      onUpdate();
      setOpen(false);
      setNotes('');
    } catch(err) {
      // toast is handled in context
    } finally {
      setLoading(false);
    }
  };

  const triggerAction = (newAction) => {
    setAction(newAction);
    setOpen(true);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700" onClick={() => triggerAction('completed')}>
            <CheckCircle className="h-4 w-4 mr-2" /> Pagar
          </Button>
          <Button size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => triggerAction('rejected')}>
            <XCircle className="h-4 w-4 mr-2" /> Rejeitar
          </Button>
        </div>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Processar Saque - {request.partner.full_name}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <div className="mb-4">
            <p><strong>Valor:</strong> R$ {request.amount.toFixed(2).replace('.', ',')}</p>
            <p><strong>Chave PIX:</strong> {request.pix_key}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea 
              id="notes" 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={`Ex: Pagamento realizado via PIX em ${new Date().toLocaleDateString()}`}
            />
          </div>
          <Button onClick={handleAction} className="mt-4 w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar {action === 'completed' ? 'Pagamento' : 'Rejeição'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};


const FinancialTab = () => {
  const { payoutRequests, loadingPayouts, fetchPayoutRequests, fetchAffiliates } = useAdmin();

  const handleUpdate = () => {
    fetchPayoutRequests();
    fetchAffiliates();
  };

  const getStatusComponent = (status) => {
    const statusMap = {
      pending: { icon: <Clock className="w-4 h-4 text-yellow-500" />, text: 'Pendente', className: 'bg-yellow-100 text-yellow-800' },
      completed: { icon: <CheckCircle className="w-4 h-4 text-green-500" />, text: 'Concluído', className: 'bg-green-100 text-green-800' },
      rejected: { icon: <XCircle className="w-4 h-4 text-red-500" />, text: 'Rejeitado', className: 'bg-red-100 text-red-800' },
    };
    const { icon, text, className } = statusMap[status] || {};
    return <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${className}`}>{icon}{text}</span>;
  };

  return (
    <TabsContent value="financial" className="space-y-6 mt-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Receita Total" value="R$ 12.345,67" icon={<DollarSign className="h-4 w-4 text-muted-foreground" />} description="+20,1% do último mês" />
        <StatCard title="Assinaturas Ativas" value="+235" icon={<Users className="h-4 w-4 text-muted-foreground" />} description="+180,1% do último mês" />
        <StatCard title="Vendas de Produtos" value="+12" icon={<ShoppingCart className="h-4 w-4 text-muted-foreground" />} description="+19% do último mês" />
        <StatCard title="Pagamentos a Parceiros" value="R$ 1.234,56" icon={<Send className="h-4 w-4 text-muted-foreground" />} description="Total pago este mês" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Solicitações de Saque de Parceiros</CardTitle>
          <CardDescription>Gerencie os pagamentos de comissão para seus parceiros.</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingPayouts ? (
             <div className="flex justify-center items-center h-40">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parceiro</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Chave PIX</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payoutRequests.length === 0 ? (
                   <TableRow>
                    <TableCell colSpan={6} className="text-center">Nenhuma solicitação de saque.</TableCell>
                  </TableRow>
                ) : (
                  payoutRequests.map(request => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.partner.full_name}</TableCell>
                      <TableCell>{new Date(request.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>R$ {request.amount.toFixed(2).replace('.', ',')}</TableCell>
                      <TableCell>{request.pix_key}</TableCell>
                      <TableCell>{getStatusComponent(request.status)}</TableCell>
                      <TableCell>
                        {request.status === 'pending' ? (
                          <PayoutActionDialog request={request} onUpdate={handleUpdate} />
                        ) : (
                          <span className="text-xs text-gray-500">Processado</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
};

export default FinancialTab;
