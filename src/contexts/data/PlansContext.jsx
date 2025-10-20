/** Contexto para gerenciamento de planos personalizados gerados pela IA */

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/auth/AuthProvider';

const PlansContext = createContext(undefined);

// Sistema de prompts científicos avançados para geração de planos
const ADVANCED_TRAINING_PROMPTS = {
  strength: {
    beginner: `Crie um plano de treino de força baseado em periodização linear para iniciante, seguindo os princípios científicos de:
- Sobrecarga progressiva (aumentos de 2.5-5% por semana)
- Volume ótimo: 10-14 séries por grupo muscular por semana
- Frequência: 2-3x por semana por grupo muscular
- Exercícios compostos multi-articulares prioritários
- Tempo sob tensão: 2-4 segundos excêntrico
- Descanso inter-séries: 2-3 minutos para força
- Baseado em evidências de Schoenfeld, Helms e ACSM guidelines`,
    
    intermediate: `Desenvolva periodização undulante diária (DUP) para intermediário:
- Variação de intensidade: 65-85% 1RM
- Volume auto-regulado por RPE 6-9
- Frequência otimizada: 2-3x por grupo muscular
- Exercícios principais + acessórios específicos
- Deload programado a cada 4 semanas
- Princípios de Prilepin e conjugate method adaptado`,
    
    advanced: `Implemente periodização em blocos para avançado:
- Bloco de acumulação (4 semanas) + intensificação (3 semanas) + realização (1 semana)
- Autoregulação via velocity-based training (VBT)
- Especialização por padrões de movimento
- Periodização reversa em fases específicas
- Integração de métodos avançados: clusters, rest-pause, dropsets científicos`
  },
  
  hypertrophy: {
    beginner: `Plano hipertrofia baseado em meta-análises recentes:
- Volume: 12-20 séries por grupo muscular/semana
- Intensidade: 6-15 RM (65-85% 1RM)
- Frequência: 2x por semana mínimo por grupo
- Amplitude completa de movimento (ROM)
- Tempo sob tensão: 40-70s por série
- Exercícios compostos + isoladores
- Progressão via volume → intensidade`,
    
    intermediate: `Periodização não-linear para hipertrofia máxima:
- Variação de rep ranges: 6-8, 8-12, 12-15, 15-20
- Volume landmarks individualizados
- Técnicas avançadas: dropsets, rest-pause, mTOR activation
- Periodização da frequência de treino
- Specialization phases de 4-6 semanas
- Detraining prevention strategies`,
    
    advanced: `Sistema híbrido conjugado para hipertrofia:
- High-frequency training (HFT) modificado
- Volume autoregulated por biomarkers
- Intensification techniques científicas
- Muscle-specific periodization
- Advanced loading patterns
- Satellite cell activation protocols`
  },
  
  endurance: {
    beginner: `Plano baseado em zonas de treinamento científicas:
- 80/20 rule: 80% zona 1-2, 20% zona 4-5
- Base aeróbica via MAF method
- VO2max intervals 1x/semana
- Threshold work progressivo
- Cross-training para injury prevention
- Periodização linear-reversa híbrida`,
    
    intermediate: `Periodização polarizada para resistência:
- Zones baseadas em lactate thresholds
- High-volume low-intensity base
- High-intensity interval training (HIIT) científico
- Neuromuscular power maintenance
- Periodização em blocos de 3-4 semanas
- Tapering strategies evidence-based`,
    
    advanced: `Modelo norueguês de treinamento adaptado:
- Double-threshold concept
- VO2max intervals otimizados
- Lactate clearing capacity
- Neuromuscular power integration
- Altitude/heat adaptation protocols
- Competition periodization advanced`
  }
};

