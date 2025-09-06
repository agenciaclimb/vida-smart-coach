
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';
import { supabase } from '../../core/supabase';
import { Loader2, Save } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const initialFeatures = {
    ia_coach_access: false,
    training_plan_update: "none",
    meal_plan_update: "none",
    habit_tracking: false,
    points_system: false,
    community_access: false,
    progress_charts: false,
    google_calendar_integration: false,
    achievements_system: false,
    monthly_challenges: false,
    daily_monitoring: false,
    smart_alerts: false,
    group_consulting: false,
    exclusive_sweepstakes: false,
    early_access: false,
    referral_commission_tier1: 0,
    referral_commission_tier2: 0,
    referral_commission_tier3: 0,
};

const PlanEditModal = ({ isOpen, onClose, plan, onSave }) => {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [benefits, setBenefits] = useState('');
    const [stripePriceId, setStripePriceId] = useState('');
    const [features, setFeatures] = useState(initialFeatures);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (plan) {
            setName(plan.name || '');
            setPrice(plan.price || '');
            setBenefits((plan.benefits || []).join('\n'));
            setStripePriceId(plan.stripe_price_id || '');
            setFeatures({ 
                ...initialFeatures, 
                ...(plan.features || {}),
                referral_commission_tier1: (plan.features?.referral_commission_tier1 || 0),
                referral_commission_tier2: (plan.features?.referral_commission_tier2 || 0),
                referral_commission_tier3: (plan.features?.referral_commission_tier3 || 0),
            });
        } else {
            setName('');
            setPrice('');
            setBenefits('');
            setStripePriceId('');
            setFeatures(initialFeatures);
        }
    }, [plan, isOpen]);

    const handleFeatureToggle = (featureKey) => {
        setFeatures(prev => ({ ...prev, [featureKey]: !prev[featureKey] }));
    };
    
    const handleFeatureChange = (featureKey, value) => {
        setFeatures(prev => ({ ...prev, [featureKey]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        const toastId = toast.loading(plan ? 'Atualizando plano...' : 'Criando plano...');
        
        const benefitsArray = benefits.split('\n').map(b => b.trim()).filter(b => b);

        const planData = {
            name,
            price: parseFloat(price),
            benefits: benefitsArray,
            stripe_price_id: stripePriceId,
            features: {
                ...features,
                referral_commission_tier1: parseFloat(features.referral_commission_tier1) || 0,
                referral_commission_tier2: parseFloat(features.referral_commission_tier2) || 0,
                referral_commission_tier3: parseFloat(features.referral_commission_tier3) || 0,
            },
        };

        try {
            let error;
            if (plan) {
                const { error: updateError } = await supabase
                    .from('plans')
                    .update(planData)
                    .eq('id', plan.id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('plans')
                    .insert({ ...planData, is_active: true, trial_days: 7 });
                error = insertError;
            }

            if (error) throw error;
            
            toast.success(plan ? 'Plano atualizado com sucesso!' : 'Plano criado com sucesso!', { id: toastId });
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
            <DialogContent className="sm:max-w-2xl">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{plan ? 'Editar Plano' : 'Criar Novo Plano'}</DialogTitle>
                        <DialogDescription>
                            {plan ? 'Faça alterações no plano existente.' : 'Preencha os detalhes para um novo plano.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 max-h-[70vh] overflow-y-auto pr-2">
                        <div className="space-y-4">
                             <div>
                                <Label htmlFor="name">Nome</Label>
                                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                            </div>
                            <div>
                                <Label htmlFor="price">Preço (R$)</Label>
                                <Input id="price" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />
                            </div>
                             <div>
                                <Label htmlFor="stripe_price_id">Stripe Price ID</Label>
                                <Input id="stripe_price_id" placeholder="price_..." value={stripePriceId} onChange={(e) => setStripePriceId(e.target.value)} />
                            </div>
                            <div>
                                <Label htmlFor="benefits">Benefícios (um por linha)</Label>
                                <Textarea id="benefits" placeholder="Benefício 1&#10;Benefício 2" value={benefits} onChange={(e) => setBenefits(e.target.value)} rows={8} />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="font-semibold text-base">Funcionalidades</h4>
                            <div className="space-y-2 rounded-md border p-4">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="ia_coach_access" className="font-normal">Acesso IA Coach</Label>
                                    <Switch id="ia_coach_access" checked={features.ia_coach_access} onCheckedChange={() => handleFeatureToggle('ia_coach_access')} />
                                </div>
                                <div>
                                    <Label>Atualização do Treino</Label>
                                    <Select value={features.training_plan_update} onValueChange={(v) => handleFeatureChange('training_plan_update', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Nenhuma</SelectItem>
                                            <SelectItem value="monthly">Mensal</SelectItem>
                                            <SelectItem value="weekly">Semanal</SelectItem>
                                            <SelectItem value="3_days">A cada 3 dias</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="progress_charts" className="font-normal">Gráficos de Progresso</Label>
                                    <Switch id="progress_charts" checked={features.progress_charts} onCheckedChange={() => handleFeatureToggle('progress_charts')} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="community_access" className="font-normal">Acesso à Comunidade</Label>
                                    <Switch id="community_access" checked={features.community_access} onCheckedChange={() => handleFeatureToggle('community_access')} />
                                </div>
                                <h4 className="font-semibold text-sm pt-2">Comissões de Indicação</h4>
                                 <div className="grid grid-cols-3 gap-2">
                                     <div>
                                         <Label htmlFor="ref1">Nível 1 (%)</Label>
                                         <Input id="ref1" type="number" value={features.referral_commission_tier1 * 100} onChange={e => handleFeatureChange('referral_commission_tier1', parseFloat(e.target.value) / 100 || 0)} />
                                     </div>
                                      <div>
                                         <Label htmlFor="ref2">Nível 2 (%)</Label>
                                         <Input id="ref2" type="number" value={features.referral_commission_tier2 * 100} onChange={e => handleFeatureChange('referral_commission_tier2', parseFloat(e.target.value) / 100 || 0)} />
                                     </div>
                                      <div>
                                         <Label htmlFor="ref3">Nível 3 (%)</Label>
                                         <Input id="ref3" type="number" value={features.referral_commission_tier3 * 100} onChange={e => handleFeatureChange('referral_commission_tier3', parseFloat(e.target.value) / 100 || 0)} />
                                     </div>
                                 </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="mt-4 pt-4 border-t">
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

export default PlanEditModal;
