'use client';

import { ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useConfirmEmail, useResendCode } from '@/lib/api/auth';
import { ROUTES } from '@/lib/routes';
import { confirmEmailSchema, type ConfirmEmailFormData } from '@/lib/validations/auth';

// ============= Form Component =============

function ConfirmForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const formId = useId();
    const errorId = useId();
    const [resendCooldown, setResendCooldown] = useState(0);

    // Get email from URL params (passed from register or login)
    const emailFromParams = searchParams.get('email') || '';

    const {
        register,
        handleSubmit,
        formState: { errors, isValid, isDirty },
        watch,
    } = useForm<ConfirmEmailFormData>({
        resolver: zodResolver(confirmEmailSchema),
        mode: 'onChange',
        defaultValues: {
            email: emailFromParams,
            code: '',
        },
    });

    const confirmMutation = useConfirmEmail({
        onSuccess: (data) => {
            if (data.success) {
                toast.success(data.data?.message || data.message || 'Email confirmed successfully!');
                router.push(ROUTES.LOGIN.path);
            } else {
                const message = data.error?.message || data.message || 'Confirmation failed';
                toast.error(message);
            }
        },
        onError: (error) => {
            const message = error.message || 'An error occurred';
            toast.error(message);
        },
    });

    const resendMutation = useResendCode({
        onSuccess: (data) => {
            if (data.success) {
                toast( data.data?.message || data.message  || 'Check your email for the confirmation code.');
                setResendCooldown(60);
                const interval = setInterval(() => {
                    setResendCooldown((prev) => {
                        if (prev <= 1) {
                            clearInterval(interval);
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);
            } else {
                const message = data.error?.message || data.message || 'Failed to resend code';
                toast.error(message);
            }
        },
        onError: (error) => {
            const message = error.message || 'An error occurred';
            toast.error(message);
        },
    });

    const onSubmit = useCallback(
        (data: ConfirmEmailFormData) => {
            confirmMutation.mutate(data);
        },
        [confirmMutation]
    );

    const handleResendCode = useCallback(() => {
        const email = watch('email');
        if (!email) {
            toast.error('Please enter your email first');
            return;
        }
        resendMutation.mutate({ email });
    }, [resendMutation, watch]);

    const isSubmitting = confirmMutation.isPending;
    const isResending = resendMutation.isPending;
    const serverError = confirmMutation.error?.message ||
        (!confirmMutation.data?.success ? confirmMutation.data?.error?.message : null);

    return (
        <div className="w-full max-w-md bg-base-100 rounded-box shadow p-8">
            <header className="mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2 text-primary">
                    <ShieldCheck className="shrink-0" size={34} aria-hidden="true" />
                    Confirm Account
                </h1>
                <p className="text-base-content/70 mt-2">
                    Please enter your email and the 6-digit confirmation code sent to you.
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

                {/* Confirmation Code Field */}
                <div className="fieldset w-full">
                    <label htmlFor={`${formId}-code`} className="label text-neutral">
                        Confirmation Code
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

                {/* Submit Button */}
                <button
                    type="submit"
                    className="btn btn-primary mt-2 w-full"
                    disabled={isSubmitting || !isValid || !isDirty}
                    aria-busy={isSubmitting}
                    aria-describedby={serverError ? errorId : undefined}
                >
                    {isSubmitting ? (
                        <>
                            <span className="loading loading-spinner loading-sm" aria-hidden="true" />
                            <span>Confirming...</span>
                        </>
                    ) : (
                        'Confirm Account'
                    )}
                </button>

                {/* Resend Code Button */}
                <button
                    type="button"
                    className="btn btn-ghost btn-sm w-full"
                    onClick={handleResendCode}
                    disabled={isResending || resendCooldown > 0}
                >
                    {isResending ? (
                        <>
                            <span className="loading loading-spinner loading-xs" aria-hidden="true" />
                            <span>Sending...</span>
                        </>
                    ) : resendCooldown > 0 ? (
                        `Resend code in ${resendCooldown}s`
                    ) : (
                        "Didn't receive a code? Resend"
                    )}
                </button>
            </form>

            {/* Footer Links */}
            <footer className="mt-6 text-center">
                <p className="text-sm text-base-content/70">
                    Already confirmed?{' '}
                    <Link
                        href={ROUTES.LOGIN.path}
                        className="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                    >
                        Login here
                    </Link>
                </p>
            </footer>
        </div>
    );
}

// ============= Loading Fallback =============

function ConfirmFormSkeleton() {
    return (
        <div className="w-full max-w-md bg-base-100 rounded-box shadow p-8 animate-pulse">
            <div className="h-8 bg-base-300 rounded w-48 mb-4" />
            <div className="h-4 bg-base-300 rounded w-3/4 mb-6" />
            <div className="space-y-4">
                <div className="h-10 bg-base-300 rounded" />
                <div className="h-10 bg-base-300 rounded" />
                <div className="h-10 bg-base-300 rounded" />
            </div>
        </div>
    );
}

// ============= Page Export with Suspense =============

export default function ConfirmPage() {
    return (
        <Suspense fallback={<ConfirmFormSkeleton />}>
            <ConfirmForm />
        </Suspense>
    );
}
