import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const types = await prisma.accountType.findMany({
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { accounts: true }
                }
            }
        });
        return NextResponse.json(types);
    } catch (error) {
        return NextResponse.json({ error: "Error fetching account types" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, icon } = body;

        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        const newType = await prisma.accountType.create({
            data: { name, icon }
        });

        return NextResponse.json(newType);
    } catch (error) {
        return NextResponse.json({ error: "Error creating account type" }, { status: 500 });
    }
}