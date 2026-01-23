import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Ensure directory exists
        const uploadDir = path.join(process.cwd(), "public", "uploads");
        try {
            await mkdir(uploadDir, { recursive: true });
        } catch (error) {
            // Ignore if exists
        }

        // Generate unique name
        const filename = `${uuidv4()}${path.extname(file.name)}`;
        const filepath = path.join(uploadDir, filename);

        await writeFile(filepath, buffer);

        // Return relative path for DB/Frontend
        const relativePath = `/uploads/${filename}`;

        return NextResponse.json({ path: relativePath });

    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}
