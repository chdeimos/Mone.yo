import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
    subDays,
    startOfDay,
    endOfDay,
    format,
    eachDayOfInterval,
    isSameDay,
    subMonths,
    subYears,
    startOfMonth,
    eachMonthOfInterval
} from "date-fns";
import { es } from "date-fns/locale";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const period = searchParams.get("period") || "1m";
        const now = new Date();
        let startDate: Date;
        let groupBy: 'day' | 'month' = 'day';

        // 1. Get current balance of accounts visible on dashboard
        const visibleAccounts = await prisma.account.findMany({
            where: { showOnDashboard: true }
        });
        const visibleAccountIds = visibleAccounts.map(a => a.id);
        const currentTotalBalance = visibleAccounts.reduce((acc, a) => acc + Number(a.balance), 0);

        switch (period) {
            case "1m":
                startDate = subDays(now, 30);
                groupBy = 'day';
                break;
            case "3m":
                startDate = subMonths(now, 3);
                groupBy = 'day';
                break;
            case "6m":
                startDate = subMonths(now, 6);
                groupBy = 'day';
                break;
            case "1y":
                startDate = subYears(now, 1);
                groupBy = 'month';
                break;
            case "total":
                const oldestTx = await prisma.transaction.findFirst({
                    where: {
                        OR: [
                            { accountId: { in: visibleAccountIds } },
                            { originAccountId: { in: visibleAccountIds } },
                            { destinationAccountId: { in: visibleAccountIds } }
                        ]
                    },
                    orderBy: { date: 'asc' }
                });
                startDate = oldestTx ? startOfMonth(oldestTx.date) : subMonths(now, 6);
                groupBy = 'month';
                break;
            default:
                startDate = subDays(now, 30);
        }

        // 2. Fetch all transactions desde startDate that involve these accounts
        const transactions = await prisma.transaction.findMany({
            where: {
                date: { gte: startDate },
                OR: [
                    { accountId: { in: visibleAccountIds } },
                    { originAccountId: { in: visibleAccountIds } },
                    { destinationAccountId: { in: visibleAccountIds } }
                ]
            },
            orderBy: { date: 'desc' }
        });

        // 3. Process data
        let history = [];
        let runningBalance = currentTotalBalance;

        if (groupBy === 'day') {
            const days = eachDayOfInterval({ start: startDate, end: now });

            // Reversa: empezamos desde hoy hacia atrás
            // Pero Recharts lo quiere de antiguo a nuevo
            // Así que calcularemos los puntos y luego invertiremos

            for (let i = days.length - 1; i >= 0; i--) {
                const day = days[i];
                const dayStart = startOfDay(day);
                const dayEnd = endOfDay(day);

                // No restamos para el punto "hoy" (el balance actual es para el final de hoy)
                // En realidad, el balance actual es el estado AHORA.

                history.push({
                    date: format(day, "d MMM", { locale: es }),
                    fullDate: day,
                    value: runningBalance
                });

                // Restamos el efecto de las transacciones de este día para obtener el balance del día anterior
                const dayTransactions = transactions.filter(tx => {
                    const txDate = new Date(tx.date);
                    return txDate >= dayStart && txDate <= dayEnd;
                });

                for (const tx of dayTransactions) {
                    const amount = Number(tx.amount);
                    if (tx.type === "INGRESO") {
                        if (visibleAccountIds.includes(tx.accountId)) runningBalance -= amount;
                    } else if (tx.type === "GASTO") {
                        if (visibleAccountIds.includes(tx.accountId)) runningBalance += amount;
                    } else if (tx.type === "TRASPASO") {
                        const isOriginVisible = tx.originAccountId && visibleAccountIds.includes(tx.originAccountId);
                        const isDestVisible = tx.destinationAccountId && visibleAccountIds.includes(tx.destinationAccountId);

                        if (isOriginVisible && !isDestVisible) runningBalance += amount;
                        else if (!isOriginVisible && isDestVisible) runningBalance -= amount;
                    }
                }
            }
            history.reverse();
        } else {
            // Group by month
            const months = eachMonthOfInterval({ start: startDate, end: now });

            for (let i = months.length - 1; i >= 0; i--) {
                const month = months[i];
                const mStart = startOfMonth(month);

                history.push({
                    date: format(month, "MMM yy", { locale: es }),
                    fullDate: month,
                    value: runningBalance
                });

                // Restamos transacciones de este mes
                const monthTransactions = transactions.filter(tx => {
                    const txDate = new Date(tx.date);
                    return txDate >= mStart && txDate <= (i === months.length - 1 ? now : endOfDay(subDays(months[i + 1], 0)));
                    // Aproximación: transacciones entre el inicio del mes i y el inicio del mes i+1
                });

                // Nota: para simplificar, filtramos por las transacciones que ocurrieron después del inicio de este mes
                const txsAfterStart = transactions.filter(tx => new Date(tx.date) >= mStart);
                // Pero esto es ineficiente en el loop. Mejor pre-procesar o usar la lógica exacta.

                // Lógica corregida para meses:
                // Restamos todas las transacciones que ocurrieron dentro del periodo del "punto" actual
                // para llegar al balance con el que empezó el mes.
            }
            // Re-evaluando la lógica de meses para ser más precisa:
            history = [];
            runningBalance = currentTotalBalance;

            // Loop de días es más preciso incluso para periodos largos, 
            // luego podemos samplear o promediar por mes.
            // Para 1 año (365 días), el gráfico de área se ve bien con 365 puntos.
            // Usemos puntos diarios y si es muy largo, sampleamos.

            const days = eachDayOfInterval({ start: startDate, end: now });
            for (let i = days.length - 1; i >= 0; i--) {
                const day = days[i];
                const dayStart = startOfDay(day);
                const dayEnd = endOfDay(day);

                history.push({
                    date: period === "total" ? format(day, "MM/yy", { locale: es }) : format(day, "d MMM", { locale: es }),
                    value: runningBalance,
                    timestamp: day.getTime()
                });

                const dayTransactions = transactions.filter(tx => {
                    const txDate = new Date(tx.date);
                    return txDate >= dayStart && txDate <= dayEnd;
                });

                for (const tx of dayTransactions) {
                    const amount = Number(tx.amount);
                    if (tx.type === "INGRESO") {
                        if (visibleAccountIds.includes(tx.accountId)) runningBalance -= amount;
                    } else if (tx.type === "GASTO") {
                        if (visibleAccountIds.includes(tx.accountId)) runningBalance += amount;
                    } else if (tx.type === "TRASPASO") {
                        const isOriginVisible = (tx.originAccountId && visibleAccountIds.includes(tx.originAccountId)) || (tx.accountId && visibleAccountIds.includes(tx.accountId) && tx.type === "TRASPASO" && !tx.originAccountId);
                        // Simplified check for clarity
                        const originId = tx.originAccountId || tx.accountId;
                        const destId = tx.destinationAccountId;

                        const isOriginVis = originId && visibleAccountIds.includes(originId);
                        const isDestVis = destId && visibleAccountIds.includes(destId);

                        if (isOriginVis && !isDestVis) runningBalance += amount;
                        else if (!isOriginVis && isDestVis) runningBalance -= amount;
                    }
                }
            }
            history.reverse();

            // Si hay demasiados puntos (más de 60), sampleamos para no saturar Recharts
            if (history.length > 100) {
                const step = Math.ceil(history.length / 60);
                history = history.filter((_, idx) => idx % step === 0);
            }
        }

        return NextResponse.json(history);
    } catch (error) {
        console.error("Error fetching history:", error);
        return NextResponse.json({ error: "Error al cargar histórico" }, { status: 500 });
    }
}
