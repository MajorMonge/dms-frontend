'use client';

import { KeyRound, Mail } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForgotPassword, useResetPassword } from '@/lib/api/auth';
import { ROUTES } from '@/lib/routes';
import {
    forgotPasswordSchema,
    resetPasswordSchema,
    type ForgotPasswordFormData,
    type ResetPasswordFormData,
} from '@/lib/validations/auth';

// ============= Step 1: Request Reset Code =============

function RequestResetForm({
    onCodeSent,
    initialEmail,
}: {
    onCodeSent: (email: string) => void;
    initialEmail: string;
}) {
    const formId = useId();
    const errorId = useId();

    const {
        register,
        handleSubmit,
        formState: { errors, isValid, isDirty },
    } = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
        mode: 'onChange',
        defaultValues: {
            email: initialEmail,
        },
    });

    const forgotPasswordMutation = useForgotPassword({
        onSuccess: (data, variables) => {
            if (data.success) {
                toast.success(data.data?.message ||  data.message || 'Reset code sent! Please check your email.');
                onCodeSent(variables.email);
            } else {
                const message = data.error?.message || data.message || 'Failed to send reset code';
                toast.error(message);
            }
        },
        onError: (error) => {
            const message = error.message || 'An error occurred';
            toast.error(message);
        },
    });

    const onSubmit = useCallback(
        (data: ForgotPasswordFormData) => {
            forgotPasswordMutation.mutate(data);
        },
        [forgotPasswordMutation]
    );

    const isSubmitting = forgotPasswordMutation.isPending;
    const serverError = forgotPasswordMutation.error?.message ||
        (!forgotPasswordMutation.data?.success ? forgotPasswordMutation.data?.error?.message : null);

    return (
        <>
            <header className="mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2 text-primary">
                    <Mail className="shrink-0" size={34} aria-hidden="true" />
                    Reset Password
                </h1>
                <p className="text-base-content/70 mt-2">
                    Enter your email address and we&apos;ll send you a code to reset your password.
                </p>
            </header>

            {/* Server Error Alert */}
            {serverError && (
                <div
                    id={errorId}
                    role="alert"
                    aria-live="polite"
                    className="alert alert-error alert-soft mb-4"
                >
                    <span>{serverError}</span>
                </div>
            )}

            <form
                id={formId}
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-col gap-4"
                noValidate
            >
                {/* Email Field */}
                <div className="fieldset w-full">
                    <label htmlFor={`${formId}-email`} className="label text-neutral">
                        Email
                    </label>
                    <input
                        id={`${formId}-email`}
                        type="email"
                        autoComplete="email"
                        placeholder="user@example.com"
                        aria-invalid={errors.email ? 'true' : 'false'}
                        aria-describedby={errors.email ? `${formId}-email-error` : undefined}
                        className={`input w-full ${errors.email ? 'input-error' : ''}`}
                        disabled={isSubmitting}
                        {...register('email')}
                    />
                    {errors.email && (
                        <p
                            id={`${formId}-email-error`}
                            className="text-error text-sm mt-1"
                            role="alert"
                        >
                            {errors.email.message}
                        </p>
                    )}
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    className="btn btn-primary mt-2 w-full"
                    disabled={isSubmitting || !isValid || !isDirty}
                    aria-busy={isSubmitting}
                >
                    {isSubmitting ? (
                        <>
                            <span className="loading loading-spinner loading-sm" aria-hidden="true" />
                            <span>Sending code...</span>
                        </>
                    ) : (
                        'Send Reset Code'
                    )}
                </button>
            </form>
        </>
    );
}

// ============= Step 2: Enter Code & New Password =============

