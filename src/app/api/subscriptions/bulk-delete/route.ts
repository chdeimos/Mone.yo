import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const { ids } = await req.json();

        if (!ids || !Array.isArray(ids)) {
            return NextResponse.json({ error: "IDs inválidos" }, { status: 400 });
        }

        await prisma.subscription.deleteMany({
            where: { id: { in: ids } }
        });

        return NextResponse.json({ success: true, count: ids.length });
    } catch (error) {
        console.error("Error deleting subscriptions bulk:", error);
        return NextResponse.json({ error: "Error al borrar recurrencias" }, { status: 500 });
    }
}
