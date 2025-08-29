
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/customSupabaseClient';

const RewardEditModal = ({ reward, isOpen, onClose, onRewardUpdate }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    points: '',
    icon: '',
    is_active: true,
  });

  useEffect(() => {
    if (reward) {
      setFormData({
        name: reward.name || '',
        description: reward.description || '',
        points: reward.points || '',
        icon: reward.icon || '',
        is_active: reward.is_active,
      });
    }
  }, [reward]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSwitchChange = (checked) => {
    setFormData((prev) => ({ ...prev, is_active: checked }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reward) return;

    setIsSubmitting(true);
    const toastId = toast.loading('Atualizando recompensa...');

    try {
      const { data, error } = await supabase
        .from('rewards')
        .update({
          name: formData.name,
          description: formData.description,
          points: parseInt(formData.points, 10),
          icon: formData.icon,
          is_active: formData.is_active,
        })
        .eq('id', reward.id)
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Recompensa atualizada com sucesso!', { id: toastId });
      onRewardUpdate(data);
      onClose();
    } catch (error) {
      toast.error(`Falha ao atualizar recompensa: ${error.message}`, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!reward) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Recompensa</DialogTitle>
          <DialogDescription>
            Ajuste os detalhes da recompensa. Mudanças serão refletidas para todos os usuários.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nome
              </Label>
              <Input id="name" value={formData.name} onChange={handleChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Descrição
              </Label>
              <Input id="description" value={formData.description} onChange={handleChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="points" className="text-right">
                Pontos
              </Label>
              <Input id="points" type="number" value={formData.points} onChange={handleChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="icon" className="text-right">
                Ícone
              </Label>
              <Input id="icon" value={formData.icon} onChange={handleChange} className="col-span-3" />
            </div>
            <div className="flex items-center space-x-2 justify-end col-span-4 pr-4">
              <Label htmlFor="is_active">Status</Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={handleSwitchChange}
              />
               <span className={formData.is_active ? 'text-green-600' : 'text-red-600'}>
                {formData.is_active ? 'Ativo' : 'Inativo'}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" className="vida-smart-gradient" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RewardEditModal;
