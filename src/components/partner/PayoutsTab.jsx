import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from 'react-hot-toast';
import { Loader2, DollarSign, Send, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useData } from '@/contexts/DataContext';

const PayoutsTab = ({ partnerId, availableCommission }) => {
  const { refetchPartnerData } = useData();
  const [pixKey, setPixKey] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [balance, setBalance] = useState(0);

  const fetchPayoutHistory = useCallback(async () => {
    if (!partnerId) return;
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('payout_requests')
        .select('*')
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory(data);
      
      const pendingAmount = data
        .filter(req => req.status === 'pending')
        .reduce((acc, req) => acc + parseFloat(req.amount), 0);
      
      setBalance(availableCommission - pendingAmount);

    } catch (error) {
      toast.error('Erro ao buscar histórico de saques.');
      console.error(error);
    } finally {
      setLoadingHistory(false);
    }
  }, [partnerId, availableCommission]);

  useEffect(() => {
    fetchPayoutHistory();
  }, [fetchPayoutHistory]);

  const handleRequestPayout = async (e) => {
    e.preventDefault();
    if (!pixKey || !amount) {
      toast.error('Preencha a chave PIX e o valor.');
      return;
    }
    const numericAmount = parseFloat(amount);
    if (numericAmount <= 0) {
      toast.error('O valor deve ser positivo.');
      return;
    }
    if (numericAmount > balance) {
      toast.error('Saldo de comissão insuficiente.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('payout_requests').insert({
        partner_id: partnerId,
        amount: numericAmount,
        pix_key: pixKey,
        status: 'pending',
      });
      if (error) throw error;
      toast.success('Solicitação de saque enviada com sucesso!');
      setAmount('');
      setPixKey('');
      await fetchPayoutHistory();
      refetchPartnerData(); 
    } catch (error) {
      toast.error('Falha ao solicitar saque.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusComponent = (status) => {
    const statusMap = {
      pending: { icon: <Clock className="w-4 h-4 text-yellow-500" />, text: 'Pendente', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' },
      completed: { icon: <CheckCircle className="w-4 h-4 text-green-500" />, text: 'Concluído', className: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' },
      rejected: { icon: <XCircle className="w-4 h-4 text-red-500" />, text: 'Rejeitado', className: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' },
    };
    const { icon, text, className } = statusMap[status] || {};
    return <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${className}`}>{icon}{text}</span>;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-lg">
          <CardHeader>
            <CardTitle>Histórico de Saques</CardTitle>
            <CardDescription>Acompanhe suas solicitações de saque.</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingHistory ? <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /> :
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Chave PIX</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Nenhum saque solicitado.</TableCell></TableRow>
                  ) : (
                    history.map(item => (
                      <TableRow key={item.id}>
                        <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">R$ {parseFloat(item.amount).toFixed(2).replace('.', ',')}</TableCell>
                        <TableCell>{item.pix_key}</TableCell>
                        <TableCell>{getStatusComponent(item.status)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            }
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Solicitar Saque</CardTitle>
            <CardDescription>Peça a transferência de suas comissões.</CardDescription>
          </CardHeader>
          <form onSubmit={handleRequestPayout}>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-center dark:bg-green-900/30 dark:border-green-700">
                <p className="text-sm font-medium text-green-800 dark:text-green-300">Saldo disponível para saque</p>
                <p className="text-3xl font-bold text-green-700 dark:text-green-400">R$ {balance.toFixed(2).replace('.', ',')}</p>
              </div>
              <div>
                <Label htmlFor="pixKey">Sua Chave PIX</Label>
                <Input
                  id="pixKey"
                  type="text"
                  placeholder="E-mail, telefone, CPF/CNPJ..."
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
              <div>
                <Label htmlFor="amount">Valor do Saque (R$)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-9"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={loading || balance <= 0}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                {loading ? 'Solicitando...' : 'Solicitar Saque'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </motion.div>
  );
};

export default PayoutsTab;