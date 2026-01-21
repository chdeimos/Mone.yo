import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file || file.type !== "application/pdf") {
            return NextResponse.json({ error: "Debe proporcionar un archivo PDF" }, { status: 400 });
        }

        // Get Configuration (Cast to any until prisma generates types correctly)
        const config = await prisma.configuration.findUnique({
            where: { id: "global" }
        }) as any;

        // Initialize Gemini
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
        // Use configured model from settings or fallback to gemini-2.5-flash-image
        const model = genAI.getGenerativeModel({ model: config?.iaModel || "gemini-2.5-flash-image" });

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const prompt = config?.bankPdfPrompt || `Analiza este extracto bancario y extrae TODOS los movimientos en una lista JSON.
        
        INSTRUCCIONES:
        1. Identifica cada transacción.
        2. Extrae: date (YYYY-MM-DD), description, amount (positivo), type (INGRESO/GASTO).
        
        REGLAS:
        - Procesa todas las páginas.
        - Devuelve EXCLUSIVAMENTE un array JSON sin markdown.`;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: buffer.toString("base64"),
                    mimeType: "application/pdf"
                }
            }
        ]);

        const responseText = result.response.text();

        // Limpiar el JSON de posibles bloques de código markdown
        const cleanedJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        const transactions = JSON.parse(cleanedJson);

        return NextResponse.json(transactions);

    } catch (error: any) {
        console.error("PDF Bank Import Error:", error);
        return NextResponse.json({ error: "Error al procesar el PDF: " + error.message }, { status: 500 });
    }
}
