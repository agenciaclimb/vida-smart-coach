/**
 * Authentication and authorization utilities
 */

/**
 * Validates internal call or authentication header
 */
export function validateAuthentication(
  headers: Headers
): { authorized: boolean; error?: string } {
  const configuredSecret = Deno.env.get('INTERNAL_FUNCTION_SECRET') || '';
  const callerSecret = headers.get('x-internal-secret') || '';
  const authHeader = headers.get('authorization') || '';

  // If secret is configured and doesn't match
  if (configuredSecret && callerSecret !== configuredSecret) {
    // Allow if has valid Authorization header (authenticated frontend calls)
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        authorized: false,
        error: 'Unauthorized: missing auth or secret',
      };
    }
  }

  return { authorized: true };
}

/**
 * Checks if debug stage mode is enabled
 */
export function isDebugModeEnabled(url: URL, headers: Headers): boolean {
  return (
    url.searchParams.get('debugStage') === '1' ||
    headers.get('x-debug-stage') === '1'
  );
}

/**
 * Checks if offline mode is forced
 */
export function isOfflineModeForced(url: URL, headers: Headers): boolean {
  return (
    url.searchParams.get('forceOffline') === '1' ||
    headers.get('x-force-offline') === '1'
  );
}
