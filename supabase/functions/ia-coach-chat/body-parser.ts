/**
 * Body parsing utilities with fallback handling
 */

export interface ParsedBody {
  messageContent: string;
  userProfile: any;
  chatHistory?: any[];
}

/**
 * Parses request body with safe fallbacks
 */
export async function parseRequestBody(req: Request): Promise<ParsedBody | null> {
  let parsed: any = null;

  try {
    parsed = await req.json();
  } catch (e1) {
    try {
      const txt = await req.text();
      if (txt) {
        parsed = JSON.parse(txt);
      }
    } catch (e2) {
      console.warn('Body parse failed:', e1);
      return null;
    }
  }

  if (!parsed || typeof parsed !== 'object') {
    return null;
  }

  return parsed;
}

/**
 * Validates required fields in parsed body
 */
export function validateRequiredFields(
  body: any
): { valid: boolean; error?: string } {
  const { messageContent, userProfile } = body;

  if (!messageContent || !userProfile) {
    return {
      valid: false,
      error: 'Mensagem e perfil do usuário são obrigatórios',
    };
  }

  return { valid: true };
}
