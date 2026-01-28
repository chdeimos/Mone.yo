import cron from "node-cron";
import { processRecurrentTransactions } from "./recurrence";
import { checkAndSendMonthlyReports } from "./reports";

let isInitialized = false;

export function initCron() {
    if (isInitialized) return;
    isInitialized = true;

    console.log("🚀 [Mone.yo] Inicializando motor de tareas programadas...");

    // 1. Ejecución inmediata al arrancar para catch-up
    setTimeout(async () => {
        console.log("⏱️ [Mone.yo] Realizando comprobación de catch-up inicial...");
        await processRecurrentTransactions();
    }, 5000); // Esperamos 5 segundos para asegurar que el sistema está listo

    // 2. Ejecutar cada medianoche (00:00)
    cron.schedule("0 0 * * *", async () => {
        console.log("🌙 [Mone.yo] Ejecutando tareas de medianoche...");
        await processRecurrentTransactions();
        await checkAndSendMonthlyReports();
    });
}
