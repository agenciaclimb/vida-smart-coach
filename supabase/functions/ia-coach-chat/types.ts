/**
 * Types and interfaces for IA Coach Chat
 */

export interface RequestContext {
  userId: string;
  phone?: string;
  message: string;
  body: RequestBody;
  headers: Headers;
  supabase: any;
  openaiKey: string;
  isInternalCall: boolean;
}

export interface RequestBody {
  message: string;
  phone?: string;
  userId?: string;
  from?: string;
  automation_trigger?: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  context?: Partial<RequestContext>;
}

export interface StageResponse {
  response: string;
  newStage?: string;
  metadata?: Record<string, any>;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export interface UserContextData {
  userId: string;
  phone?: string;
  profile?: any;
  currentPlans?: any[];
  activePlans?: any[];
  gamification?: any;
  conversationMemory?: any;
  activities?: any[];
  missions?: any[];
  goals?: any[];
  pendingFeedback?: any[];
  recentActivities?: any[];
  currentStreak?: number;
}

export interface ClientStage {
  id: string;
  user_id: string;
  stage: string;
  stage_metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ConversationGuard {
  shouldBlock: boolean;
  reason?: string;
  forceStage?: boolean;
  suggestion?: string;
}

export interface ProgressionCheck {
  shouldAdvance: boolean;
  targetStage?: string;
  reason?: string;
}

export interface AutomationContext {
  userId: string;
  supabase: any;
  userContext: UserContextData;
}

export interface AutomationAction {
  type: string;
  params?: Record<string, any>;
}

export interface AutomationExecutionResult {
  success: boolean;
  message?: string;
  data?: any;
}
