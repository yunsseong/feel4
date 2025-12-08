import { Capacitor } from '@capacitor/core';
import { getAuthFetchOptions } from './mobile-auth';

/**
 * Get the appropriate API URL based on environment
 * - Development web: http://localhost:3201
 * - Production web: from NEXT_PUBLIC_API_URL
 * - Mobile (dev): http://localhost:3201 (or your computer's IP)
 * - Mobile (prod): production API URL
 */
export function getApiUrl(): string {
  const isNative = Capacitor.isNativePlatform();
  const envApiUrl = process.env.NEXT_PUBLIC_API_URL;
  const devMobileApiUrl = process.env.NEXT_PUBLIC_MOBILE_DEV_API_URL;

  console.log('[API Config] isNative:', isNative);
  console.log('[API Config] envApiUrl:', envApiUrl);
  console.log('[API Config] devMobileApiUrl:', devMobileApiUrl);

  // Mobile development
  if (isNative) {
    const url = devMobileApiUrl || envApiUrl || 'http://10.0.2.2:3201'; // 10.0.2.2 is emulator's host
    console.log('[API Config] Using mobile URL:', url);
    return url;
  }

  // Web development
  const url = envApiUrl || 'http://localhost:3201';
  console.log('[API Config] Using web URL:', url);
  return url;
}

/**
 * API Error class for better error handling
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: unknown
  ) {
    super(`API Error ${status}: ${statusText}`);
    this.name = 'ApiError';
  }
}

/**
 * Network error class
 */
export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

/**
 * Retry configuration
 */
interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  retryCondition?: (error: Error) => boolean;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  retryCondition: (error) => error instanceof NetworkError,
};

/**
 * Create fetch with automatic API URL and error handling
 */
export async function apiFetch(
  endpoint: string,
  options?: RequestInit,
  retryConfig: Partial<RetryConfig> = {}
): Promise<Response> {
  const apiUrl = getApiUrl();
  const url = endpoint.startsWith('http') ? endpoint : `${apiUrl}${endpoint}`;
  const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      // Get platform-specific auth options (web: cookie, mobile: Bearer token)
      const authOptions = await getAuthFetchOptions(options);

      const response = await fetch(url, {
        ...authOptions,
        headers: {
          'Content-Type': 'application/json',
          ...authOptions?.headers,
        },
      });

      // Handle HTTP errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new ApiError(response.status, response.statusText, errorData);
      }

      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        // Don't retry API errors (4xx, 5xx)
        throw error;
      }

      // Network error
      const networkError = new NetworkError(
        error instanceof Error ? error.message : 'Network request failed'
      );
      lastError = networkError;

      // Check if we should retry
      if (
        attempt < config.maxRetries &&
        (!config.retryCondition || config.retryCondition(networkError))
      ) {
        // Wait before retrying
        await new Promise((resolve) =>
          setTimeout(resolve, config.retryDelay * (attempt + 1))
        );
        continue;
      }

      throw networkError;
    }
  }

  throw lastError || new NetworkError('Request failed after retries');
}

/**
 * Type-safe API fetch with JSON parsing
 */
export async function apiFetchJson<T = unknown>(
  endpoint: string,
  options?: RequestInit,
  retryConfig?: Partial<RetryConfig>
): Promise<T> {
  const response = await apiFetch(endpoint, options, retryConfig);
  return response.json();
}

/**
 * Check if API is reachable
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await apiFetch('/health', {
      method: 'GET',
    });
    return response.ok;
  } catch {
    return false;
  }
}
