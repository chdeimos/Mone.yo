
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET() {
    try {
        let config = await prisma.configuration.findUnique({
            where: { id: "global" }
        });

        if (!config) {
            config = await (prisma.configuration as any).create({
                data: {
                    id: "global",
                    iaPrompt: "Eres un asistente experto en finanzas...",
                    bankPdfPrompt: "Analiza este extracto bancario y extrae movimientos en lista JSON...",
                    iaModel: "gemini-2.5-flash-image",
                    reportDay: 1,
                    reportPrompt: "Analiza mi situación financiera del mes pasado..."
                }
            });
            await logger.info("Configuración global creada por defecto");
        }

        return NextResponse.json(config);
    } catch (error) {
        await logger.error("Error fetching configuration", error);
        return NextResponse.json({ error: "Error fetching configuration" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { iaPrompt, iaModel, bankPdfPrompt, reportEmail, reportDay, reportPrompt } = body;

        const config = await (prisma.configuration as any).upsert({
            where: { id: "global" },
            update: {
                iaPrompt,
                iaModel,
                bankPdfPrompt,
                reportEmail,
                reportDay: reportDay !== undefined ? parseInt(reportDay) : undefined,
                reportPrompt
            },
            create: {
                id: "global",
                iaPrompt: iaPrompt || "",
                iaModel: iaModel || "gemini-2.5-flash-image",
                bankPdfPrompt,
                reportEmail,
                reportDay: reportDay !== undefined ? parseInt(reportDay) : 1,
                reportPrompt
            }
        });

        await logger.info("Configuración de IA actualizada", { iaModel });

        return NextResponse.json(config);
    } catch (error) {
        await logger.error("Error saving configuration", error);
        return NextResponse.json({ error: "Error saving configuration" }, { status: 500 });
    }
}