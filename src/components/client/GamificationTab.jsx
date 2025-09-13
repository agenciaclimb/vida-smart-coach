
import React from 'react';
import { motion } from 'framer-motion';
import { TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Award, Gift, History, Loader2 } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/components/auth/AuthProvider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';

const GamificationTab = () => {
    const { user } = useAuth();
    const { rewards, redemptionHistory, redeemReward, loading: dataLoading } = useData();
    const [redeemingId, setRedeemingId] = React.useState(null);

    const points = user?.profile?.points || 0;
    const level = user?.profile?.level || 1;
    const pointsForNextLevel = level * 100;
    const progress = (points % 100) / 100 * 100;

    const handleRedeem = async (reward) => {
        setRedeemingId(reward.id);
        try {
            await redeemReward(reward);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setRedeemingId(null);
        }
    };

    return (
        <TabsContent value="gamification" className="mt-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-8"
            >
                <Card className="shadow-lg bg-gradient-to-br from-primary to-purple-600 text-white">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-2xl">
                            <Award className="w-8 h-8" />
                            Seu Progresso de Gamer
                        </CardTitle>
                        <CardDescription className="text-purple-200">Continue evoluindo e ganhe recompensas incríveis!</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center text-lg">
                            <span>Nível Atual: <span className="font-bold text-2xl">{level}</span></span>
                            <span className="font-bold text-2xl">{points} Pontos</span>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-1 text-purple-200">
                                <span>Progresso para o Nível {level + 1}</span>
                                <span>{points % 100} / {pointsForNextLevel}</span>
                            </div>
                            <Progress value={progress} className="w-full [&>div]:bg-amber-400" />
                        </div>
                    </CardContent>
                </Card>

                <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Gift className="w-6 h-6 text-primary" />
                        Loja de Recompensas
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {rewards?.filter(r => r.is_active).map((reward) => (
                            <Card key={reward.id} className="flex flex-col justify-between">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-3">
                                        <span className="text-2xl">{reward.icon || '🎁'}</span>
                                        {reward.name}
                                    </CardTitle>
                                    <CardDescription>{reward.description}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button
                                        className="w-full vida-smart-gradient"
                                        disabled={points < reward.points || redeemingId === reward.id || dataLoading}
                                        onClick={() => handleRedeem(reward)}
                                    >
                                        {redeemingId === reward.id ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            `Resgatar por ${reward.points} pontos`
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <History className="w-6 h-6 text-primary" />
                        Histórico de Resgates
                    </h2>
                    <Card>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Recompensa</TableHead>
                                    <TableHead>Pontos</TableHead>
                                    <TableHead>Data</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {redemptionHistory && redemptionHistory.length > 0 ? (
                                    redemptionHistory.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium flex items-center gap-2">
                                                {item.reward_icon || '🎁'} {item.reward_name}
                                            </TableCell>
                                            <TableCell>{item.points_spent}</TableCell>
                                            <TableCell>{format(new Date(item.redeemed_at), "dd 'de' MMMM, yyyy", { locale: ptBR })}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center">Você ainda não resgatou nenhuma recompensa.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </Card>
                </div>
            </motion.div>
        </TabsContent>
    );
};

export default GamificationTab;
