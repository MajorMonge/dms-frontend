'use client';

import { User } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useId } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLogin } from '@/lib/api/auth';
import { ROUTES } from '@/lib/routes';
import { loginSchema, type LoginFormData } from '@/lib/validations/auth';
import { getSafeRedirectUrl } from '@/lib/security';

// ============= Form Component =============

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const formId = useId();
    const errorId = useId();

    const {
        register,
        handleSubmit,
        formState: { errors, isValid, isDirty },
        watch,
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        mode: 'onChange',
        defaultValues: {
            email: '',
            password: '',
        },
    });

    const loginMutation = useLogin({
        onSuccess: (data) => {
            if (data.success) {
                toast.success('Login successful!');
                const redirectParam = searchParams.get('redirect');
                const safeRedirect = getSafeRedirectUrl(redirectParam);
                router.push(safeRedirect);
            } else {
                const errorCode = data.error?.code?.toLowerCase() || '';
                const message = data.error?.message || data.message || 'Login failed';

                if (errorCode.includes('notconfirmed') ||
                    errorCode.includes('not_confirmed') ||
                    errorCode.includes('usernotconfirmedexception') ||
                    message.toLowerCase().includes('not confirmed') ||
                    message.toLowerCase().includes('verify your email')) {
                    toast.error('Please confirm your email before logging in.');
                    const email = watch('email');
                    router.push(`${ROUTES.CONFIRM.path}?email=${encodeURIComponent(email)}`);
                    return;
                }

                toast.error(message);
            }
        },
        onError: (error) => {
            const message = error.message || 'An error occurred';

            if (message.toLowerCase().includes('not confirmed') ||
                message.toLowerCase().includes('verify your email')) {
                toast.error('Please confirm your email before logging in.');
                const email = watch('email');
                router.push(`${ROUTES.CONFIRM.path}?email=${encodeURIComponent(email)}`);
                return;
            }

            toast.error(message);
        },
    });

    const onSubmit = useCallback(
        (data: LoginFormData) => {
            loginMutation.mutate(data);
        },
        [loginMutation]
    );

    const isSubmitting = loginMutation.isPending;
    const serverError = loginMutation.error?.message ||
        (!loginMutation.data?.success ? loginMutation.data?.error?.message : null);

    return (
        <div className="w-full max-w-md bg-base-100 rounded-box shadow p-8">
            <header className="mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2 text-primary">
                    <User className="shrink-0" size={34} aria-hidden="true" />
                    Login
                </h1>
                <p className="text-base-content/70 mt-2">
                    Please enter your credentials to access your account.
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

                {/* Password Field */}
                <div className="fieldset w-full">
                    <label htmlFor={`${formId}-password`} className="label text-neutral">
                        Password
                    </label>
                    <input
                        id={`${formId}-password`}
                        type="password"
                        autoComplete="current-password"
                        placeholder="Password"
                        aria-invalid={errors.password ? 'true' : 'false'}
                        aria-describedby={errors.password ? `${formId}-password-error` : undefined}
                        className={`input w-full ${errors.password ? 'input-error' : ''}`}
                        disabled={isSubmitting}
                        minLength={8}
                        {...register('password')}
                    />
                    {errors.password && (
                        <p
                            id={`${formId}-password-error`}
                            className="text-error text-sm mt-1"
                            role="alert"
                        >
                            {errors.password.message}
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
                            <span>Logging in...</span>
                        </>
                    ) : (
                        'Login'
                    )}
                </button>
            </form>

            {/* Footer Links */}
            <footer className="mt-6 space-y-2 text-center">
                <p className="text-sm text-base-content/70">
                    Don&apos;t have an account?{' '}
                    <Link
                        href={ROUTES.REGISTER.path}
                        className="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                    >
                        Sign up
                    </Link>
                </p>
                <p className="text-sm text-base-content/70">
                    Forgot your password?{' '}
                    <Link
                        href={ROUTES.RESET_PASSWORD.path}
                        className="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                    >
                        Reset here
                    </Link>
                </p>
            </footer>
        </div>
    );
}

// ============= Loading Fallback =============

function LoginFormSkeleton() {
    return (
        <div className="w-full max-w-md bg-base-100 rounded-box shadow p-8 animate-pulse">
            <div className="h-8 bg-base-300 rounded w-32 mb-4" />
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

export default function LoginPage() {
    return (
        <Suspense fallback={<LoginFormSkeleton />}>
            <LoginForm />
        </Suspense>
    );
}
