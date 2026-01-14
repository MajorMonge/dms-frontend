import PageTransition from '@/components/PageTransition';
import Image from 'next/image';

export const metadata = {
    title: "Chrombox - Authentication",
    description: "Login or register to your Chrombox account",
};

export default function AuthLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="grid-wrapper h-full">
            <div className="grid-background"></div>
            <div className="relative z-10 h-full flex flex-col items-center p-4 pt-8 lg:pt-16">
                {/* Fixed logo position */}
                <div className="mb-8 flex-shrink-0">
                    <Image
                        src="/favicon.svg"
                        alt="Chrombox Logo"
                        className="shadow rounded-full"
                        width={120}
                        height={120}
                    />
                </div>
                {/* Content container */}
                <div className="w-full flex justify-center">
                    <PageTransition>{children}</PageTransition>
                </div>
            </div>
        </div>
    );
}
