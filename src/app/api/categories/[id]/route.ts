import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const body = await req.json();
        const { name, color, icon } = body;

        const category = await prisma.category.update({
            where: { id: params.id },
            data: { name, color, icon }
        });

        return NextResponse.json(category);
    } catch (error) {
        return NextResponse.json({ error: "Error updating category" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        // Check usage
        const category = await prisma.category.findUnique({
            where: { id: params.id },
            include: {
                _count: {
                    select: { transactions: true, budgets: true }
                }
            }
        });

        if (category && (category._count.transactions > 0 || category._count.budgets > 0)) {
            return NextResponse.json({ error: "No se puede eliminar una categoría en uso." }, { status: 400 });
        }

        await prisma.category.delete({
            where: { id: params.id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Error deleting category" }, { status: 500 });
    }
}