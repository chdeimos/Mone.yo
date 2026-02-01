import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { NextAuthOptions, DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import { compare } from "bcryptjs";
import { verify } from "otplib";
import { accessLogger } from "./logger";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            role: string;
            twoFactorEnabled: boolean;
            permissions: any;
        } & DefaultSession["user"]
    }

    interface User {
        role: string;
        twoFactorEnabled: boolean;
        permissions: any;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        role: string;
        twoFactorEnabled: boolean;
        permissions: any;
    }
}

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    session: {
        strategy: "jwt",
        maxAge: 30 * 60, // 30 minutes
        updateAge: 15 * 60, // Update session every 15 minutes
    },
    pages: {
        signIn: "/login",
    },
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
                code: { label: "2FA Code", type: "text" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const user = await prisma.user.findUnique({
                    where: {
                        email: credentials.email
                    }
                });

                if (!user) {
                    return null;
                }

                const isPasswordValid = await compare(credentials.password, user.password);

                if (!isPasswordValid) {
                    await accessLogger.log({
                        email: credentials.email,
                        action: "FAILED_LOGIN"
                    });
                    return null;
                }

                // Verificación de 2FA si está activo
                if (user.twoFactorEnabled) {
                    if (!credentials?.code) {
                        // Solicitamos el código al frontend
                        throw new Error("2FA_REQUIRED");
                    }

                    const result = await verify({
                        token: credentials.code,
                        secret: user.twoFactorSecret || ""
                    });

                    if (!result || !result.valid) {
                        await accessLogger.log({
                            email: user.email,
                            action: "FAILED_LOGIN"
                        });
                        throw new Error("INVALID_2FA");
                    }

                    await accessLogger.log({
                        email: user.email,
                        action: "2FA_VERIFY"
                    });
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    twoFactorEnabled: user.twoFactorEnabled,
                    permissions: (user as any).permissions
                };
            }
        })
    ],
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            // Initial sign in
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.twoFactorEnabled = !!user.twoFactorEnabled;
                token.permissions = user.permissions;
            }
            // Handling updates
            if (trigger === "update" && session) {
                if (session.name) token.name = session.name;
                if (session.email) token.email = session.email;
                if (session.twoFactorEnabled !== undefined) {
                    token.twoFactorEnabled = !!session.twoFactorEnabled;
                }
                // Handle case where user object is passed
                if (session.user) {
                    if (session.user.name) token.name = session.user.name;
                    if (session.user.email) token.email = session.user.email;
                    if (session.user.twoFactorEnabled !== undefined) {
                        token.twoFactorEnabled = !!session.user.twoFactorEnabled;
                    }
                }
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
                session.user.twoFactorEnabled = !!token.twoFactorEnabled;
                session.user.permissions = token.permissions;
                if (token.name) session.user.name = token.name as string;
                if (token.email) session.user.email = token.email as string;
            }
            return session;
        }
    },
    events: {
        async signIn({ user }) {
            if (user && user.email) {
                await accessLogger.log({
                    email: user.email,
                    action: "LOGIN"
                });
            }
        },
        async signOut({ token }) {
            if (token && token.email) {
                await accessLogger.log({
                    email: token.email,
                    action: "LOGOUT"
                });
            }
        },
    }
};