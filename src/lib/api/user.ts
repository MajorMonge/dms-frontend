import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { get } from '@/lib/api-client';
import { updateUserProfile } from '@/store/auth';
import type { UserProfile, StorageInfo, MutationResponse } from '@/types/api';
import { ApiClientError } from '@/lib/api-client';

const STALE_TIME_USER_PROFILE = 5 * 60 * 1000;
const STALE_TIME_STORAGE_INFO = 1 * 60 * 1000;

// ============= API Functions =============

/**
 * Get current user profile
 */
export async function getCurrentUserProfile(): Promise<MutationResponse<UserProfile>> {
    return get<MutationResponse<UserProfile>>('/api/v1/users/me', {
        requiresAuth: true,
    });
}

/**
 * Get current user storage info
 */
export async function getUserStorageInfo(): Promise<MutationResponse<StorageInfo>> {
    return get<MutationResponse<StorageInfo>>('/api/v1/users/me/storage', {
        requiresAuth: true,
    });
}

/**
 * Fetch and update user profile in store
 */
export async function fetchAndUpdateUserProfile(): Promise<UserProfile | null> {
    try {
        const response = await getCurrentUserProfile();

        if (response.success && response.data) {
            updateUserProfile(response.data);
            return response.data;
        }

        return null;
    } catch (error) {
        console.error('Failed to fetch user profile:', error);
        return null;
    }
}

// ============= React Query Hooks =============

/**
 * Hook for fetching current user profile
 */
export function useCurrentUser(
    options?: Omit<UseQueryOptions<MutationResponse<UserProfile>, ApiClientError>, 'queryKey' | 'queryFn'>
) {
    return useQuery<MutationResponse<UserProfile>, ApiClientError>({
        queryKey: ['user', 'me'],
        queryFn: getCurrentUserProfile,
        staleTime: STALE_TIME_USER_PROFILE,
        ...options,
    });
}

/**
 * Hook for fetching user storage info
 */
export function useUserStorage(
    options?: Omit<UseQueryOptions<MutationResponse<StorageInfo>, ApiClientError>, 'queryKey' | 'queryFn'>
) {
    return useQuery<MutationResponse<StorageInfo>, ApiClientError>({
        queryKey: ['user', 'storage'],
        queryFn: getUserStorageInfo,
        staleTime: STALE_TIME_STORAGE_INFO,
        ...options,
    });
}
