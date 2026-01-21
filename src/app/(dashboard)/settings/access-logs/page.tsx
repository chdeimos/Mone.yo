"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCcw, Shield, Globe, Smartphone, Laptop, Trash2 } from "lucide-react";
import Link from "next/link";
import { cn, formatDate, formatShortTime } from "@/lib/utils";

export default function AccessLogsPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadLogs = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/access-logs");
            if (res.ok) {
                const data = await res.json();
                setLogs(data);
            } else {
                setError("No se pudieron cargar los registros de acceso.");
            }
        } catch (error) {
            console.error("Error loading access logs", error);
            setError("Error de conexión al servidor.");
        } finally {
            setLoading(false);
        }
    };

    const handleClearLogs = async () => {
        if (!confirm("¿Seguro que quieres borrar todos los logs de acceso? Esta acción no se puede deshacer.")) return;

        try {
            const res = await fetch("/api/access-logs", { method: "DELETE" });
            if (res.ok) {
                setLogs([]);
            } else {
                alert("Error al borrar los logs");
            }
        } catch (error) {
            console.error("Error clearing logs", error);
            alert("Error de conexión");
        }
    };

    useEffect(() => {
        loadLogs();
    }, []);

    const getDeviceIcon = (ua: string) => {
        if (!ua) return <Globe className="w-4 h-4" />;
        if (ua.toLowerCase().includes("mobile")) return <Smartphone className="w-4 h-4" />;
        return <Laptop className="w-4 h-4" />;
    };

    return (
        <div className="space-y-6">
            {/* Header / Breadcrumb */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-500 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-black dark:text-white uppercase tracking-tight">
                        Bitácora de Accesos
                    </h1>
                    <nav className="flex mt-1">
                        <ol className="flex items-center space-x-2 text-xs font-semibold text-slate-400 uppercase tracking-widest">
                            <li><Link href="/" className="hover:text-primary transition-colors">Dashboard</Link></li>
                            <li><span className="mx-1">/</span></li>
                            <li><Link href="/settings" className="hover:text-primary transition-colors">Configuración</Link></li>
                            <li><span className="mx-1">/</span></li>
                            <li className="text-primary">Registros de Acceso</li>
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
                        <Trash2 className="w-4 h-4" /> Vaciar Bitácora
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
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Acción</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Identidad</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Terminal</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Origen IP</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Cronología</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stroke dark:divide-strokedark">
                            {loading && logs.length === 0 ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        <td colSpan={5} className="px-6 py-8">
                                            <div className="h-10 bg-slate-50 dark:bg-meta-4 animate-pulse rounded-md" />
                                        </td>
                                    </tr>
                                ))
                            ) : error ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <p className="text-rose-500 font-bold uppercase tracking-widest text-[10px]">{error}</p>
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <Shield className="w-12 h-12 text-slate-300 dark:text-slate-500 mx-auto mb-4" />
                                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Sin actividad registrada</p>
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-meta-4/10 transition-colors group">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "w-9 h-9 rounded-md flex items-center justify-center transition-all duration-300",
                                                    log.action === 'LOGIN' ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/10" :
                                                        log.action === 'LOGOUT' ? "bg-slate-100 dark:bg-meta-4 text-slate-400 border border-stroke dark:border-strokedark" :
                                                            "bg-rose-500/10 text-rose-600 border border-rose-500/10"
                                                )}>
                                                    <Shield className="w-4 h-4 transition-transform group-hover:scale-110" />
                                                </div>
                                                <span className="font-bold text-black dark:text-white text-[10px] uppercase tracking-widest">{log.action}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-black dark:text-white text-sm uppercase tracking-tight">{log.email || "Anónimo"}</span>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Internal Session</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3 text-slate-500" title={log.userAgent}>
                                                <div className="w-8 h-8 rounded-md bg-slate-50 dark:bg-meta-4 flex items-center justify-center border border-stroke dark:border-strokedark">
                                                    {getDeviceIcon(log.userAgent)}
                                                </div>
                                                <span className="text-[10px] truncate max-w-[150px] font-bold uppercase tracking-tight">{log.userAgent || "Unknown Agent"}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <code className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-meta-4 px-2 py-1 rounded-md text-slate-600 dark:text-slate-400 border border-stroke dark:border-strokedark">
                                                {log.ip || "127.0.0.1"}
                                            </code>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] font-bold text-black dark:text-white uppercase tracking-tight">
                                                    {formatDate(log.createdAt)}
                                                </span>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                    {formatShortTime(log.createdAt)}
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