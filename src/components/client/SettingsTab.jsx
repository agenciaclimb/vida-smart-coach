
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bot, Bell, User, Save, Smile, Zap, BrainCircuit, VenetianMask, Sparkles, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuth } from '@/contexts/SupabaseAuthContext';
import toast from 'react-hot-toast';

const SettingsCard = ({ icon, title, children, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className="vida-smart-card p-6 rounded-2xl shadow-lg"
    >
        <h3 className="text-lg font-semibold mb-6 flex items-center">{icon}{title}</h3>
        <div className="space-y-4">
            {children}
        </div>
    </motion.div>
);

const SettingsTab = () => {
  const { user, updateUserProfile, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    current_weight: '',
    target_weight: '',
    height: '',
    wants_reminders: false,
    wants_quotes: false,
  });
  
  useEffect(() => {
    if (user?.profile) {
      setFormData({
        current_weight: user.profile.current_weight || '',
        target_weight: user.profile.target_weight || '',
        height: user.profile.height || '',
        wants_reminders: user.profile.wants_reminders ?? false,
        wants_quotes: user.profile.wants_quotes ?? false,
      });
    }
  }, [user]);

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSave = () => {
    const updateData = {
        current_weight: parseFloat(formData.current_weight) || null,
        target_weight: parseFloat(formData.target_weight) || null,
        height: parseFloat(formData.height) || null,
        wants_reminders: formData.wants_reminders,
        wants_quotes: formData.wants_quotes,
    };
    updateUserProfile(updateData);
  };

  const handleUnsupportedFeature = () => {
      toast("🚧 Esta funcionalidade ainda não foi implementada—mas não se preocupe! Você pode solicitá-la no seu próximo prompt! 🚀", {
        icon: '🚀',
        duration: 5000,
    });
  }

  const aiPersonalities = [
    { name: "Amigável", icon: <Smile className="w-5 h-5" /> },
    { name: "Energética", icon: <Zap className="w-5 h-5" /> },
    { name: "Zen", icon: <Sparkles className="w-5 h-5" /> },
    { name: "Inteligente", icon: <BrainCircuit className="w-5 h-5" /> },
    { name: "Criativa", icon: <VenetianMask className="w-5 h-5" /> },
  ];
  
  if (!user || !user.profile) {
      return (
          <TabsContent value="settings" className="mt-6 flex justify-center items-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </TabsContent>
      );
  }

  return (
    <TabsContent value="settings" className="mt-6">
        <div className="grid lg:grid-cols-2 gap-6">
            <div>
                <SettingsCard icon={<User className="w-5 h-5 mr-2" />} title="Perfil e Metas" delay={0.1}>
                    <div>
                        <Label htmlFor="current-weight">Peso Atual (kg)</Label>
                        <Input id="current-weight" type="number" value={formData.current_weight} onChange={(e) => handleFormChange('current_weight', e.target.value)} />
                    </div>
                    <div>
                        <Label htmlFor="target-weight">Peso Meta (kg)</Label>
                        <Input id="target-weight" type="number" value={formData.target_weight} onChange={(e) => handleFormChange('target_weight', e.target.value)} />
                    </div>
                     <div>
                        <Label htmlFor="height">Altura (cm)</Label>
                        <Input id="height" type="number" value={formData.height} onChange={(e) => handleFormChange('height', e.target.value)} />
                    </div>
                </SettingsCard>
            </div>
            <div>
                <SettingsCard icon={<Bot className="w-5 h-5 mr-2" />} title="Preferências da IA" delay={0.2}>
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
                </SettingsCard>
                <div className="mt-6">
                    <SettingsCard icon={<Bell className="w-5 h-5 mr-2" />} title="Notificações" delay={0.3}>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="wants_reminders">Lembretes e Check-ins</Label>
                            <Switch id="wants_reminders" checked={formData.wants_reminders} onCheckedChange={(checked) => handleFormChange('wants_reminders', checked)} />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="wants_quotes">Frases Motivacionais</Label>
                            <Switch id="wants_quotes" checked={formData.wants_quotes} onCheckedChange={(checked) => handleFormChange('wants_quotes', checked)}/>
                        </div>
                    </SettingsCard>
                </div>
            </div>
        </div>
        <div className="mt-6 flex justify-end">
            <Button className="vida-smart-gradient text-white" onClick={handleSave} disabled={authLoading}>
                {authLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Salvar Alterações
            </Button>
        </div>
    </TabsContent>
  );
};

export default SettingsTab;