// Mock data generators for new plan types
const generateMockNutritionalPlan = (profile) => ({
  title: "Plano Nutricional Personalizado",
  description: "Dieta balanceada para seus objetivos, com foco em déficit calórico e preservação de massa muscular.",
  daily_calories: 1800,
  macronutrients: { protein: 130, carbs: 180, fat: 60 },
  water_intake_liters: 3,
  meals: [
    { name: "Café da Manhã", time: "08:00", calories: 350, items: ["Ovos mexidos", "Pão integral", "Fruta"] },
    { name: "Almoço", time: "12:30", calories: 450, items: ["Frango grelhado", "Arroz integral", "Salada completa"] },
    { name: "Jantar", time: "19:00", calories: 400, items: ["Salmão assado", "Batata doce", "Brócolis"] },
  ]
});

const generateMockEmotionalPlan = (profile) => ({
  title: "Plano de Bem-Estar Emocional",
  description: "Rotinas e técnicas para reduzir ansiedade e melhorar a autoestima.",
  focus_areas: ["Reduzir ansiedade", "Melhorar autoestima"],
  daily_routines: [
    { time: "Manhã", duration_minutes: 10, activity: "Check-in de humor e respiração consciente." },
    { time: "Noite", duration_minutes: 15, activity: "Diário emocional e meditação de gratidão." },
  ],
  techniques: [
    { name: "Respiração 4-7-8", description: "Técnica para acalmar o sistema nervoso em momentos de ansiedade." },
    { name: "Afirmações Positivas", description: "Prática para fortalecer a autoestima e o diálogo interno." },
  ]
});

const generateMockSpiritualPlan = (profile) => ({
  title: "Plano de Crescimento Espiritual",
  description: "Práticas para conexão com propósito, gratidão e compaixão.",
  focus_areas: ["Conexão com propósito", "Gratidão"],
  daily_practices: [
    { time: "Manhã", activity: "Momento de silêncio e definição de intenção para o dia." },
    { time: "Noite", activity: "Reflexão sobre 3 coisas pelas quais você é grato(a)." },
  ],
  weekly_reflection_prompts: [
    "Como vivi meu propósito esta semana?",
    "Que lições aprendi sobre mim mesmo(a)?",
  ]
});


