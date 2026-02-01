import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AdmZip from "adm-zip";
import path from "path";
import fs from "fs";

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "ADMIN") {
            console.log("[Current User Role]:", (session?.user as any)?.role);
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        console.log("[RESTORE UPLOADS] Start processing...");
        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            console.error("[RESTORE UPLOADS] No file provided");
            return NextResponse.json({ error: "No se proporcionó ningún archivo" }, { status: 400 });
        }

        console.log("[RESTORE UPLOADS] File received:", file.name, "Size:", file.size);

        if (!file.name.endsWith(".zip")) {
            return NextResponse.json({ error: "Formato de archivo no válido. Debe ser .zip" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const zip = new AdmZip(buffer);
        const uploadsPath = path.join(process.cwd(), "public", "uploads");

        console.log("[RESTORE UPLOADS] Target path:", uploadsPath);

        // Asegurarse de que el directorio existe, si no, crearlo.
        // Si existe, lo limpiamos para que la restauración sea limpia.
        if (fs.existsSync(uploadsPath)) {
            console.log("[RESTORE UPLOADS] Cleaning existing uploads...");
            fs.rmSync(uploadsPath, { recursive: true, force: true });
        }
        fs.mkdirSync(uploadsPath, { recursive: true });

        console.log("[RESTORE UPLOADS] Extracting zip...");
        zip.extractAllTo(uploadsPath, true);
        console.log("[RESTORE UPLOADS] Extraction complete.");

        return NextResponse.json({ message: "Archivos restaurados correctamente" });
    } catch (error: any) {
        console.error("Error restoring uploads:", error);
        return NextResponse.json({ error: "Error al restaurar los archivos: " + error.message }, { status: 500 });
    }
}
