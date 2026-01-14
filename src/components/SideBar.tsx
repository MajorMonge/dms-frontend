'use client';
import { appPreferencesStore } from "@/store/app";
import { authStore, formatBytes, getStoragePercentage } from "@/store/auth";
import { useStore } from "@nanostores/react";
import { AnimatePresence, motion } from "framer-motion";
import { House, Settings, Users, Clock, Star, Trash2 } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { closeMobileDrawer } from "./MobileDrawer";

interface SideBarProps {
    isMobile?: boolean;
}

export default function SideBarComponent({ isMobile = false }: SideBarProps) {
    const pathname = usePathname();
    const preferences = useStore(appPreferencesStore);
    const auth = useStore(authStore);
    const sidebarState = isMobile ? "expanded" : preferences.sidebarState;

    const user = auth.user;
    const storageUsed = formatBytes(user?.storageUsed ?? 0);
    const storageLimit = formatBytes(user?.storageLimit ?? 5 * 1024 * 1024 * 1024);
    const storagePercentage = getStoragePercentage(user);

    const triggerSidebar = () => {
        if (sidebarState === "expanded") {
            appPreferencesStore.set({ ...appPreferencesStore.get(), sidebarState: "collapsed" });
        } else {
            appPreferencesStore.set({ ...appPreferencesStore.get(), sidebarState: "expanded" });
        }
    }

    const handleNavClick = () => {
        if (isMobile) {
            closeMobileDrawer();
        }
    };

    const menuItems = [
        { label: "My Files", icon: <House size={20} />, href: "/" },
        { label: "Recent", icon: <Clock size={20} />, href: "/recent" },
        { label: "Starred", icon: <Star size={20} />, href: "/starred" },
        { label: "Trash", icon: <Trash2 size={20} />, href: "/trash" },
    ];

    const bottomMenuItems = [] as any[];

    interface MenuItemProps {
        label: string;
        icon: React.ReactNode;
        active?: boolean;
        href: string;
    }

    const MenuItemComponent = ({ label, icon, active, href }: MenuItemProps) => {
        return (
            <li>
                <Link 
                    href={href}
                    onClick={handleNavClick}
                    className={`${active ? "menu-active" : ""} flex gap-2 items-center h-12`}
                >
                    <motion.span layout className="flex items-center" aria-hidden={false}>
                        {icon}
                    </motion.span>
                    <AnimatePresence initial={false}>
                        {sidebarState === "expanded" && (
                            <motion.span
                                key={label}
                                className="font-medium origin-left"
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -8 }}
                                transition={{ duration: 0.15 }}
                            >
                                {label}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </Link>
            </li>
        );
    }

    // Mobile sidebar is always expanded, no width animation needed
    if (isMobile) {
        return (
            <div className="relative flex flex-col gap-4 h-full w-full">
                <div className="relative flex items-center justify-center h-16 glass shadow-sm rounded-box overflow-hidden">
                    <div className="absolute inset-0 bg-radial from-primary to-b rounded-xl blur-md opacity-20"></div>
                    <p className="relative text-2xl font-bold z-10">Chromix</p>
                </div>
                <div className="grow bg-base-100 shadow-sm rounded-box flex flex-col shrink-0">
                    <div className="flex-1 overflow-y-auto px-2 py-4">
                        <ul className="menu menu-lg w-full gap-2 items-stretch">
                            {menuItems.map((item) => (
                                <MenuItemComponent
                                    key={item.href}
                                    active={pathname === item.href}
                                    label={item.label}
                                    icon={item.icon}
                                    href={item.href}
                                />
                            ))}
                        </ul>
                        
                        <div className="divider my-2"></div>
                        
                        <ul className="menu menu-lg w-full gap-2 items-stretch">
                            {bottomMenuItems.map((item) => (
                                <MenuItemComponent
                                    key={item.href}
                                    active={pathname === item.href}
                                    label={item.label}
                                    icon={item.icon}
                                    href={item.href}
                                />
                            ))}
                        </ul>
                    </div>
                    <div className="border-t border-base-300 mt-auto">
                        <div className="flex flex-col gap-2 p-4">
                            <p className="font-medium text-sm">Storage Used</p>
                            <progress 
                                className={`progress w-full ${
                                    storagePercentage > 90 ? 'progress-error' : 
                                    storagePercentage > 70 ? 'progress-warning' : 
                                    'progress-primary'
                                }`} 
                                value={storagePercentage} 
                                max="100"
                            />
                            <p className="text-xs opacity-70">{storageUsed} of {storageLimit} used</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            className="relative flex flex-col gap-4 h-full shrink-0"
            initial={false}
            animate={{ width: sidebarState === "collapsed" ? 72 : 304 }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
        >
            {!isMobile &&
                <div className="tooltip tooltip-right absolute top-1/2 -right-3 cursor-pointer" data-tip={sidebarState === "collapsed" ? "Expand sidebar" : "Collapse sidebar"}>
                    <div role="button" onClick={triggerSidebar} className="bg-base-200 border border-base-300 rounded-full p-1 shadow-sm hover:bg-base-300 transition-colors z-50">
                        <motion.svg
                            className="h-4 w-4"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            animate={{ rotate: sidebarState === "collapsed" ? 0 : 180 }}
                            transition={{ type: "spring", stiffness: 260, damping: 20 }}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </motion.svg>
                    </div>
                </div>}
            <motion.div
                className="relative flex items-center justify-center h-16 glass shadow-sm rounded-box overflow-hidden"
                layout
                initial={false}
            >
                <motion.div
                    className="absolute inset-0 bg-radial from-primary to-b rounded-xl blur-md opacity-20"
                    animate={{ scale: sidebarState === "collapsed" ? 0.95 : 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 24 }}
                ></motion.div>
                <AnimatePresence mode="wait" initial={false}>
                    {sidebarState === "collapsed" ? (
                        <motion.p
                            key="collapsed-logo"
                            className="relative text-2xl font-bold z-10"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.15 }}
                        >
                            C
                        </motion.p>
                    ) : (
                        <motion.p
                            key="expanded-logo"
                            className="relative text-2xl font-bold z-10"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.15 }}
                        >
                            Chromix
                        </motion.p>
                    )}
                </AnimatePresence>
            </motion.div>
            <div className="grow bg-base-100 shadow-sm rounded-box flex flex-col shrink-0">
                <motion.div
                    className={`flex-1 overflow-y-auto ${sidebarState === "collapsed" ? "px-1 py-2" : "px-2 py-4"}`}
                    initial={isMobile ? { opacity: 0 } : false}
                    animate={isMobile ? { opacity: 1 } : {}}
                    transition={{ delay: isMobile ? 0.15 : 0, duration: 0.3 }}
                >
                    <ul className={`menu ${sidebarState === "collapsed" ? "menu-md" : "menu-lg"} w-full gap-2 ${sidebarState === "collapsed" ? "items-center" : "items-stretch"}`}>
                        {menuItems.map((item) => (
                            <MenuItemComponent
                                key={item.href}
                                active={pathname === item.href}
                                label={item.label}
                                icon={item.icon}
                                href={item.href}
                            />
                        ))}
                    </ul>
                    
                    <div className="divider my-2"></div>
                    
                    <ul className={`menu ${sidebarState === "collapsed" ? "menu-md" : "menu-lg"} w-full gap-2 ${sidebarState === "collapsed" ? "items-center" : "items-stretch"}`}>
                        {bottomMenuItems.map((item) => (
                            <MenuItemComponent
                                key={item.href}
                                active={pathname === item.href}
                                label={item.label}
                                icon={item.icon}
                                href={item.href}
                            />
                        ))}
                    </ul>
                </motion.div>
                <div className="border-t border-base-300 mt-auto">
                    <motion.div
                        className={`flex flex-col gap-2 ${sidebarState === "collapsed" ? "p-2 items-center" : "p-4"}`}
                        initial={isMobile ? { opacity: 0 } : false}
                        animate={isMobile ? { opacity: 1 } : {}}
                        transition={{ delay: isMobile ? 0.25 : 0, duration: 0.3 }}
                    >
                        <AnimatePresence mode="wait" initial={false}>
                            {sidebarState === "expanded" ? (
                                <motion.div
                                    key="expanded"
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 8 }}
                                    transition={{ duration: 0.15 }}
                                    className="flex flex-col gap-2 w-full"
                                >
                                    <p className="font-medium text-sm">Storage Used</p>
                                    <progress 
                                        className={`progress w-full ${
                                            storagePercentage > 90 ? 'progress-error' : 
                                            storagePercentage > 70 ? 'progress-warning' : 
                                            'progress-primary'
                                        }`} 
                                        value={storagePercentage} 
                                        max="100"
                                    />
                                    <p className="text-xs opacity-70">{storageUsed} of {storageLimit} used</p>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="collapsed"
                                    className="flex flex-col items-center"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.15 }}
                                >
                                    <div
                                        className={`radial-progress text-[10px] ${
                                            storagePercentage > 90 ? 'text-error' : 
                                            storagePercentage > 70 ? 'text-warning' : 
                                            'text-primary'
                                        }`}
                                        style={{ "--value": storagePercentage, "--size": "2.5rem", "--thickness": "3px" } as React.CSSProperties}
                                        role="progressbar"
                                        aria-valuenow={storagePercentage}
                                    >
                                        {Math.round(storagePercentage)}%
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
}
