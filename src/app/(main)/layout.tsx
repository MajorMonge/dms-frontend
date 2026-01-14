import SideBarComponent from "@/components/SideBar";
import NavBarComponent from "@/components/NavBar";
import PageTransition from "@/components/PageTransition";
import UploadManager from "@/components/UploadManager";
import TransferIndicator from "@/components/TransferIndicator";
import MobileDrawer from "@/components/MobileDrawer";

export default function MainLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>
            <UploadManager />
            <TransferIndicator />
            <div className="grid-wrapper h-full">
                <div className="grid-background"></div>
                <div className="relative z-10 h-full p-4 flex gap-2">
                    <div className="hidden lg:flex h-full">
                        <SideBarComponent />
                    </div>

                    <MobileDrawer />

                    <div className="flex flex-col flex-1 gap-4 min-w-0 h-full">
                        <NavBarComponent />
                        <main className="flex-1 min-h-0">
                            <PageTransition>{children}</PageTransition>
                        </main>
                    </div>
                </div>
            </div>
        </>
    );
}
