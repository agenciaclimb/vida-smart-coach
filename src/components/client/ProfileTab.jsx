import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from "@/components/ui/switch";
import { useAuth } from '@/components/auth/AuthProvider';
import { toast } from 'react-hot-toast';
import { Save, Loader2, User, Bot, Bell, Smile, Zap, BrainCircuit, VenetianMask, Sparkles, Trophy, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/core/supabase';
import { useGamification } from '@/contexts/data/GamificationContext';
import { debugLog, validateProfileData, trackError } from '@/utils/debugHelpers';
import { ACTIVITY_LEVEL_OPTIONS, normalizeActivityLevel } from '@/domain/profile/activityLevels';
import { GOAL_TYPE_OPTIONS, normalizeGoalType } from '@/domain/profile/goalTypes';

const ProfileInput = ({ id, label, type, value, onChange, placeholder, step }) => (
    <div className="space-y-2">
        <Label htmlFor={id}>{label}</Label>
        <Input
            id={id}
            type={type}
            step={step}
            value={value || ''}
            onChange={onChange}
            placeholder={placeholder}
            className="bg-gray-50"
        />
    </div>
);

const ProfileTab = () => {
    const { user, updateUserProfile, loading: authLoading } = useAuth();
    const { achievements, userAchievements, loading: gamificationLoading } = useGamification();
    const [formData, setFormData] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [isSavingDiagnostics, setIsSavingDiagnostics] = useState(false);

    // Questionário 4 pilares (beta)
    const [diag, setDiag] = useState({
        physical: { frequency: '', challenge: '', goal: '' },
        nutrition: { frequency: '', challenge: '', goal: '' },
        emotional: { frequency: '', challenge: '', goal: '' },
        spiritual: { frequency: '', challenge: '', goal: '' },
    });

    const aiPersonalities = [
        { name: "Amigável", icon: <Smile className="w-5 h-5" /> },
        { name: "Energética", icon: <Zap className="w-5 h-5" /> },
        { name: "Zen", icon: <Sparkles className="w-5 h-5" /> },
        { name: "Inteligente", icon: <BrainCircuit className="w-5 h-5" /> },
        { name: "Criativa", icon: <VenetianMask className="w-5 h-5" /> },
    ];

    useEffect(() => {
        const profileData = user?.profile || {};
        const normalizedData = {
            ...profileData,
            activity_level: normalizeActivityLevel(profileData.activity_level) ?? 'sedentary',
            goal_type: normalizeGoalType(profileData.goal_type) ?? 'general_health',
            wants_reminders: profileData.wants_reminders ?? false,
            wants_quotes: profileData.wants_quotes ?? false,
        };
        setFormData(normalizedData);
    }, [user]);

    const handleChange = (e) => {
        const { id, value } = e.target;
        const isNumeric = ['current_weight', 'target_weight', 'height', 'age'].includes(id);
        setFormData(prev => ({
            ...prev,
            [id]: isNumeric ? (value === '' ? null : parseFloat(value)) : value
        }));
    };

    const handleSwitchChange = (id, checked) => {
        setFormData(prev => ({ ...prev, [id]: checked }));
    };
    const setDiagField = (area, field, value) => {
        setDiag(prev => ({ ...prev, [area]: { ...prev[area], [field]: value } }));
    };

    const saveDiagnostics = async () => {
        if (!user?.id) return;
        setIsSavingDiagnostics(true);
        const toastId = toast.loading('Salvando questionário 4 pilares...');
        try {
            const entries = [
                { area: 'physical', diagKey: 'physical', label: 'Física' },
                { area: 'nutritional', diagKey: 'nutrition', label: 'Alimentar' },
                { area: 'emotional', diagKey: 'emotional', label: 'Emocional' },
                { area: 'spiritual', diagKey: 'spiritual', label: 'Espiritual' },
            ];
            
            for (const e of entries) {
                const diagData = diag[e.diagKey];
                if (!diagData) continue;
                
                const payload = {
                    user_id: user.id,
                    area: e.area,
                    current_state: {
                        frequency: diagData.frequency || null,
                    },
                    pain_points: diagData.challenge ? [diagData.challenge] : [],
                    goals: diagData.goal ? [diagData.goal] : [],
                    score: null,
                };
                
                console.log('Saving diagnostics for', e.area, payload);
                
                // upsert by (user_id, area)
                const { error } = await supabase
                  .from('area_diagnostics')
                  .upsert(payload, { onConflict: 'user_id,area' });
                  
                if (error) {
                    console.error('area_diagnostics upsert error', e.area, error);
                    throw error;
                }
            }
            toast.success('Questionário salvo! Isso ajuda a IA a personalizar seu plano.', { id: toastId });
        } catch (err) {
            console.error('saveDiagnostics error', err);
            toast.error('Erro ao salvar questionário: ' + err.message, { id: toastId });
        } finally {
            setIsSavingDiagnostics(false);
        }
    };
    
    const handleUnsupportedFeature = () => {
      toast("🚧 Esta funcionalidade ainda não foi implementada—mas não se preocupe! Você pode solicitá-la no seu próximo prompt! 🚀", {
        icon: '🚀',
        duration: 5000,
    });
  }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        
        try {
            const { 
                full_name, phone, age, height, current_weight, target_weight, 
                gender, activity_level, goal_type, wants_reminders, wants_quotes
            } = formData;
            
            const rawLevel = formData.activity_level ?? (formData.activityLevel ?? user?.profile?.activity_level);
            const rawGoal = formData.goal_type ?? (formData.goalType ?? user?.profile?.goal_type);
            
            const activityLevel = normalizeActivityLevel(rawLevel);
            const goalType = normalizeGoalType(rawGoal);

            if (!activityLevel) {
                toast.error('Selecione um nível de atividade válido.');
                return;
            }

            if (!goalType) {
                toast.error('Selecione um objetivo válido.');
                return;
            }

            const profileData = {
                full_name: full_name?.trim() || '',
                name: full_name?.trim() || '',
                phone: phone?.trim() || null,
                age: age ? parseInt(age) : null,
                height: height ? parseInt(height) : null,
                current_weight: current_weight ? parseFloat(current_weight) : null,
                target_weight: target_weight ? parseFloat(target_weight) : null,
                gender: gender || null,
                activity_level: activityLevel,
                goal_type: goalType,
                wants_reminders: wants_reminders,
                wants_quotes: wants_quotes,
            };
            
            const validation = validateProfileData(profileData);
            if (!validation.isValid) {
                validation.errors.forEach(error => toast.error(error));
                debugLog('Profile Validation Failed', { formData, profileData, errors: validation.errors });
                return;
            }
            
            debugLog('Profile Save Started', { user: user?.id, profileData });
            
            const result = await updateUserProfile(profileData);
            
            if (result) {
                toast.success('Perfil e configurações atualizados com sucesso!');
                debugLog('Profile Save Success', { result });
            } else {
                throw new Error('Nenhum dado foi retornado do servidor');
            }
            
        } catch (error) {
            debugLog('Profile Save Error', { user: user?.id, formData }, error);
            trackError('ProfileTab.handleSubmit', error, { 
                userId: user?.id, 
                formData: Object.keys(formData) 
            });
            toast.error('Erro ao atualizar perfil: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    // =============== UI AUX: GRID DE BADGES ===============
    const earnedMap = new Set((userAchievements || []).map((ua) => ua.achievement_id || ua.achievements?.id));
    const unlocked = (userAchievements || []).slice(0, 12);
    const locked = (achievements || []).filter(a => !earnedMap.has(a.id)).slice(0, 12);

    const BadgeItem = ({ icon, label, description, locked, progressPercent }) => (
        <Tooltip>
            <TooltipTrigger asChild>
                <div className={`flex flex-col items-center justify-center rounded-lg border p-3 text-center h-28 w-full ${locked ? 'bg-gray-50 opacity-70' : 'bg-white hover:shadow-sm'} `}>
                    <div className={`text-2xl ${locked ? 'text-gray-400' : 'text-amber-600'}`}>{icon}</div>
                    <div className={`mt-1 text-sm font-medium ${locked ? 'text-gray-500' : 'text-gray-800'}`}>{label}</div>
                    <div className="text-xs text-gray-500 line-clamp-1">{description}</div>
                    {typeof progressPercent === 'number' && !Number.isNaN(progressPercent) && (
                        <div className="w-full mt-2">
                            <Progress value={Math.max(0, Math.min(100, progressPercent))} />
                        </div>
                    )}
                </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
                <p className="text-sm">{description || 'Conquista do seu progresso no Vida Smart.'}</p>
            </TooltipContent>
        </Tooltip>
    );
    
    if (!user?.id || authLoading) {
        return (
            <TabsContent value="profile" className="mt-6">
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>Carregando...</CardTitle>
                        <CardDescription>Aguarde enquanto carregamos seus dados.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center items-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </CardContent>
                </Card>
            </TabsContent>
        );
    }

    const profileExists = user?.profile && Object.keys(user.profile).length > 0;

    return (
        <TabsContent value="profile" className="mt-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <form onSubmit={handleSubmit} className="space-y-8">
                    <Card className="shadow-lg transition-all duration-300 hover:shadow-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center"><User className="w-6 h-6 mr-3" />{profileExists ? 'Meu Perfil' : 'Complete seu Perfil'}</CardTitle>
                            <CardDescription>
                                {profileExists 
                                    ? 'Mantenha seus dados sempre atualizados para uma experiência personalizada.'
                                    : 'Adicione suas informações para personalizar sua experiência no Vida Smart.'
                                }
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <ProfileInput id="full_name" label="Nome Completo *" type="text" value={formData.full_name} onChange={handleChange} placeholder="Seu nome completo" />
                                <ProfileInput id="phone" label="WhatsApp" type="tel" value={formData.phone} onChange={handleChange} placeholder="11999998888" />
                                <ProfileInput id="age" label="Idade" type="number" value={formData.age} onChange={handleChange} placeholder="Ex: 30" />
                                <ProfileInput id="height" label="Altura (cm) *" type="number" value={formData.height} onChange={handleChange} placeholder="Ex: 175" />
                                <ProfileInput id="current_weight" label="Peso Atual (kg) *" type="number" step="0.1" value={formData.current_weight} onChange={handleChange} placeholder="Ex: 75.5" />
                                <ProfileInput id="target_weight" label="Peso Meta (kg)" type="number" step="0.1" value={formData.target_weight} onChange={handleChange} placeholder="Ex: 70.0" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="gender">Gênero</Label>
                                    <Select onValueChange={(value) => setFormData(prev => ({...prev, gender: value}))} value={formData.gender || ''}>
                                        <SelectTrigger><SelectValue placeholder="Selecione seu gênero" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="masculino">Masculino</SelectItem>
                                            <SelectItem value="feminino">Feminino</SelectItem>
                                            <SelectItem value="outro">Outro</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="activity_level">Nível de Atividade *</Label>
                                    <Select onValueChange={(value) => setFormData(prev => ({...prev, activity_level: normalizeActivityLevel(value) || 'sedentary'}))} value={formData.activity_level || ''} required>
                                        <SelectTrigger><SelectValue placeholder="Selecione seu nível" /></SelectTrigger>
                                        <SelectContent>
                                            {ACTIVITY_LEVEL_OPTIONS.map(option => (<SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="goal_type">Objetivo Principal *</Label>
                                <Select onValueChange={(value) => setFormData(prev => ({...prev, goal_type: normalizeGoalType(value) || 'general_health'}))} value={formData.goal_type || ''} required>
                                    <SelectTrigger><SelectValue placeholder="Qual seu objetivo principal?" /></SelectTrigger>
                                    <SelectContent>
                                        {GOAL_TYPE_OPTIONS.map(option => (<SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Questionário 4 Pilares (Beta) */}
                    <Card className="shadow-lg transition-all duration-300 hover:shadow-xl">
                        <CardHeader>
                            <CardTitle>Questionário 4 Pilares (beta)</CardTitle>
                            <CardDescription>Responda rapidamente para personalizar seu plano nas áreas Física, Alimentar, Emocional e Espiritual.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Física */}
                            <div className="space-y-3">
                                <h4 className="font-medium">🏋️ Física</h4>
                                <Input placeholder="Frequência semanal de exercícios (ex: 3x)" value={diag.physical.frequency} onChange={(e)=>setDiagField('physical','frequency',e.target.value)} />
                                <Input placeholder="Maior desafio físico hoje" value={diag.physical.challenge} onChange={(e)=>setDiagField('physical','challenge',e.target.value)} />
                                <Input placeholder="Objetivo físico principal" value={diag.physical.goal} onChange={(e)=>setDiagField('physical','goal',e.target.value)} />
                            </div>
                            {/* Alimentar */}
                            <div className="space-y-3">
                                <h4 className="font-medium">🥗 Alimentar</h4>
                                <Input placeholder="Frequência de refeições equilibradas (ex: 2 por dia)" value={diag.nutrition.frequency} onChange={(e)=>setDiagField('nutrition','frequency',e.target.value)} />
                                <Input placeholder="Maior desafio alimentar hoje" value={diag.nutrition.challenge} onChange={(e)=>setDiagField('nutrition','challenge',e.target.value)} />
                                <Input placeholder="Objetivo alimentar principal" value={diag.nutrition.goal} onChange={(e)=>setDiagField('nutrition','goal',e.target.value)} />
                            </div>
                            {/* Emocional */}
                            <div className="space-y-3">
                                <h4 className="font-medium">🧠 Emocional</h4>
                                <Input placeholder="Frequência de estresse/ansiedade (ex: 2x/semana)" value={diag.emotional.frequency} onChange={(e)=>setDiagField('emotional','frequency',e.target.value)} />
                                <Input placeholder="Maior desafio emocional hoje" value={diag.emotional.challenge} onChange={(e)=>setDiagField('emotional','challenge',e.target.value)} />
                                <Input placeholder="Objetivo emocional principal" value={diag.emotional.goal} onChange={(e)=>setDiagField('emotional','goal',e.target.value)} />
                            </div>
                            {/* Espiritual */}
                            <div className="space-y-3">
                                <h4 className="font-medium">✨ Espiritual</h4>
                                <Input placeholder="Frequência de práticas (ex: meditação 10min/dia)" value={diag.spiritual.frequency} onChange={(e)=>setDiagField('spiritual','frequency',e.target.value)} />
                                <Input placeholder="Maior desafio espiritual hoje" value={diag.spiritual.challenge} onChange={(e)=>setDiagField('spiritual','challenge',e.target.value)} />
                                <Input placeholder="Objetivo espiritual principal" value={diag.spiritual.goal} onChange={(e)=>setDiagField('spiritual','goal',e.target.value)} />
                            </div>
                            <div className="flex justify-end">
                                <Button type="button" onClick={saveDiagnostics} disabled={isSavingDiagnostics} className="vida-smart-gradient text-white">
                                    {isSavingDiagnostics ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Salvar Questionário
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg transition-all duration-300 hover:shadow-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center"><Bot className="w-6 h-6 mr-3" />Preferências da IA</CardTitle>
                            <CardDescription>Personalize como você interage com sua Coach de IA.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                             <div className="space-y-2">
                                <Label>Personalidade da IA</Label>
                                <Select defaultValue="Amigável" onValueChange={handleUnsupportedFeature}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione uma personalidade" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {aiPersonalities.map(p => (
                                            <SelectItem key={p.name} value={p.name}>
                                                <div className="flex items-center">{p.icon}<span className="ml-2">{p.name}</span></div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg transition-all duration-300 hover:shadow-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center"><Bell className="w-6 h-6 mr-3" />Notificações</CardTitle>
                            <CardDescription>Gerencie os lembretes e mensagens que você recebe.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <Label htmlFor="wants_reminders">Lembretes e Check-ins</Label>
                                <Switch id="wants_reminders" checked={formData.wants_reminders} onCheckedChange={(checked) => handleSwitchChange('wants_reminders', checked)} />
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <Label htmlFor="wants_quotes">Frases Motivacionais</Label>
                                <Switch id="wants_quotes" checked={formData.wants_quotes} onCheckedChange={(checked) => handleSwitchChange('wants_quotes', checked)}/>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Minhas Conquistas (Badges) */}
                    <Card className="shadow-lg transition-all duration-300 hover:shadow-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center"><Trophy className="w-6 h-6 mr-3 text-amber-600" />Minhas Conquistas</CardTitle>
                            <CardDescription>Desbloqueie badges completando hábitos e metas diárias.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {gamificationLoading ? (
                                <div className="flex justify-center items-center py-6">
                                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <div className="text-sm font-semibold mb-2">Desbloqueadas ({unlocked?.length || 0})</div>
                                        {unlocked && unlocked.length > 0 ? (
                                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                                                {unlocked.map((ua, idx) => {
                                                    const prog = ua?.progress || ua?.achievements?.progress || null;
                                                    let percent = null;
                                                    if (prog && typeof prog.percent !== 'undefined') {
                                                        const p = Number(prog.percent);
                                                        percent = Number.isFinite(p) ? p : null;
                                                    } else if (prog && typeof prog.current !== 'undefined' && typeof prog.target !== 'undefined') {
                                                        const cur = Number(prog.current);
                                                        const tgt = Number(prog.target);
                                                        percent = Number.isFinite(cur) && Number.isFinite(tgt) && tgt > 0 ? (cur / tgt) * 100 : null;
                                                    }
                                                    return (
                                                        <BadgeItem
                                                            key={`u-${ua?.achievement_id || ua?.achievements?.id || idx}`}
                                                            icon={<Trophy className="w-6 h-6" />}
                                                            label={ua?.achievements?.name || ua?.achievements?.title || ua?.title || 'Conquista'}
                                                            description={ua?.achievements?.description || ua?.description || ''}
                                                            locked={false}
                                                            progressPercent={percent}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="text-xs text-gray-500">Você ainda não desbloqueou conquistas. Complete hábitos para ganhar suas primeiras badges!</div>
                                        )}
                                    </div>

                                    <div className="pt-2">
                                        <div className="text-sm font-semibold mb-2">Bloqueadas ({locked?.length || 0})</div>
                                        {locked && locked.length > 0 ? (
                                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                                                {locked.map((a) => (
                                                    <BadgeItem
                                                        key={`l-${a.id}`}
                                                        icon={<Lock className="w-6 h-6" />}
                                                        label={a?.title || 'Badge' }
                                                        description={a?.description || ''}
                                                        locked
                                                    />
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-xs text-gray-500">Parabéns! Você já desbloqueou todas as conquistas atuais.</div>
                                        )}
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                    
                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={isSaving} className="vida-smart-gradient text-white">
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            {profileExists ? 'Salvar Alterações' : 'Criar Perfil e Salvar'}
                        </Button>
                    </div>
                </form>
            </motion.div>
        </TabsContent>
    );
};

export default ProfileTab;