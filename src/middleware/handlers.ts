import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isProtectedRoute, isAuthOnlyRoute, ROUTES } from '@/lib/routes';
import { isAuthenticated } from './auth';

/**
 * Auth middleware handler
 * Handles authentication and route protection
 */
export function authMiddleware(request: NextRequest): NextResponse | null {
	const { pathname } = request.nextUrl;
	const authenticated = isAuthenticated(request);

	// Redirect authenticated users away from auth pages
	if (authenticated && isAuthOnlyRoute(pathname)) {
		return NextResponse.redirect(new URL(ROUTES.HOME.path, request.url));
	}

	// Redirect unauthenticated users to login
	if (!authenticated && isProtectedRoute(pathname)) {
		const loginUrl = new URL(ROUTES.LOGIN.path, request.url);
		loginUrl.searchParams.set('redirect', pathname);
		return NextResponse.redirect(loginUrl);
	}

	// Continue to the route
	return null;
}
