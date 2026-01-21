import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateSecret, generateURI } from "otplib";
import qrcode from "qrcode";

export async function POST() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const userEmail = session.user.email!;
        const userId = (session.user as any).id;

        // Generar un secreto compatible con TOTP
        const secret = generateSecret();

        // Guardar el secreto TEMPORALMENTE
        await prisma.user.update({
            where: { id: userId },
            data: { twoFactorSecret: secret, twoFactorEnabled: false }
        });

        const otpauthUrl = generateURI({
            issuer: "Mone.yo",
            label: userEmail,
            secret
        });

        const qrCodeUrl = await qrcode.toDataURL(otpauthUrl);

        return NextResponse.json({
            secret,
            qrCodeUrl
        });
    } catch (error) {
        console.error("Error setting up 2FA:", error);
        return NextResponse.json({ error: "Error al configurar 2FA" }, { status: 500 });
    }
}
