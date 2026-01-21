import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST() {
    try {
        const accounts = await prisma.account.findMany();
        const results = [];

        for (const account of accounts) {
            // 1. Sumar ingresos
            const ingresos = await prisma.transaction.aggregate({
                where: { accountId: account.id, type: "INGRESO" },
                _sum: { amount: true }
            });

            // 2. Restar gastos
            const gastos = await prisma.transaction.aggregate({
                where: { accountId: account.id, type: "GASTO" },
                _sum: { amount: true }
            });

            // 3. Restar traspasos salientes (origen)
            const traspasosSalientes = await prisma.transaction.aggregate({
                where: { originAccountId: account.id, type: "TRASPASO" },
                _sum: { amount: true }
            });

            // 4. Sumar traspasos entrantes (destino)
            const traspasosEntrantes = await prisma.transaction.aggregate({
                where: { destinationAccountId: account.id, type: "TRASPASO" },
                _sum: { amount: true }
            });

            const newBalance =
                Number(account.initialBalance || 0) +
                Number(ingresos._sum.amount || 0) -
                Number(gastos._sum.amount || 0) -
                Number(traspasosSalientes._sum.amount || 0) +
                Number(traspasosEntrantes._sum.amount || 0);

            await prisma.account.update({
                where: { id: account.id },
                data: { balance: newBalance }
            });

            results.push({
                name: account.name,
                oldBalance: Number(account.balance),
                newBalance,
                diff: newBalance - Number(account.balance)
            });
        }

        return NextResponse.json({ success: true, results });
    } catch (error: any) {
        console.error("Error recalculating balances:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
