import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const recurringTransactions = await prisma.transaction.findMany({
            where: {
                isRecurring: true
            },
            include: {
                category: true,
                account: true,
                frequency: true
            },
            orderBy: {
                date: 'desc'
            }
        });

        return NextResponse.json(recurringTransactions);
    } catch (error) {
        console.error("Error fetching recurring transactions:", error);
        return NextResponse.json({ error: "Error fetching recurring transactions" }, { status: 500 });
    }
}
