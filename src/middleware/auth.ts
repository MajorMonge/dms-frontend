import type { NextRequest } from 'next/server';

/**
 * Get auth data from cookies or headers
 */
export function getAuthFromRequest(request: NextRequest): {
	accessToken: string | null;
	expiresIn: number | null;
} {
	let accessToken = request.cookies.get('accessToken')?.value || null;

	if (!accessToken) {
		const authData = request.cookies.get('auth')?.value;
		if (authData) {
			try {
				const parsed = JSON.parse(decodeURIComponent(authData));
				accessToken = parsed.tokens?.accessToken || null;
			} catch (e) {
				// Invalid cookie data, ignore
			}
		}
	}

	const expiresIn = request.cookies.get('expiresIn')?.value;
	const expiresInNum = expiresIn ? parseInt(expiresIn, 10) : null;

	return { accessToken, expiresIn: expiresInNum };
}

/**
 * Verify if user is authenticated
 */
export function isAuthenticated(request: NextRequest): boolean {
	const { accessToken } = getAuthFromRequest(request);
	return !!accessToken;
}

/**
 * Check if a token is expired (basic check)
 * For more robust validation, decode and verify JWT
 */
export function isTokenExpired(expiresIn: number | null): boolean {
	if (!expiresIn) return false;

	// Simple check - in production you'd want to decode JWT and check exp claim
	return Date.now() >= expiresIn * 1000;
}
