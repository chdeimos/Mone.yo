import cron from "node-cron";
import { processRecurrentTransactions } from "./recurrence";
import { checkAndSendMonthlyReports } from "./reports";

export function initCron() {
    console.log("Inicializando motor de tareas programadas (Mone.yo)...");

    // Ejecutar cada medianoche
    cron.schedule("0 0 * * *", async () => {
        console.log("Ejecutando tareas de medianoche...");
        await processRecurrentTransactions();
        await checkAndSendMonthlyReports();
    });

    // También una ejecución inmediata para pruebas en desarrollo (opcional)
    if (process.env.NODE_ENV === "development") {
        console.log("Ejecución de prueba de recurrencia (Dev mode)...");
        processRecurrentTransactions();
    }
}
