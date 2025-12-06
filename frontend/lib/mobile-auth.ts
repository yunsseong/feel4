import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

const TOKEN_KEY = 'accessToken';

/**
 * Save authentication token
 * - Web: Uses HttpOnly cookie (set by backend)
 * - Mobile: Uses Capacitor Preferences
 */
export async function saveToken(token: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await Preferences.set({ key: TOKEN_KEY, value: token });
  }
  // Web uses HttpOnly cookie set by backend
}

/**
 * Get authentication token
 * - Web: Returns null (uses cookie automatically)
 * - Mobile: Returns token from Preferences
 */
export async function getToken(): Promise<string | null> {
  if (Capacitor.isNativePlatform()) {
    const { value } = await Preferences.get({ key: TOKEN_KEY });
    return value;
  }
  // Web uses cookie automatically
  return null;
}

/**
 * Clear authentication token
 */
export async function clearToken(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await Preferences.remove({ key: TOKEN_KEY });
  }
  // Web cookie cleared by backend /auth/logout
}

/**
 * Get fetch options with authentication
 * - Web: Uses credentials: 'include' for cookie
 * - Mobile: Adds Authorization header with token
 */
export async function getAuthFetchOptions(options?: RequestInit): Promise<RequestInit> {
  const isNative = Capacitor.isNativePlatform();

  if (isNative) {
    const token = await getToken();
    return {
      ...options,
      headers: {
        ...options?.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };
  }

  // Web: use cookies
  return {
    ...options,
    credentials: 'include',
  };
}
