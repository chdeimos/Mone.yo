import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const accounts = await prisma.account.findMany({
            include: {
                type: true
            },
            orderBy: {
                name: "asc"
            }
        });
        return NextResponse.json(accounts);
    } catch (error) {
        console.error("Error fetching accounts:", error);
        return NextResponse.json({ error: "Error al obtener las cuentas" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, initialBalance, typeId, currency, color } = body;

        if (!name || !typeId) {
            return NextResponse.json({ error: "Nombre y tipo son requeridos" }, { status: 400 });
        }

        const account = await prisma.account.create({
            data: {
                name,
                initialBalance: initialBalance || 0,
                balance: initialBalance || 0,
                typeId,
                currency: currency || "EUR",
                color
            },
            include: {
                type: true
            }
        });

        return NextResponse.json(account);
    } catch (error) {
        console.error("Error creating account:", error);
        return NextResponse.json({ error: "Error al crear la cuenta" }, { status: 500 });
    }
}
