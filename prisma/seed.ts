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
