'use client';

import { UserPlus } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useCallback, useId } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRegister } from '@/lib/api/auth';
import { ROUTES } from '@/lib/routes';
import { registerSchema, type RegisterFormData } from '@/lib/validations/auth';

export default function RegisterPage() {
    const router = useRouter();
    const formId = useId();
    const errorId = useId();

    const {
        register,
        handleSubmit,
        formState: { errors, isValid, isDirty },
        watch,
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        mode: 'onChange',
        defaultValues: {
            email: '',
            password: '',
            confirmPassword: '',
        },
    });

    const registerMutation = useRegister({
        onSuccess: (data) => {
            if (data.success) {
                toast.success('Registration successful! Please check your email to verify your account.');
                // Redirect to confirmation page with email
                const email = watch('email');
                router.push(`${ROUTES.CONFIRM.path}?email=${encodeURIComponent(email)}`);
            } else {
                const message = data.error?.message || data.message || 'Registration failed';
                toast.error(message);
            }
        },
        onError: (error) => {
            const message = error.message || 'An error occurred';
            toast.error(message);
        },
    });

    const onSubmit = useCallback(
        (data: RegisterFormData) => {
            registerMutation.mutate({
                email: data.email,
                password: data.password,
            });
        },
        [registerMutation]
    );

    const isSubmitting = registerMutation.isPending;
    const serverError = registerMutation.error?.message ||
        (!registerMutation.data?.success ? registerMutation.data?.error?.message : null);

    return (
        <div className="w-full max-w-lg bg-base-100 rounded-box shadow p-8">
            <header className="mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2 text-primary">
                    <UserPlus className="shrink-0" size={34} aria-hidden="true" />
                    Register new account
                </h1>
                <p className="text-base-content/70 mt-2">
                    Please enter your details to create a new account.
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
                        autoComplete="new-password"
                        placeholder="Password"
                        aria-invalid={errors.password ? 'true' : 'false'}
                        aria-describedby={`${formId}-password-hint ${errors.password ? `${formId}-password-error` : ''}`}
                        className={`input w-full ${errors.password ? 'input-error' : ''}`}
                        disabled={isSubmitting}
                        {...register('password')}
                    />
                    <p id={`${formId}-password-hint`} className="text-base-content/60 text-sm mt-1">
                        Must be at least 8 characters, including:
                        <br />• At least one uppercase letter
                        <br />• At least one lowercase letter
                        <br />• At least one number
                        <br />• At least one special character (!@#$%^&amp;*...)
                    </p>
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

                {/* Confirm Password Field */}
                <div className="fieldset w-full">
                    <label htmlFor={`${formId}-confirmPassword`} className="label text-neutral">
                        Confirm Password
                    </label>
                    <input
                        id={`${formId}-confirmPassword`}
                        type="password"
                        autoComplete="new-password"
                        placeholder="Confirm Password"
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
                    aria-describedby={serverError ? errorId : undefined}
                >
                    {isSubmitting ? (
                        <>
                            <span className="loading loading-spinner loading-sm" aria-hidden="true" />
                            <span>Creating account...</span>
                        </>
                    ) : (
                        'Create Account'
                    )}
                </button>
            </form>

            {/* Footer Links */}
            <footer className="mt-6 text-center">
                <p className="text-sm text-base-content/70">
                    Already have an account?{' '}
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
