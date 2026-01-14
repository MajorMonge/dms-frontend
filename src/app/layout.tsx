import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import { appPreferencesStore } from "@/store/app";
import { QueryProvider } from "@/components/QueryProvider";
import { AuthSync } from "@/components/AuthSync";
import { Toaster } from 'react-hot-toast';
import "@/styles/globals.scss";

const getMontserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
});

export const metadata: Metadata = {
  title: "Chrombox",
  description: "Document Management System",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Chrombox",
  },
};

export const viewport: Viewport = {
  themeColor: "#570df8",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme={appPreferencesStore.get().theme} className="bg-base-300 text-base-content">
      <body
        className={`${getMontserrat.variable} antialiased h-screen overflow-hidden`}
      >
        <QueryProvider>
          <AuthSync>
            {children}
          </AuthSync>
        </QueryProvider>
        <Toaster />
      </body>
    </html>
  );
}
