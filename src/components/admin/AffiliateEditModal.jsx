
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const AffiliateEditModal = ({ affiliate, isOpen, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
    });
    const [isSaving, setIsSaving] = useState(false);

    const isEditing = !!affiliate;

    useEffect(() => {
        if (isOpen) {
            if (isEditing) {
                setFormData({
                    full_name: affiliate.full_name || '',
                    email: affiliate.email || '',
                    password: '',
                });
            } else {
                setFormData({
                    full_name: '',
                    email: '',
                    password: '',
                });
            }
        }
    }, [affiliate, isOpen, isEditing]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.email || !formData.full_name) {
            toast.error("Nome e E-mail são obrigatórios.");
            return;
        }

        if (!isEditing && !formData.password) {
            toast.error("A senha é obrigatória para novos afiliados.");
            return;
        }
        
        setIsSaving(true);
        try {
            await onSave(formData, isEditing ? affiliate.id : null);
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
                    <DialogTitle>{isEditing ? 'Editar Afiliado' : 'Adicionar Novo Afiliado'}</DialogTitle>
                    <DialogDescription>
                        {isEditing ? 'Altere os detalhes do afiliado.' : 'Preencha os detalhes para um novo afiliado.'}
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
                            <Label htmlFor="password">{isEditing ? 'Nova Senha (opcional)' : 'Senha'}</Label>
                            <Input id="password" name="password" type="password" value={formData.password} onChange={handleChange} required={!isEditing} />
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

export default AffiliateEditModal;
