import { initCron } from "./cron";

if (typeof window === "undefined") {
    // Solo en el servidor
    initCron();
}
