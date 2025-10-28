import React, { useEffect, useState } from 'react';
import { supabase } from '@/core/supabase';
import { useAuth } from '@/components/auth/AuthProvider';
import { useUserXP } from '@/hooks/useUserXP';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Gift, ShoppingCart, History, Star, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

const RewardsPage = () => {
  const { user } = useAuth();
  const { xpData, loading: loadingXP } = useUserXP();
  const [rewards, setRewards] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadRewards();
    loadRedemptions();
  }, []);

  const loadRewards = async () => {
    try {
      const { data, error } = await supabase
        .from('v_rewards_catalog')
        .select('*')
        .order('xp_cost', { ascending: true });

      if (error) throw error;
      setRewards(data || []);
    } catch (error) {
      console.error('Error loading rewards:', error);
      toast.error('Erro ao carregar recompensas');
    } finally {
      setLoading(false);
    }
  };

  const loadRedemptions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('reward_redemptions')
        .select(`
          *,
          reward:rewards(title, image_url, category)
        `)
        .eq('user_id', user.id)
        .order('redeemed_at', { ascending: false });

      if (error) throw error;
      setRedemptions(data || []);
    } catch (error) {
      console.error('Error loading redemptions:', error);
    }
  };

  const handleRedeem = async (reward) => {
    if (!user || !xpData) return;

    // Validar antes de tentar resgatar
    if (xpData.xp_total < reward.xp_cost) {
      toast.error(`Você precisa de ${reward.xp_cost - xpData.xp_total} XP a mais para resgatar esta recompensa`);
      return;
    }

    if (reward.available_stock <= 0) {
      toast.error('Esta recompensa está esgotada');
      return;
    }

    setRedeeming(reward.id);

    try {
      // Chamar Edge Function reward-redeem
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        throw new Error('Usuário não autenticado');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reward-redeem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          rewardId: reward.id,
          deliveryInfo: null, // Pode ser adicionado depois com formulário
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao resgatar recompensa');
      }

      toast.success(`Recompensa resgatada com sucesso! 🎉\nCódigo: ${result.redemption.couponCode}`);
      

      // Recarregar dados
      await loadRewards();
      await loadRedemptions();
    } catch (error) {
      console.error('Error redeeming reward:', error);
      toast.error('Erro ao resgatar recompensa. Tente novamente.');
    } finally {
      setRedeeming(null);
    }
  };

  const filteredRewards = filter === 'all' 
    ? rewards 
    : rewards.filter(r => r.category === filter);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle2 className="w-4 h-4 text-blue-500" />;
      case 'delivered':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'cancelled':
      case 'expired':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pendente',
      approved: 'Aprovado',
      delivered: 'Entregue',
      cancelled: 'Cancelado',
      expired: 'Expirado',
    };
    return labels[status] || status;
  };

  if (loadingXP || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header com saldo de XP */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
          <CardHeader>
            <CardTitle className="text-3xl flex items-center gap-3">
              <Gift className="w-8 h-8" />
              Loja de Recompensas
            </CardTitle>
            <CardDescription className="text-purple-100 text-lg">
              Troque seus pontos por experiências incríveis!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-5 h-5 text-yellow-300" />
                  <span className="text-sm font-medium text-purple-100">Seus Pontos</span>
                </div>
                <p className="text-4xl font-bold">{xpData?.xp_total || 0} XP</p>
              </div>
              <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingCart className="w-5 h-5 text-blue-300" />
                  <span className="text-sm font-medium text-purple-100">Resgates</span>
                </div>
                <p className="text-4xl font-bold">{redemptions.length}</p>
              </div>
              <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="w-5 h-5 text-green-300" />
                  <span className="text-sm font-medium text-purple-100">Nível</span>
                </div>
                <p className="text-4xl font-bold">{xpData?.level || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="catalog" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="catalog">Catálogo</TabsTrigger>
          <TabsTrigger value="history">Meus Resgates</TabsTrigger>
        </TabsList>

        {/* Catálogo */}
        <TabsContent value="catalog" className="space-y-6">
          {/* Filtros */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              Todas
            </Button>
            <Button
              variant={filter === 'experiencia' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('experiencia')}
            >
              Experiências
            </Button>
            <Button
              variant={filter === 'desconto' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('desconto')}
            >
              Descontos
            </Button>
            <Button
              variant={filter === 'produto' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('produto')}
            >
              Produtos
            </Button>
            <Button
              variant={filter === 'servico' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('servico')}
            >
              Serviços
            </Button>
            <Button
              variant={filter === 'digital' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('digital')}
            >
              Digital
            </Button>
          </div>

          {/* Grid de recompensas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRewards.map((reward) => {
              const canAfford = xpData && xpData.xp_total >= reward.xp_cost;
              const hasStock = reward.available_stock > 0;

              return (
                <motion.div
                  key={reward.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className={`overflow-hidden ${!canAfford || !hasStock ? 'opacity-60' : ''}`}>
                    {reward.image_url && (
                      <div className="aspect-video overflow-hidden bg-gray-100">
                        <img
                          src={reward.image_url}
                          alt={reward.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-lg">{reward.title}</CardTitle>
                        <Badge variant="outline" className="shrink-0">
                          {reward.category}
                        </Badge>
                      </div>
                      {reward.partner_name && (
                        <CardDescription>Por {reward.partner_name}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {reward.description && (
                        <p className="text-sm text-gray-600">{reward.description}</p>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Star className="w-5 h-5 text-yellow-500" />
                          <span className="text-2xl font-bold text-purple-600">
                            {reward.xp_cost} XP
                          </span>
                        </div>
                        {reward.stock_quantity !== null && (
                          <Badge variant={hasStock ? 'secondary' : 'destructive'}>
                            {reward.available_stock} restantes
                          </Badge>
                        )}
                      </div>

                      {!canAfford && (
                        <p className="text-xs text-red-500">
                          Faltam {reward.xp_cost - (xpData?.xp_total || 0)} XP
                        </p>
                      )}

                      <Button
                        className="w-full"
                        disabled={!canAfford || !hasStock || redeeming === reward.id}
                        onClick={() => handleRedeem(reward)}
                      >
                        {redeeming === reward.id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Resgatando...
                          </>
                        ) : (
                          <>
                            <Gift className="w-4 h-4 mr-2" />
                            Resgatar
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {filteredRewards.length === 0 && (
            <div className="text-center py-12">
              <Gift className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Nenhuma recompensa encontrada
              </h3>
              <p className="text-gray-500">
                Tente alterar os filtros ou volte mais tarde
              </p>
            </div>
          )}
        </TabsContent>

        {/* Histórico */}
        <TabsContent value="history" className="space-y-4">
          {redemptions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <History className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Nenhum resgate ainda
                </h3>
                <p className="text-gray-500 mb-6">
                  Comece a trocar seus pontos por recompensas incríveis!
                </p>
                <Button onClick={() => document.querySelector('[value="catalog"]').click()}>
                  Ver Catálogo
                </Button>
              </CardContent>
            </Card>
          ) : (
            redemptions.map((redemption) => (
              <motion.div
                key={redemption.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        {redemption.reward?.image_url && (
                          <img
                            src={redemption.reward.image_url}
                            alt={redemption.reward.title}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        )}
                        <div>
                          <h3 className="font-semibold text-lg">
                            {redemption.reward?.title || 'Recompensa'}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            {getStatusIcon(redemption.status)}
                            <Badge variant="outline">{getStatusLabel(redemption.status)}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-2">
                            {new Date(redemption.redeemed_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </p>
                          {redemption.coupon_code && (
                            <div className="mt-3 p-3 bg-gray-100 rounded-lg">
                              <p className="text-xs text-gray-600 mb-1">Código do Cupom:</p>
                              <p className="font-mono font-bold text-lg">
                                {redemption.coupon_code}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-purple-600 font-bold">
                          <Star className="w-4 h-4" />
                          <span>-{redemption.xp_spent} XP</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RewardsPage;
