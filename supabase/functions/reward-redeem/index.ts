import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { cors } from "../_shared/cors.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.3';

// ============================================
// 🎁 REWARD REDEEM - Processamento de Resgates
// ============================================

interface RedeemRequest {
  rewardId: string;
  deliveryInfo?: {
    address?: string;
    email?: string;
    phone?: string;
    notes?: string;
  };
}

serve(async (req) => {
  const headers = cors(req.headers.get('origin'));
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers });
  }

  try {
    // Autenticação obrigatória
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...headers, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Obter usuário autenticado
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...headers, 'Content-Type': 'application/json' }
      });
    }

    const userId = userData.user.id;
    const { rewardId, deliveryInfo }: RedeemRequest = await req.json();

    if (!rewardId) {
      return new Response(JSON.stringify({ error: 'rewardId é obrigatório' }), {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' }
      });
    }

    // 🔍 Validar resgate usando função do banco
    const { data: validation, error: validationError } = await supabase
      .rpc('validate_reward_redemption', {
        p_user_id: userId,
        p_reward_id: rewardId
      });

    if (validationError) {
      console.error('Validation error:', validationError);
      return new Response(JSON.stringify({ 
        error: 'Erro ao validar resgate',
        details: validationError.message 
      }), {
        status: 500,
        headers: { ...headers, 'Content-Type': 'application/json' }
      });
    }

    const validationResult = validation[0];
    if (!validationResult.is_valid) {
      return new Response(JSON.stringify({ 
        error: validationResult.error_message,
        userXP: validationResult.user_xp,
        rewardCost: validationResult.reward_cost
      }), {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' }
      });
    }

    // 🎫 Gerar código de cupom único
    const couponCode = generateCouponCode();

    // 📝 Criar resgate na tabela
    const { data: redemption, error: redeemError } = await supabase
      .from('reward_redemptions')
      .insert({
        user_id: userId,
        reward_id: rewardId,
        xp_spent: validationResult.reward_cost,
        status: 'pending',
        coupon_code: couponCode,
        delivery_info: deliveryInfo || null,
        expires_at: getExpirationDate(),
      })
      .select(`
        id,
        coupon_code,
        status,
        expires_at,
        reward:rewards(
          id,
          title,
          description,
          category,
          partner_name,
          image_url
        )
      `)
      .single();

    if (redeemError) {
      console.error('Redemption error:', redeemError);
      return new Response(JSON.stringify({ 
        error: 'Erro ao criar resgate',
        details: redeemError.message 
      }), {
        status: 500,
        headers: { ...headers, 'Content-Type': 'application/json' }
      });
    }

    // 💰 Debitar XP do usuário
    const { error: debitError } = await supabase
      .rpc('debit_user_xp', {
        p_user_id: userId,
        p_amount: validationResult.reward_cost
      });

    if (debitError) {
      console.error('Debit XP error:', debitError);
      
      // Rollback: cancelar resgate
      await supabase
        .from('reward_redemptions')
        .update({ status: 'cancelled' })
        .eq('id', redemption.id);

      return new Response(JSON.stringify({ 
        error: 'Erro ao debitar XP',
        details: debitError.message 
      }), {
        status: 500,
        headers: { ...headers, 'Content-Type': 'application/json' }
      });
    }

    // 🎟️ Criar cupom na tabela de cupons
    const { error: couponError } = await supabase
      .from('reward_coupons')
      .insert({
        redemption_id: redemption.id,
        reward_id: rewardId,
        code: couponCode,
        expires_at: getExpirationDate(),
      });

    if (couponError) {
      console.error('Coupon creation error:', couponError);
      // Não falhar aqui pois o resgate já foi criado
    }

    const processedAt = new Date().toISOString();

    const { error: confirmError } = await supabase
      .from('reward_redemptions')
      .update({
        status: 'approved',
        processed_at: processedAt,
      })
      .eq('id', redemption.id);

    if (confirmError) {
      console.error('Confirm redemption error:', confirmError);
      return new Response(JSON.stringify({
        error: 'Erro ao confirmar resgate',
        details: confirmError.message,
      }), {
        status: 500,
        headers: { ...headers, 'Content-Type': 'application/json' }
      });
    }

    const confirmedRedemption = {
      ...redemption,
      status: 'approved',
      processed_at: processedAt,
    };

    // 📊 Registrar evento de gamificação
    await supabase
      .from('gamification_events')
      .insert({
        user_id: userId,
        event_type: 'reward_redeemed',
        event_data: {
          reward_id: rewardId,
          reward_title: confirmedRedemption.reward?.title,
          xp_spent: validationResult.reward_cost,
          coupon_code: couponCode,
        },
        points_change: -validationResult.reward_cost,
      });

    // 🔔 TODO: Enviar notificação por email/WhatsApp (futuro)
    // await sendRedemptionNotification(userId, redemption);

    return new Response(JSON.stringify({
      success: true,
      redemption: {
        id: confirmedRedemption.id,
        couponCode: confirmedRedemption.coupon_code,
        status: confirmedRedemption.status,
        expiresAt: confirmedRedemption.expires_at,
        processedAt: confirmedRedemption.processed_at,
        reward: confirmedRedemption.reward,
      },
      userXPAfter: validationResult.user_xp - validationResult.reward_cost,
    }), {
      headers: { ...headers, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Reward Redeem Error:', error);
    return new Response(JSON.stringify({
      error: 'Erro interno do servidor',
      details: error?.message || String(error)
    }), {
      status: 500,
      headers: { ...headers, 'Content-Type': 'application/json' }
    });
  }
});

// ============================================
// 🛠️ FUNÇÕES AUXILIARES
// ============================================

function generateCouponCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sem letras confusas (I, O, 1, 0)
  const segments = [4, 4, 4]; // XXXX-XXXX-XXXX
  
  return segments
    .map(length => {
      let segment = '';
      for (let i = 0; i < length; i++) {
        segment += chars[Math.floor(Math.random() * chars.length)];
      }
      return segment;
    })
    .join('-');
}

function getExpirationDate(): string {
  // Cupons expiram em 30 dias
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString();
}
