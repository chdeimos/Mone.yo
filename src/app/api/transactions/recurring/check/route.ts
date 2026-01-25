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
            let currentTx = tx;
            let catchUpLimit = 0; // Evitar bucles infinitos por configuración errónea

            while (catchUpLimit < 100) { // Límite de 100 iteraciones por seguridad
                const lastDate = new Date(currentTx.date);
                let nextDate = new Date(lastDate);

                // Calcular la siguiente fecha
                if (currentTx.frequencyId && currentTx.frequency) {
                    nextDate.setDate(lastDate.getDate() + currentTx.frequency.days);
                } else if (currentTx.recurrencePeriod) {
                    const interval = currentTx.recurrenceInterval || 1;
                    switch (currentTx.recurrencePeriod) {
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
                } else {
                    // Si no tiene periodo definido, no podemos calcular la siguiente
                    await logger.warn(`La transacción recurrente ${tx.id} (${tx.description}) no tiene un periodo de frecuencia definido.`);
                    break;
                }

                // Si la fecha calculada es posterior a ahora, paramos el catch-up
                if (nextDate > now) {
                    break;
                }

                // Generamos el movimiento
                try {
                    const result = await prisma.$transaction(async (prismaTx) => {
                        // Bloqueamos el movimiento actual
                        const lock = await prismaTx.transaction.updateMany({
                            where: {
                                id: currentTx.id,
                                isRecurring: true
                            },
                            data: { isRecurring: false }
                        });

                        if (lock.count === 0) return null;

                        // Crear el nuevo movimiento
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
                            },
                            include: {
                                frequency: true
                            }
                        });

                        // Actualizar saldos
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

                        return newTx;
                    });

                    if (result) {
                        createdTransactions.push(result);
                        currentTx = result; // Para la siguiente vuelta del catch-up
                        await logger.info(`Generada recurrencia para "${tx.description}" con fecha ${nextDate.toLocaleDateString()}`);
                    } else {
                        break;
                    }
                } catch (txError) {
                    await logger.error(`Error procesando transacción recurrente ${tx.id}:`, txError);
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
