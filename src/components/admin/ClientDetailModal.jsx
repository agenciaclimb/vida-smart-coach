import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'react-hot-toast';
import { supabase } from '@/core/supabase';
import { useData } from '@/contexts/DataContext';
import { User, TrendingUp, Smile, Award, Sparkles } from 'lucide-react';

const ClientDetailModal = ({ client, isOpen, onClose }) => {
    const { refetchData, userMetrics, redemptionHistory } = useData();

    const handlePlanChange = async (newPlan) => {
        try {
            const { error } = await supabase
                .from('user_profiles')
                .update({ plan: newPlan })
                .eq('id', client.id);
            if (error) throw error;
            toast.success(`Plano do cliente ${client.full_name} atualizado para ${newPlan}!`);
            refetchData();
            onClose();
        } catch (error) {
            toast.error(`Falha ao atualizar o plano: ${error.message}`);
        }
    };

    const clientMetrics = userMetrics.filter(m => m.user_id === client.id);
    const clientRedemptions = redemptionHistory.filter(r => r.user_id === client.id);

    if (!client) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <User className="w-6 h-6 text-primary" />
                        Detalhes de {client.full_name}
                    </DialogTitle>
                    <DialogDescription>
                        Visualize e gerencie as informações do cliente.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[60vh] p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h4 className="font-semibold text-lg flex items-center gap-2"><Sparkles className="w-5 h-5 text-yellow-500" />Informações Gerais</h4>
                            <p><strong>Nome:</strong> {client.full_name}</p>
                            <p><strong>Telefone:</strong> {client.phone || 'Não informado'}</p>
                            <p><strong>Nível:</strong> {client.level || 'Não informado'}</p>
                            <p><strong>Pontos:</strong> {client.points || 0}</p>
                            <div className="space-y-2">
                                <label className="font-semibold">Plano Atual: </label>
                                <Select defaultValue={client.plan} onValueChange={handlePlanChange}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Selecione o plano" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="trial">Trial</SelectItem>
                                        <SelectItem value="premium">Premium</SelectItem>
                                        <SelectItem value="inactive">Inativo</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-4">
                           <h4 className="font-semibold text-lg flex items-center gap-2"><TrendingUp className="w-5 h-5 text-green-500" />Métricas</h4>
                            <p><strong>Peso Inicial:</strong> {client.start_weight || '-'} kg</p>
                            <p><strong>Peso Atual:</strong> {client.current_weight || '-'} kg</p>
                            <p><strong>Meta de Peso:</strong> {client.target_weight || '-'} kg</p>
                        </div>

                        <div className="md:col-span-2 space-y-4">
                             <h4 className="font-semibold text-lg flex items-center gap-2"><Smile className="w-5 h-5 text-blue-500" />Histórico de Métricas</h4>
                            {clientMetrics.length > 0 ? (
                                <ul className="list-disc list-inside bg-gray-50 p-3 rounded-md">
                                    {clientMetrics.slice(0, 5).map(metric => (
                                        <li key={metric.id}>
                                            {new Date(metric.date).toLocaleDateString()}: 
                                            {metric.weight && ` Peso: ${metric.weight}kg`}
                                            {metric.mood_score && ` - Humor: ${metric.mood_score}/5`}
                                        </li>
                                    ))}
                                </ul>
                            ) : <p className="text-sm text-gray-500">Nenhuma métrica registrada.</p>}
                        </div>

                        <div className="md:col-span-2 space-y-4">
                            <h4 className="font-semibold text-lg flex items-center gap-2"><Award className="w-5 h-5 text-purple-500" />Recompensas Resgatadas</h4>
                            {clientRedemptions.length > 0 ? (
                                <ul className="list-disc list-inside bg-gray-50 p-3 rounded-md">
                                    {clientRedemptions.map(item => (
                                        <li key={item.id}>
                                            {item.reward_icon} {item.reward_name} - {item.points_spent} pts em {new Date(item.redeemed_at).toLocaleDateString()}
                                        </li>
                                    ))}
                                </ul>
                            ) : <p className="text-sm text-gray-500">Nenhuma recompensa resgatada.</p>}
                        </div>
                    </div>
                </ScrollArea>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Fechar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ClientDetailModal;
