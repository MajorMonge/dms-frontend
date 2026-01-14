'use client';
import { useStore } from "@nanostores/react";
import { appPreferencesStore } from "@/store/app";
import { authStore, getUserInitials } from "@/store/auth";
import { useEffect, useState, useCallback } from "react";
import { toggleMobileDrawer } from "./MobileDrawer";
import { useLogout } from "@/lib/api/auth";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import toast from "react-hot-toast";
import SearchModal from "./SearchModal";

export default function NavBarComponent() {
    const preferences = useStore(appPreferencesStore);
    const auth = useStore(authStore);
    const theme = preferences.theme;
    const [mounted, setMounted] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const router = useRouter();

    const user = auth.user;
    const initials = getUserInitials(user);

    const logoutMutation = useLogout({
        onSuccess: () => {
            toast.success('Logged out successfully');
            router.push(ROUTES.LOGIN.path);
        },
        onError: (error) => {
            toast.error(error.message || 'Logout failed');
            router.push(ROUTES.LOGIN.path);
        },
    });

    const handleLogout = useCallback(() => {
        logoutMutation.mutate();
    }, [logoutMutation]);

    useEffect(() => {
        setMounted(true);
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsSearchOpen(true);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    const changeTheme = () => {
        const newTheme = theme === "dim" ? "light" : "dim";
        appPreferencesStore.set({ ...preferences, theme: newTheme });
    };

    return (<div className="navbar bg-base-100 shadow-sm rounded-box h-16 min-h-16">
        <div className="navbar-start gap-2">
            <button onClick={toggleMobileDrawer} className="btn btn-ghost btn-square lg:hidden" aria-label="Toggle sidebar">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>
            <button 
                onClick={() => setIsSearchOpen(true)}
                className="input shadow-sm rounded-box outline-none cursor-pointer hover:bg-base-200 transition-colors flex items-center gap-2"
            >
                <svg className="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <g
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        strokeWidth="2.5"
                        fill="none"
                        stroke="currentColor"
                    >
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.3-4.3"></path>
                    </g>
                </svg>
                <span className="text-base-content/50">Search...</span>
                <kbd className="kbd kbd-sm ml-auto hidden sm:inline-flex">Ctrl+K</kbd>
            </button>
        </div>
        <div className="navbar-end gap-4">
            <div className="dropdown dropdown-end flex flex-row gap-4 items-center z-99">
                {mounted && (
                    <div className="dropdown dropdown-end">
                        <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar placeholder">
                            <div className="w-10 rounded-full bg-primary text-primary-content flex items-center justify-center">
                                <span className="text-lg font-semibold">{initials}</span>
                            </div>
                        </div>
                        <ul
                            tabIndex={0}
                            className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-48 w-auto p-2 shadow-sm gap-1 text-base-content">
                            <li className="menu-title pointer-events-none">
                                <span className="text-xs text-base-content/60 truncate">
                                    {user?.email || 'User'}
                                </span>
                            </li>
                            <li >
                                <label className="label cursor-pointer text-base-content active:text-base-100" htmlFor="theme-toggle">
                                    <input
                                        type="checkbox"
                                        className="toggle toggle-sm  active:border-base-100 active:bg-base-100"
                                        checked={theme === "dim"}
                                        onChange={changeTheme}
                                    />
                                    {theme === "light" ? "Light" : "Dark"} Mode
                                </label>
                            </li>
                            <hr className="border-base-300" />
                            <li>
                                <button
                                    onClick={handleLogout}
                                    disabled={logoutMutation.isPending}
                                    className="justify-between"
                                >
                                    {logoutMutation.isPending ? (
                                        <>
                                            <span className="loading loading-spinner loading-xs" />
                                            Logging out...
                                        </>
                                    ) : (
                                        'Logout'
                                    )}
                                </button>
                            </li>
                        </ul>
                    </div>
                )}
            </div>
        </div>

        <SearchModal 
            isOpen={isSearchOpen} 
            onClose={() => setIsSearchOpen(false)} 
        />
    </div>);
}