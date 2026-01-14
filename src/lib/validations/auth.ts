import { z } from 'zod';

// NOTE: Keep in sync with backend-ex/src/schemas/auth.schema.ts

// ============= Shared Base Schemas =============

/**
 * Password requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(
    /[!@#$%^&*(),.?":{}|<>]/,
    'Password must contain at least one special character'
  );

const emailSchema = z.string().email('Invalid email format').max(255);

// ============= Auth Schemas (matching backend) =============

/**
 * Schema for user login
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Schema for user registration (backend)
 */
export const registerBodySchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

/**
 * Schema for user registration (frontend with confirm)
 */
export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

/**
 * Schema for email confirmation
 */
export const confirmEmailSchema = z.object({
  email: emailSchema,
  code: z.string().length(6, 'Verification code must be 6 digits'),
});

export type ConfirmEmailFormData = z.infer<typeof confirmEmailSchema>;

/**
 * Schema for resending verification code
 */
export const resendCodeSchema = z.object({
  email: emailSchema,
});

export type ResendCodeFormData = z.infer<typeof resendCodeSchema>;

/**
 * Schema for forgot password request
 */
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

/**
 * Schema for password reset (backend)
 */
export const resetPasswordBodySchema = z.object({
  email: emailSchema,
  code: z.string().length(6, 'Reset code must be 6 digits'),
  newPassword: passwordSchema,
});

/**
 * Schema for password reset (frontend with confirm)
 */
export const resetPasswordSchema = z
  .object({
    email: emailSchema,
    code: z.string().length(6, 'Reset code must be 6 digits'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

/**
 * Schema for token refresh
 */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type RefreshTokenFormData = z.infer<typeof refreshTokenSchema>;

// ============= Password Helper for UI =============

export const PASSWORD_REQUIREMENTS = [
  { regex: /.{8,}/, label: 'At least 8 characters' },
  { regex: /[A-Z]/, label: 'At least one uppercase letter' },
  { regex: /[a-z]/, label: 'At least one lowercase letter' },
  { regex: /[0-9]/, label: 'At least one number' },
  { regex: /[!@#$%^&*(),.?":{}|<>]/, label: 'At least one special character' },
] as const;
