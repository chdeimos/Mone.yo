import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { verify } from "otplib";

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const { code } = await request.json();

        if (!code) {
            return NextResponse.json({ error: "Código requerido" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { twoFactorSecret: true }
        });

        if (!user || !user.twoFactorSecret) {
            return NextResponse.json({ error: "2FA no configurado" }, { status: 400 });
        }

        // En otplib v13+ verify es async y devuelve { valid: boolean }
        const result = await verify({
            token: code,
            secret: user.twoFactorSecret
        });

        if (!result || !result.valid) {
            return NextResponse.json({ error: "Código inválido" }, { status: 400 });
        }

        // Activamos definitivamente el 2FA
        await prisma.user.update({
            where: { id: userId },
            data: { twoFactorEnabled: true }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error verifying 2FA:", error);
        return NextResponse.json({ error: "Error al verificar 2FA" }, { status: 500 });
    }
}
