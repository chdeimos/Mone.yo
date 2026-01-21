import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { startOfMonth, endOfMonth } from "date-fns";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const month = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString());
        const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());

        const budgets = await prisma.budget.findMany({
            where: {
                month,
                year
            },
            include: {
                category: true
            }
        });

        // Calculate current spending for each budget
        const budgetsWithSpending = await Promise.all(budgets.map(async (budget) => {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0); // Last day of the month

            const aggregations = await prisma.transaction.aggregate({
                _sum: {
                    amount: true
                },
                where: {
                    categoryId: budget.categoryId,
                    type: "GASTO",
                    date: {
                        gte: startDate,
                        lte: endDate
                    }
                }
            });

            const currentSpent = aggregations._sum.amount ? Math.abs(Number(aggregations._sum.amount)) : 0;

            // Optionally update the cached 'current' value
            // await prisma.budget.update({ where: { id: budget.id }, data: { current: currentSpent } });

            return {
                ...budget,
                current: currentSpent, // Overwrite with real-time value
                limit: Number(budget.limit)
            };
        }));

        return NextResponse.json(budgetsWithSpending);
    } catch (error) {
        console.error("CRITICAL ERROR FETCHING BUDGETS:", error);
        return NextResponse.json({ error: "Error fetching budgets", details: String(error) }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log("POST /api/budgets received:", body);
        const { categoryId, limit, month, year, cloneMonths } = body;

        // Basic validation
        if (!categoryId || !limit || !month || !year) {
            console.error("Missing fields:", { categoryId, limit, month, year });
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Check if budget already exists for this category/month/year
        const existingBudget = await prisma.budget.findFirst({
            where: {
                categoryId,
                month: parseInt(month),
                year: parseInt(year)
            }
        });

        if (existingBudget) {
            return NextResponse.json({ error: "Ya existe un presupuesto para esta categoría en el mes seleccionado." }, { status: 400 });
        }

        const newBudget = await prisma.budget.create({
            data: {
                categoryId,
                limit: parseFloat(limit),
                month: parseInt(month),
                year: parseInt(year),
                current: 0 // Initial
            },
            include: {
                category: true
            }
        });

        // If requested, replicate for selected months
        if (cloneMonths && Array.isArray(cloneMonths) && cloneMonths.length > 0) {
            for (const m of cloneMonths) {
                let targetYear = parseInt(year);
                // If the selected month is earlier than the current month in the form, it targets NEXT year
                if (m < parseInt(month)) {
                    targetYear += 1;
                }

                // Upsert: update if exists, create if not
                const existing = await prisma.budget.findFirst({
                    where: { categoryId, month: m, year: targetYear }
                });

                if (existing) {
                    await prisma.budget.update({
                        where: { id: existing.id },
                        data: { limit: parseFloat(limit) }
                    });
                } else {
                    await prisma.budget.create({
                        data: {
                            categoryId,
                            limit: parseFloat(limit),
                            month: m,
                            year: targetYear,
                            current: 0
                        }
                    });
                }
            }
        }

        return NextResponse.json(newBudget);
    } catch (error) {
        console.error("CRITICAL ERROR CREATING BUDGET:", error);
        return NextResponse.json({ error: "Error creating budget", details: String(error) }, { status: 500 });
    }
}
