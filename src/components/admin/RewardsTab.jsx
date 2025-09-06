import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';
import { Gift, PlusCircle, Loader2, Edit } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { supabase } from '../../core/supabase';
import RewardEditModal from './RewardEditModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const RewardsTab = () => {
  const { rewards, loadingRewards, redemptionHistory, loadingHistory, clients, loadingClients, refetchData } = useData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedReward, setSelectedReward] = useState('');
  
  const [newRewardName, setNewRewardName] = useState('');
  const [newRewardDesc, setNewRewardDesc] = useState('');
  const [newRewardPoints, setNewRewardPoints] = useState('');
  const [newRewardIcon, setNewRewardIcon] = useState('🎁');

  const [editingReward, setEditingReward] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleManualRedeem = async () => {
    if (!selectedClient || !selectedReward) {
      toast.error("Por favor, selecione um cliente e uma recompensa.");
      return;
    }
    
    setIsSubmitting(true);
    const toastId = toast.loading("Processando resgate manual...");

    try {
        const client = clients.find(c => c.id === selectedClient);
        const reward = rewards.find(r => r.id === parseInt(selectedReward));

        if (!client || !reward) throw new Error("Cliente ou recompensa não encontrado.");
        
        const newPoints = (client.points || 0) - reward.points;
        if (newPoints < 0) throw new Error("Cliente não tem pontos suficientes.");

        const { error: updateError } = await supabase
            .from('user_profiles')
            .update({ points: newPoints })
            .eq('id', client.id);
        if (updateError) throw updateError;

        const { error: logError } = await supabase
            .from('redemption_history')
            .insert({
                user_id: client.id,
                reward_name: reward.name,
                reward_icon: reward.icon,
                points_spent: reward.points,
            });
        if (logError) throw logError;

        toast.success(`Recompensa resgatada para ${client.full_name}!`, { id: toastId });
        refetchData();
        setSelectedClient('');
        setSelectedReward('');

    } catch (error) {
        toast.error(`Falha no resgate: ${error.message}`, { id: toastId });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleAddReward = async (e) => {
    e.preventDefault();
    if (!newRewardName || !newRewardPoints) {
        toast.error("Nome e pontos são obrigatórios.");
        return;
    }
    setIsSubmitting(true);
    const toastId = toast.loading("Adicionando nova recompensa...");
    try {
        const { error } = await supabase
            .from('rewards')
            .insert({
                name: newRewardName,
                description: newRewardDesc,
                points: parseInt(newRewardPoints),
                icon: newRewardIcon,
                is_active: true,
            });

        if (error) throw error;
        toast.success("Nova recompensa adicionada!", { id: toastId });
        setNewRewardName('');
        setNewRewardDesc('');
        setNewRewardPoints('');
        setNewRewardIcon('🎁');
        refetchData();
    } catch(error) {
        toast.error(`Falha ao adicionar recompensa: ${error.message}`, { id: toastId });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handleEditRewardClick = (reward) => {
    setEditingReward(reward);
    setIsEditModalOpen(true);
  };

  const handleRewardUpdate = () => {
    refetchData();
  };

  return (
    <>
      <RewardEditModal
        reward={editingReward}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onRewardUpdate={handleRewardUpdate}
      />
      <TabsContent value="rewards" className="w-full">
        <Tabs defaultValue="manage" className="w-full">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Gerenciar Recompensas</h2>
            <TabsList>
              <TabsTrigger value="manage">Recompensas</TabsTrigger>
              <TabsTrigger value="history">Histórico</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="manage" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid md:grid-cols-3 gap-6"
            >
              <div className="md:col-span-2 vida-smart-card p-6 rounded-2xl shadow-lg">
                <h3 className="text-lg font-semibold mb-4">Recompensas Disponíveis</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {(loadingRewards && (!rewards || rewards.length === 0)) ? <p>Carregando...</p> : (rewards || []).map(reward => (
                    <div key={reward.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{reward.icon}</span>
                        <div>
                          <p className={`font-medium ${!reward.is_active ? 'text-gray-400 line-through' : ''}`}>{reward.name}</p>
                          <p className="text-sm text-gray-600">{reward.points} pontos • {reward.description}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleEditRewardClick(reward)}><Edit className="w-4 h-4" /></Button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="vida-smart-card p-6 rounded-2xl shadow-lg">
                <h3 className="text-lg font-semibold mb-4">Adicionar Recompensa</h3>
                <form onSubmit={handleAddReward} className="space-y-4">
                  <div>
                    <Label htmlFor="reward-name">Nome</Label>
                    <Input id="reward-name" value={newRewardName} onChange={e => setNewRewardName(e.target.value)} required/>
                  </div>
                  <div>
                    <Label htmlFor="reward-desc">Descrição</Label>
                    <Input id="reward-desc" value={newRewardDesc} onChange={e => setNewRewardDesc(e.target.value)} required/>
                  </div>
                  <div>
                    <Label htmlFor="reward-points">Pontos</Label>
                    <Input id="reward-points" value={newRewardPoints} onChange={e => setNewRewardPoints(e.target.value)} type="number" required/>
                  </div>
                  <div>
                    <Label htmlFor="reward-icon">Ícone (Emoji)</Label>
                    <Input id="reward-icon" value={newRewardIcon} onChange={e => setNewRewardIcon(e.target.value)} required/>
                  </div>
                  <Button type="submit" className="w-full vida-smart-gradient text-white" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <PlusCircle className="w-4 h-4 mr-2" />}
                    Adicionar
                  </Button>
                </form>
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="vida-smart-card p-6 rounded-2xl shadow-lg"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Resgatar Manualmente</h3>
                <div className="flex space-x-2">
                  <Select value={selectedClient} onValueChange={setSelectedClient} disabled={loadingClients || isSubmitting}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Selecione o Cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {!loadingClients && clients && clients.map(c => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={selectedReward} onValueChange={setSelectedReward} disabled={isSubmitting}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Selecione a Recompensa" />
                    </SelectTrigger>
                    <SelectContent>
                      {rewards.filter(r => r.is_active).map(r => <SelectItem key={r.id} value={String(r.id)}>{r.name} ({r.points} pts)</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button className="vida-smart-gradient text-white" onClick={handleManualRedeem} disabled={loadingClients || isSubmitting}>
                    {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Gift className="w-4 h-4 mr-2" />}
                    Resgatar
                  </Button>
                </div>
              </div>
              <hr className="my-6"/>
              <h3 className="text-lg font-semibold mb-4">Histórico de Resgates</h3>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {loadingHistory ? <p>Carregando histórico...</p> : (redemptionHistory || []).map(item => (
                  <div key={item.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                    <span className="text-2xl">{item.reward_icon || '🎁'}</span>
                    <p className="flex-1"><span className="font-semibold">{item.profile?.full_name || 'Usuário desconhecido'}</span> resgatou <span className="font-semibold">{item.reward_name}</span> por {item.points_spent} pontos.</p>
                    <p className="text-sm text-gray-500">{new Date(item.redeemed_at).toLocaleString('pt-BR')}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </TabsContent>
    </>
  );
};

export default RewardsTab;
