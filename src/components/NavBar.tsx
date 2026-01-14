'use client';
import { useStore } from "@nanostores/react";
import { appPreferencesStore } from "@/store/app";
import { useEffect, useState } from "react";
import { toggleMobileDrawer } from "./MobileDrawer";

export default function NavBarComponent() {
    const preferences = useStore(appPreferencesStore);
    const theme = preferences.theme;
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

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
            <label className="input shadow-sm rounded-box outline-none">
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
                <input type="search" required placeholder="Search" className="rounded-box" />
            </label>
        </div>
        <div className="navbar-end gap-4">
            <div className="dropdown dropdown-end flex flex-row gap-4 items-center">
                {mounted && (
                    <div className="dropdown dropdown-end">
                        <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
                            <div className="w-10 rounded-full">
                                <img
                                    alt="Tailwind CSS Navbar component"
                                    src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp" />
                            </div>
                        </div>
                        <ul
                            tabIndex={0}
                            className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow-sm gap-2 text-base-content">
                            <li>
                                <a className="justify-between">
                                    Profile
                                </a>
                            </li>
                            <li><a>Logout</a></li>
                            <hr className="border-base-300" />
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
                        </ul>
                    </div>
                )}
            </div>
        </div>
    </div>);
}