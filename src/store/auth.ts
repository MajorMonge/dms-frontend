import { atom } from 'nanostores';
import { persistentAtom } from '@nanostores/persistent';
import type { User, AuthTokens } from '@/types/api';

// ============= Types =============

export interface AuthState {
    user: User | null;
    tokens: AuthTokens | null;
    isAuthenticated: boolean;
}

// ============= Stores =============

/**
 * Persistent auth store that syncs with localStorage
 */
export const authStore = persistentAtom<AuthState>(
    'auth',
    {
        user: null,
        tokens: null,
        isAuthenticated: false,
    },
    {
        encode: JSON.stringify,
        decode: JSON.parse,
    }
);

/**
 * Separate persistent token store for easy access
 * (Kept separate for backward compatibility with api-client)
 */
export const accessTokenStore = atom<string | null>(null);

// ============= Actions =============

/**
 * Set user and tokens after successful login
 */
export function setAuthData(user: User, tokens: AuthTokens): void {
    authStore.set({
        user,
        tokens,
        isAuthenticated: true,
    });

    // Update token atom for real-time access
    accessTokenStore.set(tokens.accessToken);

    // Store in localStorage for api-client backward compatibility
    if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        localStorage.setItem('idToken', tokens.idToken);
    }
}

/**
 * Update tokens (e.g., after refresh)
 */
export function updateTokens(tokens: AuthTokens): void {
    const current = authStore.get();
    authStore.set({
        ...current,
        tokens,
    });

    accessTokenStore.set(tokens.accessToken);

    if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        localStorage.setItem('idToken', tokens.idToken);
    }
}

/**
 * Update user info
 */
export function updateUser(user: Partial<User>): void {
    const current = authStore.get();
    if (current.user) {
        authStore.set({
            ...current,
            user: { ...current.user, ...user },
        });
    }
}

/**
 * Clear all auth data (logout)
 */
export function clearAuth(): void {
    authStore.set({
        user: null,
        tokens: null,
        isAuthenticated: false,
    });

    accessTokenStore.set(null);

    if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('idToken');
    }
}

/**
 * Get current access token
 */
export function getAccessToken(): string | null {
    const state = authStore.get();
    return state.tokens?.accessToken ?? null;
}

/**
 * Get current refresh token
 */
export function getRefreshToken(): string | null {
    const state = authStore.get();
    return state.tokens?.refreshToken ?? null;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
    return authStore.get().isAuthenticated;
}

/**
 * Get current user
 */
export function getCurrentUser(): User | null {
    return authStore.get().user;
}
