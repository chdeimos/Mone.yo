import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

export async function saveFile(base64Data: string) {
    const buffer = Buffer.from(base64Data.split(",")[1] || base64Data, "base64");
    const filename = `${uuidv4()}.jpg`;
    const uploadDir = join(process.cwd(), "uploads");

    try {
        await mkdir(uploadDir, { recursive: true });
        const filePath = join(uploadDir, filename);
        await writeFile(filePath, buffer);
        return `/uploads/${filename}`;
    } catch (error) {
        console.error("Error saving file:", error);
        throw error;
    }
}
