import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const body = await req.json();
        const { name, days } = body;

        const frequency = await prisma.frequency.update({
            where: { id: params.id },
            data: { name, days: parseInt(days) }
        });

        return NextResponse.json(frequency);
    } catch (error) {
        return NextResponse.json({ error: "Error updating frequency" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        // Check usage
        const frequency = await prisma.frequency.findUnique({
            where: { id: params.id },
            include: {
                _count: {
                    select: { transactions: true }
                }
            }
        });

        if (frequency && frequency._count.transactions > 0) {
            return NextResponse.json({ error: "No se puede eliminar una frecuencia en uso." }, { status: 400 });
        }

        await prisma.frequency.delete({
            where: { id: params.id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Error deleting frequency" }, { status: 500 });
    }
}