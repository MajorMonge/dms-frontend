'use client';

import { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { authStore } from '@/store/auth';

/**
 * Sync auth state to cookies for middleware access
 */
export function useAuthSync() {
  const auth = useStore(authStore);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Sync access token to cookie
    if (auth.tokens?.accessToken) {
      document.cookie = `accessToken=${auth.tokens.accessToken}; path=/; max-age=${auth.tokens.expiresIn || 3600}; SameSite=Lax`;
      
      // Store auth state as cookie for middleware
      const authData = encodeURIComponent(JSON.stringify(auth));
      document.cookie = `auth=${authData}; path=/; max-age=${auth.tokens.expiresIn || 3600}; SameSite=Lax`;
    } else {
      // Clear cookies on logout
      document.cookie = 'accessToken=; path=/; max-age=0';
      document.cookie = 'auth=; path=/; max-age=0';
    }
  }, [auth]);
}

/**
 * Get current authentication status
 */
export function useAuth() {
  const auth = useStore(authStore);
  
  return {
    user: auth.user,
    tokens: auth.tokens,
    isAuthenticated: auth.isAuthenticated,
    isLoading: false, // Can be enhanced with loading state
  };
}
