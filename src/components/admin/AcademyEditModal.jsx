import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';
import { supabase } from '@/core/supabase';
import { Loader2, Save } from 'lucide-react';

const AcademyEditModal = ({ isOpen, onClose, academy, onSave }) => {
    const [name, setName] = useState('');
    const [logo, setLogo] = useState('');
    const [clients, setClients] = useState(0);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (academy) {
            setName(academy.name || '');
            setLogo(academy.logo || '');
            setClients(academy.clients || 0);
        } else {
            setName('');
            setLogo('🏢');
            setClients(0);
        }
    }, [academy, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        const toastId = toast.loading(academy ? 'Atualizando academia...' : 'Criando academia...');

        const academyData = {
            name,
            logo,
            clients: parseInt(clients)
        };

        try {
            let error;
            if (academy) {
                const { error: updateError } = await supabase
                    .from('academies')
                    .update(academyData)
                    .eq('id', academy.id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('academies')
                    .insert(academyData);
                error = insertError;
            }

            if (error) throw error;

            toast.success(academy ? 'Academia atualizada!' : 'Academia criada!', { id: toastId });
            onSave();
            onClose();

        } catch (error) {
            toast.error(`Erro: ${error.message}`, { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{academy ? 'Editar Academia' : 'Adicionar Nova Academia'}</DialogTitle>
                        <DialogDescription>
                            Gerencie os parceiros do seu programa White Label.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="academy-name" className="text-right">Nome</Label>
                            <Input id="academy-name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="academy-logo" className="text-right">Logo (Emoji)</Label>
                            <Input id="academy-logo" value={logo} onChange={(e) => setLogo(e.target.value)} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="academy-clients" className="text-right">Clientes</Label>
                            <Input id="academy-clients" type="number" value={clients} onChange={(e) => setClients(e.target.value)} className="col-span-3" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>Cancelar</Button>
                        <Button type="submit" className="vida-smart-gradient text-white" disabled={isSaving}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Salvar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AcademyEditModal;
