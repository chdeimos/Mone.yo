import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;

        const sub = await prisma.subscription.findUnique({
            where: { id },
            include: { frequency: true }
        });

        if (!sub) {
            return NextResponse.json({ error: "Recurrencia no encontrada" }, { status: 404 });
        }

        if (sub.isPaused) {
            return NextResponse.json({ error: "La recurrencia está pausada y no se puede ejecutar" }, { status: 400 });
        }

        if (sub.recurrenceInterval !== null && sub.recurrenceInterval <= 0) {
            return NextResponse.json({ error: "Esta recurrencia ya ha completado todas sus ejecuciones programadas" }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            // 1. Crear el movimiento (transacción)
            const transaction = await tx.transaction.create({
                data: {
                    amount: sub.amount,
                    description: sub.description,
                    type: sub.type,
                    accountId: sub.accountId,
                    categoryId: sub.categoryId,
                    originAccountId: sub.originAccountId,
                    destinationAccountId: sub.destinationAccountId,
                    date: sub.nextExecutionDate,
                    isVerified: false,
                    isRecurring: true
                }
            });

            // 2. Actualizar balance de cuentas
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

            // 3. Calcular la próxima fecha de ejecución (siempre avanza 1 periodo)
            let nextDate = new Date(sub.nextExecutionDate);

            if (sub.frequency) {
                // Si tiene frecuencia personalizada, sumamos 1 mes por defecto
                nextDate.setMonth(nextDate.getMonth() + 1);
            } else {
                switch (sub.recurrencePeriod) {
                    case "DIARIO":
                        nextDate.setDate(nextDate.getDate() + 1);
                        break;
                    case "SEMANAL":
                        nextDate.setDate(nextDate.getDate() + 7);
                        break;
                    case "MENSUAL":
                        nextDate.setMonth(nextDate.getMonth() + 1);
                        break;
                    case "ANUAL":
                        nextDate.setFullYear(nextDate.getFullYear() + 1);
                        break;
                    default:
                        nextDate.setMonth(nextDate.getMonth() + 1);
                }
            }

            // 4. Gestionar el intervalo como contador de ejecuciones restantes
            const currentInterval = sub.recurrenceInterval || 1;
            const newInterval = Math.max(0, currentInterval - 1);
            const shouldPause = newInterval === 0;

            // 5. Actualizar la recurrencia
            const updatedSub = await tx.subscription.update({
                where: { id },
                data: {
                    nextExecutionDate: nextDate,
                    lastExecutionDate: new Date(),
                    recurrenceInterval: newInterval,
                    isPaused: shouldPause ? true : sub.isPaused
                }
            });

            return { transaction, updatedSub };
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error executing subscription:", error);
        return NextResponse.json({ error: "Error al ejecutar la recurrencia" }, { status: 500 });
    }
}
