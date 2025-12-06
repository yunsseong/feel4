/**
 * Get fetch options with authentication
 * - Web: Uses credentials: 'include' for cookie
 * - Mobile: Would add Authorization header with token (when Capacitor is installed)
 */
export async function getAuthFetchOptions(options?: RequestInit): Promise<RequestInit> {
  // For now, web-only implementation using cookies
  // Mobile support can be added later when Capacitor is configured
  return {
    ...options,
    credentials: 'include' as RequestCredentials,
    headers: {
      ...options?.headers,
    },
  };
}

/**
 * Save authentication token
 * Currently a no-op for web (uses HttpOnly cookie set by backend)
 */
export async function saveToken(token: string): Promise<void> {
  // Web uses HttpOnly cookie set by backend
  // Mobile implementation would use Capacitor Preferences
}

/**
 * Get authentication token
 * Returns null for web (uses cookie automatically)
 */
export async function getToken(): Promise<string | null> {
  // Web uses cookie automatically
  return null;
}

/**
 * Clear authentication token
 * Currently a no-op for web (cookie cleared by backend /auth/logout)
 */
export async function clearToken(): Promise<void> {
  // Web cookie cleared by backend /auth/logout
  // Mobile implementation would use Capacitor Preferences
}
