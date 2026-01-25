import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await logger.info("Iniciando proceso de verificación de recurrencias");

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
        now.setHours(23, 59, 59, 999); // Aseguramos tomar el día completo

        for (const tx of activeRecurring) {
            let currentAnchorDate = new Date(tx.date);
            let currentAnchorId = tx.id;
            let catchUpLimit = 0;

            while (catchUpLimit < 100) {
                if (currentAnchorDate > now) {
                    break;
                }

                const executionDate = new Date(currentAnchorDate);
                let followingDate = new Date(executionDate);

                if (tx.frequencyId && tx.frequency) {
                    followingDate.setDate(executionDate.getDate() + tx.frequency.days);
                } else if (tx.recurrencePeriod) {
                    const interval = tx.recurrenceInterval || 1;
                    switch (tx.recurrencePeriod) {
                        case "DIARIO":
                            followingDate.setDate(executionDate.getDate() + interval);
                            break;
                        case "SEMANAL":
                            followingDate.setDate(executionDate.getDate() + (7 * interval));
                            break;
                        case "MENSUAL":
                            followingDate.setMonth(executionDate.getMonth() + interval);
                            break;
                        case "ANUAL":
                            followingDate.setFullYear(executionDate.getFullYear() + interval);
                            break;
                    }
                } else {
                    await logger.warn(`La transacción recurrente ${tx.id} no tiene frecuencia definida.`);
                    break;
                }

                try {
                    const result = await prisma.$transaction(async (prismaTx) => {
                        const lock = await prismaTx.transaction.updateMany({
                            where: {
                                id: currentAnchorId,
                                isRecurring: true
                            },
                            data: { isRecurring: false }
                        });

                        if (lock.count === 0) return null;

                        const newExecutedTx = await prismaTx.transaction.create({
                            data: {
                                amount: tx.amount,
                                description: tx.description,
                                type: tx.type,
                                accountId: tx.accountId,
                                categoryId: tx.categoryId,
                                originAccountId: tx.originAccountId,
                                destinationAccountId: tx.destinationAccountId,
                                isVerified: false,
                                date: executionDate,
                                isRecurring: false,
                            }
                        });

                        const nextAnchor = await prismaTx.transaction.create({
                            data: {
                                amount: tx.amount,
                                description: tx.description,
                                type: tx.type,
                                accountId: tx.accountId,
                                categoryId: tx.categoryId,
                                originAccountId: tx.originAccountId,
                                destinationAccountId: tx.destinationAccountId,
                                isVerified: false,
                                date: followingDate,
                                isRecurring: true,
                                isPaused: false,
                                recurrencePeriod: tx.recurrencePeriod,
                                recurrenceInterval: tx.recurrenceInterval,
                                frequencyId: tx.frequencyId,
                            },
                            include: { frequency: true }
                        });

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
                        } else if (tx.type === "TRASPASO" && tx.originAccountId && tx.destinationAccountId) {
                            await prismaTx.account.update({
                                where: { id: tx.originAccountId },
                                data: { balance: { decrement: tx.amount } }
                            });
                            await prismaTx.account.update({
                                where: { id: tx.destinationAccountId },
                                data: { balance: { increment: tx.amount } }
                            });
                        }

                        return { executed: newExecutedTx, next: nextAnchor };
                    });

                    if (result) {
                        createdTransactions.push(result.executed);
                        currentAnchorDate = result.next.date;
                        currentAnchorId = result.next.id;
                        await logger.info(`Generado movimiento programado para "${tx.description}" (${executionDate.toLocaleDateString()}). Próximo: ${result.next.date.toLocaleDateString()}`);
                    } else {
                        break;
                    }
                } catch (txError) {
                    await logger.error(`Error procesando recurrencia ${tx.id}:`, txError);
                    break;
                }
                catchUpLimit++;
            }
        }



        if (createdTransactions.length > 0) {
            await logger.info(`Proceso completado. Se han generado ${createdTransactions.length} nuevos movimientos.`);
        }

        return NextResponse.json({
            processed: activeRecurring.length,
            created: createdTransactions.length
        });
    } catch (error) {
        await logger.error("Error crítico en el proceso de recurrencias:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
