'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useStore } from '@nanostores/react';
import { authStore, updateTokens, clearAuth } from '@/store/auth';
import { refreshToken } from '@/lib/api/auth';

// Refresh token 5 minutes before expiration
const TOKEN_REFRESH_THRESHOLD_MS = 5 * 60 * 1000;
// Minimum time between refresh attempts
const MIN_REFRESH_INTERVAL_MS = 10 * 1000;

/**
 * Sync auth state to cookies for middleware access
 * and handle automatic token refresh
 */
export function useAuthSync() {
  const auth = useStore(authStore);
  const isRefreshing = useRef(false);
  const lastRefreshAttempt = useRef(0);
  const tokenExpiresAt = useRef<number | null>(null);

  // Calculate and track absolute token expiration time
  useEffect(() => {
    if (auth.tokens?.expiresIn) {
      // Only update if we don't have one or tokens changed
      if (!tokenExpiresAt.current) {
        tokenExpiresAt.current = Date.now() + (auth.tokens.expiresIn * 1000);
      }
    } else {
      tokenExpiresAt.current = null;
    }
  }, [auth.tokens?.accessToken, auth.tokens?.expiresIn]);

  // Reset expiration tracking when tokens are updated
  useEffect(() => {
    if (auth.tokens?.expiresIn) {
      tokenExpiresAt.current = Date.now() + (auth.tokens.expiresIn * 1000);
    }
  }, [auth.tokens?.accessToken]);

  // Token refresh function
  const performTokenRefresh = useCallback(async () => {
    if (!auth.tokens?.refreshToken) return false;
    
    // Prevent concurrent refresh attempts
    if (isRefreshing.current) return false;
    
    // Rate limit refresh attempts
    const now = Date.now();
    if (now - lastRefreshAttempt.current < MIN_REFRESH_INTERVAL_MS) return false;
    
    isRefreshing.current = true;
    lastRefreshAttempt.current = now;
    
    try {
      const response = await refreshToken({ refreshToken: auth.tokens.refreshToken });
      
      if (response.success && response.data?.tokens) {
        updateTokens(response.data.tokens);
        // Update the expiration time after successful refresh
        tokenExpiresAt.current = Date.now() + (response.data.tokens.expiresIn * 1000);
        // Clear the refresh needed flag
        document.cookie = 'tokenNeedsRefresh=; path=/; max-age=0';
        return true;
      } else {
        // Refresh failed, clear auth
        console.error('Token refresh failed:', response.error?.message);
        clearAuth();
        tokenExpiresAt.current = null;
        return false;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      // Don't clear auth on network errors - let user retry
      return false;
    } finally {
      isRefreshing.current = false;
    }
  }, [auth.tokens?.refreshToken]);

  // Sync tokens to cookies
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (auth.tokens?.accessToken) {
      const expiresIn = auth.tokens.expiresIn || 3600;
      const expiresAt = tokenExpiresAt.current || (Date.now() + (expiresIn * 1000));
      
      // Store access token
      document.cookie = `accessToken=${auth.tokens.accessToken}; path=/; max-age=${expiresIn}; SameSite=Lax`;
      
      // Store refresh token (longer lived)
      if (auth.tokens.refreshToken) {
        // Refresh tokens typically last 30 days
        document.cookie = `refreshToken=${auth.tokens.refreshToken}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
      }
      
      // Store token expiration timestamp for middleware
      document.cookie = `tokenExpiresAt=${expiresAt}; path=/; max-age=${expiresIn}; SameSite=Lax`;
      
      // Store full auth state for middleware
      const authData = encodeURIComponent(JSON.stringify(auth));
      document.cookie = `auth=${authData}; path=/; max-age=${expiresIn}; SameSite=Lax`;
    } else {
      // Clear all auth cookies on logout
      document.cookie = 'accessToken=; path=/; max-age=0';
      document.cookie = 'refreshToken=; path=/; max-age=0';
      document.cookie = 'tokenExpiresAt=; path=/; max-age=0';
      document.cookie = 'auth=; path=/; max-age=0';
      document.cookie = 'tokenNeedsRefresh=; path=/; max-age=0';
      tokenExpiresAt.current = null;
    }
  }, [auth]);

  // Check for middleware refresh signal
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkRefreshFlag = () => {
      const cookies = document.cookie.split(';');
      const needsRefresh = cookies.some(c => c.trim().startsWith('tokenNeedsRefresh=true'));
      
      if (needsRefresh && auth.tokens?.refreshToken) {
        performTokenRefresh();
      }
    };
    
    // Check on mount
    checkRefreshFlag();
    
    // Also check periodically in case middleware sets the flag
    const interval = setInterval(checkRefreshFlag, 5000);
    
    return () => clearInterval(interval);
  }, [auth.tokens?.refreshToken, performTokenRefresh]);

  // Proactive token refresh before expiration
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!auth.tokens?.accessToken || !tokenExpiresAt.current) return;

    const timeUntilRefresh = tokenExpiresAt.current - Date.now() - TOKEN_REFRESH_THRESHOLD_MS;
    
    if (timeUntilRefresh <= 0) {
      // Token already needs refresh
      performTokenRefresh();
      return;
    }

    // Schedule refresh before token expires
    const timeoutId = setTimeout(() => {
      performTokenRefresh();
    }, timeUntilRefresh);

    return () => clearTimeout(timeoutId);
  }, [auth.tokens?.accessToken, performTokenRefresh]);
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

/**
 * Hook to check if queries should be enabled based on auth state
 * Use this in combination with React Query's enabled option
 */
export function useAuthReady() {
  const auth = useStore(authStore);
  
  // Check if we have valid auth state
  // This helps prevent queries from firing before auth is ready
  return {
    isReady: auth.isAuthenticated && !!auth.tokens?.accessToken,
    isAuthenticated: auth.isAuthenticated,
  };
}
