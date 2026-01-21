
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const logs = await prisma.accessLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100
        });
        return NextResponse.json(logs);
    } catch (error) {
        return NextResponse.json({ error: "Error fetching access logs" }, { status: 500 });
    }
}

export async function DELETE() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        await prisma.accessLog.deleteMany({});

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error clearing access logs:", error);
        return NextResponse.json({ error: "Error al borrar logs" }, { status: 500 });
    }
}
