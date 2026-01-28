import { NextResponse } from "next/server";
import { processRecurrentTransactions } from "@/lib/recurrence";

export async function GET() {
    try {
        const result = await processRecurrentTransactions();
        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
    }
}
