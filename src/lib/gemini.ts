import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function processReceipt(imageBase64: string, categories: string[], accounts: string[]) {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
    Eres un asistente contable experto. Tu tarea es extraer información de la imagen de un ticket o factura adjunta.
    
    Devuelve un JSON con la siguiente estructura:
    {
      "date": "ISO-8601 string",
      "merchant": "Nombre del comercio",
      "total": 0.00,
      "category": "Una de las siguientes: ${categories.join(", ")}",
      "account": "Una de las siguientes: ${accounts.join(", ")} (si no se puede determinar, usa la primera)",
      "description": "Breve descripción de la compra"
    }

    Si no puedes determinar un campo, intenta dar tu mejor suposición basada en el contexto. El total debe ser un número decimal.
  `;

    const result = await model.generateContent([
        prompt,
        {
            inlineData: {
                data: imageBase64.split(",")[1] || imageBase64,
                mimeType: "image/jpeg",
            },
        },
    ]);

    const response = await result.response;
    const text = response.text();

    // Limpiar el texto en caso de que Gemini añada markdown
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
    }

    throw new Error("No se pudo extraer información válida de la imagen");
}

export async function analyzeMonthlyStatus(data: any, prompt: string, modelName: string = "gemini-2.5-flash-image") {
    const model = genAI.getGenerativeModel({ model: modelName });

    const fullPrompt = `
        ${prompt}
        
        DATOS REALES DEL MES SELECCIONADO:
        ${JSON.stringify(data, null, 2)}
        
        INSTRUCCIONES DE FORMATO OBLIGATORIAS:
        1. Responde ÚNICAMENTE con el cuerpo del análisis.
        2. NO uses bloques de código Markdown (evita las comillas invertidas triple \`\`\`).
        3. NO incluyas <html>, <head> ni <body>.
        4. Usa etiquetas HTML simples si es necesario (<p>, <ul>, <li>, <strong>).
        5. No incluyas ningún texto de aviso antes o después del análisis.
    `;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    let text = response.text();

    // Limpiar bloques de código markdown si el modelo los incluyó a pesar de las instrucciones
    text = text.replace(/```[a-z]*\n?/gi, "");
    text = text.replace(/```/g, "");

    return text.trim();
}
