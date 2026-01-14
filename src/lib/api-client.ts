import { getAccessToken, getRefreshToken, updateTokens, clearAuth } from '@/store/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export class ApiClientError extends Error {
    constructor(
        message: string,
        public code: string,
        public status?: number,
        public details?: unknown[]
    ) {
        super(message);
        this.name = 'ApiClientError';
    }
}

export interface RequestOptions extends RequestInit {
    requiresAuth?: boolean;
    skipRefresh?: boolean; // Prevent infinite refresh loops
}

// Track ongoing refresh to prevent concurrent refresh attempts
let refreshPromise: Promise<boolean> | null = null;

/**
 * Attempt to refresh the access token
 */
async function attemptTokenRefresh(): Promise<boolean> {
    // If already refreshing, wait for that to complete
    if (refreshPromise) {
        return refreshPromise;
    }

    const refreshTokenValue = getRefreshToken();
    if (!refreshTokenValue) {
        return false;
    }

    refreshPromise = (async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: refreshTokenValue }),
            });

            const data = await response.json();

            if (data.success && data.data?.tokens) {
                updateTokens(data.data.tokens);
                return true;
            } else {
                // Refresh failed, clear auth state
                clearAuth();
                return false;
            }
        } catch (error) {
            console.error('Token refresh failed:', error);
            return false;
        } finally {
            refreshPromise = null;
        }
    })();

    return refreshPromise;
}

/**
 * Base API client for making HTTP requests
 */
export async function apiClient<T>(
    endpoint: string,
    options: RequestOptions = {}
): Promise<T> {
    const { requiresAuth = true, skipRefresh = false, headers = {}, ...fetchOptions } = options;

    const url = `${API_BASE_URL}${endpoint}`;

    const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(headers as Record<string, string>),
    };

    // Add auth token if required
    if (requiresAuth) {
        const token = getAccessToken();
        if (token) {
            requestHeaders['Authorization'] = `Bearer ${token}`;
        }
    }

    try {
        const response = await fetch(url, {
            ...fetchOptions,
            headers: requestHeaders,
            cache: 'no-store',
        });

        // Handle 401 Unauthorized - attempt token refresh
        if (response.status === 401 && requiresAuth && !skipRefresh) {
            const refreshed = await attemptTokenRefresh();
            
            if (refreshed) {
                // Retry the original request with new token
                const newToken = getAccessToken();
                if (newToken) {
                    requestHeaders['Authorization'] = `Bearer ${newToken}`;
                }
                
                const retryResponse = await fetch(url, {
                    ...fetchOptions,
                    headers: requestHeaders,
                });
                
                // Handle empty response (204 No Content)
                if (retryResponse.status === 204 || retryResponse.headers.get('content-length') === '0') {
                    return undefined as T;
                }
                
                const retryData = await retryResponse.json();
                return retryData;
            } else {
                // Refresh failed, throw auth error
                throw new ApiClientError(
                    'Session expired. Please log in again.',
                    'AUTH_EXPIRED',
                    401
                );
            }
        }

        // Handle empty response (204 No Content)
        if (response.status === 204 || response.headers.get('content-length') === '0') {
            return undefined as T;
        }

        const data = await response.json();

        // Return response regardless of status code
        // Let the application handle success/failure based on response content
        return data;
    } catch (error) {
        if (error instanceof ApiClientError) {
            throw error;
        }
        // Only throw for network or parsing errors
        throw new ApiClientError(
            error instanceof Error ? error.message : 'Network error',
            'NETWORK_ERROR'
        );
    }
}

/**
 * Typed GET request
 */
export function get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return apiClient<T>(endpoint, { ...options, method: 'GET' });
}

/**
 * Typed POST request
 */
export function post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return apiClient<T>(endpoint, {
        ...options,
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
    });
}

/**
 * Typed PATCH request
 */
export function patch<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return apiClient<T>(endpoint, {
        ...options,
        method: 'PATCH',
        body: body ? JSON.stringify(body) : undefined,
    });
}

/**
 * Typed DELETE request
 */
export function del<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return apiClient<T>(endpoint, { ...options, method: 'DELETE' });
}
