import prisma from "./prisma";
import { logger } from "./logger";

export async function processRecurrentTransactions() {
    try {
        const now = new Date();
        // Ponemos el límite al final del día de hoy para incluir todo lo programado para hoy
        const checkLimit = new Date();
        checkLimit.setHours(23, 59, 59, 999);

        // 1. Obtener todas las recurrencias activas que deben ejecutarse
        // Filtramos isPaused: false y recurrenceInterval > 0 (si no es null)
        const dueSubscriptions = await prisma.subscription.findMany({
            where: {
                isPaused: false,
                nextExecutionDate: {
                    lte: checkLimit
                },
                OR: [
                    { recurrenceInterval: { gt: 0 } },
                    { recurrenceInterval: null }
                ]
            },
            include: {
                frequency: true
            }
        });

        if (dueSubscriptions.length === 0) {
            return { message: "No hay recurrencias pendientes.", createdCount: 0 };
        }

        await logger.info(`[WORKER] Iniciando procesamiento de ${dueSubscriptions.length} recurrencias pendientes.`);

        let createdTotal = 0;

        for (const sub of dueSubscriptions) {
            let nextDate = new Date(sub.nextExecutionDate);
            let currentInterval = sub.recurrenceInterval;
            let catchUpLimit = 0;

            // Procesamos catch-up (por si el servidor estuvo apagado varios días)
            // Cada ejecución resta 1 al intervalo
            while (nextDate <= checkLimit && catchUpLimit < 50) {
                // Si el intervalo llega a 0, paramos
                if (currentInterval !== null && currentInterval <= 0) break;

                try {
                    await prisma.$transaction(async (tx) => {
                        // 1. Crear el movimiento
                        await tx.transaction.create({
                            data: {
                                amount: sub.amount,
                                description: sub.description,
                                type: sub.type,
                                accountId: sub.accountId,
                                categoryId: sub.categoryId,
                                originAccountId: sub.originAccountId,
                                destinationAccountId: sub.destinationAccountId,
                                date: nextDate,
                                isVerified: false,
                                isRecurring: true,
                            }
                        });

                        // 2. Actualizar saldos
                        if (sub.type === "INGRESO") {
                            await tx.account.update({
                                where: { id: sub.accountId },
                                data: { balance: { increment: sub.amount } }
                            });
                        } else if (sub.type === "GASTO") {
                            await tx.account.update({
                                where: { id: sub.accountId },
                                data: { balance: { decrement: sub.amount } }
                            });
                        } else if (sub.type === "TRASPASO") {
                            const orgId = sub.originAccountId || sub.accountId;
                            await tx.account.update({
                                where: { id: orgId },
                                data: { balance: { decrement: sub.amount } }
                            });
                            if (sub.destinationAccountId) {
                                await tx.account.update({
                                    where: { id: sub.destinationAccountId },
                                    data: { balance: { increment: sub.amount } }
                                });
                            }
                        }

                        // 3. Calcular SIGUIENTE fecha (siempre 1 periodo)
                        let newNextDate = new Date(nextDate);
                        if (sub.frequency) {
                            newNextDate.setMonth(newNextDate.getMonth() + 1);
                        } else {
                            switch (sub.recurrencePeriod) {
                                case "DIARIO": newNextDate.setDate(newNextDate.getDate() + 1); break;
                                case "SEMANAL": newNextDate.setDate(newNextDate.getDate() + 7); break;
                                case "MENSUAL": newNextDate.setMonth(newNextDate.getMonth() + 1); break;
                                case "ANUAL": newNextDate.setFullYear(newNextDate.getFullYear() + 1); break;
                                default: newNextDate.setMonth(newNextDate.getMonth() + 1);
                            }
                        }

                        // 4. Actualizar intervalo y estado
                        if (currentInterval !== null) {
                            currentInterval = Math.max(0, currentInterval - 1);
                        }

                        const isNowPaused = currentInterval === 0;

                        await tx.subscription.update({
                            where: { id: sub.id },
                            data: {
                                nextExecutionDate: newNextDate,
                                lastExecutionDate: new Date(),
                                recurrenceInterval: currentInterval,
                                isPaused: isNowPaused ? true : sub.isPaused
                            }
                        });

                        await logger.info(`[WORKER] Movimiento generado: ${sub.description}. Restan ${currentInterval ?? '∞'} ejecuciones.`);

                        // Avanzamos para el catch-up
                        nextDate = newNextDate;
                        createdTotal++;
                    });
                } catch (subError: any) {
                    await logger.error(`[WORKER] Error procesando recurrencia ${sub.id} (${sub.description}):`, subError);
                    break;
                }
                catchUpLimit++;
            }
        }

        if (createdTotal > 0) {
            await logger.info(`[WORKER] Proceso finalizado. Total movimientos creados: ${createdTotal}.`);
        }

        return { success: true, createdCount: createdTotal };
    } catch (error: any) {
        console.error("Critical error in recurring check:", error);
        await logger.error("[WORKER] Error crítico en el proceso de recurrencia", error);
        return { error: "Error interno" };
    }
}
