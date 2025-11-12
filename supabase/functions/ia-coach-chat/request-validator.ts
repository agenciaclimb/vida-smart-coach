/**
 * Request validation and parsing utilities
 */

import type { RequestBody, ValidationResult, RequestContext } from './types.ts';

/**
 * Validates and extracts data from the incoming request
 */
export async function validateAndParseRequest(
  req: Request,
  supabase: any,
  openaiKey: string
): Promise<ValidationResult> {
  // Validate OpenAI key
  if (!openaiKey) {
    return {
      valid: false,
      error: 'OpenAI API key not configured',
    };
  }

  // Parse body
  let body: RequestBody;
  try {
    body = await req.json();
  } catch (e1) {
    console.warn('Failed to parse JSON body, trying text:', e1);
    try {
      const text = await req.text();
      body = { message: text };
    } catch (e2) {
      console.warn('Body parse failed completely:', e1);
      return {
        valid: false,
        error: 'Invalid request body',
      };
    }
  }

  // Extract message
  const message = body.message || body.from || '';
  if (!message || typeof message !== 'string') {
    return {
      valid: false,
      error: 'Missing or invalid message',
    };
  }

  // Extract userId and phone
  const userId = body.userId || body.phone;
  const phone = body.phone || body.userId;

  if (!userId) {
    return {
      valid: false,
      error: 'Missing userId or phone',
    };
  }

  // Check internal call authentication
  const headers = req.headers;
  const providedSecret = headers.get('X-Internal-Secret') || '';
  const configuredSecret = Deno.env.get('INTERNAL_FUNCTION_SECRET') || '';
  const isInternalCall = configuredSecret && providedSecret === configuredSecret;

  return {
    valid: true,
    context: {
      userId,
      phone,
      message,
      body,
      headers,
      supabase,
      openaiKey,
      isInternalCall,
    },
  };
}

/**
 * Creates error response
 */
export function createErrorResponse(message: string, status = 400): Response {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Creates success response
 */
export function createSuccessResponse(data: any, status = 200): Response {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
