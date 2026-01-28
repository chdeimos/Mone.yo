import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const subscription = await prisma.subscription.findUnique({
            where: { id: params.id },
            include: {
                account: true,
                category: true,
                originAccount: true,
                destinationAccount: true,
                frequency: true
            }
        });

        if (!subscription) {
            return NextResponse.json({ error: "Recurrencia no encontrada" }, { status: 404 });
        }

        return NextResponse.json(subscription);
    } catch (error) {
        console.error("Error fetching subscription:", error);
        return NextResponse.json({ error: "Error al obtener recurrencia" }, { status: 500 });
    }
}

export async function PUT(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const body = await req.json();
        const {
            amount, description, type, accountId, categoryId,
            originAccountId, destinationAccountId,
            recurrencePeriod, recurrenceInterval, frequencyId,
            isPaused, nextExecutionDate
        } = body;

        const updated = await prisma.subscription.update({
            where: { id: params.id },
            data: {
                amount,
                description,
                type,
                accountId,
                categoryId,
                originAccountId: type === "TRASPASO" ? (originAccountId || accountId) : null,
                destinationAccountId: type === "TRASPASO" ? destinationAccountId : null,
                recurrencePeriod,
                recurrenceInterval: recurrenceInterval ? parseInt(recurrenceInterval.toString()) : undefined,
                frequencyId,
                isPaused,
                nextExecutionDate: nextExecutionDate ? new Date(nextExecutionDate) : undefined,
            }
        });

        return NextResponse.json(updated);
    } catch (error: any) {
        console.error("Error updating subscription:", error);
        return NextResponse.json({ error: "Error al actualizar recurrencia" }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        await prisma.subscription.delete({
            where: { id: params.id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting subscription:", error);
        return NextResponse.json({ error: "Error al eliminar recurrencia" }, { status: 500 });
    }
}
