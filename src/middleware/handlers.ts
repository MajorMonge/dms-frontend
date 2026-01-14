import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isProtectedRoute, isAuthOnlyRoute, ROUTES } from '@/lib/routes';
import {
	getAuthFromRequest,
	shouldRefreshToken,
	isTokenExpired,
	setRefreshNeededFlag,
} from './auth';

/**
 * Auth middleware handler
 * Handles authentication, route protection, and token refresh signaling
 */
export function authMiddleware(request: NextRequest): NextResponse | null {
	const { pathname } = request.nextUrl;
	const authData = getAuthFromRequest(request);
	const authenticated = authData.isAuthenticated;

	// Redirect authenticated users away from auth pages
	if (authenticated && isAuthOnlyRoute(pathname)) {
		return NextResponse.redirect(new URL(ROUTES.HOME.path, request.url));
	}

	// Check if token is completely expired
	if (authenticated && isTokenExpired(authData)) {
		// Token is expired, but we have a refresh token - let client handle refresh
		if (authData.refreshToken) {
			// For protected routes, allow access but signal refresh needed
			if (isProtectedRoute(pathname)) {
				const response = NextResponse.next();
				return setRefreshNeededFlag(response);
			}
		} else {
			// No refresh token, redirect to login
			if (isProtectedRoute(pathname)) {
				const loginUrl = new URL(ROUTES.LOGIN.path, request.url);
				loginUrl.searchParams.set('redirect', pathname);
				return NextResponse.redirect(loginUrl);
			}
		}
	}

	// Redirect unauthenticated users to login
	if (!authenticated && isProtectedRoute(pathname)) {
		const loginUrl = new URL(ROUTES.LOGIN.path, request.url);
		loginUrl.searchParams.set('redirect', pathname);
		return NextResponse.redirect(loginUrl);
	}

	// Check if token needs refresh (about to expire)
	if (authenticated && shouldRefreshToken(authData)) {
		const response = NextResponse.next();
		return setRefreshNeededFlag(response);
	}

	// Continue to the route
	return null;
}
