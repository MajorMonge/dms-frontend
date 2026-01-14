/**
 * Unified Route Configuration System
 * Centralizes route definitions, protection rules, and aliases
 */

export type RouteConfig = {
    path: string;
    aliases?: string[]; // Multiple paths that redirect to this route
    protected: boolean;
    authOnly?: boolean; // Only for unauthenticated users (login, register)
    title?: string;
    icon?: string;
};

// ============= Route Definitions =============

/**
 * Main application routes
 */
export const ROUTES = {
    // Auth Routes (unauthenticated only)
    LOGIN: {
        path: '/login',
        aliases: ['/signin', '/auth/login'],
        protected: false,
        authOnly: true,
        title: 'Login',
    },
    REGISTER: {
        path: '/register',
        aliases: ['/signup', '/auth/register'],
        protected: false,
        authOnly: true,
        title: 'Register',
    },
    CONFIRM: {
        path: '/confirm',
        aliases: ['/auth/confirm', '/verify'],
        protected: false,
        authOnly: true,
        title: 'Confirm Account',
    },
    RESET_PASSWORD: {
        path: '/reset-password',
        aliases: ['/forgot-password', '/auth/reset'],
        protected: false,
        authOnly: true,
        title: 'Reset Password',
    },

    // Protected Routes (authenticated only)
    HOME: {
        path: '/',
        aliases: ['/home', '/dashboard'],
        protected: true,
        title: 'Home',
        icon: 'Home',
    },
    TRASH: {
        path: '/trash',
        aliases: ['/bin', '/deleted'],
        protected: true,
        title: 'Trash',
        icon: 'Trash',
    },
    SETTINGS: {
        path: '/settings',
        aliases: ['/preferences', '/config'],
        protected: true,
        title: 'Settings',
        icon: 'Settings',
    },
} as const;

// ============= Helper Functions =============

/**
 * Get route by any alias
 */
export function getRouteByAlias(alias: string) {
    return Object.values(ROUTES).find(route =>
        (route.aliases && (route.aliases as readonly string[]).includes(alias)) || route.path === alias
    );
}

/**
 * Get route by path (primary path or alias)
 */
export function getRouteByPath(path: string) {
    return Object.values(ROUTES).find(route =>
        route.path === path || (route.aliases && (route.aliases as readonly string[]).includes(path))
    );
}

/**
 * Get all protected routes
 */
export function getProtectedRoutes() {
    return Object.values(ROUTES).filter(route => route.protected);
}

/**
 * Get all auth-only routes (login, register, etc.)
 */
export function getAuthOnlyRoutes() {
    return Object.values(ROUTES).filter(route =>
        'authOnly' in route && (route as any).authOnly === true
    );
}

/**
 * Get all public routes
 */
export function getPublicRoutes() {
    return Object.values(ROUTES).filter(route => !route.protected && !('authOnly' in route));
}

/**
 * Check if a path is protected (checks both primary path and aliases)
 */
export function isProtectedRoute(pathname: string): boolean {
    return getProtectedRoutes().some(route =>
        pathname === route.path ||
        pathname.startsWith(route.path + '/') ||
        route.aliases?.some(alias => pathname === alias || pathname.startsWith(alias + '/'))
    );
}

/**
 * Check if a path is auth-only (for unauthenticated users)
 */
export function isAuthOnlyRoute(pathname: string): boolean {
    return getAuthOnlyRoutes().some(route =>
        pathname === route.path ||
        pathname.startsWith(route.path + '/') ||
        route.aliases?.some(alias => pathname === alias || pathname.startsWith(alias + '/'))
    );
}

/**
 * Get route path by alias with type safety
 */
export function getPath(alias: keyof typeof ROUTES): string {
    return ROUTES[alias].path;
}

/**
 * Navigate to route by alias (for use with router.push)
 */
export function navigateTo(alias: keyof typeof ROUTES, params?: Record<string, string>): string {
    let path: string = ROUTES[alias].path;

    // Replace params in path if provided
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            path = path.replace(`:${key}`, value);
        });
    }

    return path;
}

// ============= Route Groups =============

/**
 * Navigation menu items (for sidebar, etc.)
 */
export const MAIN_NAVIGATION = [
    ROUTES.HOME,
    ROUTES.TRASH,
] as const;

/**
 * Settings navigation
 */
export const SETTINGS_NAVIGATION = [
    ROUTES.SETTINGS,
] as const;

// ============= Next.js Config Helpers =============

/**
 * Generate Next.js redirects configuration from route aliases
 * Use this in next.config.ts
 */
export function generateRedirects() {
    const redirects: Array<{
        source: string;
        destination: string;
        permanent: boolean;
    }> = [];

    Object.values(ROUTES).forEach(route => {
        if (route.aliases) {
            route.aliases.forEach(alias => {
                redirects.push({
                    source: alias,
                    destination: route.path,
                    permanent: false, // Use 307 for temporary redirects
                });
            });
        }
    });

    return redirects;
}

// ============= Types =============

export type RouteKey = keyof typeof ROUTES;
export type RoutePath = typeof ROUTES[RouteKey]['path'];
export type RouteAlias = NonNullable<typeof ROUTES[RouteKey]['aliases']>[number];

