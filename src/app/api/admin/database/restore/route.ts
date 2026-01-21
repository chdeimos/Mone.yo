import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ message: "No se proporcionó ningún archivo" }, { status: 400 });
        }

        const text = await file.text();
        const backup = JSON.parse(text);

        if (!backup.data || !backup.version) {
            return NextResponse.json({ message: "Formato de archivo inválido" }, { status: 400 });
        }

        const { data } = backup;

        // Perform restore in a transaction
        await prisma.$transaction(async (tx) => {
            // 1. Delete everything in reverse dependency order
            await tx.transactionImage.deleteMany();
            await tx.transaction.deleteMany();
            await tx.budget.deleteMany();
            await tx.account.deleteMany();
            await tx.accountType.deleteMany();
            await tx.category.deleteMany();
            await tx.frequency.deleteMany();
            await tx.tag.deleteMany();
            await tx.user.deleteMany();
            await tx.configuration.deleteMany();
            await tx.systemLog.deleteMany();
            await tx.accessLog.deleteMany();

            // 2. Insert data in correct dependency order
            if (data.users?.length) await tx.user.createMany({ data: data.users });
            if (data.accountTypes?.length) await tx.accountType.createMany({ data: data.accountTypes });
            if (data.categories?.length) await tx.category.createMany({ data: data.categories });
            if (data.frequencies?.length) await tx.frequency.createMany({ data: data.frequencies });
            if (data.tags?.length) await tx.tag.createMany({ data: data.tags });
            if (data.configurations?.length) await tx.configuration.createMany({ data: data.configurations });

            // Accounts depend on AccountType
            if (data.accounts?.length) await tx.account.createMany({ data: data.accounts });

            // Transactions depend on Accounts, Categories, Frequencies
            if (data.transactions?.length) await tx.transaction.createMany({ data: data.transactions });

            // Budgets depend on Categories
            if (data.budgets?.length) await tx.budget.createMany({ data: data.budgets });

            // TransactionImages depend on Transactions
            if (data.transactionImages?.length) await tx.transactionImage.createMany({ data: data.transactionImages });

            // Logs
            if (data.systemLogs?.length) await tx.systemLog.createMany({ data: data.systemLogs });
            if (data.accessLogs?.length) await tx.accessLog.createMany({ data: data.accessLogs });
        });

        return NextResponse.json({ message: "Base de datos restaurada correctamente" }, { status: 200 });
    } catch (error: any) {
        console.error("Restore error:", error);
        return NextResponse.json({
            message: "Error al restaurar base de datos",
            error: error.message
        }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
