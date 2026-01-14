/**
 * Public routes that don't require any middleware checks
 */
export const PUBLIC_ROUTES = [
	'/api',
	'/_next',
	'/favicon.ico',
	'/site.webmanifest',
];

/**
 * Check if route matches any pattern
 */
export function matchesRoute(pathname: string, routes: string[]): boolean {
	return routes.some((route) => pathname.startsWith(route));
}

/**
 * Check if a route is public (skips all middleware)
 */
export function isPublicRoute(pathname: string): boolean {
	return matchesRoute(pathname, PUBLIC_ROUTES);
}
