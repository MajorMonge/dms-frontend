'use client';
import { UserLock } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function ResetPasswordPage() {
    const [error, setError] = useState<string | null>(null);

    return (
        <div className="w-full max-w-md bg-base-100 rounded-box shadow p-8 gap-2">
            <h1 className="text-2xl font-bold mb-4 gap-4 text-primary"><UserLock className="inline-block mr-2" size={34} /> Reset Password</h1>
            <p className="text-base-content/70"> Please enter your email, the confirmation code sent to you, and your new password.</p>
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

                <fieldset className="fieldset w-full text-neutral">
                    <label className="label">Confirmation Code</label>
                    <input type="text" className="input  w-full" placeholder="Confirmation Code" required />
                    <p className="validator-hint hidden">Required</p>
                </fieldset>

                <label className="fieldset w-full text-neutral">
                    <label className="label">New Password</label>
                    <input type="password" className="input validator w-full" placeholder="New Password" />
                    <p className="">
                        Must be more than 8 characters, including:
                        <br />At least one number
                        <br />At least one lowercase letter
                        <br />At least one uppercase letter
                    </p>
                </label>

                <label className="fieldset w-full text-neutral">
                    <label className="label">Confirm New Password</label>
                    <input type="password" className="input validator w-full" placeholder="Confirm New Password" />
                </label>


                <button className="btn btn-primary mt-4  w-full">Change Password</button>
            </fieldset>
        </div>
    );
}
