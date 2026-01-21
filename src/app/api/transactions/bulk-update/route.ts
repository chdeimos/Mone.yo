import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const { ids, categoryId, type, destinationAccountId } = await req.json();

        if (!ids || !Array.isArray(ids)) {
            return NextResponse.json({ error: "IDs inválidos" }, { status: 400 });
        }

        const count = await prisma.$transaction(async (tx) => {
            let updatedCount = 0;

            for (const id of ids) {
                // 1. Obtener estado actual
                const oldTx = await tx.transaction.findUnique({
                    where: { id }
                });

                if (!oldTx) continue;

                // 2. Revertir impacto anterior si el tipo cambia o si el destino cambia en un traspaso
                const typeChanged = type && type !== oldTx.type;
                const destChanged = destinationAccountId && destinationAccountId !== oldTx.destinationAccountId;
                const needsRebalance = typeChanged || destChanged;

                if (needsRebalance) {
                    // Revertir antiguo
                    if (oldTx.type === "INGRESO") {
                        await tx.account.update({
                            where: { id: oldTx.accountId },
                            data: { balance: { decrement: oldTx.amount } }
                        });
                    } else if (oldTx.type === "GASTO") {
                        await tx.account.update({
                            where: { id: oldTx.accountId },
                            data: { balance: { increment: oldTx.amount } }
                        });
                    } else if (oldTx.type === "TRASPASO") {
                        const orgId = oldTx.originAccountId || oldTx.accountId;
                        await tx.account.update({
                            where: { id: orgId },
                            data: { balance: { increment: oldTx.amount } }
                        });
                        if (oldTx.destinationAccountId) {
                            await tx.account.update({
                                where: { id: oldTx.destinationAccountId },
                                data: { balance: { decrement: oldTx.amount } }
                            });
                        }
                    }
                }

                // 3. Aplicar cambios a la transacción
                const updatedTx = await tx.transaction.update({
                    where: { id },
                    data: {
                        categoryId: categoryId !== undefined ? categoryId : undefined,
                        type: type !== undefined ? type : undefined,
                        destinationAccountId: type === "TRASPASO" ? (destinationAccountId || oldTx.destinationAccountId) : (type !== undefined ? null : undefined),
                        originAccountId: type === "TRASPASO" ? oldTx.accountId : (type !== undefined ? null : undefined)
                    }
                });

                // 4. Aplicar nuevo impacto si hubo rebalanceo
                if (needsRebalance) {
                    const newTx = updatedTx;
                    if (newTx.type === "INGRESO") {
                        await tx.account.update({
                            where: { id: newTx.accountId },
                            data: { balance: { increment: newTx.amount } }
                        });
                    } else if (newTx.type === "GASTO") {
                        await tx.account.update({
                            where: { id: newTx.accountId },
                            data: { balance: { decrement: newTx.amount } }
                        });
                    } else if (newTx.type === "TRASPASO") {
                        const orgId = newTx.originAccountId || newTx.accountId;
                        await tx.account.update({
                            where: { id: orgId },
                            data: { balance: { decrement: newTx.amount } }
                        });
                        if (newTx.destinationAccountId) {
                            await tx.account.update({
                                where: { id: newTx.destinationAccountId },
                                data: { balance: { increment: newTx.amount } }
                            });
                        }
                    }
                }

                updatedCount++;
            }
            return updatedCount;
        });

        return NextResponse.json({ success: true, count });
    } catch (error) {
        console.error("Error updating transactions bulk:", error);
        return NextResponse.json({ error: "Error al actualizar movimientos" }, { status: 500 });
    }
}