function ResetPasswordForm({ email }: { email: string }) {
    const router = useRouter();
    const formId = useId();
    const errorId = useId();

    const {
        register,
        handleSubmit,
        formState: { errors, isValid, isDirty },
    } = useForm<ResetPasswordFormData>({
        resolver: zodResolver(resetPasswordSchema),
        mode: 'onChange',
        defaultValues: {
            email,
            code: '',
            newPassword: '',
            confirmPassword: '',
        },
    });

    const resetPasswordMutation = useResetPassword({
        onSuccess: (data) => {
            if (data.success) {
                toast.success('Password reset successfully! You can now log in.');
                router.push(ROUTES.LOGIN.path);
            } else {
                const message = data.error?.message || data.message || 'Failed to reset password';
                toast.error(message);
            }
        },
        onError: (error) => {
            const message = error.message || 'An error occurred';
            toast.error(message);
        },
    });

    const onSubmit = useCallback(
        (data: ResetPasswordFormData) => {
            resetPasswordMutation.mutate({
                email: data.email,
                code: data.code,
                newPassword: data.newPassword,
            });
        },
        [resetPasswordMutation]
    );

    const isSubmitting = resetPasswordMutation.isPending;
    const serverError = resetPasswordMutation.error?.message ||
        (!resetPasswordMutation.data?.success ? resetPasswordMutation.data?.error?.message : null);

    return (
        <>
            <header className="mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2 text-primary">
                    <KeyRound className="shrink-0" size={34} aria-hidden="true" />
                    Set New Password
                </h1>
                <p className="text-base-content/70 mt-2">
                    Enter the 6-digit code sent to <strong>{email}</strong> and your new password.
                </p>
            </header>

            {/* Server Error Alert */}
            {serverError && (
                <div
                    id={errorId}
                    role="alert"
                    aria-live="polite"
                    className="alert alert-error alert-soft mb-4"
                >
                    <span>{serverError}</span>
                </div>
            )}

            <form
                id={formId}
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-col gap-4"
                noValidate
            >
                {/* Hidden Email Field */}
                <input type="hidden" {...register('email')} />

                {/* Reset Code Field */}
                <div className="fieldset w-full">
                    <label htmlFor={`${formId}-code`} className="label text-neutral">
                        Reset Code
                    </label>
                    <input
                        id={`${formId}-code`}
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="123456"
                        maxLength={6}
                        aria-invalid={errors.code ? 'true' : 'false'}
                        aria-describedby={errors.code ? `${formId}-code-error` : undefined}
                        className={`input w-full font-mono text-center tracking-widest ${errors.code ? 'input-error' : ''}`}
                        disabled={isSubmitting}
                        {...register('code')}
                    />
                    {errors.code && (
                        <p
                            id={`${formId}-code-error`}
                            className="text-error text-sm mt-1"
                            role="alert"
                        >
                            {errors.code.message}
                        </p>
                    )}
                </div>

                {/* New Password Field */}
                <div className="fieldset w-full">
                    <label htmlFor={`${formId}-newPassword`} className="label text-neutral">
                        New Password
                    </label>
                    <input
                        id={`${formId}-newPassword`}
                        type="password"
                        autoComplete="new-password"
                        placeholder="New password"
                        aria-invalid={errors.newPassword ? 'true' : 'false'}
                        aria-describedby={`${formId}-password-hint ${errors.newPassword ? `${formId}-newPassword-error` : ''}`}
                        className={`input w-full ${errors.newPassword ? 'input-error' : ''}`}
                        disabled={isSubmitting}
                        {...register('newPassword')}
                    />
                    <p id={`${formId}-password-hint`} className="text-base-content/60 text-sm mt-1">
                        Must be at least 8 characters, including:
                        <br />• At least one uppercase letter
                        <br />• At least one lowercase letter
                        <br />• At least one number
                        <br />• At least one special character (!@#$%^&amp;*...)
                    </p>
                    {errors.newPassword && (
                        <p
                            id={`${formId}-newPassword-error`}
                            className="text-error text-sm mt-1"
                            role="alert"
                        >
                            {errors.newPassword.message}
                        </p>
                    )}
                </div>

                {/* Confirm Password Field */}
                <div className="fieldset w-full">
                    <label htmlFor={`${formId}-confirmPassword`} className="label text-neutral">
                        Confirm New Password
                    </label>
                    <input
                        id={`${formId}-confirmPassword`}
                        type="password"
                        autoComplete="new-password"
                        placeholder="Confirm new password"
                        aria-invalid={errors.confirmPassword ? 'true' : 'false'}
                        aria-describedby={errors.confirmPassword ? `${formId}-confirmPassword-error` : undefined}
                        className={`input w-full ${errors.confirmPassword ? 'input-error' : ''}`}
                        disabled={isSubmitting}
                        {...register('confirmPassword')}
                    />
                    {errors.confirmPassword && (
                        <p
                            id={`${formId}-confirmPassword-error`}
                            className="text-error text-sm mt-1"
                            role="alert"
                        >
                            {errors.confirmPassword.message}
                        </p>
                    )}
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    className="btn btn-primary mt-2 w-full"
                    disabled={isSubmitting || !isValid || !isDirty}
                    aria-busy={isSubmitting}
                >
                    {isSubmitting ? (
                        <>
                            <span className="loading loading-spinner loading-sm" aria-hidden="true" />
                            <span>Resetting password...</span>
                        </>
                    ) : (
                        'Reset Password'
                    )}
                </button>
            </form>
        </>
    );
}

// ============= Main Form Component =============

function ResetPasswordFlow() {
    const searchParams = useSearchParams();
    const [step, setStep] = useState<'request' | 'reset'>('request');
    const [email, setEmail] = useState('');

    const emailFromParams = searchParams.get('email') || '';

    const handleCodeSent = useCallback((sentEmail: string) => {
        setEmail(sentEmail);
        setStep('reset');
    }, []);

    return (
        <div className="w-full max-w-md bg-base-100 rounded-box shadow p-8">
            {step === 'request' ? (
                <RequestResetForm onCodeSent={handleCodeSent} initialEmail={emailFromParams} />
            ) : (
                <ResetPasswordForm email={email} />
            )}

            {/* Footer Links */}
            <footer className="mt-6 space-y-2 text-center">
                <p className="text-sm text-base-content/70">
                    Remember your password?{' '}
                    <Link
                        href={ROUTES.LOGIN.path}
                        className="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                    >
                        Login here
                    </Link>
                </p>
                {step === 'reset' && (
                    <button
                        type="button"
                        className="text-sm text-base-content/70 hover:underline"
                        onClick={() => setStep('request')}
                    >
                        Use a different email
                    </button>
                )}
            </footer>
        </div>
    );
}

// ============= Loading Fallback =============

function ResetPasswordSkeleton() {
    return (
        <div className="w-full max-w-md bg-base-100 rounded-box shadow p-8 animate-pulse">
            <div className="h-8 bg-base-300 rounded w-48 mb-4" />
            <div className="h-4 bg-base-300 rounded w-3/4 mb-6" />
            <div className="space-y-4">
                <div className="h-10 bg-base-300 rounded" />
                <div className="h-10 bg-base-300 rounded" />
            </div>
        </div>
    );
}

// ============= Page Export with Suspense =============

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<ResetPasswordSkeleton />}>
            <ResetPasswordFlow />
        </Suspense>
    );
}
