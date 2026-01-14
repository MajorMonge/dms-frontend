import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { post } from '@/lib/api-client';
import { setAuthData, updateTokens, clearAuth } from '@/store/auth';
import type {
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    RegisterResponse,
    ConfirmEmailRequest,
    ResendCodeRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    RefreshTokenRequest,
    RefreshTokenResponse,
    MutationResponse,
    SuccessResponse,
} from '@/types/api';
import { ApiClientError } from '@/lib/api-client';

// ============= API Functions =============

/**
 * Login user
 */
export async function loginUser(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await post<LoginResponse>('/api/v1/auth/login', credentials, {
        requiresAuth: false,
    });

    if (response.success && response.data?.tokens && response.data?.user) {
        setAuthData(response.data.user, response.data.tokens);
    }

    return response;
}

/**
 * Register new user
 */
export async function registerUser(data: RegisterRequest): Promise<RegisterResponse> {
    return post<RegisterResponse>('/api/v1/auth/register', data, {
        requiresAuth: false,
    });
}

/**
 * Confirm email with verification code
 */
export async function confirmEmail(data: ConfirmEmailRequest): Promise<MutationResponse> {
    return post<MutationResponse>('/api/v1/auth/confirm-email', data, {
        requiresAuth: false,
    });
}

/**
 * Resend verification code
 */
export async function resendCode(data: ResendCodeRequest): Promise<MutationResponse> {
    return post<MutationResponse>('/api/v1/auth/resend-code', data, {
        requiresAuth: false,
    });
}

/**
 * Request password reset
 */
export async function forgotPassword(data: ForgotPasswordRequest): Promise<MutationResponse> {
    return post<MutationResponse>('/api/v1/auth/forgot-password', data, {
        requiresAuth: false,
    });
}

/**
 * Reset password with code
 */
export async function resetPassword(data: ResetPasswordRequest): Promise<MutationResponse> {
    return post<MutationResponse>('/api/v1/auth/reset-password', data, {
        requiresAuth: false,
    });
}

/**
 * Refresh access token
 */
export async function refreshToken(data: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    const response = await post<RefreshTokenResponse>('/api/v1/auth/refresh', data, {
        requiresAuth: false,
    });

    // Update stored tokens
    if (response.success && response.data?.tokens) {
        updateTokens(response.data.tokens);
    }

    return response;
}

/**
 * Logout user
 */
export async function logoutUser(): Promise<SuccessResponse> {
    const response = await post<SuccessResponse>('/api/v1/auth/logout', undefined, {
        requiresAuth: true,
    });

    // Clear auth data on successful logout
    if (response.success) {
        clearAuth();
    }

    return response;
}

// ============= React Query Hooks =============

/**
 * Hook for login mutation
 */
export function useLogin(
    options?: UseMutationOptions<LoginResponse, ApiClientError, LoginRequest>
) {
    return useMutation<LoginResponse, ApiClientError, LoginRequest>({
        mutationFn: loginUser,
        ...options,
    });
}

/**
 * Hook for register mutation
 */
export function useRegister(
    options?: UseMutationOptions<RegisterResponse, ApiClientError, RegisterRequest>
) {
    return useMutation<RegisterResponse, ApiClientError, RegisterRequest>({
        mutationFn: registerUser,
        ...options,
    });
}

/**
 * Hook for confirm email mutation
 */
export function useConfirmEmail(
    options?: UseMutationOptions<MutationResponse, ApiClientError, ConfirmEmailRequest>
) {
    return useMutation<MutationResponse, ApiClientError, ConfirmEmailRequest>({
        mutationFn: confirmEmail,
        ...options,
    });
}

/**
 * Hook for resend code mutation
 */
export function useResendCode(
    options?: UseMutationOptions<MutationResponse, ApiClientError, ResendCodeRequest>
) {
    return useMutation<MutationResponse, ApiClientError, ResendCodeRequest>({
        mutationFn: resendCode,
        ...options,
    });
}

/**
 * Hook for forgot password mutation
 */
export function useForgotPassword(
    options?: UseMutationOptions<MutationResponse, ApiClientError, ForgotPasswordRequest>
) {
    return useMutation<MutationResponse, ApiClientError, ForgotPasswordRequest>({
        mutationFn: forgotPassword,
        ...options,
    });
}

/**
 * Hook for reset password mutation
 */
export function useResetPassword(
    options?: UseMutationOptions<MutationResponse, ApiClientError, ResetPasswordRequest>
) {
    return useMutation<MutationResponse, ApiClientError, ResetPasswordRequest>({
        mutationFn: resetPassword,
        ...options,
    });
}

/**
 * Hook for logout mutation
 */
export function useLogout(
    options?: UseMutationOptions<SuccessResponse, ApiClientError, void>
) {
    return useMutation<SuccessResponse, ApiClientError, void>({
        mutationFn: logoutUser,
        ...options,
    });
}
