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
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No se proporcionó ningún archivo" }, { status: 400 });
        }

        if (!file.name.endsWith(".zip")) {
            return NextResponse.json({ error: "Formato de archivo no válido. Debe ser .zip" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const zip = new AdmZip(buffer);
        const uploadsPath = path.join(process.cwd(), "public", "uploads");

        // Asegurarse de que el directorio existe, si no, crearlo.
        // Si existe, lo limpiamos para que la restauración sea limpia.
        if (fs.existsSync(uploadsPath)) {
            fs.rmSync(uploadsPath, { recursive: true, force: true });
        }
        fs.mkdirSync(uploadsPath, { recursive: true });

        zip.extractAllTo(uploadsPath, true);

        return NextResponse.json({ message: "Archivos restaurados correctamente" });
    } catch (error: any) {
        console.error("Error restoring uploads:", error);
        return NextResponse.json({ error: "Error al restaurar los archivos: " + error.message }, { status: 500 });
    }
}
