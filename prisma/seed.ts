import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    const hashedPassword = await bcrypt.hash("admin123", 10);

    // 1. Usuario Admin
    await prisma.user.upsert({
        where: { email: "admin@moneyo.com" },
        update: { password: hashedPassword },
        create: {
            email: "admin@moneyo.com",
            name: "Admin Pro",
            password: hashedPassword,
            role: Role.ADMIN,
        },
    });

    // 2. Tipos de Cuenta (CRUD dinámico inicial)
    const accountTypes = [
        { name: "Banco", icon: "Building2" },
        { name: "Efectivo", icon: "Banknote" },
        { name: "Inversiones", icon: "TrendingUp" },
        { name: "Cripto", icon: "Coins" },
        { name: "Ahorros", icon: "PiggyBank" },
    ];

    for (const type of accountTypes) {
        await prisma.accountType.upsert({
            where: { name: type.name },
            update: { icon: type.icon },
            create: { name: type.name, icon: type.icon },
        });
    }

    // 3. Categorías Profesionales (sin campo 'type' enum)
    const categories = [
        { name: "Alimentación", color: "#ef4444", icon: "ShoppingBasket" },
        { name: "Sueldo/Ingresos", color: "#22c55e", icon: "Wallet" },
        { name: "Transporte", color: "#3b82f6", icon: "Car" },
        { name: "Ocio y Cultura", color: "#eab308", icon: "Gamepad2" },
        { name: "Vivienda", color: "#8b5cf6", icon: "Home" },
        { name: "Sustentabilidad/Salud", color: "#10b981", icon: "HeartPulse" },
    ];

    for (const cat of categories) {
        await prisma.category.upsert({
            where: { name: cat.name },
            update: { color: cat.color, icon: cat.icon },
            create: { name: cat.name, color: cat.color, icon: cat.icon },
        });
    }

    // 4. Configuración Global (IA y Reportes)
    await prisma.configuration.upsert({
        where: { id: "global" },
        update: {},
        create: {
            id: "global",
            iaModel: "gemini-2.5-flash-image",
            iaPrompt: `Eres un asistente experto en análisis de tickets y facturas españolas. Tu tarea es extraer información precisa de las imágenes del ticket.

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

CATEGORÍA: Elige de esta lista: {{CATEGORIES}}

CUENTA: Elige de esta lista: {{ACCOUNTS}}
- Si menciona "TARJETA", "VISA" → cuenta de tarjeta
- Si menciona "EFECTIVO" → cuenta de efectivo
- Como último recurso → primera cuenta de la lista

Devuelve ÚNICAMENTE el JSON, sin explicaciones.`,
            bankPdfPrompt: `Analiza este extracto bancario y extrae movimientos en lista JSON.
        
INSTRUCCIONES:
1. Identifica cada transacción.
2. Para cada transacción extrae:
   - date: la fecha en formato YYYY-MM-DD.
   - description: el concepto o descripción del movimiento.
   - amount: el importe (siempre como número positivo).
   - type: "INGRESO" si el dinero entra, "GASTO" si el dinero sale.

REGLAS:
- Si el documento tiene varias páginas, procésalas todas.
- Sé preciso con los importes y las fechas.
- La descripción debe ser concisa pero informativa.
- Si hay transferencias internas o pagos con tarjeta, identifícalos correctamente.
- Devuelve exclusivamente un array de objetos JSON, sin markdown ni explicaciones adicionales.`,
            reportPrompt: `Como experto asesor financiero, analiza mis movimientos del mes pasado.
        
IMPORTANTE:
1. Da una visión general (Ingresos vs Gastos).
2. Resalta categorías con exceso de gasto.
3. Da 3 sugerencias concretas de ahorro basadas en los datos.
4. Usa un tono motivador y profesional.
5. El formato debe ser HTML rico para el cuerpo del correo.`,
            reportDay: 1
        },
    });

    console.log("Mone.yo 2.0 Seed completado satisfactoriamente.");
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
