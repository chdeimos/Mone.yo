import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
    try {
        // Fetch all data from all tables
        const [
            users,
            accountTypes,
            accounts,
            categories,
            frequencies,
            transactions,
            tags,
            budgets,
            configurations,
            transactionImages,
            systemLogs,
            accessLogs
        ] = await Promise.all([
            prisma.user.findMany(),
            prisma.accountType.findMany(),
            prisma.account.findMany(),
            prisma.category.findMany(),
            prisma.frequency.findMany(),
            prisma.transaction.findMany(),
            prisma.tag.findMany(),
            prisma.budget.findMany(),
            prisma.configuration.findMany(),
            prisma.transactionImage.findMany(),
            prisma.systemLog.findMany(),
            prisma.accessLog.findMany()
        ]);

        const backupData = {
            version: "1.0",
            timestamp: new Date().toISOString(),
            data: {
                users,
                accountTypes,
                accounts,
                categories,
                frequencies,
                transactions,
                tags,
                budgets,
                configurations,
                transactionImages,
                systemLogs,
                accessLogs
            }
        };

        return new NextResponse(JSON.stringify(backupData, null, 2), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Content-Disposition": `attachment; filename="moneyo_backup_${new Date().toISOString().split('T')[0]}.json"`
            }
        });
    } catch (error) {
        console.error("Backup error:", error);
        return NextResponse.json({ message: "Error al generar copia de seguridad" }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
