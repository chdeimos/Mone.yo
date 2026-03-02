import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "@/lib/init";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/components/AuthProvider";

import { ThemeProvider } from "@/components/theme-provider";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Mone.yo - Finanzas Inteligentes",
    description: "Tu asistente personal de finanzas con IA",
    manifest: "/manifest.json",
    themeColor: "#3b82f6",
    viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "Mone.yo",
    },
    icons: {
        apple: "/icons/icon-192x192.png",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es" suppressHydrationWarning>
            <body className={inter.className}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="light"
                    enableSystem
                    disableTransitionOnChange
                >
                    <AuthProvider>
                        <LanguageProvider>
                            {children}
                        </LanguageProvider>
                    </AuthProvider>
                </ThemeProvider>
                <Script
                    id="service-worker-registration"
                    strategy="afterInteractive"
                >
                    {`
                    if ('serviceWorker' in navigator) {
                        navigator.serviceWorker.register('/sw.js')
                        .then(reg => console.log('SW registered'))
                        .catch(err => console.log('SW support missing'));
                    }
                    `}
                </Script>
            </body>
        </html>
    );
}
