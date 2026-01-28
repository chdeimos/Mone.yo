import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const { ids, categoryId, accountId, recurrencePeriod, isPaused } = await req.json();

        if (!ids || !Array.isArray(ids)) {
            return NextResponse.json({ error: "IDs inválidos" }, { status: 400 });
        }

        const data: any = {};
        if (categoryId !== undefined) data.categoryId = categoryId;
        if (accountId !== undefined) data.accountId = accountId;
        if (recurrencePeriod !== undefined) data.recurrencePeriod = recurrencePeriod;
        if (isPaused !== undefined) data.isPaused = isPaused;

        if (Object.keys(data).length === 0) {
            return NextResponse.json({ error: "No hay campos para actualizar" }, { status: 400 });
        }

        const result = await prisma.subscription.updateMany({
            where: { id: { in: ids } },
            data
        });

        return NextResponse.json({ success: true, count: result.count });
    } catch (error) {
        console.error("Error updating subscriptions bulk:", error);
        return NextResponse.json({ error: "Error al actualizar recurrencias" }, { status: 500 });
    }
}
