import cron from "node-cron";
import { processRecurrentTransactions } from "./recurrence";
import { checkAndSendMonthlyReports } from "./reports";

let isInitialized = false;

export function initCron() {
    if (isInitialized) return;
    isInitialized = true;

    console.log("Inicializando motor de tareas programadas (Mone.yo)...");

    // Ejecutar cada medianoche
    cron.schedule("0 0 * * *", async () => {
        console.log("Ejecutando tareas de medianoche...");
        await processRecurrentTransactions();
        await checkAndSendMonthlyReports();
    });
}
