import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isPublicRoute } from './middleware/routes';
import { authMiddleware } from './middleware/handlers';

// ============= Main Proxy =============

export default function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Skip public routes
	if (isPublicRoute(pathname)) {
		return NextResponse.next();
	}

	// Auth middleware
	const authResponse = authMiddleware(request);
	if (authResponse) {
		return authResponse;
	}

	// Add more middleware handlers here as needed
	// Example: const rateLimitResponse = rateLimitMiddleware(request);

	return NextResponse.next();
}

// ============= Config =============

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - api (API routes)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 */
		'/((?!api|_next/static|_next/image|favicon.ico|site.webmanifest).*)',
	],
};
