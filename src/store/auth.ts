import { atom } from 'nanostores';
import { persistentAtom } from '@nanostores/persistent';
import type { User, UserProfile, AuthTokens } from '@/types/api';

// ============= Types =============

export interface AuthState {
    user: UserProfile | null;
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
 * Note: This sets basic user info, call updateUserProfile for full profile
 */
export function setAuthData(user: User, tokens: AuthTokens): void {
    const userProfile: UserProfile = {
        ...user,
        storageUsed: 0,
        storageLimit: 5 * 1024 * 1024 * 1024, // 5GB default
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    authStore.set({
        user: userProfile,
        tokens,
        isAuthenticated: true,
    });

    accessTokenStore.set(tokens.accessToken);

    if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        localStorage.setItem('idToken', tokens.idToken);
    }
}

/**
 * Update user profile with full data from /users/me endpoint
 */
export function updateUserProfile(profile: UserProfile): void {
    const current = authStore.get();
    authStore.set({
        ...current,
        user: profile,
    });
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
 * Update user storage info (after uploads, etc.)
 */
export function updateUserStorage(storageUsed: number): void {
    const current = authStore.get();
    if (current.user) {
        authStore.set({
            ...current,
            user: { ...current.user, storageUsed },
        });
    }
}

/**
 * Update user info (partial update)
 */
export function updateUser(user: Partial<UserProfile>): void {
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
export function getCurrentUser(): UserProfile | null {
    return authStore.get().user;
}

// ============= Helpers =============

/**
 * Get user initials from email
 */
export function getUserInitials(user: UserProfile | null): string {
    if (!user?.email) return '?';
    
    const email = user.email;
    
    const name = email.split('@')[0];
    
    const parts = name.split(/[._-]/);
    if (parts.length > 1) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    
    return name.slice(0, 2).toUpperCase();
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Get storage percentage used
 */
export function getStoragePercentage(user: UserProfile | null): number {
    if (!user || !user.storageLimit) return 0;
    return Math.round((user.storageUsed / user.storageLimit) * 100);
}
