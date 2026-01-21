import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const body = await request.json();
        const { limit, month, year, cloneMonths } = body;

        if (!limit) {
            return NextResponse.json({ error: "Missing limit" }, { status: 400 });
        }

        const updatedBudget = await prisma.budget.update({
            where: {
                id: params.id
            },
            data: {
                limit: parseFloat(limit)
            },
            include: {
                category: true
            }
        });

        // Replicate to other months if requested
        if (cloneMonths && Array.isArray(cloneMonths) && cloneMonths.length > 0 && month && year) {
            for (const m of cloneMonths) {
                let targetYear = parseInt(year);
                if (m < parseInt(month)) {
                    targetYear += 1;
                }

                const existing = await prisma.budget.findFirst({
                    where: { categoryId: updatedBudget.categoryId, month: m, year: targetYear }
                });

                if (existing) {
                    await prisma.budget.update({
                        where: { id: existing.id },
                        data: { limit: parseFloat(limit) }
                    });
                } else {
                    await prisma.budget.create({
                        data: {
                            categoryId: updatedBudget.categoryId,
                            limit: parseFloat(limit),
                            month: m,
                            year: targetYear,
                            current: 0
                        }
                    });
                }
            }
        }

        return NextResponse.json(updatedBudget);
    } catch (error) {
        console.error("Error updating budget:", error);
        return NextResponse.json({ error: "Error updating budget" }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        await prisma.budget.delete({
            where: {
                id: params.id
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting budget:", error);
        return NextResponse.json({ error: "Error deleting budget" }, { status: 500 });
    }
}
