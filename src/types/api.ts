/**
 * API Types based on OpenAPI specification
 * Base URL: https://dms-backend-prod.fly.dev
 */

// ============= Authentication Types =============

export interface AuthTokens {
    accessToken: string;
    idToken: string;
    refreshToken: string;
    expiresIn: number;
}

/**
 * Basic user info returned from login
 */
export interface User {
    id: string;
    email: string;
    cognitoId: string;
}

/**
 * Full user profile with storage info (from /users/me endpoint)
 */
export interface UserProfile extends User {
    storageUsed: number;
    storageLimit: number;
    metadata?: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
}

/**
 * Storage info response
 */
export interface StorageInfo {
    used: number;
    limit: number;
    available: number;
    usedPercentage: number;
}

export interface RegisterRequest {
    email: string;
    password: string;
}

export interface RegisterResponse {
    success: boolean;
    data?: {
        userSub: string;
        email: string;
        confirmed: boolean;
        message: string;
    };
    message?: string;
    error?: {
        code: string;
        message: string;
        stack?: string;
    };
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    success: boolean;
    data?: {
        tokens: AuthTokens;
        user: User;
    };
    message?: string;
    error?: {
        code: string;
        message: string;
        stack?: string;
    };
}

export interface ConfirmEmailRequest {
    email: string;
    code: string;
}

export interface ResendCodeRequest {
    email: string;
}

export interface ForgotPasswordRequest {
    email: string;
}

export interface ResetPasswordRequest {
    email: string;
    code: string;
    newPassword: string;
}

export interface RefreshTokenRequest {
    refreshToken: string;
}

export interface RefreshTokenResponse {
    success: boolean;
    data?: {
        tokens: AuthTokens;
    };
    message?: string;
    error?: {
        code: string;
        message: string;
        stack?: string;
    };
}

// ============= Error Types =============

export interface ApiError {
    success: false;
    error: {
        code: string;
        message: string;
        details?: unknown[];
    };
}

export interface SuccessResponse<T = unknown> {
    success: true;
    data: T;
    message?: string;
}

// ============= Generic Response Type =============
export type ApiResponse<T> = SuccessResponse<T> | ApiError;

/**
 * Generic API response that can be success or error
 * Used for mutations that may return error in response body
 */
export interface MutationResponse<T = { message?: string }> {
    success: boolean;
    data?: T;
    message?: string;
    error?: {
        code: string;
        message: string;
        stack?: string;
    };
}

/**
 * Common response data with just a message
 */
export interface MessageResponse {
    message: string;
}
