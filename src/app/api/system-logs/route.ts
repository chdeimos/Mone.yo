
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const logs = await prisma.systemLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100
        });
        return NextResponse.json(logs);
    } catch (error) {
        await logger.error("Error fetching system logs", error);
        return NextResponse.json({ error: "Error fetching logs" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { level, message, stack, context } = body;

        const log = await prisma.systemLog.create({
            data: {
                level: level || 'ERROR',
                message: message || 'Unknown error',
                stack: stack || null,
                context: context ? (typeof context === 'object' ? JSON.stringify(context) : context) : null
            }
        });

        return NextResponse.json(log);
    } catch (error) {
        console.error("Error saving log:", error);
        return NextResponse.json({ error: "Error saving log" }, { status: 500 });
    }
}

export async function DELETE() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        await prisma.systemLog.deleteMany({});

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error clearing system logs:", error);
        return NextResponse.json({ error: "Error al borrar logs" }, { status: 500 });
    }
}