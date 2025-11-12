import { DEFAULT_STAGE_RUNTIME_CONFIG } from './runtime-config.ts';
import type { StageRuntimeConfig } from './runtime-config.ts';

type StageDetectionInput = {
  message: string;
  chatHistory?: any[];
  userProfile?: any;
  currentStage?: any;
  config?: StageRuntimeConfig;
};

type StageSignalSnapshot = {
  partner: number;
  seller: number;
  specialist: number;
  sdr: number;
  planAdjustmentIntent: boolean;
  interestKeywords: boolean;
  planKeywords: boolean;
};

export type StageDetectionResult = {
  stage: string | null;
  confidence: number;
  metrics: StageSignalSnapshot;
  reason?: string;
};

export function detectStage(input: StageDetectionInput): StageDetectionResult {
  const {
    message,
    chatHistory = [],
    config = DEFAULT_STAGE_RUNTIME_CONFIG,
  } = input;

  const msgLower = message.toLowerCase();

  const partnerSignals = [
    msgLower.includes('check-in'),
    msgLower.includes('como foi'),
    msgLower.includes('consegui'),
    msgLower.includes('fiz o treino'),
    msgLower.includes('bebi água'),
    msgLower.includes('segui o plano'),
    msgLower.includes('como estou'),
    chatHistory.length >= 5,
  ];

  const sellerSignals = [
    msgLower.includes('quero testar'),
    msgLower.includes('teste grátis'),
    msgLower.includes('como funciona'),
    msgLower.includes('quanto custa'),
    msgLower.includes('preço'),
    msgLower.includes('assinar'),
    msgLower.includes('começar'),
    msgLower.includes('cadastro'),
    msgLower.includes('quero começar'),
  ];

  const specialistSignals = [
    msgLower.includes('preciso de ajuda'),
    msgLower.includes('estou com dificuldade'),
    msgLower.includes('não consigo'),
    msgLower.includes('problema com'),
    msgLower.includes('tenho lutado'),
    msgLower.includes('ansiedade'),
    msgLower.includes('depressão'),
    msgLower.includes('peso'),
    msgLower.includes('alimentação'),
    msgLower.includes('físico'),
    msgLower.includes('emocional'),
    extractPainLevel(message) >= 7,
  ];

  const sdrSignals = [
    msgLower.includes('oi'),
    msgLower.includes('olá'),
    msgLower.includes('bom dia'),
    msgLower.includes('boa tarde'),
    msgLower.includes('boa noite'),
    msgLower.includes('o que é'),
    msgLower.includes('me fale sobre'),
    message.length < 50 && !msgLower.includes('não'),
  ];

  const partnerCount = partnerSignals.filter(Boolean).length;
  const sellerCount = sellerSignals.filter(Boolean).length;
  const specialistCount = specialistSignals.filter(Boolean).length;
  const sdrCount = sdrSignals.filter(Boolean).length;

  const interestKeywords = /(quero|preciso|ajuda|ajudar|melhorar|arrumar|corrigir)/.test(msgLower);
  const planKeywords = /(plano|treino|dieta|rotina|cardapio)/.test(msgLower);
  const planAdjustmentIntent =
    (/\b(ajustar|ajuste|mudar|alterar|regenerar|refazer|recriar)\b/.test(msgLower) && planKeywords) ||
    /\bnovo\s+plano\b/.test(msgLower);

  let detectedStage: string | null = null;

  if (partnerCount >= 2) detectedStage = 'partner';
  else if (sellerCount >= 2) detectedStage = 'seller';
  else if (specialistCount >= 2) detectedStage = 'specialist';
  else if (sdrCount >= 2) detectedStage = 'sdr';

  if (!detectedStage && config.enableStageHeuristics) {
    if (planAdjustmentIntent || (specialistCount >= 1 && interestKeywords && planKeywords)) {
      detectedStage = 'specialist';
    }
  }

  const metrics: StageSignalSnapshot = {
    partner: partnerCount,
    seller: sellerCount,
    specialist: specialistCount,
    sdr: sdrCount,
    planAdjustmentIntent,
    interestKeywords,
    planKeywords,
  };

  const confidence = computeConfidence(detectedStage, metrics);

  if (config.debugStageMetrics) {
    const preview = message.replace(/\s+/g, ' ').slice(0, 120);
    console.log(
      JSON.stringify({
        stage_metrics: {
          preview,
          counts: metrics,
          enableStageHeuristicsV2: config.enableStageHeuristics,
          detectedStage,
          confidence,
        },
      }),
    );
  }

  return { stage: detectedStage, confidence, metrics };
}

function computeConfidence(stage: string | null, metrics: StageSignalSnapshot): number {
  if (!stage) return 0;
  const signalStrength = metrics[stage as keyof StageSignalSnapshot];
  if (typeof signalStrength !== 'number') {
    return metrics.planAdjustmentIntent ? 0.6 : 0.4;
  }
  const normalized = Math.min(1, signalStrength / 3);
  const bonus = metrics.planAdjustmentIntent && stage === 'specialist' ? 0.2 : 0;
  return Math.min(1, normalized + bonus);
}

function extractPainLevel(message: string): number {
  const match = message.match(/(\d+)\/10|(\d+) de 10|nível (\d+)/i);
  if (match) {
    return parseInt(match[1] || match[2] || match[3]);
  }

  const lower = message.toLowerCase();
  if (lower.includes('muito') || lower.includes('demais')) return 8;
  if (lower.includes('bastante') || lower.includes('bem')) return 7;
  if (lower.includes('um pouco') || lower.includes('às vezes')) return 4;

  return 5;
}
