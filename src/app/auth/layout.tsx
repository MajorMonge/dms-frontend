export const metadata = {
    title: "Chrombox - Login",
    description: "Login to your Chrombox account",
};


export default function AuthLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="h-screen flex items-center justify-center bg-base-300">
            {children}
        </div>
    );
}
