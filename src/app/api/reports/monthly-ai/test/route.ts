import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { analyzeMonthlyStatus } from "@/lib/gemini";
import { logger } from "@/lib/logger";
import { sendEmail } from "@/lib/mailer";

export async function POST() {
    try {
        const config = await (prisma.configuration as any).findUnique({ where: { id: "global" } });
        if (!config || !config.reportEmail) {
            return NextResponse.json({ error: "Email de reporte no configurado en Cerebro IA" }, { status: 400 });
        }

        // Obtener fechas del mes pasado
        const now = new Date();
        const firstDayOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayOfLastMonth = new Date(firstDayOfCurrentMonth.getTime() - 1);
        const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        const [transactions, budgets] = await Promise.all([
            prisma.transaction.findMany({
                where: {
                    date: {
                        gte: firstDayOfLastMonth,
                        lte: lastDayOfLastMonth
                    }
                },
                include: { category: true }
            }),
            prisma.budget.findMany({
                where: {
                    month: firstDayOfLastMonth.getMonth() + 1,
                    year: firstDayOfLastMonth.getFullYear()
                },
                include: { category: true }
            })
        ]);

        const analysisData = {
            periodo: `${firstDayOfLastMonth.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}`,
            resumen: {
                totalIngresos: transactions.filter(t => t.type === 'INGRESO').reduce((acc, t) => acc + Number(t.amount), 0),
                totalGastos: transactions.filter(t => t.type === 'GASTO').reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0),
            },
            transacciones: transactions.slice(0, 50).map(t => ({
                fecha: t.date.toISOString().split('T')[0],
                descripcion: t.description,
                monto: Number(t.amount),
                tipo: t.type,
                categoria: t.category?.name
            })),
            presupuestos: budgets.map(b => ({
                categoria: b.category?.name,
                limite: Number(b.limit),
                estadoActual: Number(b.current)
            }))
        };

        const analysis = await analyzeMonthlyStatus(
            analysisData,
            config.reportPrompt || "Analiza mi situación financiera del mes pasado y dame consejos de ahorro.",
            config.iaModel
        );

        // Enviar Email Real
        await sendEmail({
            to: config.reportEmail,
            subject: `📊 Reporte Mensual Mone.yo - ${analysisData.periodo} (Prueba)`,
            html: `
                <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #2563eb; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 5px; font-size: 24px;">Mone.yo IA</h1>
                        <p style="color: #64748b; margin: 0; font-size: 14px; font-weight: bold;">PRUEBA DE REPORTE: ${analysisData.periodo}</p>
                    </div>

                    <div style="background-color: #f8fafc; border-radius: 12px; padding: 25px; margin-bottom: 30px; border: 1px solid #e2e8f0;">
                        <h3 style="margin-top: 0; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 15px;">Análisis Estratégico</h3>
                        <div style="line-height: 1.7; color: #1e293b; font-size: 15px;">${analysis}</div>
                    </div>

                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 30px;">
                        <tr>
                            <td width="48%" style="background-color: #ecfdf5; border-radius: 10px; padding: 15px; text-align: center; border: 1px solid #d1fae5;">
                                <span style="font-size: 10px; color: #059669; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Ingresos</span><br>
                                <span style="font-size: 20px; font-weight: 900; color: #059669;">+${analysisData.resumen.totalIngresos.toLocaleString('es-ES', { minimumFractionDigits: 2 })}€</span>
                            </td>
                            <td width="4%">&nbsp;</td>
                            <td width="48%" style="background-color: #fef2f2; border-radius: 10px; padding: 15px; text-align: center; border: 1px solid #fee2e2;">
                                <span style="font-size: 10px; color: #dc2626; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Gastos</span><br>
                                <span style="font-size: 20px; font-weight: 900; color: #dc2626;">-${analysisData.resumen.totalGastos.toLocaleString('es-ES', { minimumFractionDigits: 2 })}€</span>
                            </td>
                        </tr>
                    </table>

                    <div style="text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 40px;">
                        <p style="font-size: 12px; color: #94a3b8; margin: 0;">Generado automáticamente por la inteligencia artificial de Mone.yo.</p>
                        <p style="font-size: 11px; color: #cbd5e1; margin-top: 5px;">&copy; ${new Date().getFullYear()} Mone.yo App</p>
                    </div>
                </div>
            `
        });

        // Registro del envío
        await logger.info(`[REPORTE MENSUAL IA] Enviado a: ${config.reportEmail}`, {
            destinatario: config.reportEmail,
            periodo: analysisData.periodo,
            contenidoAnalisis: analysis
        });

        return NextResponse.json({
            message: "Informe generado y enviado correctamente por email",
            analysis
        });
    } catch (error: any) {
        console.error("Error generating monthly report:", error);
        await logger.error("Error generating monthly report", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
