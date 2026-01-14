import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Token refresh threshold (refresh if less than 5 minutes remaining)
const TOKEN_REFRESH_THRESHOLD_MS = 5 * 60 * 1000;

export interface AuthData {
	accessToken: string | null;
	refreshToken: string | null;
	expiresAt: number | null;
	isAuthenticated: boolean;
}

/**
 * Get auth data from cookies or headers
 */
export function getAuthFromRequest(request: NextRequest): AuthData {
	let accessToken: string | null = null;
	let refreshToken: string | null = null;
	let expiresAt: number | null = null;

	// Try to get tokens from individual cookies first
	accessToken = request.cookies.get('accessToken')?.value || null;
	refreshToken = request.cookies.get('refreshToken')?.value || null;
	const expiresAtCookie = request.cookies.get('tokenExpiresAt')?.value;
	expiresAt = expiresAtCookie ? parseInt(expiresAtCookie, 10) : null;

	// Fallback to auth data cookie
	if (!accessToken) {
		const authData = request.cookies.get('auth')?.value;
		if (authData) {
			try {
				const parsed = JSON.parse(decodeURIComponent(authData));
				accessToken = parsed.tokens?.accessToken || null;
				refreshToken = parsed.tokens?.refreshToken || null;
				// Calculate expiration from expiresIn if available
				if (parsed.tokens?.expiresIn && !expiresAt) {
					// This is approximate since we don't know when the token was issued
					// Client-side will handle accurate tracking
					expiresAt = Date.now() + (parsed.tokens.expiresIn * 1000);
				}
			} catch {
				// Invalid cookie data, ignore
			}
		}
	}

	return {
		accessToken,
		refreshToken,
		expiresAt,
		isAuthenticated: !!accessToken,
	};
}

/**
 * Verify if user is authenticated
 */
export function isAuthenticated(request: NextRequest): boolean {
	const { accessToken } = getAuthFromRequest(request);
	return !!accessToken;
}

/**
 * Check if token needs refresh (expired or about to expire)
 */
export function shouldRefreshToken(authData: AuthData): boolean {
	if (!authData.accessToken || !authData.refreshToken) {
		return false;
	}

	if (!authData.expiresAt) {
		// Can't determine expiration, let client handle it
		return false;
	}

	const timeUntilExpiry = authData.expiresAt - Date.now();
	return timeUntilExpiry < TOKEN_REFRESH_THRESHOLD_MS;
}

/**
 * Check if token is completely expired (no grace period)
 */
export function isTokenExpired(authData: AuthData): boolean {
	if (!authData.expiresAt) {
		return false; // Can't determine, assume valid
	}

	return Date.now() >= authData.expiresAt;
}

/**
 * Set a cookie flag to signal client to refresh the token
 */
export function setRefreshNeededFlag(response: NextResponse): NextResponse {
	response.cookies.set('tokenNeedsRefresh', 'true', {
		path: '/',
		maxAge: 60, // Short-lived flag
		sameSite: 'lax',
	});
	return response;
}

/**
 * Clear the refresh needed flag
 */
export function clearRefreshNeededFlag(response: NextResponse): NextResponse {
	response.cookies.delete('tokenNeedsRefresh');
	return response;
}
