'use client';
import { User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
    const [error, setError] = useState<string | null>(null);

    return (
        <div className="w-full max-w-md bg-base-100 rounded-box shadow p-8 gap-2">
            <h1 className="text-2xl font-bold mb-4 gap-4 text-primary"><User className="inline-block mr-2" size={34} /> Login</h1>
            <p className="text-base-content/70"> Please enter your credentials to access your account.</p>
            <br />
            {
                error && <div className="alert alert-error mb-4">
                    {error}
                    <br />
                </div>
            }
            <fieldset className="flex flex-col items-start container justify-center gap-2 text-base-content/50">
                <fieldset className="fieldset w-full text-neutral">
                    <label className="label">Email</label>
                    <input type="email" className="input validator w-full" placeholder="user@example.com" required />
                    <p className="validator-hint hidden">Required</p>
                </fieldset>

                <label className="fieldset w-full text-neutral">
                    <label className="label">Password</label>
                    <input type="password" className="input validator w-full" placeholder="Password" />
                    <p className="validator-hint hidden">
                        Must be more than 8 characters, including
                        <br />At least one number
                        <br />At least one lowercase letter
                        <br />At least one uppercase letter
                    </p></label>

                <button className="btn btn-primary mt-4  w-full">Login</button>
            </fieldset>
            <br />
            <p className="text-sm text-base-content/70 mt-4 text-center">
                Don't have an account? <Link href="/register" className="text-primary hover:underline">Sign up</Link>
            </p>
            <p className="text-sm text-base-content/70 mt-4 text-center">
                Forgot your password? <Link href="/reset-password" className="text-primary hover:underline">Reset here</Link>
            </p>
        </div>
    );
}
