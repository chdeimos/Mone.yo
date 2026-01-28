import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const subscriptions = await prisma.subscription.findMany({
            include: {
                account: true,
                category: true,
                originAccount: true,
                destinationAccount: true,
                frequency: true
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        return NextResponse.json(subscriptions);
    } catch (error) {
        console.error("Error fetching subscriptions:", error);
        return NextResponse.json({ error: "Error al obtener recurrencias" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            amount, description, type, accountId, categoryId,
            originAccountId, destinationAccountId,
            recurrencePeriod, recurrenceInterval, frequencyId,
            startDate, nextExecutionDate
        } = body;

        if (!amount || !type || !accountId || !nextExecutionDate) {
            return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });
        }

        const subscription = await prisma.subscription.create({
            data: {
                amount,
                description,
                type,
                accountId,
                categoryId,
                originAccountId: type === "TRASPASO" ? (originAccountId || accountId) : null,
                destinationAccountId: type === "TRASPASO" ? destinationAccountId : null,
                recurrencePeriod,
                recurrenceInterval: parseInt(recurrenceInterval?.toString() || "1"),
                frequencyId,
                startDate: startDate ? new Date(startDate) : new Date(),
                nextExecutionDate: new Date(nextExecutionDate),
            },
            include: {
                account: true,
                category: true,
                frequency: true
            }
        });

        return NextResponse.json(subscription);
    } catch (error) {
        console.error("Error creating subscription:", error);
        return NextResponse.json({ error: "Error al registrar recurrencia" }, { status: 500 });
    }
}
