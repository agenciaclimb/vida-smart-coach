# 💻 TEMPLATES DE CÓDIGO - Roadmap UX/Gamificação

**Projeto:** Vida Smart Coach  
**Objetivo:** Templates prontos para copiar e implementar  
**Data:** 22/10/2025  

---

## 📑 ÍNDICE

1. [Migrations SQL](#migrations-sql)
2. [Hooks React](#hooks-react)
3. [Componentes UI](#componentes-ui)
4. [Edge Functions](#edge-functions)
5. [Utils e Helpers](#utils-e-helpers)

---

## 🗂️ MIGRATIONS SQL

### 1. Plan Completions Table

```sql
-- File: supabase/migrations/20251023_create_plan_completions.sql

-- Tabela de conclusões de itens dos planos
CREATE TABLE IF NOT EXISTS plan_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('physical', 'nutritional', 'emotional', 'spiritual')),
  item_type TEXT NOT NULL CHECK (item_type IN ('exercise', 'workout', 'meal', 'routine', 'practice', 'goal', 'technique')),
  item_identifier TEXT NOT NULL, -- ex: "week_1_workout_0_exercise_2"
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  points_awarded INTEGER DEFAULT 0,
  
  -- Constraint de unicidade (usuário não pode completar o mesmo item 2x)
  UNIQUE(user_id, plan_type, item_identifier)
);

-- Índices para performance
CREATE INDEX idx_plan_completions_user_date 
  ON plan_completions(user_id, completed_at DESC);

CREATE INDEX idx_plan_completions_type 
  ON plan_completions(user_id, plan_type);

CREATE INDEX idx_plan_completions_item_type 
  ON plan_completions(item_type, completed_at DESC);

-- RLS Policies
ALTER TABLE plan_completions ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver apenas suas próprias conclusões
CREATE POLICY "Users can view own completions"
  ON plan_completions FOR SELECT
  USING (auth.uid() = user_id);

-- Usuários podem inserir suas próprias conclusões
CREATE POLICY "Users can insert own completions"
  ON plan_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Usuários podem deletar suas próprias conclusões (desmarcar)
CREATE POLICY "Users can delete own completions"
  ON plan_completions FOR DELETE
  USING (auth.uid() = user_id);

-- Comentários
COMMENT ON TABLE plan_completions IS 'Rastreamento de itens completados nos planos (exercícios, refeições, práticas)';
COMMENT ON COLUMN plan_completions.item_identifier IS 'Identificador único do item dentro do plano (ex: week_1_workout_0_exercise_2)';
COMMENT ON COLUMN plan_completions.points_awarded IS 'Pontos de gamificação concedidos por esta conclusão';
```

---

### 2. Rewards System

```sql
-- File: supabase/migrations/20251107_create_rewards_system.sql

-- Tabela de recompensas disponíveis
CREATE TABLE IF NOT EXISTS rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('digital', 'content', 'service', 'badge')),
  cost_xp INTEGER NOT NULL CHECK (cost_xp > 0),
  icon TEXT, -- emoji ou URL de ícone
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  stock INTEGER, -- NULL = estoque ilimitado
  tier_required TEXT CHECK (tier_required IN ('iniciante', 'praticante', 'veterano', 'expert', 'mestre')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de resgates de recompensas
CREATE TABLE IF NOT EXISTS user_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES rewards(id),
  redeemed_at TIMESTAMPTZ DEFAULT NOW(),
  xp_spent INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'cancelled')),
  notes TEXT,
  
  -- Audit fields
  delivered_at TIMESTAMPTZ,
  delivered_by UUID REFERENCES auth.users(id)
);

-- Índices
CREATE INDEX idx_rewards_active ON rewards(is_active, category);
CREATE INDEX idx_rewards_cost ON rewards(cost_xp, tier_required);
CREATE INDEX idx_user_rewards_user ON user_rewards(user_id, redeemed_at DESC);
CREATE INDEX idx_user_rewards_status ON user_rewards(status, redeemed_at);

-- RLS Policies
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rewards ENABLE ROW LEVEL SECURITY;

-- Qualquer pessoa autenticada pode ver recompensas ativas
CREATE POLICY "Anyone can view active rewards"
  ON rewards FOR SELECT
  USING (is_active = TRUE);

-- Admins podem gerenciar recompensas
CREATE POLICY "Admins can manage rewards"
  ON rewards FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'admin' OR
    auth.jwt() ->> 'email' IN (
      SELECT email FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Usuários podem ver seus próprios resgates
CREATE POLICY "Users can view own redemptions"
  ON user_rewards FOR SELECT
  USING (auth.uid() = user_id);

-- Usuários podem resgatar recompensas
CREATE POLICY "Users can redeem rewards"
  ON user_rewards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Seeds de recompensas iniciais
INSERT INTO rewards (name, description, category, cost_xp, icon, tier_required) VALUES
  -- Digitais
  ('Sessão Extra IA Coach', 'Conversa de 15 minutos extra com IA Coach sobre qualquer assunto', 'digital', 500, '💬', NULL),
  ('Relatório Personalizado', 'PDF detalhado com análise de progresso e insights personalizados', 'digital', 1000, '📊', 'praticante'),
  ('Tema Premium "Energia"', 'Visual exclusivo com gradientes energéticos para o app', 'digital', 300, '🎨', NULL),
  ('Acesso Antecipado', 'Teste novas funcionalidades antes de todo mundo', 'digital', 800, '🚀', 'praticante'),
  
  -- Conteúdo
  ('E-book Nutrição Avançada', 'Guia completo com 50+ receitas saudáveis e deliciosas', 'content', 800, '📚', 'praticante'),
  ('Plano de Treino Avançado', 'Programa de 12 semanas para hipertrofia focada', 'content', 1200, '💪', 'veterano'),
  ('Vídeo-aula Meditação', 'Série de 5 vídeos de meditação guiada por especialista', 'content', 600, '🧘', NULL),
  ('Receitas Gourmet Saudáveis', '30 receitas de chef para dieta equilibrada', 'content', 500, '👨‍🍳', NULL),
  
  -- Badges
  ('Badge Guerreiro da Saúde', 'Badge exclusivo que aparece no seu perfil', 'badge', 300, '🏅', NULL),
  ('Badge Mestre do Equilíbrio', 'Badge raro para quem equilibra os 4 pilares', 'badge', 2000, '⚖️', 'mestre'),
  ('Badge Streak de Ouro', 'Badge especial para 30+ dias consecutivos', 'badge', 1500, '🔥', 'veterano'),
  
  -- Serviços
  ('Consultoria 1:1 Premium', 'Sessão de 30min com especialista real em saúde', 'service', 3000, '👨‍⚕️', 'expert'),
  ('Ajuste de Plano Personalizado', 'Coach humano ajusta seu plano baseado em feedback', 'service', 1500, '🎯', 'veterano'),
  ('Comunidade VIP', 'Acesso ao grupo exclusivo VIP no Discord', 'service', 2000, '👑', 'expert');

-- Function para deduzir XP ao resgatar recompensa
CREATE OR REPLACE FUNCTION deduct_user_xp(
  p_user_id UUID,
  p_xp_amount INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validar que o usuário tem XP suficiente
  IF (SELECT total_points FROM user_gamification_summary WHERE user_id = p_user_id) < p_xp_amount THEN
    RAISE EXCEPTION 'Insufficient XP: user has less than % points', p_xp_amount;
  END IF;
  
  -- Deduzir XP (implementar lógica real baseado na estrutura da tabela de gamificação)
  -- Exemplo genérico:
  UPDATE user_gamification_summary
  SET total_points = total_points - p_xp_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id;
  
  RETURN TRUE;
END;
$$;

COMMENT ON TABLE rewards IS 'Catálogo de recompensas disponíveis para resgate com XP';
COMMENT ON TABLE user_rewards IS 'Histórico de resgates de recompensas pelos usuários';
COMMENT ON FUNCTION deduct_user_xp IS 'Deduz XP do usuário ao resgatar recompensa';
```

---

### 3. Plan Feedback Loop

```sql
-- File: supabase/migrations/20251114_create_plan_feedback.sql

-- Tabela de feedback sobre planos
CREATE TABLE IF NOT EXISTS plan_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('physical', 'nutritional', 'emotional', 'spiritual')),
  feedback_text TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'ignored')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  ai_response TEXT,
  plan_updated BOOLEAN DEFAULT FALSE
);

-- Índices
CREATE INDEX idx_plan_feedback_user ON plan_feedback(user_id, created_at DESC);
CREATE INDEX idx_plan_feedback_status ON plan_feedback(status, created_at);
CREATE INDEX idx_plan_feedback_pending ON plan_feedback(user_id, status) WHERE status = 'pending';

-- RLS
ALTER TABLE plan_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own feedback"
  ON plan_feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feedback"
  ON plan_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE plan_feedback IS 'Feedback dos usuários sobre seus planos para ajuste pela IA';
```

---

## 🎣 HOOKS REACT

### 1. usePlanCompletions

```typescript
// File: src/hooks/usePlanCompletions.js

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useGamification } from './useGamification';
import { toast } from 'sonner';
import { triggerConfetti } from '@/components/ui/confetti';

/**
 * Hook para gerenciar conclusões de itens dos planos
 * @param {string} userId - ID do usuário
 * @param {string} planType - Tipo do plano ('physical', 'nutritional', 'emotional', 'spiritual')
 * @returns {object} { completions, toggleCompletion, getProgress, isLoading }
 */
export function usePlanCompletions(userId, planType) {
  const [completions, setCompletions] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const { addDailyActivity } = useGamification();
  
  // Carregar completions do backend
  useEffect(() => {
    if (!userId || !planType) {
      setIsLoading(false);
      return;
    }
    
    fetchCompletions();
  }, [userId, planType]);
  
  const fetchCompletions = async () => {
    setIsLoading(true);
    
    const { data, error } = await supabase
      .from('plan_completions')
      .select('item_identifier, completed_at')
      .eq('user_id', userId)
      .eq('plan_type', planType);
    
    if (!error && data) {
      const completionsMap = {};
      data.forEach(c => {
        completionsMap[c.item_identifier] = {
          completed: true,
          date: c.completed_at
        };
      });
      setCompletions(completionsMap);
    }
    
    setIsLoading(false);
  };
  
  /**
   * Marca/desmarca um item como concluído
   * @param {string} itemIdentifier - ID único do item (ex: "week_1_workout_0_exercise_2")
   * @param {string} itemType - Tipo do item ('exercise', 'meal', 'routine', etc)
   * @param {string} itemLabel - Label do item para exibição no toast
   */
  const toggleCompletion = async (itemIdentifier, itemType, itemLabel = '') => {
    const isCompleted = completions[itemIdentifier]?.completed;
    
    if (isCompleted) {
      // Remover conclusão
      const { error } = await supabase
        .from('plan_completions')
        .delete()
        .eq('user_id', userId)
        .eq('plan_type', planType)
        .eq('item_identifier', itemIdentifier);
      
      if (!error) {
        setCompletions(prev => {
          const updated = { ...prev };
          delete updated[itemIdentifier];
          return updated;
        });
        
        toast.info('Marcado como não concluído', {
          description: itemLabel
        });
      } else {
        toast.error('Erro ao desmarcar item');
        console.error('Toggle completion error:', error);
      }
    } else {
      // Adicionar conclusão
      const points = getPointsForItemType(itemType);
      
      const { error } = await supabase
        .from('plan_completions')
        .insert({
          user_id: userId,
          plan_type: planType,
          item_type: itemType,
          item_identifier: itemIdentifier,
          points_awarded: points
        });
      
      if (!error) {
        setCompletions(prev => ({ 
          ...prev, 
          [itemIdentifier]: { 
            completed: true, 
            date: new Date().toISOString() 
          } 
        }));
        
        // Adicionar pontos de gamificação
        await addDailyActivity(
          `${planType}_${itemType}_completed`,
          points,
          { item: itemIdentifier, label: itemLabel }
        );
        
        // Efeitos visuais
        triggerConfetti();
        
        toast.success(`🎉 Concluído! +${points} XP`, {
          description: getCelebrationMessage(itemType),
          action: {
            label: 'Ver progresso',
            onClick: () => {
              // Navegar para dashboard de progresso (implementar)
              console.log('Navigate to progress dashboard');
            }
          }
        });
      } else {
        toast.error('Erro ao marcar como concluído');
        console.error('Toggle completion error:', error);
      }
    }
  };
  
  /**
   * Calcula progresso de conclusão
   * @param {number} totalItems - Total de itens no plano
   * @returns {object} { completed, total, percentage }
   */
  const getProgress = (totalItems = 0) => {
    const completed = Object.keys(completions).length;
    const percentage = totalItems > 0 ? Math.round((completed / totalItems) * 100) : 0;
    
    return { 
      completed, 
      total: totalItems, 
      percentage 
    };
  };
  
  /**
   * Verifica se um item específico está concluído
   * @param {string} itemIdentifier - ID do item
   * @returns {boolean}
   */
  const isCompleted = (itemIdentifier) => {
    return !!completions[itemIdentifier]?.completed;
  };
  
  return { 
    completions, 
    toggleCompletion, 
    getProgress, 
    isCompleted,
    isLoading,
    refresh: fetchCompletions
  };
}

// Helpers internos
function getPointsForItemType(itemType) {
  const pointsMap = {
    exercise: 5,
    workout: 10,
    meal: 5,
    routine: 8,
    practice: 8,
    goal: 15,
    technique: 6
  };
  return pointsMap[itemType] || 5;
}

function getCelebrationMessage(itemType) {
  const messages = {
    exercise: 'Ótimo trabalho! Continue assim! 💪',
    workout: 'Treino concluído! Você é incrível! 🏆',
    meal: 'Alimentação em dia! Parabéns! 🥗',
    routine: 'Rotina completa! Você está evoluindo! 🌟',
    practice: 'Prática concluída! Muito bem! 🧘',
    goal: 'Meta alcançada! Você é uma inspiração! 🎯',
    technique: 'Técnica dominada! Excelente! ✨'
  };
  return messages[itemType] || 'Parabéns pela conclusão! 🎊';
}
```

---

### 2. useRewards

```typescript
// File: src/hooks/useRewards.js

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useGamification } from './useGamification';
import { toast } from 'sonner';

/**
 * Hook para gerenciar recompensas e resgates
 */
export function useRewards() {
  const { user } = useAuth();
  const { gamificationData, refresh: refreshGamification } = useGamification();
  const [rewards, setRewards] = useState([]);
  const [userRewards, setUserRewards] = useState([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    fetchRewards();
    if (user) {
      fetchUserRewards();
    }
  }, [user]);
  
  const fetchRewards = async () => {
    const { data, error } = await supabase
      .from('rewards')
      .select('*')
      .eq('is_active', true)
      .order('cost_xp');
    
    if (!error && data) {
      setRewards(data);
    }
  };
  
  const fetchUserRewards = async () => {
    const { data, error } = await supabase
      .from('user_rewards')
      .select(`
        *,
        reward:rewards(*)
      `)
      .eq('user_id', user.id)
      .order('redeemed_at', { ascending: false });
    
    if (!error && data) {
      setUserRewards(data);
    }
  };
  
  const redeemReward = async (reward) => {
    if (!user) {
      toast.error('Você precisa estar logado');
      return false;
    }
    
    if (gamificationData.total_points < reward.cost_xp) {
      toast.error('XP insuficiente', {
        description: `Você precisa de ${reward.cost_xp - gamificationData.total_points} XP a mais`
      });
      return false;
    }
    
    // Verificar tier se necessário
    if (reward.tier_required) {
      const userTier = calculateTierFromLevel(gamificationData.level);
      const tierOrder = ['iniciante', 'praticante', 'veterano', 'expert', 'mestre'];
      const userTierIndex = tierOrder.indexOf(userTier);
      const requiredTierIndex = tierOrder.indexOf(reward.tier_required);
      
      if (userTierIndex < requiredTierIndex) {
        toast.error('Tier insuficiente', {
          description: `Esta recompensa requer tier ${reward.tier_required}`
        });
        return false;
      }
    }
    
    // Verificar estoque
    if (reward.stock !== null && reward.stock <= 0) {
      toast.error('Recompensa esgotada');
      return false;
    }
    
    setLoading(true);
    
    try {
      // Inserir resgate
      const { error: insertError } = await supabase
        .from('user_rewards')
        .insert({
          user_id: user.id,
          reward_id: reward.id,
          xp_spent: reward.cost_xp
        });
      
      if (insertError) throw insertError;
      
      // Deduzir XP
      const { error: deductError } = await supabase.rpc('deduct_user_xp', {
        p_user_id: user.id,
        p_xp_amount: reward.cost_xp
      });
      
      if (deductError) throw deductError;
      
      // Atualizar estoque se aplicável
      if (reward.stock !== null) {
        await supabase
          .from('rewards')
          .update({ stock: reward.stock - 1 })
          .eq('id', reward.id);
      }
      
      toast.success('Resgate realizado! 🎉', {
        description: 'Você receberá sua recompensa em breve'
      });
      
      // Recarregar dados
      await Promise.all([
        fetchRewards(),
        fetchUserRewards(),
        refreshGamification()
      ]);
      
      return true;
    } catch (error) {
      console.error('Redeem error:', error);
      toast.error('Erro ao resgatar recompensa');
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  const canAfford = (reward) => {
    return gamificationData.total_points >= reward.cost_xp;
  };
  
  const hasSufficientTier = (reward) => {
    if (!reward.tier_required) return true;
    
    const userTier = calculateTierFromLevel(gamificationData.level);
    const tierOrder = ['iniciante', 'praticante', 'veterano', 'expert', 'mestre'];
    const userTierIndex = tierOrder.indexOf(userTier);
    const requiredTierIndex = tierOrder.indexOf(reward.tier_required);
    
    return userTierIndex >= requiredTierIndex;
  };
  
  return {
    rewards,
    userRewards,
    loading,
    redeemReward,
    canAfford,
    hasSufficientTier,
    refresh: fetchRewards
  };
}

function calculateTierFromLevel(level) {
  if (level <= 10) return 'iniciante';
  if (level <= 20) return 'praticante';
  if (level <= 30) return 'veterano';
  if (level <= 40) return 'expert';
  return 'mestre';
}
```

---

## 🎨 COMPONENTES UI

### 1. CompletionCheckbox

```typescript
// File: src/components/client/CompletionCheckbox.jsx

import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

export function CompletionCheckbox({ 
  isCompleted, 
  onToggle, 
  label,
  itemType,
  disabled = false
}) {
  return (
    <div className="flex items-center space-x-3 group">
      <Checkbox
        checked={isCompleted}
        onCheckedChange={onToggle}
        disabled={disabled}
        className="h-5 w-5 transition-all"
      />
      
      <motion.label
        className={`flex-1 cursor-pointer transition-all select-none ${
          isCompleted 
            ? 'text-muted-foreground line-through opacity-60' 
            : 'text-foreground group-hover:text-primary'
        }`}
        whileTap={{ scale: disabled ? 1 : 0.98 }}
        onClick={() => !disabled && onToggle()}
      >
        {label}
      </motion.label>
      
      <AnimatePresence>
        {isCompleted && (
          <motion.div
            initial={{ scale: 0, rotate: -180, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0, rotate: 180, opacity: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 500, 
              damping: 20 
            }}
            className="text-green-500"
          >
            <Check className="h-4 w-4" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

---

### 2. ProgressCard

```typescript
// File: src/components/client/ProgressCard.jsx

import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card } from '@/components/ui/card';

export function ProgressCard({ 
  title, 
  icon, 
  percentage, 
  completed, 
  total,
  trend = 'stable', // 'up' | 'down' | 'stable'
  gradient = 'from-blue-500 to-purple-600'
}) {
  const getTrendIcon = () => {
    switch(trend) {
      case 'up': 
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': 
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: 
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };
  
  const getTrendLabel = () => {
    switch(trend) {
      case 'up': return 'Melhorando';
      case 'down': return 'Precisa atenção';
      default: return 'Estável';
    }
  };
  
  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: "0 12px 24px rgba(0,0,0,0.1)" }}
      transition={{ duration: 0.2 }}
    >
      <Card className="p-6 relative overflow-hidden">
        {/* Background gradient sutil */}
        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${gradient} opacity-5 rounded-full blur-2xl`} />
        
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-3xl">{icon}</span>
              <div>
                <h3 className="font-semibold text-sm">{title}</h3>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  {getTrendIcon()}
                  {getTrendLabel()}
                </span>
              </div>
            </div>
          </div>
          
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <motion.span 
                className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {percentage}%
              </motion.span>
              <span className="text-xs text-muted-foreground mb-1">
                {completed} de {total}
              </span>
            </div>
            
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
              style={{ transformOrigin: "left" }}
            >
              <Progress value={percentage} className="h-2" />
            </motion.div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
```

---

### 3. Confetti Trigger

```typescript
// File: src/components/ui/confetti.tsx

import confetti from 'canvas-confetti';

export function triggerConfetti(options = {}) {
  const defaults = {
    duration: 2000,
    particleCount: 50,
    spread: 360,
    startVelocity: 30,
    ticks: 60,
    zIndex: 9999,
    ...options
  };
  
  const duration = defaults.duration;
  const animationEnd = Date.now() + duration;
  
  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }
  
  const interval = setInterval(function() {
    const timeLeft = animationEnd - Date.now();
    
    if (timeLeft <= 0) {
      return clearInterval(interval);
    }
    
    const particleCount = defaults.particleCount * (timeLeft / duration);
    
    // Confete da esquerda
    confetti({
      ...defaults,
      particleCount,
      origin: { 
        x: randomInRange(0.1, 0.3), 
        y: Math.random() - 0.2 
      }
    });
    
    // Confete da direita
    confetti({
      ...defaults,
      particleCount,
      origin: { 
        x: randomInRange(0.7, 0.9), 
        y: Math.random() - 0.2 
      }
    });
  }, 250);
}

// Confete mais intenso para conquistas importantes
export function triggerBigConfetti() {
  triggerConfetti({
    duration: 3000,
    particleCount: 100,
    spread: 360,
    startVelocity: 45
  });
}

// Confete sutil para pequenas conquistas
export function triggerSubtleConfetti() {
  confetti({
    particleCount: 30,
    spread: 60,
    origin: { y: 0.6 },
    colors: ['#667eea', '#764ba2', '#f093fb', '#f5576c']
  });
}
```

---

## 💡 UTILS E HELPERS

### Points Calculator

```typescript
// File: src/utils/pointsCalculator.js

export const POINTS_CONFIG = {
  // Plan completions
  exercise: 5,
  workout: 10,
  meal: 5,
  routine: 8,
  practice: 8,
  goal: 15,
  technique: 6,
  
  // Milestones
  plan_generated: 30,
  ia_stage_progression: 50,
  checkin_completed: 20,
  streak_7days: 100,
  streak_14days: 200,
  streak_30days: 500,
  streak_90days: 1500,
  
  // Challenges
  challenge_weekly: 150,
  challenge_monthly: 500,
  challenge_seasonal: 1000,
  
  // Social
  referral_success: 300,
  mentor_session: 50,
  community_post: 10
};

export function calculatePointsForActivity(activityType, metadata = {}) {
  const basePoints = POINTS_CONFIG[activityType] || 0;
  
  // Multiplicadores por tier
  const tierMultipliers = {
    iniciante: 1.0,
    praticante: 1.1,
    veterano: 1.2,
    expert: 1.3,
    mestre: 1.5
  };
  
  const multiplier = metadata.userTier 
    ? tierMultipliers[metadata.userTier] || 1.0 
    : 1.0;
  
  return Math.round(basePoints * multiplier);
}
```

---

### Tier Calculator

```typescript
// File: src/utils/tierCalculator.js

export const TIER_CONFIG = {
  iniciante: {
    levelRange: [1, 10],
    icon: '🌱',
    name: 'Aprendiz do Bem-Estar',
    color: 'from-green-400 to-emerald-600',
    benefits: [
      'Acesso básico ao app',
      '3 missões por dia',
      'Suporte IA padrão',
      'Tutorial completo'
    ]
  },
  praticante: {
    levelRange: [11, 20],
    icon: '🌿',
    name: 'Guardião da Saúde',
    color: 'from-blue-400 to-cyan-600',
    benefits: [
      'Tudo do Aprendiz',
      '+2 missões extras por dia',
      'Badge personalizado',
      'Analytics básico'
    ]
  },
  veterano: {
    levelRange: [21, 30],
    icon: '🌳',
    name: 'Mestre do Equilíbrio',
    color: 'from-purple-400 to-violet-600',
    benefits: [
      'Tudo do Guardião',
      'Loja de recompensas',
      'Relatórios mensais',
      'Temas premium',
      'Desafios avançados'
    ]
  },
  expert: {
    levelRange: [31, 40],
    icon: '🏆',
    name: 'Lenda Viva',
    color: 'from-yellow-400 to-orange-600',
    benefits: [
      'Tudo do Mestre',
      'Comunidade exclusiva',
      'Mentoria de novos usuários',
      'Prioridade no suporte',
      'Badges únicos'
    ]
  },
  mestre: {
    levelRange: [41, Infinity],
    icon: '⭐',
    name: 'Inspiração para Outros',
    color: 'from-pink-400 to-rose-600',
    benefits: [
      'Todas as funcionalidades',
      'Reconhecimento público',
      'Influenciador verificado',
      'Acesso antecipado permanente',
      'Recompensas exclusivas'
    ]
  }
};

export function getTierFromLevel(level) {
  for (const [tierKey, tierData] of Object.entries(TIER_CONFIG)) {
    const [min, max] = tierData.levelRange;
    if (level >= min && level <= max) {
      return { key: tierKey, ...tierData };
    }
  }
  return { key: 'iniciante', ...TIER_CONFIG.iniciante };
}

export function getNextTier(currentLevel) {
  const currentTier = getTierFromLevel(currentLevel);
  const tierKeys = Object.keys(TIER_CONFIG);
  const currentIndex = tierKeys.indexOf(currentTier.key);
  
  if (currentIndex < tierKeys.length - 1) {
    const nextTierKey = tierKeys[currentIndex + 1];
    return {
      tier: { key: nextTierKey, ...TIER_CONFIG[nextTierKey] },
      levelsRemaining: TIER_CONFIG[nextTierKey].levelRange[0] - currentLevel
    };
  }
  
  return null; // Já é o tier máximo
}
```

---

**Templates criados!** 🎉

Todos os arquivos estão prontos para serem copiados e implementados. Próximos passos:

1. Copiar migrations para `supabase/migrations/`
2. Copiar hooks para `src/hooks/`
3. Copiar componentes para `src/components/`
4. Instalar dependências: `npm install framer-motion canvas-confetti`
5. Executar migrations no Supabase
6. Iniciar implementação Sprint 1

---

**Última atualização:** 22/10/2025
