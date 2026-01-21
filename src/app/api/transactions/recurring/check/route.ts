import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic'; // Asegura que no se cachee

export async function GET() {
    try {
        // 1. Buscar transacciones activas marcadas como recurrentes
        const activeRecurring = await prisma.transaction.findMany({
            where: {
                isRecurring: true,
                isPaused: false,
            },
            include: {
                frequency: true
            }
        });

        const createdTransactions = [];
        const now = new Date();

        for (const tx of activeRecurring) {
            const lastDate = new Date(tx.date);
            let nextDate = new Date(lastDate);
            let shouldGenerate = false;

            // Calcular la siguiente fecha según el periodo
            if (tx.frequencyId && tx.frequency) {
                // Frecuencia personalizada (días)
                nextDate.setDate(lastDate.getDate() + tx.frequency.days);
            } else if (tx.recurrencePeriod) {
                // Periodos estándar
                const interval = tx.recurrenceInterval || 1;
                switch (tx.recurrencePeriod) {
                    case "DIARIO":
                        nextDate.setDate(lastDate.getDate() + interval);
                        break;
                    case "SEMANAL":
                        nextDate.setDate(lastDate.getDate() + (7 * interval));
                        break;
                    case "MENSUAL":
                        nextDate.setMonth(lastDate.getMonth() + interval);
                        break;
                    case "ANUAL":
                        nextDate.setFullYear(lastDate.getFullYear() + interval);
                        break;
                }
            }

            // Si la fecha calculada es hoy o anterior, generamos el movimiento
            if (nextDate <= now) {
                shouldGenerate = true;
            }

            if (shouldGenerate) {
                // Transacción atómica para asegurar integridad y evitar duplicados en llamadas concurrentes
                try {
                    const result = await prisma.$transaction(async (prismaTx) => {
                        // 1. "Bloqueamos" el movimiento padre asegurándonos de que sigue siendo recurrente
                        // Usamos updateMany para poder condicionar por isRecurring y evitar que dos procesos
                        // generen el mismo hijo.
                        const lock = await prismaTx.transaction.updateMany({
                            where: {
                                id: tx.id,
                                isRecurring: true
                            },
                            data: { isRecurring: false }
                        });

                        // Si el count es 0, significa que otro proceso ya lo marcó como no recurrente
                        if (lock.count === 0) return null;

                        // 2. Crear el nuevo movimiento (que será el nuevo recurrente)
                        const newTx = await prismaTx.transaction.create({
                            data: {
                                amount: tx.amount,
                                description: tx.description,
                                type: tx.type,
                                accountId: tx.accountId,
                                categoryId: tx.categoryId,
                                originAccountId: tx.originAccountId,
                                destinationAccountId: tx.destinationAccountId,
                                isVerified: false,
                                date: nextDate,
                                isRecurring: true,
                                isPaused: false,
                                recurrencePeriod: tx.recurrencePeriod,
                                recurrenceInterval: tx.recurrenceInterval,
                                frequencyId: tx.frequencyId,
                            }
                        });

                        // 3. Actualizar saldo de la cuenta
                        if (tx.type === "GASTO") {
                            await prismaTx.account.update({
                                where: { id: tx.accountId },
                                data: { balance: { decrement: tx.amount } }
                            });
                        } else if (tx.type === "INGRESO") {
                            await prismaTx.account.update({
                                where: { id: tx.accountId },
                                data: { balance: { increment: tx.amount } }
                            });
                        }

                        return newTx;
                    });

                    if (result) {
                        createdTransactions.push(result);
                    }
                } catch (txError) {
                    console.error(`Error processing transaction ${tx.id}:`, txError);
                }
            }
        }

        return NextResponse.json({ processed: activeRecurring.length, created: createdTransactions.length });
    } catch (error) {
        console.error("Error processing recurring transactions:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}