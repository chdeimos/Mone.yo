import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const frequencies = await prisma.frequency.findMany({
            orderBy: { days: 'asc' },
            include: {
                _count: {
                    select: { transactions: true }
                }
            }
        });
        return NextResponse.json(frequencies);
    } catch (error) {
        return NextResponse.json({ error: "Error fetching frequencies" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, days } = body;

        if (!name || !days) {
            return NextResponse.json({ error: "Name and days are required" }, { status: 400 });
        }

        const frequency = await prisma.frequency.create({
            data: {
                name,
                days: parseInt(days)
            }
        });

        return NextResponse.json(frequency);
    } catch (error) {
        return NextResponse.json({ error: "Error creating frequency" }, { status: 500 });
    }
}