"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, Sparkles, RefreshCcw, FileText } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function AIConfigPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [prompt, setPrompt] = useState("");
    const [bankPdfPrompt, setBankPdfPrompt] = useState("");
    const [reportPrompt, setReportPrompt] = useState("");
    const [reportEmail, setReportEmail] = useState("");
    const [reportDay, setReportDay] = useState(1);
    const [model, setModel] = useState("gemini-2.5-flash-image");

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/configuration");
            if (res.ok) {
                const data = await res.json();
                if (data.iaPrompt) setPrompt(data.iaPrompt);
                if (data.bankPdfPrompt) setBankPdfPrompt(data.bankPdfPrompt);
                else handleResetDefault(); // Cargar default si está vacío

                if (data.reportPrompt) setReportPrompt(data.reportPrompt);
                if (data.reportEmail) setReportEmail(data.reportEmail);
                if (data.reportDay) setReportDay(data.reportDay);

                if (data.iaModel) setModel(data.iaModel);
            }
        } catch (error) {
            console.error("Error loading config", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/configuration", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    iaPrompt: prompt,
                    bankPdfPrompt,
                    iaModel: model,
                    reportEmail,
                    reportDay,
                    reportPrompt
                })
            });
            if (res.ok) {
                alert("Configuración guardada correctamente");
            } else {
                alert("Error al guardar");
            }
        } catch (error) {
            console.error("Error saving config", error);
            alert("Error al guardar");
        } finally {
            setSaving(false);
        }
    };

    const handleTestReport = async () => {
        if (!confirm("¿Deseas generar y enviar el informe del mes anterior ahora mismo?")) return;
        setSaving(true);
        try {
            const res = await fetch("/api/reports/monthly-ai/test", { method: "POST" });
            if (res.ok) {
                alert("Informe generado y enviado con éxito");
            } else {
                const data = await res.json();
                alert("Error: " + (data.error || "No se pudo enviar el informe"));
            }
        } catch (error) {
            console.error(error);
            alert("Error de conexión");
        } finally {
            setSaving(false);
        }
    };

    const handleResetDefault = () => {
        setBankPdfPrompt(`Analiza este extracto bancario y extrae movimientos en lista JSON.
        
INSTRUCCIONES:
1. Identifica cada transacción.
2. Para cada transacción extrae:
   - date: la fecha en formato YYYY-MM-DD.
   - description: el concepto o descripción del movimiento.
   - amount: el importe (siempre como número positivo).
   - type: "INGRESO" si el dinero entra, "GASTO" si el dinero sale.

REGLAS:
- Si el documento tiene varias páginas, procésalas todas.
- Sé preciso con los importes y las fechas.
- La descripción debe ser concisa pero informativa.
- Si hay transferencias internas o pagos con tarjeta, identifícalos correctamente.
- Devuelve exclusivamente un array de objetos JSON, sin markdown ni explicaciones adicionales.`);

        setPrompt(`Eres un asistente experto en análisis de tickets y facturas españolas. Tu tarea es extraer información precisa de las imágenes del ticket.

IMPORTANTE: Si recibes múltiples imágenes, asume que son partes secuenciales del MISMO ticket (cabecera, cuerpo, pie). Analízalas como un único documento continuo. El TOTAL suele estar en la última imagen (pie) y el COMERCIO en la primera (cabecera).

INSTRUCCIONES CRÍTICAS:
1. Busca el TOTAL FINAL (puede aparecer como "TOTAL", "TOTAL A PAGAR", "IMPORTE", "TOTAL VENTA")
2. Ignora subtotales, IVA desglosado, o importes parciales
3. Si hay "CAMBIO" o "ENTREGA", el total es el importe ANTES del cambio
4. La fecha puede estar en formatos: DD/MM/YYYY, DD-MM-YYYY, o DD.MM.YYYY
5. El nombre del comercio suele estar en la parte superior en MAYÚSCULAS

FORMATO DE SALIDA (JSON puro, sin markdown):
{
  "amount": [número decimal, ejemplo: 49.98],
  "date": "[YYYY-MM-DD]",
  "description": "[Nombre del comercio]",
  "categoryName": "[categoría de la lista]",
  "accountName": "[cuenta de la lista]"
}

REGLAS DE EXTRACCIÓN:

IMPORTE: Busca "TOTAL", "IMPORTE", "TOTAL VENTA". Usa punto decimal (49.98 no 49,98). Ignora "CAMBIO" o "ENTREGA".

FECHA: Convierte a formato ISO YYYY-MM-DD. Si no encuentras, usa la fecha de hoy.

DESCRIPCIÓN: Nombre del comercio (parte superior). Máximo 50 caracteres.

CATEGORÍA: Elige de esta lista: {{CATEGORIES}}

CUENTA: Elige de esta lista: {{ACCOUNTS}}
- Si menciona "TARJETA", "VISA" → cuenta de tarjeta
- Si menciona "EFECTIVO" → cuenta de efectivo
- Como último recurso → primera cuenta de la lista

Devuelve ÚNICAMENTE el JSON, sin explicaciones.`);

        setReportPrompt(`Como experto asesor financiero, analiza mis movimientos del mes pasado.
        
IMPORTANTE:
1. Da una visión general (Ingresos vs Gastos).
2. Resalta categorías con exceso de gasto.
3. Da 3 sugerencias concretas de ahorro basadas en los datos.
4. Usa un tono motivador y profesional.
5. El formato debe ser HTML rico para el cuerpo del correo.`);
    };

    return (
        <div className="space-y-6">
            {/* Header / Breadcrumb */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-500 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-black dark:text-white uppercase tracking-tight">
                        Cerebro IA
                    </h1>
                    <nav className="flex mt-1">
                        <ol className="flex items-center space-x-2 text-xs font-semibold text-slate-400 uppercase tracking-widest">
                            <li><Link href="/" className="hover:text-primary transition-colors">Dashboard</Link></li>
                            <li><span className="mx-1">/</span></li>
                            <li><Link href="/settings" className="hover:text-primary transition-colors">Configuración</Link></li>
                            <li><span className="mx-1">/</span></li>
                            <li className="text-primary">Inteligencia Artificial</li>
                        </ol>
                    </nav>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={saving || loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white gap-2 rounded-md h-11 px-6 font-bold shadow-md transition-all uppercase text-[10px] tracking-widest disabled:opacity-50 border-none"
                >
                    {saving ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? "Procesando..." : "Guardar Cambios"}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="p-8 border-none bg-white dark:bg-boxdark shadow-sm rounded-md space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Lógica del Sistema (System Prompt)</Label>
                                <p className="text-[10px] text-slate-500 font-medium max-w-md">
                                    Define las instrucciones base para la IA. Usa <code className="bg-slate-50 dark:bg-meta-4 px-1.5 py-0.5 rounded text-primary font-bold">{"{{CATEGORIES}}"}</code> y <code className="bg-slate-50 dark:bg-meta-4 px-1.5 py-0.5 rounded text-primary font-bold">{"{{ACCOUNTS}}"}</code> como variables.
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { if (confirm("¿Restaurar prompt por defecto?")) handleResetDefault(); }}
                                className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-all"
                            >
                                <RefreshCcw className="w-3.5 h-3.5 mr-1.5" /> Restaurar
                            </Button>
                        </div>

                        <div className="relative group">
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                className="flex min-h-[300px] w-full rounded-md border border-stroke dark:border-strokedark bg-slate-50 dark:bg-meta-4 p-6 text-xs font-mono leading-relaxed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary transition-all disabled:cursor-not-allowed disabled:opacity-50 text-black dark:text-white"
                                placeholder="..."
                            />
                        </div>

                        <div className="pt-6 border-t border-stroke dark:border-strokedark">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Lógica de Importación de Extractos (PDF)</Label>
                            <textarea
                                value={bankPdfPrompt}
                                onChange={(e) => setBankPdfPrompt(e.target.value)}
                                className="flex min-h-[300px] w-full mt-2 rounded-md border border-stroke dark:border-strokedark bg-slate-50 dark:bg-meta-4 p-6 text-xs font-mono leading-relaxed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary transition-all text-black dark:text-white"
                                placeholder="Instrucciones para PDFs..."
                            />
                            <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-100 transition-opacity">
                                <Sparkles className="w-5 h-5 text-primary" />
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="p-8 border-none bg-white dark:bg-boxdark shadow-sm rounded-md space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-md flex items-center justify-center text-primary">
                                <Sparkles className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-black dark:text-white uppercase tracking-tight">Motor de IA</h3>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Core Engine</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Identificador del Modelo</Label>
                                <Input
                                    value={model}
                                    onChange={(e) => setModel(e.target.value)}
                                    placeholder="Ej: gemini-1.5-flash"
                                    className="h-11 rounded-md bg-slate-50 dark:bg-meta-4 border-stroke dark:border-strokedark font-mono font-bold text-xs text-black dark:text-white focus:ring-1 focus:ring-primary"
                                />
                            </div>

                            <div className="p-4 bg-primary/5 rounded-md border border-primary/10">
                                <p className="text-[11px] text-primary font-medium leading-relaxed">
                                    <span className="font-black uppercase text-[9px] block mb-1 tracking-widest">Recomendación:</span>
                                    gemini-2.5-flash-image es el modelo optimizado para baja latencia y alta precisión en visión.
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-8 border-none bg-white dark:bg-boxdark shadow-sm rounded-md border-l-4 border-l-primary">
                        <h4 className="font-bold text-black dark:text-white text-xs mb-2 uppercase tracking-tight">Consejo de Optimización</h4>
                        <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                            Para mejores resultados, solicita siempre la salida en formato JSON y define claramente las categorías permitidas para evitar alucinaciones.
                        </p>
                    </Card>

                    <Card className="p-8 border-none bg-white dark:bg-boxdark shadow-sm rounded-md space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-500/10 rounded-md flex items-center justify-center text-emerald-500">
                                <FileText className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-black dark:text-white uppercase tracking-tight">Informe Mensual</h3>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Email Automático</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email de Destino</Label>
                                <Input
                                    value={reportEmail}
                                    onChange={(e) => setReportEmail(e.target.value)}
                                    placeholder="ejemplo@correo.com"
                                    className="h-11 rounded-md bg-slate-50 dark:bg-meta-4 border-stroke dark:border-strokedark font-bold text-xs"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Día del Mes</Label>
                                <Input
                                    type="number"
                                    min="1"
                                    max="31"
                                    value={reportDay}
                                    onChange={(e) => setReportDay(parseInt(e.target.value))}
                                    className="h-11 rounded-md bg-slate-50 dark:bg-meta-4 border-stroke dark:border-strokedark font-bold text-xs"
                                />
                            </div>

                            <Button
                                onClick={handleTestReport}
                                disabled={saving}
                                variant="outline"
                                className="w-full h-11 border-dashed border-2 hover:bg-emerald-50 dark:hover:bg-emerald-500/5 text-emerald-600 font-bold uppercase text-[9px] tracking-[0.2em] gap-2"
                            >
                                <RefreshCcw className={cn("w-3.5 h-3.5", saving && "animate-spin")} />
                                Probar Informe Ahora
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>

            <Card className="p-8 border-none bg-white dark:bg-boxdark shadow-sm rounded-md mt-6">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Prompt para Análisis Mensual</Label>
                <p className="text-[10px] text-slate-500 font-medium mb-3">Instrucciones para que la IA genere el reporte de salud financiera mensual.</p>
                <textarea
                    value={reportPrompt}
                    onChange={(e) => setReportPrompt(e.target.value)}
                    className="flex min-h-[200px] w-full rounded-md border border-stroke dark:border-strokedark bg-slate-50 dark:bg-meta-4 p-6 text-xs font-mono leading-relaxed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary transition-all text-black dark:text-white"
                    placeholder="Instrucciones del reporte..."
                />
            </Card>
        </div>
    );
}