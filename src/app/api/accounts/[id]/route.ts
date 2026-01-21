import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const body = await req.json();
        const { name, typeId, currency, color, showOnDashboard } = body;

        const updated = await prisma.account.update({
            where: { id: params.id },
            data: {
                name,
                typeId,
                color,
                showOnDashboard: showOnDashboard !== undefined ? showOnDashboard : undefined,
                initialBalance: body.initialBalance !== undefined ? body.initialBalance : undefined
            },
            include: {
                type: true
            }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error updating account:", error);
        return NextResponse.json({ error: "Error al actualizar la cuenta" }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        await prisma.account.delete({
            where: { id: params.id }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting account:", error);
        return NextResponse.json({ error: "Error al eliminar la cuenta" }, { status: 500 });
    }
}
