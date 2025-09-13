
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAdmin } from '@/contexts/data/AdminContext';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Zap, PlusCircle, Edit } from 'lucide-react';
import AutomationEditModal from './AutomationEditModal';
import { TabsContent } from '@/components/ui/tabs';

const AutomationItem = ({ automation, onToggle, onEdit }) => {
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async (checked) => {
    setIsToggling(true);
    try {
      await onToggle(automation.id, checked);
    } catch (e) {
      // toast is shown in context
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-center space-x-4">
        <div className="p-2 bg-primary/10 rounded-full">
          <Zap className="w-5 h-5 text-primary" />
        </div>
        <div>
          <Label htmlFor={`automation-${automation.id}`} className="font-semibold text-lg cursor-pointer">
            {automation.title}
          </Label>
          <p className="text-sm text-muted-foreground">{automation.description}</p>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={() => onEdit(automation)}>
          <Edit className="w-4 h-4" />
        </Button>
        <div className="flex items-center space-x-2">
            {isToggling && <Loader2 className="w-4 h-4 animate-spin" />}
            <Switch
            id={`automation-${automation.id}`}
            checked={automation.is_active}
            onCheckedChange={handleToggle}
            disabled={isToggling}
            />
        </div>
      </div>
    </motion.div>
  );
};


const AutomationsTab = () => {
  const { automations, loadingAutomations, updateAutomationStatus, saveAutomation } = useAdmin();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState(null);

  const handleCreateNew = () => {
    setEditingAutomation(null);
    setIsModalOpen(true);
  };

  const handleEdit = (automation) => {
    setEditingAutomation(automation);
    setIsModalOpen(true);
  };
  
  const handleSave = async (data) => {
    await saveAutomation(data);
    setIsModalOpen(false);
    setEditingAutomation(null);
  };

  if (loadingAutomations) {
    return (
      <TabsContent value="automations" className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </TabsContent>
    );
  }

  return (
    <>
      <AutomationEditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        automation={editingAutomation}
        onSave={handleSave}
      />
      <TabsContent value="automations" className="mt-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Gerenciar Automações</CardTitle>
                  <CardDescription>
                    Ative, desative ou edite as mensagens automáticas enviadas aos seus clientes.
                  </CardDescription>
                </div>
                <Button onClick={handleCreateNew}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Criar Automação
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {automations.length > 0 ? (
                  automations.map(automation => (
                    <AutomationItem 
                      key={automation.id} 
                      automation={automation}
                      onToggle={updateAutomationStatus}
                      onEdit={handleEdit}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Nenhuma automação encontrada.</p>
                    <p className="text-sm">Clique em "Criar Automação" para começar.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </TabsContent>
    </>
  );
};

export default AutomationsTab;
