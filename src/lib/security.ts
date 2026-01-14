import { ROUTES } from './routes';

/**
 * List of allowed redirect paths to prevent open redirect attacks.
 * Only internal paths should be allowed.
 */
const ALLOWED_REDIRECT_PATHS = [
  ROUTES.HOME.path,
  ROUTES.TRASH.path,
  ROUTES.SETTINGS.path,
] as const;

/**
 * Validates and sanitizes a redirect URL to prevent open redirect vulnerabilities.
 * 
 * @param redirectUrl - The URL to validate
 * @param fallback - Fallback URL if validation fails (defaults to home)
 * @returns A safe redirect URL
 */
export function getSafeRedirectUrl(
  redirectUrl: string | null | undefined,
  fallback: string = ROUTES.HOME.path
): string {
  if (!redirectUrl) {
    return fallback;
  }

  // Trim and normalize the URL
  const normalizedUrl = redirectUrl.trim();

  // Block absolute URLs (could be external)
  if (normalizedUrl.startsWith('http://') || normalizedUrl.startsWith('https://')) {
    return fallback;
  }

  // Block protocol-relative URLs
  if (normalizedUrl.startsWith('//')) {
    return fallback;
  }

  // Block javascript: and data: URLs
  if (normalizedUrl.toLowerCase().startsWith('javascript:') || 
      normalizedUrl.toLowerCase().startsWith('data:')) {
    return fallback;
  }

  // Ensure the path starts with /
  if (!normalizedUrl.startsWith('/')) {
    return fallback;
  }

  // Check against allowed paths (exact match or starts with)
  const isAllowed = ALLOWED_REDIRECT_PATHS.some(
    (allowedPath) => 
      normalizedUrl === allowedPath || 
      normalizedUrl.startsWith(`${allowedPath}/`) ||
      normalizedUrl.startsWith(`${allowedPath}?`)
  );

  if (!isAllowed) {
    // For additional security, we can also allow any path that starts with /
    // but doesn't contain suspicious characters
    const suspiciousPattern = /[<>'"`;(){}]/;
    if (suspiciousPattern.test(normalizedUrl)) {
      return fallback;
    }
  }

  return normalizedUrl;
}

/**
 * Creates a login URL with redirect parameter
 */
export function createLoginUrlWithRedirect(currentPath: string): string {
  const encodedRedirect = encodeURIComponent(currentPath);
  return `${ROUTES.LOGIN.path}?redirect=${encodedRedirect}`;
}
