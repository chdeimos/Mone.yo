import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        console.log("[BACKUP] Iniciando copia de seguridad de la base de datos...");

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

        console.log(`[BACKUP] Datos obtenidos: 
            Users: ${users.length}, 
            Transactions: ${transactions.length}, 
            Accounts: ${accounts.length},
            Logs: ${systemLogs.length + accessLogs.length}`);

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

        // Custom serializer to handle Decimal and BigInt if needed
        const jsonResponse = JSON.stringify(backupData, (key, value) => {
            // Handle Prisma Decimal (Decimal.js objects have d, e, s properties)
            if (value && typeof value === 'object' && value.constructor && value.constructor.name === 'Decimal') {
                return value.toString();
            }
            // Fallback for objects that might look like Decimals
            if (value && typeof value === 'object' && 'd' in value && 'e' in value && 's' in value) {
                return value.toString();
            }
            return value;
        }, 2);

        return new NextResponse(jsonResponse, {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Content-Disposition": `attachment; filename="moneyo_backup_${new Date().toISOString().split('T')[0]}.json"`
            }
        });
    } catch (error: any) {
        console.error("[BACKUP] Error fatal:", error);
        return NextResponse.json({
            message: "Error al generar copia de seguridad",
            error: error.message
        }, { status: 500 });
    }
}
