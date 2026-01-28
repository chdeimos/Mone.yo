import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const accountId = searchParams.get("accountId");
        const destinationAccountId = searchParams.get("destinationAccountId");
        const categoryId = searchParams.get("categoryId");
        const type = searchParams.get("type");
        const query = searchParams.get("query");
        const isVerified = searchParams.get("isVerified");
        const isRecurring = searchParams.get("isRecurring");
        const minAmount = searchParams.get("minAmount");
        const maxAmount = searchParams.get("maxAmount");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const page = searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1;
        const limit = searchParams.get("limit");
        const limitNum = limit ? parseInt(limit) : undefined;
        const skip = limitNum ? (page - 1) * limitNum : undefined;

        const where = {
            ...(accountId && !destinationAccountId ? {
                OR: [
                    { accountId },
                    { destinationAccountId: accountId },
                    { originAccountId: accountId }
                ]
            } : {
                ...(accountId && { accountId }),
                ...(destinationAccountId && { destinationAccountId }),
            }),
            ...(categoryId && { categoryId }),
            ...(type && { type: type as any }),
            ...(isVerified !== null && { isVerified: isVerified === "true" }),
            ...(isRecurring !== null && { isRecurring: isRecurring === "true" }),
            ...((minAmount || maxAmount) && {
                amount: {
                    ...(minAmount && { gte: parseFloat(minAmount) }),
                    ...(maxAmount && { lte: parseFloat(maxAmount) }),
                }
            }),
            ...((startDate || endDate) && {
                date: {
                    ...(startDate && { gte: new Date(startDate) }),
                    ...(endDate && { lte: new Date(endDate) }),
                }
            }),
            ...(query && {
                description: {
                    contains: query,
                    mode: 'insensitive' as const
                }
            }),
        };

        const [transactions, totalCount, typeStats] = await Promise.all([
            prisma.transaction.findMany({
                take: limitNum,
                skip: skip,
                where,
                include: {
                    account: true,
                    category: true,
                    originAccount: true,
                    destinationAccount: true,
                    tags: true,
                    images: true,
                },
                orderBy: {
                    date: "desc"
                }
            }),
            prisma.transaction.count({ where }),
            prisma.transaction.groupBy({
                by: ['type'],
                where,
                _sum: {
                    amount: true
                }
            })
        ]);

        const summary = {
            income: typeStats.find(s => s.type === 'INGRESO')?._sum.amount || 0,
            expenses: typeStats.find(s => s.type === 'GASTO')?._sum.amount || 0,
            transfers: typeStats.find(s => s.type === 'TRASPASO')?._sum.amount || 0,
        };

        return NextResponse.json({
            transactions,
            totalCount,
            page,
            totalPages: limitNum ? Math.ceil(totalCount / limitNum) : 1,
            summary
        });
    } catch (error) {
        console.error("Error fetching transactions:", error);
        return NextResponse.json({ error: "Error al obtener movimientos" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { amount, description, date, type, accountId, categoryId, originAccountId, destinationAccountId, isRecurring, isPaused, recurrencePeriod, recurrenceInterval, frequencyId, tags, attachmentPath, imageUrls } = body;

        // Validación básica
        if (!amount || !type || !accountId) {
            return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });
        }

        const transaction = await prisma.$transaction(async (tx) => {
            // 1. Crear la transacción
            const newTransaction = await tx.transaction.create({
                data: {
                    amount,
                    description,
                    date: date ? new Date(date) : new Date(),
                    type,
                    accountId,
                    categoryId,
                    originAccountId,
                    destinationAccountId,
                    isRecurring,
                    isPaused: isRecurring ? (isPaused || false) : false,
                    recurrencePeriod,
                    recurrenceInterval: isRecurring ? (recurrenceInterval || 1) : null,
                    frequencyId: isRecurring ? frequencyId : null,
                    attachmentPath,
                    tags: {
                        connectOrCreate: tags?.map((tag: string) => ({
                            where: { name: tag },
                            create: { name: tag }
                        })) || []
                    },
                    images: {
                        create: imageUrls?.map((url: string) => ({ url })) || []
                    }
                },
                include: {
                    account: true,
                    category: true,
                    images: true
                }
            });

            // 2. Actualizar saldos de cuentas - SOLO si no es una recurrencia (las recurrencias se aplican al ejecutarse)
            if (!isRecurring) {
                if (type === "INGRESO") {
                    await tx.account.update({
                        where: { id: accountId },
                        data: { balance: { increment: amount } }
                    });
                } else if (type === "GASTO") {
                    await tx.account.update({
                        where: { id: accountId },
                        data: { balance: { decrement: amount } }
                    });
                } else if (type === "TRASPASO" && (originAccountId || accountId) && destinationAccountId) {
                    const orgId = originAccountId || accountId;
                    // Restar de origen
                    await tx.account.update({
                        where: { id: orgId },
                        data: { balance: { decrement: amount } }
                    });
                    // Sumar a destino
                    await tx.account.update({
                        where: { id: destinationAccountId },
                        data: { balance: { increment: amount } }
                    });
                }
            }

            return newTransaction;
        });

        return NextResponse.json(transaction);
    } catch (error) {
        console.error("Error creating transaction:", error);
        return NextResponse.json({ error: "Error al registrar movimiento" }, { status: 500 });
    }
}
