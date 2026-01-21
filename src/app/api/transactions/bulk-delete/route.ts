import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const { ids } = await req.json();

        if (!ids || !Array.isArray(ids)) {
            return NextResponse.json({ error: "IDs inválidos" }, { status: 400 });
        }

        await prisma.$transaction(async (tx) => {
            // 1. Obtener las transacciones para ajustar los saldos antes de borrar
            const transactionsToDelete = await tx.transaction.findMany({
                where: { id: { in: ids } }
            });

            for (const transaction of transactionsToDelete) {
                const { amount, type, accountId, destinationAccountId } = transaction;

                if (type === "INGRESO") {
                    await tx.account.update({
                        where: { id: accountId },
                        data: { balance: { decrement: amount } }
                    });
                } else if (type === "GASTO") {
                    await tx.account.update({
                        where: { id: accountId },
                        data: { balance: { increment: amount } }
                    });
                } else if (type === "TRASPASO") {
                    // Revertir traspaso usando los campos específicos si existen, sino usar accountId como fallback
                    const orgId = transaction.originAccountId || accountId;
                    const destId = transaction.destinationAccountId;

                    await tx.account.update({
                        where: { id: orgId },
                        data: { balance: { increment: amount } }
                    });

                    if (destId) {
                        await tx.account.update({
                            where: { id: destId },
                            data: { balance: { decrement: amount } }
                        });
                    }
                }
            }

            // 2. Borrar las transacciones
            await tx.transaction.deleteMany({
                where: { id: { in: ids } }
            });
        });

        return NextResponse.json({ success: true, count: ids.length });
    } catch (error) {
        console.error("Error deleting transactions bulk:", error);
        return NextResponse.json({ error: "Error al borrar movimientos" }, { status: 500 });
    }
}
