import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AdmZip from "adm-zip";
import path from "path";
import fs from "fs";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "ADMIN") {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const uploadsPath = path.join(process.cwd(), "public", "uploads");

        if (!fs.existsSync(uploadsPath)) {
            return NextResponse.json({ error: "No hay archivos para descargar" }, { status: 404 });
        }

        const zip = new AdmZip();
        zip.addLocalFolder(uploadsPath);
        const zipBuffer = zip.toBuffer();

        return new NextResponse(new Uint8Array(zipBuffer), {
            headers: {
                "Content-Type": "application/zip",
                "Content-Disposition": `attachment; filename=uploads_backup_${new Date().toISOString().split('T')[0]}.zip`,
            },
        });
    } catch (error: any) {
        console.error("Error downloading uploads:", error);
        return NextResponse.json({ error: "Error al generar el archivo ZIP" }, { status: 500 });
    }
}
