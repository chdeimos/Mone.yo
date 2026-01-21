import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const isAdmin = (session.user as any).role === "ADMIN";
        const isSelf = (session.user as any).id === params.id;

        if (!isAdmin && !isSelf) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const body = await request.json();
        const { email, name, password, role, twoFactorEnabled, monthlyReportEnabled, permissions } = body;

        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return NextResponse.json({ error: "El formato del correo electrónico no es válido" }, { status: 400 });
            }
        }

        const updateData: any = {
            email,
            name,
        };

        // El usuario puede activar su propio 2FA o informes, o el admin puede cambiarlo para cualquiera
        if (isAdmin || isSelf) {
            if (twoFactorEnabled !== undefined) updateData.twoFactorEnabled = !!twoFactorEnabled;
            if (monthlyReportEnabled !== undefined) updateData.monthlyReportEnabled = !!monthlyReportEnabled;
        }

        // Solo los admins pueden cambiar roles
        if (isAdmin) {
            if (role) updateData.role = role;
            if (permissions) updateData.permissions = permissions;
        }

        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const user = await (prisma.user as any).update({
            where: { id: params.id },
            data: updateData,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                twoFactorEnabled: true,
                monthlyReportEnabled: true,
                permissions: true,
            }
        });

        return NextResponse.json(user);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "El email ya está registrado por otro usuario" }, { status: 400 });
        }
        console.error("Error updating user:", error);
        return NextResponse.json({ error: "Error al actualizar usuario" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "ADMIN") {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        // No permitir que un admin se borre a sí mismo
        if ((session.user as any).id === params.id) {
            return NextResponse.json({ error: "No puedes eliminar tu propia cuenta" }, { status: 400 });
        }

        await prisma.user.delete({
            where: { id: params.id }
        });

        return NextResponse.json({ message: "Usuario eliminado" });
    } catch (error) {
        return NextResponse.json({ error: "Error al eliminar usuario" }, { status: 500 });
    }
}
