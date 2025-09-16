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

export const PlansProvider = ({ children }) => {
  const { user } = useAuth();
  const [currentPlan, setCurrentPlan] = useState(null);
  const [planHistory, setPlanHistory] = useState([]);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [generatingPlan, setGeneratingPlan] = useState(false);

  // Carrega plano atual do usuário
  const loadCurrentPlan = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoadingPlan(true);
      
      const { data, error } = await supabase
        .from('user_training_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error && error.code !== 'PGRST116') throw error;
      
      if (data && data.length > 0) {
        setCurrentPlan(data[0]);
      }
    } catch (error) {
      console.error('Error loading current plan:', error);
    } finally {
      setLoadingPlan(false);
    }
  }, [user?.id]);

  // Carrega histórico de planos
  const loadPlanHistory = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('user_training_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      
      setPlanHistory(data || []);
    } catch (error) {
      console.error('Error loading plan history:', error);
    }
  }, [user?.id]);

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
    if (!user?.id) {
      toast.error('Usuário não autenticado');
      return { success: false };
    }

    try {
      setGeneratingPlan(true);

      // 1. Busca dados do perfil do usuário
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // 2. Analisa perfil para personalização
      const userAnalysis = analyzeUserProfile(profile);

      // 3. Seleciona prompt científico baseado no perfil
      let selectedPrompt = ADVANCED_TRAINING_PROMPTS.strength.beginner;
      
      if (userAnalysis.primary_goal === 'hypertrophy') {
        selectedPrompt = ADVANCED_TRAINING_PROMPTS.hypertrophy[userAnalysis.experience_level];
      } else if (userAnalysis.primary_goal === 'endurance') {
        selectedPrompt = ADVANCED_TRAINING_PROMPTS.endurance[userAnalysis.experience_level];
      } else if (userAnalysis.primary_goal === 'strength') {
        selectedPrompt = ADVANCED_TRAINING_PROMPTS.strength[userAnalysis.experience_level];
      }

      // 4. Constrói prompt personalizado completo
      const fullPrompt = `${selectedPrompt}

PERFIL DO USUÁRIO:
- Nome: ${profile.name}
- Idade: ${profile.age || 'não informado'} anos
- Peso atual: ${profile.current_weight || 'não informado'} kg
- Peso alvo: ${profile.target_weight || 'não informado'} kg
- Altura: ${profile.height || 'não informado'} cm
- Nível atividade: ${profile.activity_level || 'não informado'}
- Objetivo: ${profile.goal_type || 'não informado'}
- Experiência estimada: ${userAnalysis.experience_level}
- Contexto treino: ${userAnalysis.training_context}
- Tempo disponível: ${userAnalysis.estimated_time_per_session} min/sessão
- Frequência preferida: ${userAnalysis.preferred_frequency}x/semana
- Considerações especiais: ${userAnalysis.special_considerations.join(', ') || 'nenhuma'}

REQUISITOS DO PLANO:
1. Gere um plano de 4 semanas com periodização científica
2. Cada semana deve ter 3-5 dias de treino
3. Cada exercício deve incluir: nome, séries, repetições, descanso, observações técnicas
4. Base tudo em evidências científicas recentes (2020-2025)
5. Inclua progressão semanal clara
6. Adapte para equipamentos disponíveis em casa/academia
7. Considere limitações e objetivos específicos do usuário

FORMATO DE RESPOSTA EM JSON:
{
  "title": "Nome do Plano Personalizado",
  "description": "Descrição científica do plano",
  "duration_weeks": 4,
  "scientific_basis": "Base científica resumida",
  "weeks": [
    {
      "week": 1,
      "summary": "Resumo da semana",
      "focus": "Foco principal da semana",
      "days": [
        {
          "day": 1,
          "focus": "Foco do dia",
          "exercises": [
            {
              "name": "Nome do exercício",
              "sets": 3,
              "reps": "8-12",
              "rest_seconds": 90,
              "intensity": "RPE 7-8",
              "observation": "Observação técnica científica"
            }
          ]
        }
      ]
    }
  ]
}`;

      // 5. Simula chamada de IA (aqui você integraria com OpenAI, Claude, etc.)
      console.log('🤖 Gerando plano personalizado com IA...', { userAnalysis, prompt: fullPrompt.substring(0, 200) });
      
      // Simular delay de IA
      await new Promise(resolve => setTimeout(resolve, 3000));

      // 6. Mock do plano gerado (substituir por chamada real de IA)
      const generatedPlan = {
        title: `Plano ${userAnalysis.primary_goal === 'hypertrophy' ? 'Hipertrofia' : 'Força'} Personalizado - ${profile.name}`,
        description: `Plano científico de 4 semanas baseado em periodização ${userAnalysis.experience_level === 'beginner' ? 'linear' : 'undulante'} para ${userAnalysis.primary_goal}`,
        duration_weeks: 4,
        scientific_basis: `Baseado em Schoenfeld et al. (2021), ACSM Guidelines (2022) e princípios de ${userAnalysis.experience_level === 'advanced' ? 'auto-regulação' : 'sobrecarga progressiva'}`,
        weeks: Array.from({ length: 4 }, (_, weekIndex) => ({
          week: weekIndex + 1,
          summary: `Semana ${weekIndex + 1}: ${['Adaptação', 'Intensificação', 'Sobrecarga', 'Deload'][weekIndex]}`,
          focus: ['Base técnica e adaptação', 'Aumento do volume', 'Intensificação progressiva', 'Recuperação ativa'][weekIndex],
          days: Array.from({ length: userAnalysis.preferred_frequency }, (_, dayIndex) => ({
            day: dayIndex + 1,
            focus: ['Corpo superior', 'Corpo inferior', 'Full body', 'Core + cardio', 'Funcional'][dayIndex % 5],
            exercises: generateExercisesForDay(userAnalysis, weekIndex + 1, dayIndex + 1)
          }))
        }))
      };

      // 7. Salva plano no banco
      const { data: savedPlan, error: saveError } = await supabase
        .from('user_training_plans')
        .insert({
          user_id: user.id,
          plan_data: generatedPlan,
          plan_type: userAnalysis.primary_goal,
          experience_level: userAnalysis.experience_level,
          is_active: true,
          generated_by: 'ai_coach',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (saveError) throw saveError;

      // 8. Desativa planos anteriores
      await supabase
        .from('user_training_plans')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .neq('id', savedPlan.id);

      setCurrentPlan(savedPlan);
      toast.success('🎉 Plano personalizado gerado com sucesso!');
      
      return { success: true, plan: savedPlan };

    } catch (error) {
      console.error('Error generating personalized plan:', error);
      toast.error(`Erro ao gerar plano: ${error.message}`);
      return { success: false, error };
    } finally {
      setGeneratingPlan(false);
    }
  }, [user?.id, analyzeUserProfile]);

  // Função auxiliar para gerar exercícios por dia
  const generateExercisesForDay = (userAnalysis, week, day) => {
    const baseExercises = {
      upper: [
        { name: 'Flexão de braço', sets: 3, reps: '8-12', rest_seconds: 60 },
        { name: 'Remada com elástico', sets: 3, reps: '10-15', rest_seconds: 60 },
        { name: 'Desenvolvimento de ombros', sets: 3, reps: '8-12', rest_seconds: 75 }
      ],
      lower: [
        { name: 'Agachamento livre', sets: 4, reps: '10-15', rest_seconds: 90 },
        { name: 'Avanço alternado', sets: 3, reps: '8 cada perna', rest_seconds: 60 },
        { name: 'Ponte glútea', sets: 3, reps: '12-18', rest_seconds: 45 }
      ],
      full: [
        { name: 'Burpee modificado', sets: 3, reps: '5-8', rest_seconds: 120 },
        { name: 'Mountain climber', sets: 3, reps: '20 total', rest_seconds: 45 },
        { name: 'Prancha', sets: 3, reps: '30-60s', rest_seconds: 60 }
      ]
    };

    const dayType = ['upper', 'lower', 'full'][day % 3];
    const exercises = baseExercises[dayType] || baseExercises.full;

    return exercises.map(ex => ({
      ...ex,
      intensity: userAnalysis.experience_level === 'beginner' ? 'RPE 6-7' : 'RPE 7-8',
      observation: `Semana ${week}: ${userAnalysis.experience_level === 'beginner' ? 'Foque na técnica' : 'Aumente carga/complexidade'}`
    }));
  };

  // Effects
  useEffect(() => {
    if (user?.id) {
      loadCurrentPlan();
      loadPlanHistory();
    }
  }, [user?.id, loadCurrentPlan, loadPlanHistory]);

  const value = useMemo(() => ({
    currentPlan,
    planHistory,
    loadingPlan,
    generatingPlan,
    generatePersonalizedPlan,
    loadCurrentPlan,
    loadPlanHistory
  }), [
    currentPlan,
    planHistory, 
    loadingPlan,
    generatingPlan,
    generatePersonalizedPlan,
    loadCurrentPlan,
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