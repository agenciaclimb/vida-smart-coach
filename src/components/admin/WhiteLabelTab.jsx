import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import { Building, PlusCircle, Search, Edit, ToggleLeft, ToggleRight, Trash2, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/lib/customSupabaseClient';
import AcademyEditModal from '@/components/admin/AcademyEditModal';

const WhiteLabelTab = () => {
  const [academies, setAcademies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAcademy, setSelectedAcademy] = useState(null);
  const [isToggling, setIsToggling] = useState(null);

  const fetchAcademies = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('academies').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setAcademies(data);
    } catch (error) {
      toast.error('Falha ao carregar academias.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAcademies();
  }, [fetchAcademies]);

  const handleToggleStatus = async (academy) => {
    setIsToggling(academy.id);
    const newStatus = academy.status === 'active' ? 'inactive' : 'active';
    try {
      const { error } = await supabase.from('academies').update({ status: newStatus }).eq('id', academy.id);
      if (error) throw error;
      toast.success("Status da academia alterado!");
      fetchAcademies();
    } catch (error) {
      toast.error('Falha ao alterar o status.');
    } finally {
      setIsToggling(null);
    }
  };
  
  const handleEditAcademy = (academy) => {
    setSelectedAcademy(academy);
    setIsModalOpen(true);
  };
  
  const handleAddAcademy = () => {
    setSelectedAcademy(null);
    setIsModalOpen(true);
  };

  const filteredAcademies = academies.filter(ac =>
    ac.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <TabsContent value="whitelabel" className="space-y-6 mt-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold flex items-center"><Building className="mr-2" /> Módulo White Label</h2>
          <div className="flex space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar academia..."
                className="pl-10 w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={handleAddAcademy} className="vida-smart-gradient text-white">
              <PlusCircle className="w-4 h-4 mr-2" />
              Nova Academia
            </Button>
          </div>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Academia</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alunos</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan="4" className="text-center p-4">Carregando...</td></tr>
                ) : (
                  filteredAcademies.map((academy) => (
                    <tr key={academy.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-2xl mr-4">{academy.logo}</div>
                          <div className="text-sm font-medium text-gray-900">{academy.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{academy.clients}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${academy.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {academy.status === 'active' ? 'Ativa' : 'Inativa'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-2">
                           {isToggling === academy.id ? (
                              <Loader2 className="w-6 h-6 animate-spin text-primary" />
                           ) : (
                            <Tooltip><TooltipTrigger asChild>
                              <Button size="sm" variant="outline" onClick={() => handleToggleStatus(academy)}>
                                {academy.status === 'active' ? <ToggleRight className="w-4 h-4 text-green-600" /> : <ToggleLeft className="w-4 h-4 text-gray-500" />}
                              </Button>
                            </TooltipTrigger><TooltipContent><p>{academy.status === 'active' ? 'Desativar' : 'Ativar'}</p></TooltipContent></Tooltip>
                           )}
                          <Tooltip><TooltipTrigger asChild>
                            <Button size="sm" variant="outline" onClick={() => handleEditAcademy(academy)}><Edit className="w-4 h-4" /></Button>
                          </TooltipTrigger><TooltipContent><p>Editar</p></TooltipContent></Tooltip>
                          <Tooltip><TooltipTrigger asChild>
                            <Button size="sm" variant="destructive" onClick={() => toast.error("Função de suspensão pendente.")}><Trash2 className="w-4 h-4" /></Button>
                          </TooltipTrigger><TooltipContent><p>Suspender</p></TooltipContent></Tooltip>
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
       <AcademyEditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        academy={selectedAcademy}
        onSave={() => {
          setIsModalOpen(false);
          fetchAcademies();
        }}
      />
    </>
  );
};

export default WhiteLabelTab;