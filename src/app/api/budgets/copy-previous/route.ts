import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { targetMonth, targetYear } = body;

        if (!targetMonth || !targetYear) {
            return NextResponse.json({ error: "Missing target month or year" }, { status: 400 });
        }

        // 1. Calculate previous month and year
        let prevMonth = targetMonth - 1;
        let prevYear = targetYear;
        if (prevMonth === 0) {
            prevMonth = 12;
            prevYear -= 1;
        }

        // 2. Fetch budgets from previous month
        const previousBudgets = await prisma.budget.findMany({
            where: {
                month: prevMonth,
                year: prevYear
            }
        });

        if (previousBudgets.length === 0) {
            return NextResponse.json({ error: "No se encontraron presupuestos en el mes anterior para copiar." }, { status: 404 });
        }

        // 3. Clone them for the target month, skipping if they already exist
        let copiedCount = 0;
        for (const budget of previousBudgets) {
            const exists = await prisma.budget.findFirst({
                where: {
                    categoryId: budget.categoryId,
                    month: targetMonth,
                    year: targetYear
                }
            });

            if (!exists) {
                await prisma.budget.create({
                    data: {
                        categoryId: budget.categoryId,
                        limit: budget.limit,
                        month: targetMonth,
                        year: targetYear,
                        current: 0
                    }
                });
                copiedCount++;
            }
        }

        return NextResponse.json({ success: true, count: copiedCount });
    } catch (error) {
        console.error("Error copying budgets:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
