import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'react-hot-toast';
import { Edit, PackagePlus, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useData } from '@/contexts/DataContext';
import { supabase } from '../../core/supabase';
import PlanEditModal from '@/components/admin/PlanEditModal';

const PlansTab = () => {
  const { plans, loading, refetchData } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isToggling, setIsToggling] = useState(null);

  const handleTogglePlan = async (plan) => {
    setIsToggling(plan.id);
    try {
      const { error } = await supabase
        .from('plans')
        .update({ is_active: !plan.is_active })
        .eq('id', plan.id);
      
      if (error) throw error;
      
      toast.success('Status do plano alterado!');
      await refetchData();
    } catch (error) {
      toast.error('Falha ao alterar o status do plano.');
      console.error(error);
    } finally {
      setIsToggling(null);
    }
  };

  const handleEditPlan = (plan) => {
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };
  
  const handleAddNewPlan = () => {
    setSelectedPlan(null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedPlan(null);
  };

  const planOrder = ['Basic', 'Premium', 'VIP', 'trial'];
  const sortedPlans = [...plans].sort((a, b) => {
    const indexA = planOrder.indexOf(a.name);
    const indexB = planOrder.indexOf(b.name);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  return (
    <>
      <TabsContent value="plans" className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Gerenciar Planos</h2>
          <Button className="vida-smart-gradient text-white" onClick={handleAddNewPlan}>
            <PackagePlus className="w-4 h-4 mr-2" />
            Novo Plano
          </Button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="vida-smart-card rounded-2xl shadow-lg overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plano</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Mensal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Benefícios Principais</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan="5" className="text-center p-4">Carregando planos...</td></tr>
                ) : (
                  sortedPlans.map((plan) => (
                    <tr key={plan.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{plan.name}</div>
                        <div className="text-sm text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded mt-1 inline-block">{plan.stripe_price_id || 'N/D'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                        {plan.name.toLowerCase() === 'trial' ? 'Grátis' : `R$ ${(plan.price || 0).toFixed(2).replace('.', ',')}`}
                      </td>
                      <td className="px-6 py-4 text-gray-700 max-w-xs">
                        <ul className="list-disc list-inside text-sm space-y-1">
                          {(plan.benefits || []).slice(0, 3).map((benefit, i) => <li key={i}>{benefit}</li>)}
                          {(plan.benefits || []).length > 3 && <li>...e mais.</li>}
                        </ul>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${plan.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {plan.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-2">
                           <Tooltip>
                              <TooltipTrigger asChild>
                                 <Button size="sm" variant="outline" onClick={() => handleEditPlan(plan)}>
                                   <Edit className="w-4 h-4" />
                                 </Button>
                              </TooltipTrigger>
                              <TooltipContent><p>Editar Plano</p></TooltipContent>
                           </Tooltip>
                           {isToggling === plan.id ? (
                              <Loader2 className="w-6 h-6 animate-spin text-primary" />
                           ) : (
                              <Switch checked={plan.is_active} onCheckedChange={() => handleTogglePlan(plan)} />
                           )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </TabsContent>
      <PlanEditModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        plan={selectedPlan}
        onSave={() => {
          handleModalClose();
          refetchData();
        }}
      />
    </>
  );
};

export default PlansTab;
