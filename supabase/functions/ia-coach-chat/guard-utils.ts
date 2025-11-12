/**
 * Guard action determination utilities
 */

/**
 * Determines guard action based on conversation guard state
 */
export function determineGuardAction(
  conversationGuard: any,
  stageForProcessing: string
): string {
  if (conversationGuard.blockReply) {
    return 'block_reply';
  }
  
  if (conversationGuard.forceStage) {
    return `force_stage:${stageForProcessing}`;
  }
  
  return 'none';
}

/**
 * Merges metadata with empty object fallback
 */
export function safeMetadataMerge(baseMetadata: any): any {
  return baseMetadata || {};
}