export const PlansProvider = ({ children }) => {
  const { user: authUser } = useAuth();
  const [currentPlans, setCurrentPlans] = useState({});
  const [planHistory, setPlanHistory] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [generatingPlan, setGeneratingPlan] = useState(false);

  const loadCurrentPlans = useCallback(async () => {
    if (!authUser?.id) return;

    try {
      setLoadingPlans(true);
      
      console.log('🔍 [DEBUG] Carregando planos para usuário:', authUser.id);
      
      const { data, error } = await supabase
        .from('user_training_plans') // A tabela ainda se chama user_training_plans
        .select('*')
        .eq('user_id', authUser.id)
        .eq('is_active', true);
      
      if (error && error.code !== 'PGRST116') {
        console.error('❌ [DEBUG] Erro ao carregar planos:', error);
        throw error;
      }
      
      console.log('📊 [DEBUG] Dados brutos recebidos:', data);
      console.log('📊 [DEBUG] Quantidade de planos:', data?.length || 0);
      
      if (data && data.length > 0) {
        // Validar cada plano individualmente com logs detalhados
        data.forEach((plan, index) => {
          console.log(`🔍 [DEBUG] Plano ${index + 1}:`, {
            id: plan.id,
            plan_type: plan.plan_type,
            is_active: plan.is_active,
            has_plan_data: !!plan.plan_data,
            plan_data_type: typeof plan.plan_data,
            plan_data_length: plan.plan_data ? JSON.stringify(plan.plan_data).length : 0,
            created_at: plan.created_at
          });
        });

        const plansByType = data.reduce((acc, plan) => {
          // Validar se o plano tem dados válidos
          if (!plan.plan_data || typeof plan.plan_data !== 'object') {
            console.warn(`⚠️ [DEBUG] Plano ${plan.id} tem plan_data inválido, ignorando:`, {
              plan_data: plan.plan_data,
              type: typeof plan.plan_data
            });
            return acc;
          }

          // Verificar se o plan_data tem conteúdo útil
          const planDataStr = JSON.stringify(plan.plan_data);
          if (planDataStr === '{}' || planDataStr.length < 50) {
            console.warn(`⚠️ [DEBUG] Plano ${plan.id} tem plan_data vazio ou muito pequeno:`, {
              content: planDataStr,
              length: planDataStr.length
            });
            return acc;
          }

          // Mapeia o plan_type do banco para as chaves do nosso objeto
          const typeMap = {
            'hypertrophy': 'physical',
            'strength': 'physical',
            'endurance': 'physical',
            'nutritional': 'nutritional',
            'emotional': 'emotional',
            'spiritual': 'spiritual',
          };
          const planKey = typeMap[plan.plan_type] || 'physical'; // Default para físico
          acc[planKey] = plan;
          
          console.log(`✅ [DEBUG] Plano ${plan.id} mapeado para '${planKey}':`, {
            original_type: plan.plan_type,
            mapped_key: planKey,
            data_preview: JSON.stringify(plan.plan_data).substring(0, 100) + '...'
          });
          
          return acc;
        }, {});
        
        // Log para debug - ver quantos planos válidos temos
        console.log('✅ [DEBUG] Planos válidos carregados:', Object.keys(plansByType));
        console.log('✅ [DEBUG] Resumo dos planos:', plansByType);
        
        setCurrentPlans(plansByType);
      } else {
        console.log('Nenhum plano encontrado, exibindo estado vazio');
        setCurrentPlans({});
      }
    } catch (error) {
      console.error('Error loading current plans:', error);
      toast.error('Erro ao carregar seus planos.');
    } finally {
      setLoadingPlans(false);
    }
  }, [authUser?.id]);

  // Carrega histórico de planos
  const loadPlanHistory = useCallback(async () => {
    if (!authUser?.id) return;

    try {
      const { data, error } = await supabase
        .from('user_training_plans')
        .select('*')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      
      setPlanHistory(data || []);
    } catch (error) {
      console.error('Error loading plan history:', error);
    }
  }, [authUser?.id]);

  // Análise do perfil do usuário para personalização
  const analyzeUserProfile = useCallback((profile) => {
    const analysis = {
      experience_level: 'beginner',
      primary_goal: 'general_fitness',
      training_context: 'home',
      special_considerations: [],
      estimated_time_per_session: 45,
      preferred_frequency: 3
    };

    // Determina nível de experiência
    if (profile.activity_level) {
      const activityMap = {
        'sedentary': 'beginner',
        'light': 'beginner', 
        'moderate': 'intermediate',
        'very_active': 'intermediate',
        'super_active': 'advanced'
      };
      analysis.experience_level = activityMap[profile.activity_level] || 'beginner';
    }

    // Determina objetivo principal
    if (profile.goal_type) {
      const goalMap = {
        'lose_weight': 'fat_loss',
        'gain_muscle': 'hypertrophy',
        'improve_endurance': 'endurance',
        'increase_strength': 'strength',
        'general_health': 'general_fitness'
      };
      analysis.primary_goal = goalMap[profile.goal_type] || 'general_fitness';
    }

    // Considera idade para adaptações
    if (profile.age) {
      if (profile.age > 50) {
        analysis.special_considerations.push('joint_friendly_exercises');
        analysis.special_considerations.push('extended_warmup');
      }
      if (profile.age > 65) {
        analysis.special_considerations.push('balance_training');
        analysis.special_considerations.push('fall_prevention');
      }
    }

    // Considera peso para adaptações
    if (profile.current_weight && profile.target_weight) {
      const weightDiff = profile.target_weight - profile.current_weight;
      if (Math.abs(weightDiff) > 10) {
        analysis.special_considerations.push(
          weightDiff > 0 ? 'muscle_gain_focus' : 'fat_loss_focus'
        );
      }
    }

    return analysis;
  }, []);

  // Geração de plano personalizado via IA
  const generatePersonalizedPlan = useCallback(async () => {
    if (!authUser?.id) {
      toast.error('Usuário não autenticado');
      return { success: false };
    }

    try {
      setGeneratingPlan(true);
      toast.loading('Nossa IA está gerando seus 4 planos de transformação...');

      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profileError) throw profileError;

      const userAnalysis = analyzeUserProfile(profile);
      
      // --- Geração dos 4 Planos ---
      
      // 1. Plano Físico (lógica de mock simplificada)
      const physicalPlanData = {
        title: `Plano ${userAnalysis.primary_goal === 'hypertrophy' ? 'Hipertrofia' : 'Força'} Personalizado`,
        description: `Plano científico de 4 semanas para ${userAnalysis.primary_goal}`,
        duration_weeks: 4,
        weeks: [] // A lógica completa de geração de exercícios pode ser mantida aqui
      };
      const physicalPlan = {
        user_id: authUser.id,
        plan_data: physicalPlanData,
        plan_type: userAnalysis.primary_goal, // ex: 'hypertrophy'
        is_active: true,
        generated_by: 'ai_coach',
      };

      // 2. Plano Nutricional (mock)
      const nutritionalPlanData = generateMockNutritionalPlan(profile);
      const nutritionalPlan = {
        user_id: authUser.id,
        plan_data: nutritionalPlanData,
        plan_type: 'nutritional',
        is_active: true,
        generated_by: 'ai_coach',
      };

      // 3. Plano Emocional (mock)
      const emotionalPlanData = generateMockEmotionalPlan(profile);
      const emotionalPlan = {
        user_id: authUser.id,
        plan_data: emotionalPlanData,
        plan_type: 'emotional',
        is_active: true,
        generated_by: 'ai_coach',
      };

      // 4. Plano Espiritual (mock)
      const spiritualPlanData = generateMockSpiritualPlan(profile);
      const spiritualPlan = {
        user_id: authUser.id,
        plan_data: spiritualPlanData,
        plan_type: 'spiritual',
        is_active: true,
        generated_by: 'ai_coach',
      };

      // Desativa todos os planos antigos
      await supabase
        .from('user_training_plans')
        .update({ is_active: false })
        .eq('user_id', authUser.id);

      // Salva os 4 novos planos no banco
      const { data: savedPlans, error: saveError } = await supabase
        .from('user_training_plans')
        .insert([physicalPlan, nutritionalPlan, emotionalPlan, spiritualPlan])
        .select();

      if (saveError) throw saveError;

      // Atualiza o estado local
      await loadCurrentPlans();
      
      toast.dismiss();
      toast.success('🎉 Seus 4 planos de transformação foram gerados com sucesso!');
      
      return { success: true, plans: savedPlans };

    } catch (error) {
      console.error('Error generating personalized plans:', error);
      toast.dismiss();
      toast.error(`Erro ao gerar planos: ${error.message}`);
      return { success: false, error };
    } finally {
      setGeneratingPlan(false);
    }
  }, [authUser?.id, analyzeUserProfile, loadCurrentPlans]);

  // Effects
  useEffect(() => {
    if (authUser?.id) {
      loadCurrentPlans();
      // loadPlanHistory(); // Manter ou adaptar conforme necessidade
    } else {
      // Limpa os planos se o usuário deslogar
      setCurrentPlans({});
      setPlanHistory([]);
      setLoadingPlans(false);
    }
  }, [authUser?.id, loadCurrentPlans]);

  const value = useMemo(() => ({
    currentPlans,
    planHistory,
    loadingPlans,
    generatingPlan,
    generatePersonalizedPlan, // A função principal agora gera os 4 planos
    loadCurrentPlans,
    loadPlanHistory
  }), [
    currentPlans,
    planHistory, 
    loadingPlans,
    generatingPlan,
    generatePersonalizedPlan,
    loadCurrentPlans,
    loadPlanHistory
  ]);

  return (
    <PlansContext.Provider value={value}>
      {children}
    </PlansContext.Provider>
  );
};

export function usePlans() {
  const context = useContext(PlansContext);
  if (context === undefined) {
    throw new Error('usePlans must be used within a PlansProvider');
  }
  return context;
}

export default PlansContext;
