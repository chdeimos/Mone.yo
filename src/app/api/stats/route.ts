import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { startOfMonth, endOfMonth } from "date-fns";

export async function GET() {
    try {
        const now = new Date();
        const start = startOfMonth(now);
        const end = endOfMonth(now);

        // 1. Patrimonio Total (Suma de saldos de todas las cuentas)
        const accounts = await prisma.account.findMany();
        const totalBalance = accounts.reduce((acc: number, curr: any) => acc + Number(curr.balance), 0);

        // 2. Ingresos del Mes
        const incomeTransactions = await prisma.transaction.findMany({
            where: {
                type: "INGRESO",
                date: {
                    gte: start,
                    lte: end
                }
            }
        });
        const monthlyIncome = incomeTransactions.reduce((acc: number, curr: any) => acc + Number(curr.amount), 0);

        // 3. Gastos del Mes
        const expenseTransactions = await prisma.transaction.findMany({
            where: {
                type: "GASTO",
                date: {
                    gte: start,
                    lte: end
                }
            }
        });
        const monthlyExpenses = expenseTransactions.reduce((acc: number, curr: any) => acc + Number(curr.amount), 0);

        // 4. Últimos 5 Movimientos
        const recentTransactions = await prisma.transaction.findMany({
            take: 5,
            orderBy: {
                date: "desc"
            },
            include: {
                account: true,
                category: true,
                originAccount: true,
                destinationAccount: true
            }
        });

        // 5. Cuentas visibles en Dashboard
        const visibleAccounts = await prisma.account.findMany({
            where: { showOnDashboard: true }
        });

        // 6. Presupuestos del mes - Calculando el gasto real dinámicamente
        const rawBudgets = await prisma.budget.findMany({
            where: {
                month: now.getMonth() + 1,
                year: now.getFullYear()
            },
            include: {
                category: true
            }
        });

        // Calculamos el gasto real para cada categoría de presupuesto en el mes actual
        const budgets = await Promise.all(rawBudgets.map(async (budget) => {
            const actualSpending = await prisma.transaction.aggregate({
                where: {
                    categoryId: budget.categoryId,
                    type: "GASTO",
                    date: {
                        gte: start,
                        lte: end
                    }
                },
                _sum: {
                    amount: true
                }
            });

            return {
                ...budget,
                current: actualSpending._sum.amount || 0
            };
        }));

        return NextResponse.json({
            totalBalance,
            monthlyIncome,
            monthlyExpenses,
            recentTransactions,
            accounts: visibleAccounts,
            budgets
        });
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        return NextResponse.json({ error: "Error al cargar estadísticas" }, { status: 500 });
    }
}
