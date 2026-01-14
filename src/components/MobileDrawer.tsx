"use client";

import { useStore } from "@nanostores/react";
import { AnimatePresence, motion } from "framer-motion";
import { atom } from "nanostores";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import SideBarComponent from "./SideBar";

export const mobileDrawerStore = atom<boolean>(false);

export const openMobileDrawer = () => mobileDrawerStore.set(true);
export const closeMobileDrawer = () => mobileDrawerStore.set(false);
export const toggleMobileDrawer = () => mobileDrawerStore.set(!mobileDrawerStore.get());

export default function MobileDrawer() {
    const isOpen = useStore(mobileDrawerStore);
    const pathname = usePathname();

    useEffect(() => {
        closeMobileDrawer();
    }, [pathname]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Overlay */}
                    <motion.div
                        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={closeMobileDrawer}
                    />
                    
                    {/* Sidebar */}
                    <motion.div
                        className="fixed top-0 left-0 h-full z-50 p-4 lg:hidden"
                        style={{ width: "min(80%, 320px)", minWidth: "60%" }}
                        initial={{ x: "-100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "-100%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                        <SideBarComponent isMobile />
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
