
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ClientEditModal = ({ client, isOpen, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        email: '',
        plan: 'trial',
        password: '',
    });
    const [isSaving, setIsSaving] = useState(false);

    const isEditing = !!client;

    useEffect(() => {
        if (isOpen) {
            if (isEditing) {
                setFormData({
                    full_name: client.full_name || '',
                    phone: client.phone || '',
                    email: client.email || '',
                    plan: client.plan || 'trial',
                    password: '',
                });
            } else {
                setFormData({
                    full_name: '',
                    phone: '',
                    email: '',
                    plan: 'trial',
                    password: '',
                });
            }
        }
    }, [client, isOpen, isEditing]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (value) => {
        setFormData(prev => ({ ...prev, plan: value }));
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.email || !formData.full_name) {
            toast.error("Nome e E-mail são obrigatórios.");
            return;
        }

        if (!isEditing && !formData.password) {
            toast.error("A senha é obrigatória para novos clientes.");
            return;
        }
        
        setIsSaving(true);
        try {
            await onSave(formData, isEditing ? client.id : null);
            onClose();
        } catch (error) {
            // Toast is handled in context
        } finally {
            setIsSaving(false);
        }
    };


    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Editar Cliente' : 'Adicionar Novo Cliente'}</DialogTitle>
                    <DialogDescription>
                        {isEditing ? 'Altere os detalhes do cliente.' : 'Preencha os detalhes para um novo cliente.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="full_name">Nome Completo</Label>
                            <Input id="full_name" name="full_name" value={formData.full_name} onChange={handleChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">E-mail</Label>
                            <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required disabled={isEditing} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Telefone (com DDI/DDD)</Label>
                            <Input id="phone" name="phone" placeholder="ex: 5511999998888" value={formData.phone} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">{isEditing ? 'Nova Senha (opcional)' : 'Senha'}</Label>
                            <Input id="password" name="password" type="password" value={formData.password} onChange={handleChange} required={!isEditing} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="plan">Plano</Label>
                            <Select onValueChange={handleSelectChange} value={formData.plan}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um plano" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="trial">Trial</SelectItem>
                                    <SelectItem value="premium">Premium</SelectItem>
                                    <SelectItem value="inactive">Inativo</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Salvar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default ClientEditModal;
