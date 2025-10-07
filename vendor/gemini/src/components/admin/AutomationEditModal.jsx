import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, Zap, MessageSquare, Gift, Calendar, BarChart, Bell, Settings } from 'lucide-react';
import { toast } from 'react-hot-toast';

const iconOptions = [
  { value: 'Zap', label: 'Zap', icon: <Zap className="w-4 h-4" /> },
  { value: 'MessageSquare', label: 'Mensagem', icon: <MessageSquare className="w-4 h-4" /> },
  { value: 'Gift', label: 'Presente', icon: <Gift className="w-4 h-4" /> },
  { value: 'Calendar', label: 'Calendário', icon: <Calendar className="w-4 h-4" /> },
  { value: 'BarChart', label: 'Gráfico', icon: <BarChart className="w-4 h-4" /> },
  { value: 'Bell', label: 'Notificação', icon: <Bell className="w-4 h-4" /> },
  { value: 'Settings', label: 'Configuração', icon: <Settings className="w-4 h-4" /> },
];

const AutomationEditModal = ({ isOpen, onClose, automation, onSave }) => {
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    description: '',
    icon: 'Zap',
  });
  const [isLoading, setIsLoading] = useState(false);

  const isEditing = !!automation;

  useEffect(() => {
    if (isOpen) {
      if (isEditing) {
        setFormData({
          id: automation.id || '',
          title: automation.title || '',
          description: automation.description || '',
          icon: automation.icon || 'Zap',
        });
      } else {
        setFormData({
          id: '',
          title: '',
          description: '',
          icon: 'Zap',
        });
      }
    }
  }, [automation, isOpen, isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;
    if (name === 'id') {
      processedValue = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    }
    setFormData((prev) => ({ ...prev, [name]: processedValue }));
  };

  const handleSelectChange = (value) => {
    setFormData((prev) => ({ ...prev, icon: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.id || !formData.title) {
      toast.error("ID da Automação e Título são obrigatórios.");
      return;
    }
    setIsLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      // Error toast is handled by the context
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Automação' : 'Criar Nova Automação'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Altere os detalhes da sua automação.' : 'Preencha os detalhes para uma nova automação.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="id" className="text-right">
                ID
              </Label>
              <Input
                id="id"
                name="id"
                value={formData.id}
                onChange={handleChange}
                className="col-span-3"
                placeholder="ex: welcome_message"
                disabled={isEditing}
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Título
              </Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="col-span-3"
                placeholder="Mensagem de Boas-Vindas"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Descrição
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="col-span-3"
                placeholder="O que esta automação faz?"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="icon" className="text-right">
                Ícone
              </Label>
              <Select onValueChange={handleSelectChange} value={formData.icon}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione um ícone" />
                </SelectTrigger>
                <SelectContent>
                  {iconOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        {opt.icon}
                        <span>{opt.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Salvar Alterações' : 'Criar Automação'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AutomationEditModal;