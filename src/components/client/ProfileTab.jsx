import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/components/auth/AuthProvider';
import { toast } from 'react-hot-toast';
import { Save, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
    const [formData, setFormData] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        // Sempre inicializa o formulário, mesmo se o perfil estiver vazio
        const profileData = user?.profile || {};
        
        // Normalizar os campos de select para usar slugs corretos - OBRIGATÓRIO
        const normalizedData = {
            ...profileData,
            activity_level: normalizeActivityLevel(profileData.activity_level) ?? 'sedentary',
            goal_type: normalizeGoalType(profileData.goal_type) ?? 'general_health'
        };
        
        setFormData(normalizedData);
    }, [user]);

    const handleChange = (e) => {
        const { id, value } = e.target;
        const isNumeric = ['current_weight', 'target_weight', 'height'].includes(id);
        setFormData(prev => ({
            ...prev,
            [id]: isNumeric ? (value === '' ? null : parseFloat(value)) : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        
        try {
            // Validate required fields
            const { 
                full_name, phone, age, height, current_weight, target_weight, 
                gender, activity_level, goal_type 
            } = formData;
            
            // BLINDAGEM CRÍTICA: Normalizar e validar slugs antes de enviar
            const rawLevel = formData.activity_level ?? (formData.activityLevel ?? user?.profile?.activity_level);
            const rawGoal = formData.goal_type ?? (formData.goalType ?? user?.profile?.goal_type);
            
            const activityLevel = normalizeActivityLevel(rawLevel);
            const goalType = normalizeGoalType(rawGoal);

            // Bloquear submit se valores inválidos
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
                name: full_name?.trim() || '', // Garante compatibilidade com diferentes campos de nome
                phone: phone?.trim() || null,
                age: age ? parseInt(age) : null,
                height: height ? parseInt(height) : null,
                current_weight: current_weight ? parseFloat(current_weight) : null,
                target_weight: target_weight ? parseFloat(target_weight) : null,
                gender: gender || null,
                activity_level: activityLevel, // SEMPRE slug válido
                goal_type: goalType // SEMPRE slug válido
            };
            
            // LOG para debug - verificar que está enviando slugs
            console.log('🔍 Payload antes do upsert:', {
                activity_level: profileData.activity_level,
                goal_type: profileData.goal_type
            });
            
            // Enhanced validation
            const validation = validateProfileData(profileData);
            if (!validation.isValid) {
                validation.errors.forEach(error => toast.error(error));
                debugLog('Profile Validation Failed', { formData, profileData, errors: validation.errors });
                return;
            }
            
            debugLog('Profile Save Started', { user: user?.id, profileData });
            
            const result = await updateUserProfile(profileData);
            
            if (result) {
                toast.success('Perfil atualizado com sucesso!');
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
    
    // Se não tem usuário autenticado
    if (!user?.id) {
        return (
            <TabsContent value="profile" className="mt-6">
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </TabsContent>
        );
    }

    // Se ainda está carregando autenticação
    if (authLoading) {
        return (
            <TabsContent value="profile" className="mt-6">
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>Carregando Perfil...</CardTitle>
                        <CardDescription>Aguarde enquanto carregamos seus dados.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center items-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </CardContent>
                </Card>
            </TabsContent>
        );
    }

    // Se não tem perfil, inicializa com dados vazios para permitir criação
    const profileExists = user?.profile && Object.keys(user.profile).length > 0;

    return (
        <TabsContent value="profile" className="mt-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Card className="shadow-lg transition-all duration-300 hover:shadow-xl">
                    <CardHeader>
                        <CardTitle>
                            {profileExists ? 'Meu Perfil' : 'Complete seu Perfil'}
                        </CardTitle>
                        <CardDescription>
                            {profileExists 
                                ? 'Mantenha seus dados sempre atualizados para uma experiência personalizada.'
                                : 'Adicione suas informações para personalizar sua experiência no Vida Smart.'
                            }
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <ProfileInput
                                    id="full_name"
                                    label="Nome Completo *"
                                    type="text"
                                    value={formData.full_name}
                                    onChange={handleChange}
                                    placeholder="Seu nome completo"
                                />
                                <ProfileInput
                                    id="phone"
                                    label="WhatsApp"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="11999998888"
                                />
                                <ProfileInput
                                    id="age"
                                    label="Idade"
                                    type="number"
                                    value={formData.age}
                                    onChange={handleChange}
                                    placeholder="Ex: 30"
                                />
                                <ProfileInput
                                    id="height"
                                    label="Altura (cm) *"
                                    type="number"
                                    value={formData.height}
                                    onChange={handleChange}
                                    placeholder="Ex: 175"
                                />
                                <ProfileInput
                                    id="current_weight"
                                    label="Peso Atual (kg) *"
                                    type="number"
                                    step="0.1"
                                    value={formData.current_weight}
                                    onChange={handleChange}
                                    placeholder="Ex: 75.5"
                                />
                                <ProfileInput
                                    id="target_weight"
                                    label="Peso Meta (kg)"
                                    type="number"
                                    step="0.1"
                                    value={formData.target_weight}
                                    onChange={handleChange}
                                    placeholder="Ex: 70.0"
                                />
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="gender">Gênero</Label>
                                    <Select onValueChange={(value) => setFormData(prev => ({...prev, gender: value}))} value={formData.gender || ''}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione seu gênero" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="masculino">Masculino</SelectItem>
                                            <SelectItem value="feminino">Feminino</SelectItem>
                                            <SelectItem value="outro">Outro</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="activity_level">Nível de Atividade *</Label>
                                    <Select 
                                        onValueChange={(value) => {
                                            // GARANTIR que apenas slugs entram no estado
                                            const normalizedValue = normalizeActivityLevel(value);
                                            setFormData(prev => ({...prev, activity_level: normalizedValue || 'sedentary'}));
                                        }} 
                                        value={formData.activity_level || ''}
                                        required
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione seu nível" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ACTIVITY_LEVEL_OPTIONS.map(option => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="goal_type">Objetivo Principal *</Label>
                                <Select 
                                    onValueChange={(value) => {
                                        // GARANTIR que apenas slugs entram no estado
                                        const normalizedValue = normalizeGoalType(value);
                                        setFormData(prev => ({...prev, goal_type: normalizedValue || 'general_health'}));
                                    }} 
                                    value={formData.goal_type || ''}
                                    required
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Qual seu objetivo principal?" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {GOAL_TYPE_OPTIONS.map(option => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-blue-800 text-sm">
                                    💡 <strong>Importante:</strong> Essas informações são essenciais para criar seu plano personalizado 
                                    e acompanhar sua evolução. Campos marcados com * são obrigatórios.
                                </p>
                            </div>
                            
                            {!profileExists && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <p className="text-blue-800 text-sm">
                                        💡 <strong>Dica:</strong> Complete seu perfil para desbloquear todas as funcionalidades do Vida Smart, 
                                        incluindo planos personalizados e sistema de pontuação!
                                    </p>
                                </div>
                            )}
                            
                            <div className="flex justify-end pt-4">
                                <Button 
                                    type="submit" 
                                    disabled={isSaving} 
                                    className="vida-smart-gradient text-white"
                                >
                                    {isSaving ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="mr-2 h-4 w-4" />
                                    )}
                                    {profileExists ? 'Salvar Alterações' : 'Criar Perfil'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>
        </TabsContent>
    );
};

export default ProfileTab;