/**
 * Response building utilities
 */

/**
 * Builds successful response with AI reply
 */
export function buildSuccessResponse(
  finalReply: string,
  activeStage: string,
  debugStage: boolean,
    debugData: any | null,
  headers: Record<string, string>
): Response {
  const responseBody: any = {
    reply: finalReply,
    stage: activeStage,
    timestamp: new Date().toISOString(),
    model: 'gpt-4o-mini',
  };

  if (debugStage && debugData) {
    responseBody.debugStage = debugData;
  }

  return new Response(JSON.stringify(responseBody), {
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}

/**
 * Builds error response
 */
export function buildErrorResponse(
  message: string,
  details: string,
  status: number,
  headers: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({
      error: message,
      details,
    }),
    {
      status,
      headers: { ...headers, 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Builds debug data object
 */
export function buildDebugData(
  detectedStage: string,
  clientStage: any,
  stageDetection: any,
  conversationGuard: any
): any {
  return {
    detectedStage,
    persistedStage: clientStage.current_stage,
    confidence: stageDetection.confidence,
    metrics: stageDetection.metrics,
    reason: stageDetection.reason || null,
    guardIssues: conversationGuard.issues,
    guardHints: conversationGuard.hints,
  };
}
