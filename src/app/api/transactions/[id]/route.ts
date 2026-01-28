import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { unlink } from "fs/promises";
import path from "path";

export async function PUT(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const body = await req.json();
        const { amount, description, date, type, accountId, categoryId, originAccountId, destinationAccountId, isRecurring, isPaused, recurrencePeriod, recurrenceInterval, frequencyId, tags, isVerified, imageUrls } = body;

        const result = await prisma.$transaction(async (tx) => {
            // 1. Obtener el estado actual del movimiento
            const oldTx = await tx.transaction.findUnique({
                where: { id: params.id }
            });

            if (!oldTx) {
                throw new Error("Movimiento no encontrado");
            }

            // 2. Revertir impacto del saldo anterior - SOLO si no era una recurrencia
            if (!oldTx.isRecurring) {
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

            // 3. Actualizar el movimiento
            const updated = await tx.transaction.update({
                where: { id: params.id },
                data: {
                    amount,
                    description,
                    date: date ? new Date(date) : undefined,
                    type,
                    accountId,
                    categoryId,
                    originAccountId: type === "TRASPASO" ? (originAccountId || accountId) : null,
                    destinationAccountId: type === "TRASPASO" ? destinationAccountId : null,
                    isRecurring,
                    isPaused: isRecurring ? (isPaused || false) : false,
                    recurrencePeriod,
                    recurrenceInterval: isRecurring ? (recurrenceInterval || 1) : null,
                    frequencyId: isRecurring ? frequencyId : null,
                    isVerified: isVerified !== undefined ? isVerified : undefined,
                    tags: {
                        set: [],
                        connectOrCreate: tags?.map((tag: string) => ({
                            where: { name: tag },
                            create: { name: tag }
                        })) || []
                    },
                    images: {
                        create: imageUrls?.map((url: string) => ({ url })) || []
                    }
                }
            });

            // 4. Aplicar el nuevo impacto del saldo - SOLO si NO es una recurrencia
            if (!updated.isRecurring) {
                if (updated.type === "INGRESO") {
                    await tx.account.update({
                        where: { id: updated.accountId },
                        data: { balance: { increment: updated.amount } }
                    });
                } else if (updated.type === "GASTO") {
                    await tx.account.update({
                        where: { id: updated.accountId },
                        data: { balance: { decrement: updated.amount } }
                    });
                } else if (updated.type === "TRASPASO") {
                    const orgId = updated.originAccountId || updated.accountId;
                    await tx.account.update({
                        where: { id: orgId },
                        data: { balance: { decrement: updated.amount } }
                    });
                    if (updated.destinationAccountId) {
                        await tx.account.update({
                            where: { id: updated.destinationAccountId },
                            data: { balance: { increment: updated.amount } }
                        });
                    }
                }
            }

            return updated;
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("Error updating transaction:", error);
        return NextResponse.json({ error: error.message || "Error al actualizar movimiento" }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        let filesToDelete: string[] = [];

        await prisma.$transaction(async (tx) => {
            // 1. Obtener la transacción antes de borrarla
            const transaction = await tx.transaction.findUnique({
                where: { id: params.id },
                include: { images: true }
            });

            if (!transaction) return;

            // Colectar archivos para borrar después
            if (transaction.attachmentPath) {
                filesToDelete.push(transaction.attachmentPath);
            }
            if (transaction.images && transaction.images.length > 0) {
                transaction.images.forEach(img => {
                    if (img.url) filesToDelete.push(img.url);
                });
            }

            // 2. Revertir el saldo en las cuentas - SOLO si no era una recurrencia (las recurrencias no afectan saldo hasta ejecutarse)
            if (transaction && !transaction.isRecurring) {
                if (transaction.type === "INGRESO") {
                    await tx.account.update({
                        where: { id: transaction.accountId },
                        data: { balance: { decrement: transaction.amount } }
                    });
                } else if (transaction.type === "GASTO") {
                    await tx.account.update({
                        where: { id: transaction.accountId },
                        data: { balance: { increment: transaction.amount } }
                    });
                } else if (transaction.type === "TRASPASO" && transaction.originAccountId && transaction.destinationAccountId) {
                    // Devolver a origen
                    await tx.account.update({
                        where: { id: transaction.originAccountId },
                        data: { balance: { increment: transaction.amount } }
                    });
                    // Quitar de destino
                    await tx.account.update({
                        where: { id: transaction.destinationAccountId },
                        data: { balance: { decrement: transaction.amount } }
                    });
                }
            }

            // 3. Borrar la transacción
            await tx.transaction.delete({
                where: { id: params.id }
            });
        });

        // 4. Borrar archivos del disco si el borrado en DB fue exitoso
        for (const relativePath of filesToDelete) {
            try {
                // Solo borrar si es una ruta local de uploads
                if (relativePath.startsWith("/uploads/")) {
                    const absolutePath = path.join(process.cwd(), "public", relativePath);
                    await unlink(absolutePath);
                    console.log(`Deleted file: ${absolutePath}`);
                }
            } catch (err: any) {
                console.error(`Error deleting file ${relativePath}:`, err.message);
                // No lanzamos error para no fallar la respuesta si el registro ya se borró de la DB
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting transaction:", error);
        return NextResponse.json({ error: "Error al eliminar movimiento" }, { status: 500 });
    }
}
