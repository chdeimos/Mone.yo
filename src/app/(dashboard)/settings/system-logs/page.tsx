"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCcw, AlertTriangle, Info, AlertCircle, Trash2 } from "lucide-react";
import Link from "next/link";
import { cn, formatDate, formatTime } from "@/lib/utils";

export default function SystemLogsPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadLogs = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/system-logs");
            if (res.ok) {
                const data = await res.json();
                setLogs(data);
            } else {
                setError("No se pudieron cargar los logs.");
            }
        } catch (error) {
            console.error("Error loading system logs", error);
            setError("Error de conexión al servidor.");
        } finally {
            setLoading(false);
        }
    };

    const handleClearLogs = async () => {
        if (!confirm("¿Seguro que quieres borrar todos los logs del sistema? Esta acción no se puede deshacer.")) return;

        try {
            const res = await fetch("/api/system-logs", { method: "DELETE" });
            if (res.ok) {
                setLogs([]);
            } else {
                alert("Error al borrar los logs");
            }
        } catch (error) {
            console.error("Error clearing system logs", error);
            alert("Error de conexión");
        }
    };

    useEffect(() => {
        loadLogs();
    }, []);

    const getLevelIcon = (level: string) => {
        switch (level) {
            case 'ERROR': return <AlertTriangle className="w-4 h-4 text-rose-500" />;
            case 'WARN': return <AlertCircle className="w-4 h-4 text-amber-500" />;
            default: return <Info className="w-4 h-4 text-blue-500" />;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header / Breadcrumb */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-500 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-black dark:text-white uppercase tracking-tight">
                        Registros del Sistema
                    </h1>
                    <nav className="flex mt-1">
                        <ol className="flex items-center space-x-2 text-xs font-semibold text-slate-400 uppercase tracking-widest">
                            <li><Link href="/" className="hover:text-primary transition-colors">Dashboard</Link></li>
                            <li><span className="mx-1">/</span></li>
                            <li><Link href="/settings" className="hover:text-primary transition-colors">Configuración</Link></li>
                            <li><span className="mx-1">/</span></li>
                            <li className="text-primary">System Logs</li>
                        </ol>
                    </nav>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={handleClearLogs}
                        variant="ghost"
                        disabled={logs.length === 0}
                        className="gap-2 rounded-md h-11 px-6 font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all uppercase text-[10px] tracking-widest shadow-none disabled:opacity-50"
                    >
                        <Trash2 className="w-4 h-4" /> Limpiar Incidencias
                    </Button>
                    <Button onClick={loadLogs} variant="outline" className="gap-2 rounded-md h-11 px-6 font-bold border-stroke dark:border-strokedark bg-white dark:bg-boxdark text-slate-400 hover:text-primary transition-all uppercase text-[10px] tracking-widest shadow-sm">
                        <RefreshCcw className={cn("w-4 h-4", loading && "animate-spin")} /> Actualizar
                    </Button>
                </div>
            </div>

            <Card className="overflow-hidden border-none bg-white dark:bg-boxdark rounded-md shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-meta-4/20 border-b border-stroke dark:border-strokedark">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Severidad</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Detalle del Evento</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Marca Temporal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stroke dark:divide-strokedark">
                            {loading && logs.length === 0 ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        <td colSpan={3} className="px-6 py-8">
                                            <div className="h-10 bg-slate-50 dark:bg-meta-4 animate-pulse rounded-md" />
                                        </td>
                                    </tr>
                                ))
                            ) : error ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-20 text-center">
                                        <p className="text-rose-500 font-bold uppercase tracking-widest text-[10px]">{error}</p>
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-20 text-center">
                                        <AlertCircle className="w-12 h-12 text-slate-300 dark:text-slate-500 mx-auto mb-4" />
                                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No hay incidencias registradas</p>
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-meta-4/10 transition-colors group">
                                        <td className="px-6 py-5 align-top">
                                            <div className={cn(
                                                "flex items-center gap-2 px-2.5 py-1 rounded-md border text-[9px] font-black tracking-widest uppercase w-fit shadow-sm",
                                                log.level === 'ERROR' ? "bg-rose-500/10 text-rose-500 border-rose-500/20" :
                                                    log.level === 'WARN' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                                                        "bg-primary/10 text-primary border-primary/20"
                                            )}>
                                                {getLevelIcon(log.level)}
                                                {log.level}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="space-y-4">
                                                <p className="font-bold text-black dark:text-white text-sm leading-snug group-hover:text-primary transition-colors">
                                                    {log.message}
                                                </p>
                                                {log.stack ? (
                                                    <details className="group/details cursor-pointer">
                                                        <summary className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors select-none list-none flex items-center gap-2">
                                                            <div className="w-3 h-[2px] bg-slate-200 dark:bg-strokedark group-hover/details:bg-primary transition-colors" />
                                                            Inspección Técnica
                                                        </summary>
                                                        <div className="mt-4 p-6 bg-slate-900 dark:bg-black text-slate-300 rounded-md text-[10px] font-mono overflow-x-auto max-w-2xl whitespace-pre-wrap border border-stroke dark:border-strokedark shadow-xl">
                                                            <div className="text-emerald-500 mb-3 font-black uppercase tracking-widest text-[9px] flex items-center gap-2">
                                                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Stack Trace:
                                                            </div>
                                                            <div className="leading-relaxed opacity-80">{log.stack}</div>
                                                            {log.context && (
                                                                <div className="mt-6 pt-6 border-t border-stroke/20 dark:border-strokedark/50">
                                                                    <div className="text-amber-500 mb-2 font-black uppercase tracking-widest text-[9px]">Context Payload:</div>
                                                                    <div className="text-slate-400 italic bg-white/5 p-3 rounded-md">{log.context}</div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </details>
                                                ) : (
                                                    <span className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">Procedimiento sin traza</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right align-top">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] font-bold text-black dark:text-white uppercase tracking-tight">
                                                    {formatDate(log.createdAt)}
                                                </span>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                    {formatTime(log.createdAt)}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}