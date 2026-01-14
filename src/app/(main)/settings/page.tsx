"use client";

import { useStore } from "@nanostores/react";
import { appPreferencesStore } from "@/store/app";

export default function SettingsPage() {
  const preferences = useStore(appPreferencesStore);

  const toggleTheme = () => {
    const newTheme = preferences.theme === "dim" ? "light" : "dim";
    appPreferencesStore.set({ ...preferences, theme: newTheme });
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  return (
    <div className="h-full bg-base-100 rounded-box p-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="space-y-6">
        {/* Appearance */}
        <div className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title text-lg">Appearance</h2>
            <div className="form-control">
              <label className="label cursor-pointer justify-start gap-4">
                <input
                  type="checkbox"
                  className="toggle toggle-primary"
                  checked={preferences.theme === "dim"}
                  onChange={toggleTheme}
                />
                <span className="label-text">Dark mode</span>
              </label>
            </div>
          </div>
        </div>

        {/* Storage */}
        <div className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title text-lg">Storage</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Used</span>
                <span>5.25 GB of 15 GB</span>
              </div>
              <progress className="progress progress-primary w-full" value={35} max="100"></progress>
            </div>
            <div className="mt-4">
              <button className="btn btn-outline btn-sm">Manage Storage</button>
            </div>
          </div>
        </div>

        {/* Account */}
        <div className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title text-lg">Account</h2>
            <div className="space-y-2">
              <p className="text-sm text-base-content/70">Signed in as</p>
              <p className="font-medium">user@example.com</p>
            </div>
            <div className="mt-4 flex gap-2">
              <button className="btn btn-outline btn-sm">Manage Account</button>
              <button className="btn btn-error btn-outline btn-sm">Sign Out</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
