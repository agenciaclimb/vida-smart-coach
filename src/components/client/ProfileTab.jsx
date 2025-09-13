
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/components/auth/AuthProvider';
import { toast } from 'react-hot-toast';
import { Save, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const ProfileInput = ({ id, label, type, value, onChange, placeholder }) => (
    <div className="space-y-2">
        <Label htmlFor={id}>{label}</Label>
        <Input
            id={id}
            type={type}
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

    useEffect(() => {
        if (user?.profile) {
            setFormData(user.profile);
        }
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
        const { full_name, phone, current_weight, target_weight, height } = formData;
        
        await updateUserProfile({
            full_name,
            name: full_name,
            phone,
            current_weight,
            target_weight,
            height,
        });
    };
    
    if (!user?.profile) return null;

    return (
        <TabsContent value="profile" className="mt-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Card className="shadow-lg transition-all duration-300 hover:shadow-xl">
                    <CardHeader>
                        <CardTitle>Meu Perfil</CardTitle>
                        <CardDescription>Mantenha seus dados sempre atualizados para uma experiência personalizada.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <ProfileInput
                                    id="full_name"
                                    label="Nome Completo"
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
                                    placeholder="5511999998888"
                                />
                                 <ProfileInput
                                    id="current_weight"
                                    label="Peso Atual (kg)"
                                    type="number"
                                    value={formData.current_weight}
                                    onChange={handleChange}
                                    placeholder="Ex: 75.5"
                                />
                                 <ProfileInput
                                    id="target_weight"
                                    label="Peso Meta (kg)"
                                    type="number"
                                    value={formData.target_weight}
                                    onChange={handleChange}
                                    placeholder="Ex: 70"
                                />
                                 <ProfileInput
                                    id="height"
                                    label="Altura (cm)"
                                    type="number"
                                    value={formData.height}
                                    onChange={handleChange}
                                    placeholder="Ex: 175"
                                />
                            </div>
                            <div className="flex justify-end pt-4">
                                <Button type="submit" disabled={authLoading} className="vida-smart-gradient text-white">
                                    {authLoading ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="mr-2 h-4 w-4" />
                                    )}
                                    Salvar Alterações
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
