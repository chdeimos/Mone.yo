import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "ADMIN") {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const users = await (prisma.user as any).findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                twoFactorEnabled: true,
                permissions: true,
                createdAt: true,
            },
            orderBy: { createdAt: "desc" }
        });
        return NextResponse.json(users);
    } catch (error) {
        return NextResponse.json({ error: "Error al obtener usuarios" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "ADMIN") {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const body = await request.json();
        const { email, name, password, role, twoFactorEnabled, permissions } = body;

        if (!email || !password || !name) {
            return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
        }

        // Validación de formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json({ error: "El formato del correo electrónico no es válido" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await (prisma.user as any).create({
            data: {
                email,
                name,
                password: hashedPassword,
                role: role || "USER",
                twoFactorEnabled: !!twoFactorEnabled,
                permissions: permissions || { vision: true },
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                twoFactorEnabled: true,
                permissions: true,
            }
        });

        return NextResponse.json(user);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "El email ya está registrado" }, { status: 400 });
        }
        return NextResponse.json({ error: "Error al crear usuario" }, { status: 500 });
    }
}
