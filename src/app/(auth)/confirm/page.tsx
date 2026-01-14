'use client';
import { ShieldUser } from "lucide-react";
import { useState } from "react";

export default function ConfirmPage() {
    const [error, setError] = useState<string | null>(null);

    return (
        <div className="w-full max-w-md bg-base-100 rounded-box shadow p-8 gap-2">
            <h1 className="text-2xl font-bold mb-4 gap-4 text-primary"><ShieldUser className="inline-block mr-2" size={34} /> Confirm Account</h1>
            <p className="text-base-content/70"> Please enter your email and the confirmation code sent to you.</p>
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

                <button className="btn btn-primary mt-4  w-full">Confirm Account</button>
            </fieldset>
        </div>
    );
}
