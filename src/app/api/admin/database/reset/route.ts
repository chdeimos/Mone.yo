import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import fs from "fs";
import path from "path";

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "ADMIN") {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const body = await request.json();
        const { keyword } = body;

        if (keyword !== "moneyo") {
            return NextResponse.json({ error: "Palabra clave incorrecta" }, { status: 400 });
        }

        // Ejecutar limpieza en orden de dependencias
        await prisma.$transaction(async (tx) => {
            // Eliminar datos dependientes primero
            await tx.transactionImage.deleteMany();
            await tx.budget.deleteMany();
            await tx.transaction.deleteMany();

            // Eliminar maestros y secundarios
            await tx.tag.deleteMany();
            await tx.category.deleteMany();
            await tx.frequency.deleteMany();
            await tx.account.deleteMany();
            await tx.accountType.deleteMany();

            // Logs
            await tx.systemLog.deleteMany();
            await tx.accessLog.deleteMany();

            // Configuración (podemos resetearla a valores por defecto)
            await tx.configuration.deleteMany();
            await tx.configuration.create({
                data: {
                    id: "global",
                    iaPrompt: "Eres un asistente financiero experto...", // Podríamos poner el prompt largo aquí
                    iaModel: "gemini-2.5-flash-image"
                }
            });

            // Usuarios
            await tx.user.deleteMany();

            // Crear el usuario administrador por defecto
            const hashedPassword = await bcrypt.hash("admin123", 10);
            await (tx.user as any).create({
                data: {
                    email: "admin@moneyo.com",
                    name: "Administrador",
                    password: hashedPassword,
                    role: "ADMIN",
                    permissions: {
                        dashboard: true,
                        vision: true,
                        transactions: true,
                        budgets: true,
                        accounts: true,
                        reports: true,
                        settings: true
                    },
                    twoFactorEnabled: false
                }
            });
        });

        // 3. Limpiar carpeta de uploads
        try {
            const uploadsPath = path.join(process.cwd(), "public", "uploads");
            if (fs.existsSync(uploadsPath)) {
                fs.rmSync(uploadsPath, { recursive: true, force: true });
                fs.mkdirSync(uploadsPath, { recursive: true });
            }
        } catch (error) {
            console.error("Error clearing uploads during reset:", error);
            // No fallamos el reseteo si fallan los archivos
        }

        return NextResponse.json({ message: "Base de datos reseteada con éxito" });
    } catch (error: any) {
        console.error("Error resetting database:", error);
        return NextResponse.json({ error: "Error al resetear la base de datos: " + error.message }, { status: 500 });
    }
}
