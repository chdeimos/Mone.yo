import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { transactions, accountId } = body;

        if (!transactions || !Array.isArray(transactions) || !accountId) {
            return NextResponse.json({ error: "Datos de importación inválidos" }, { status: 400 });
        }

        const results = await prisma.$transaction(async (tx) => {
            const createdTransactions = [];

            for (const item of transactions) {
                const { amount, description, date, type, categoryId, destinationAccountId, isVerified } = item;

                // 1. Crear la transacción
                const newTransaction = await tx.transaction.create({
                    data: {
                        amount,
                        description,
                        date: new Date(date),
                        type: type || "GASTO",
                        accountId,
                        categoryId: type === "TRASPASO" ? null : (categoryId || null),
                        originAccountId: type === "TRASPASO" ? accountId : null,
                        destinationAccountId: type === "TRASPASO" ? destinationAccountId : null,
                        isVerified: isVerified ?? true, // Por defecto verificado si viene del banco
                    }
                });

                createdTransactions.push(newTransaction);

                // 2. Actualizar saldo de la cuenta
                if (type === "INGRESO") {
                    await tx.account.update({
                        where: { id: accountId },
                        data: { balance: { increment: amount } }
                    });
                } else if (type === "GASTO") {
                    await tx.account.update({
                        where: { id: accountId },
                        data: { balance: { decrement: amount } }
                    });
                } else if (type === "TRASPASO") {
                    // Restar de origen (la cuenta de importación)
                    await tx.account.update({
                        where: { id: accountId },
                        data: { balance: { decrement: amount } }
                    });
                    // Sumar a destino
                    if (destinationAccountId) {
                        await tx.account.update({
                            where: { id: destinationAccountId },
                            data: { balance: { increment: amount } }
                        });
                    }
                }
            }

            return createdTransactions;
        });

        return NextResponse.json({
            success: true,
            count: results.length
        });
    } catch (error) {
        console.error("Error in bulk import:", error);
        return NextResponse.json({ error: "Error al procesar la importación masiva" }, { status: 500 });
    }
}
