import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { useGamification } from '../../hooks/useGamification';
import { Share2, Users, Gift, Copy, Check, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

const ReferralSystem = () => {
  const { user } = useAuth();
  const { recordActivity } = useGamification();
  const [referralCode, setReferralCode] = useState('');
  const [referralStats, setReferralStats] = useState({
    totalReferrals: 0,
    activeReferrals: 0,
    totalEarnings: 0
  });
  const [referralHistory, setReferralHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      generateReferralCode();
      fetchReferralStats();
      fetchReferralHistory();
    }
  }, [user]);

  const generateReferralCode = async () => {
    try {
      // Verifica se já tem código
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('referral_code')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      if (profile.referral_code) {
        setReferralCode(profile.referral_code);
      } else {
        // Gera novo código
        const code = `VSC${user.id.slice(-8).toUpperCase()}`;
        
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({ referral_code: code })
          .eq('user_id', user.id);

        if (updateError) throw updateError;
        setReferralCode(code);
      }
    } catch (error) {
      console.error('Erro ao gerar código de referência:', error);
    }
  };

  const fetchReferralStats = async () => {
    try {
      // Busca estatísticas de referências
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user.id);

      if (error) throw error;

      const stats = {
        totalReferrals: data.length,
        activeReferrals: data.filter(r => r.status === 'active').length,
        totalEarnings: data.reduce((sum, r) => sum + (r.commission_earned || 0), 0)
      };

      setReferralStats(stats);
    } catch (error) {
      console.error('Erro ao buscar estatísticas de referência:', error);
    }
  };

  const fetchReferralHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('referrals')
        .select(`
          *,
          referred_user:user_profiles!referrals_referred_user_id_fkey(name, email)
        `)
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReferralHistory(data);
    } catch (error) {
      console.error('Erro ao buscar histórico de referências:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = async () => {
    const referralLink = `${window.location.origin}?ref=${referralCode}`;
    
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success('Link copiado para a área de transferência!');
      
      // Registra atividade de compartilhamento
      await recordActivity('referral_share', 'Link de referência compartilhado');
      
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Erro ao copiar link');
    }
  };

  const shareReferralLink = async () => {
    const referralLink = `${window.location.origin}?ref=${referralCode}`;
    const shareText = `Transforme sua vida com o Vida Smart Coach! Use meu código ${referralCode} e ganhe benefícios exclusivos. ${referralLink}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Vida Smart Coach',
          text: shareText,
          url: referralLink
        });
        
        await recordActivity('referral_share', 'Link compartilhado via API nativa');
      } catch (error) {
        console.log('Compartilhamento cancelado');
      }
    } else {
      // Fallback para WhatsApp
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
      window.open(whatsappUrl, '_blank');
      
      await recordActivity('referral_share', 'Link compartilhado via WhatsApp');
    }
  };

  const getReferralBenefits = () => {
    return [
      {
        icon: '🎁',
        title: 'Bônus de Boas-vindas',
        description: 'Seus referidos ganham 30 dias grátis'
      },
      {
        icon: '💰',
        title: 'Comissão Recorrente',
        description: 'Ganhe 20% de comissão mensal'
      },
      {
        icon: '⭐',
        title: 'Pontos Extras',
        description: '+50 pontos por cada referência ativa'
      },
      {
        icon: '🏆',
        title: 'Status VIP',
        description: 'Acesso a recursos exclusivos'
      }
    ];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Referências</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{referralStats.totalReferrals}</div>
            <p className="text-xs text-muted-foreground">
              {referralStats.activeReferrals} ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comissões Ganhas</CardTitle>
            <Gift className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {referralStats.totalEarnings.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Este mês: R$ {(referralStats.totalEarnings * 0.3).toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pontos de Referência</CardTitle>
            <Share2 className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {referralStats.activeReferrals * 50}
            </div>
            <p className="text-xs text-muted-foreground">
              50 pontos por referência ativa
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Código de referência */}
      <Card>
        <CardHeader>
          <CardTitle>Seu Código de Referência</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              value={`${window.location.origin}?ref=${referralCode}`}
              readOnly
              className="flex-1"
            />
            <Button
              onClick={copyReferralLink}
              variant="outline"
              size="icon"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={shareReferralLink} className="flex-1">
              <Share2 className="h-4 w-4 mr-2" />
              Compartilhar
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Use meu código ${referralCode} no Vida Smart Coach!`)}`)}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              WhatsApp
            </Button>
          </div>

          <div className="text-center">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {referralCode}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Benefícios */}
      <Card>
        <CardHeader>
          <CardTitle>Benefícios do Programa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {getReferralBenefits().map((benefit, index) => (
              <div key={index} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl">{benefit.icon}</div>
                <div>
                  <h3 className="font-semibold">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Histórico de referências */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Referências</CardTitle>
        </CardHeader>
        <CardContent>
          {referralHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma referência ainda</p>
              <p className="text-sm">Compartilhe seu código e comece a ganhar!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {referralHistory.map((referral) => (
                <div key={referral.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">
                      {referral.referred_user?.name || 'Usuário'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(referral.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={referral.status === 'active' ? 'default' : 'secondary'}
                    >
                      {referral.status === 'active' ? 'Ativo' : 'Pendente'}
                    </Badge>
                    {referral.commission_earned > 0 && (
                      <p className="text-sm text-green-600 mt-1">
                        +R$ {referral.commission_earned.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReferralSystem;

