import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const body = await req.json();
        const { name, icon } = body;

        const updatedType = await prisma.accountType.update({
            where: { id: params.id },
            data: { name, icon }
        });

        return NextResponse.json(updatedType);
    } catch (error) {
        return NextResponse.json({ error: "Error updating account type" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        // Verificar si está en uso
        const type = await prisma.accountType.findUnique({
            where: { id: params.id },
            include: { _count: { select: { accounts: true } } }
        });

        if (type && type._count.accounts > 0) {
             return NextResponse.json({ error: "No se puede eliminar un tipo que tiene cuentas asociadas." }, { status: 400 });
        }

        await prisma.accountType.delete({
            where: { id: params.id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Error deleting account type" }, { status: 500 });
    }
}