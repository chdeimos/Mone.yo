import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export async function sendEmail({ to, subject, html }: { to: string, subject: string, html: string }) {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
        console.warn("⚠️ SMTP no configurado. El email no será enviado realmente.");
        return { message: "Simulated send", preview: html };
    }

    try {
        const info = await transporter.sendMail({
            from: `"Mone.yo IA" <${process.env.SMTP_USER}>`,
            to,
            subject,
            html,
        });

        console.log("✅ Email enviado: %s", info.messageId);
        return info;
    } catch (error) {
        console.error("❌ Error enviando email:", error);
        throw error;
    }
}
