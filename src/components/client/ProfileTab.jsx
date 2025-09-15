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
        setFormData(profileData);
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
            const { 
                full_name, phone, age, height, current_weight, target_weight, 
                gender, activity_level, goal_type 
            } = formData;
            
            await updateUserProfile({
                full_name,
                name: full_name, // Garante compatibilidade com diferentes campos de nome
                phone,
                age: age ? parseInt(age) : null,
                height: height ? parseInt(height) : null,
                current_weight: current_weight ? parseFloat(current_weight) : null,
                target_weight: target_weight ? parseFloat(target_weight) : null,
                gender,
                activity_level,
                goal_type
            });
            
            toast.success('Perfil atualizado com sucesso!');
        } catch (error) {
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
                                    <Label htmlFor="activity_level">Nível de Atividade</Label>
                                    <Select onValueChange={(value) => setFormData(prev => ({...prev, activity_level: value}))} value={formData.activity_level || ''}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione seu nível" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="sedentario">Sedentário</SelectItem>
                                            <SelectItem value="leve">Levemente Ativo</SelectItem>
                                            <SelectItem value="moderado">Moderadamente Ativo</SelectItem>
                                            <SelectItem value="intenso">Muito Ativo</SelectItem>
                                            <SelectItem value="extremo">Extremamente Ativo</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="goal_type">Objetivo Principal</Label>
                                <Select onValueChange={(value) => setFormData(prev => ({...prev, goal_type: value}))} value={formData.goal_type || ''}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Qual seu objetivo principal?" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="perder_peso">Perder Peso</SelectItem>
                                        <SelectItem value="ganhar_massa">Ganhar Massa Muscular</SelectItem>
                                        <SelectItem value="manter_peso">Manter Peso Atual</SelectItem>
                                        <SelectItem value="melhorar_condicionamento">Melhorar Condicionamento</SelectItem>
                                        <SelectItem value="saude_geral">Saúde Geral</SelectItem>
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