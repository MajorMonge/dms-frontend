import { getAccessToken } from '@/store/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export class ApiClientError extends Error {
    constructor(
        message: string,
        public code: string,
        public details?: unknown[]
    ) {
        super(message);
        this.name = 'ApiClientError';
    }
}

export interface RequestOptions extends RequestInit {
    requiresAuth?: boolean;
}

/**
 * Base API client for making HTTP requests
 */
export async function apiClient<T>(
    endpoint: string,
    options: RequestOptions = {}
): Promise<T> {
    const { requiresAuth = true, headers = {}, ...fetchOptions } = options;

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
        });

        const data = await response.json();

        // Return response regardless of status code
        // Let the application handle success/failure based on response content
        return data;
    } catch (error) {
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
