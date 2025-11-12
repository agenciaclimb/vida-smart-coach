/**
 * Stage routing and processing orchestration
 */

import type { RequestContext, StageResponse, ClientStage, UserContextData } from './types.ts';

/**
 * Routes the message to the appropriate stage processor
 */
export async function routeMessageByStage(
  context: RequestContext,
  userContext: UserContextData,
  stage: ClientStage,
  chatHistory: any[],
  conversationGuard: any,
  progressionCheck: any
): Promise<StageResponse> {
  const { message, supabase, openaiKey } = context;
  const stageForProcessing = progressionCheck?.targetStage || stage.stage;

  // Build context prompt
  const contextPrompt = await buildContextPromptForStage(
    stageForProcessing,
    userContext,
    chatHistory
  );

  // Get stage-specific configuration
  const stageConfig = getStageConfiguration(stageForProcessing, stage, conversationGuard);

  // Process with OpenAI
  const response = await processWithOpenAI(
    message,
    chatHistory,
    contextPrompt,
    stageConfig,
    openaiKey
  );

  // Determine if stage should change
  const newStage = determineStageTransition(
    response,
    stageForProcessing,
    stage,
    progressionCheck
  );

  return {
    response,
    newStage,
    metadata: {
      processedStage: stageForProcessing,
      originalStage: stage.stage,
      forced: progressionCheck?.shouldAdvance || false,
      guardReason: conversationGuard?.reason,
    },
  };
}

/**
 * Gets stage-specific configuration
 */
function getStageConfiguration(
  stage: string,
  clientStage: ClientStage,
  conversationGuard: any
): any {
  const metadata = clientStage.stage_metadata || {};

  return {
    stage,
    metadata,
    shouldForce: conversationGuard?.forceStage || false,
    temperature: 0.8,
    maxTokens: 800,
  };
}

/**
 * Determines if stage should transition
 */
function determineStageTransition(
  response: string,
  currentStage: string,
  clientStage: ClientStage,
  progressionCheck: any
): string | undefined {
  // If progression check indicated advance
  if (progressionCheck?.shouldAdvance && progressionCheck?.targetStage) {
    return progressionCheck.targetStage;
  }

  // Check response for stage transition indicators
  const normalizedResponse = response.toLowerCase();

  if (currentStage === 'SDR') {
    if (
      normalizedResponse.includes('vou te conectar com nosso especialista') ||
      normalizedResponse.includes('specialist')
    ) {
      return 'Specialist';
    }
  }

  if (currentStage === 'Specialist') {
    if (
      normalizedResponse.includes('testar gratuitamente') ||
      normalizedResponse.includes('seller') ||
      normalizedResponse.includes('planos foram gerados')
    ) {
      return 'Seller';
    }
  }

  if (currentStage === 'Seller') {
    if (
      normalizedResponse.includes('bem-vindo ao vida smart coach') ||
      normalizedResponse.includes('partner') ||
      normalizedResponse.includes('cadastro confirmado')
    ) {
      return 'Partner';
    }
  }

  return undefined;
}

/**
 * Placeholder for buildContextPromptForStage - to be extracted
 */
async function buildContextPromptForStage(
  stage: string,
  userContext: UserContextData,
  chatHistory: any[]
): Promise<string> {
  // This will be implemented properly when refactoring buildContextPrompt
  return `Processing stage: ${stage}`;
}

/**
 * Placeholder for processWithOpenAI - to be extracted
 */
async function processWithOpenAI(
  message: string,
  chatHistory: any[],
  contextPrompt: string,
  stageConfig: any,
  openaiKey: string
): Promise<string> {
  // This will be implemented properly
  return 'AI response placeholder';
}
