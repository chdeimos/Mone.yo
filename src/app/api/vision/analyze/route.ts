import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import prisma from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const files = Array.from(formData.values()).filter((v): v is File => v instanceof File);

        if (files.length === 0) {
            return NextResponse.json({ error: "No images provided" }, { status: 400 });
        }

        // Get Configuration
        const config = await prisma.configuration.findUnique({
            where: { id: "global" }
        });

        // Initialize Gemini
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
        // Use configured model or default to gemini-1.5-flash which supports images well, 
        // user requested gemini-2.5-flash-image but we need to check availability. 
        // For now using the config value.
        const model = genAI.getGenerativeModel({ model: config?.iaModel || "gemini-1.5-flash" });

        // Get Context (Categories & Accounts)
        const categories = await prisma.category.findMany({ select: { name: true } });
        const accounts = await prisma.account.findMany({ select: { name: true } });

        const categoryNames = categories.map(c => c.name).join(", ");
        const accountNames = accounts.map(a => a.name).join(", ");

        const inlineDataParts = [];
        const imageUrls = [];
        const uploadDir = path.join(process.cwd(), "public", "uploads");

        await mkdir(uploadDir, { recursive: true });

        let i = 0;
        for (const file of files) {
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Save image locally
            const filename = `${Date.now()}_${i++}_${file.name.replace(/\s/g, '_')}`;
            await writeFile(path.join(uploadDir, filename), buffer);
            imageUrls.push(`/uploads/${filename}`);

            inlineDataParts.push({
                inlineData: {
                    data: buffer.toString("base64"),
                    mimeType: file.type
                }
            });
        }

        // Construct Prompt
        const defaultPrompt = `Eres un asistente experto en análisis de tickets y facturas españolas. Tu tarea es extraer información precisa de las imágenes del ticket.

IMPORTANTE: Si recibes múltiples imágenes, asume que son partes secuenciales del MISMO ticket (cabecera, cuerpo, pie). Analízalas como un único documento continuo. El TOTAL suele estar en la última imagen (pie) y el COMERCIO en la primera (cabecera).

INSTRUCCIONES CRÍTICAS:
1. Busca el TOTAL FINAL (puede aparecer como "TOTAL", "TOTAL A PAGAR", "IMPORTE", "TOTAL VENTA")
2. Ignora subtotales, IVA desglosado, o importes parciales
3. Si hay "CAMBIO" o "ENTREGA", el total es el importe ANTES del cambio
4. La fecha puede estar en formatos: DD/MM/YYYY, DD-MM-YYYY, o DD.MM.YYYY
5. El nombre del comercio suele estar en la parte superior en MAYÚSCULAS

FORMATO DE SALIDA (JSON puro, sin markdown):
{
  "amount": [número decimal, ejemplo: 49.98],
  "date": "[YYYY-MM-DD]",
  "description": "[Nombre del comercio]",
  "categoryName": "[categoría de la lista]",
  "accountName": "[cuenta de la lista]"
}

REGLAS DE EXTRACCIÓN:

IMPORTE: Busca "TOTAL", "IMPORTE", "TOTAL VENTA". Usa punto decimal (49.98 no 49,98). Ignora "CAMBIO" o "ENTREGA".

FECHA: Convierte a formato ISO YYYY-MM-DD. Si no encuentras, usa la fecha de hoy.

DESCRIPCIÓN: Nombre del comercio (parte superior). Máximo 50 caracteres.

CATEGORÍA: Elige de esta lista: ${categoryNames}
- Supermercados → "Alimentación"
- Ropa/Moda → "Ropa y Calzado"  
- Ferreterías → "Hogar y Mantenimiento"
- Gasolineras → "Transporte"
- Restaurantes → "Restaurantes y Cafeterías"
- Si no coincide → "Otros"

CUENTA: Elige de esta lista: ${accountNames}
- Si menciona "TARJETA", "VISA", "MASTERCARD", "DÉBITO", "CRÉDITO" → cuenta de tarjeta
- Si menciona "EFECTIVO", "CASH" o hay "CAMBIO" → cuenta de efectivo
- Si NO hay información de pago → busca cuenta llamada "Efectivo" o similar
- Como último recurso → primera cuenta de la lista

Devuelve ÚNICAMENTE el JSON, sin explicaciones.`;

        const prompt = config?.iaPrompt ? config.iaPrompt.replace(/\{\{CATEGORIES\}\}/g, categoryNames).replace(/\{\{ACCOUNTS\}\}/g, accountNames) : defaultPrompt;

        const result = await model.generateContent([prompt, ...inlineDataParts]);
        const responseText = result.response.text();

        // Cleanup JSON
        const cleanedJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        const data = JSON.parse(cleanedJson);
        data.imageUrl = imageUrls[0];
        data.imageUrls = imageUrls;

        return NextResponse.json(data);

    } catch (error) {
        console.error("AI Analysis Error:", error);
        return NextResponse.json({ error: "Failed to analyze image" }, { status: 500 });
    }
}
