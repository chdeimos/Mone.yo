"use client";

import { SessionProvider } from "next-auth/react";

export function AuthProvider({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider
            refetchInterval={300} // Refetch session every 5 minutes (in seconds)
            refetchOnWindowFocus={true} // Refetch when the user returns to the tab
        >
            {children}
        </SessionProvider>
    );
}
