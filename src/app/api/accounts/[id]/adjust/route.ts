import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const body = await req.json();
        const { targetBalance } = body;

        if (targetBalance === undefined) {
            return NextResponse.json({ error: "Saldo objetivo requerido" }, { status: 400 });
        }

        const account = await prisma.account.findUnique({
            where: { id: params.id }
        });

        if (!account) {
            return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });
        }

        // Calcular cuentas actuales
        const currentBalance = Number(account.balance);
        const target = Number(targetBalance);
        const diff = target - currentBalance;

        if (Math.abs(diff) < 0.01) {
            return NextResponse.json({ message: "El saldo ya está cuadrado" });
        }

        const isIncome = diff > 0;
        const amount = Math.abs(diff);

        // Crear transacción de ajuste
        const transaction = await prisma.transaction.create({
            data: {
                accountId: params.id,
                amount: amount,
                type: isIncome ? "INGRESO" : "GASTO",
                description: "AJUSTE MANUAL / CUADRE",
                date: new Date(),
                isVerified: true // Los ajustes manuales se consideran verificados
            }
        });

        // Actualizar saldo de la cuenta
        // Nota: Esto debería disparar un trigger de DB o recalculo, pero por ahora actualizamos manualmente
        // Aunque idealmente tu sistema debería recalcular el saldo basándose en transacciones.
        // Si tu sistema usa un campo 'balance' cacheado:
        await prisma.account.update({
            where: { id: params.id },
            data: {
                balance: {
                    [isIncome ? "increment" : "decrement"]: amount
                }
            }
        });

        return NextResponse.json({ success: true, transaction });

    } catch (error) {
        console.error("Error adjusting balance:", error);
        return NextResponse.json({ error: "Error al cuadrar saldo" }, { status: 500 });
    }
}
