"use client";

import { useState, useEffect } from "react";
import {
    TrendingDown,
    TrendingUp,
    Wallet,
    ArrowUpRight,
    ArrowDownLeft,
    Plus,
    ChevronRight,
    ArrowRight,
    ArrowLeftRight,
    CheckCircle2,
    Repeat,
    Calendar,
    FilterX,
    ArrowUp,
    ArrowDown,
    AlertTriangle,
    Sparkles,
    Info
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency, formatDate, formatMonthYear } from "@/lib/utils";
import Link from "next/link";
import dynamic from "next/dynamic";

// Dynamic imports for charts to reduce initial bundle size
const DashboardBarChart = dynamic(() => import("@/components/dashboard/DashboardBarChart"), {
    ssr: false,
    loading: () => <div className="w-full h-[300px] bg-slate-50 dark:bg-meta-4/10 animate-pulse rounded-xl" />
});

const DashboardPieChart = dynamic(() => import("@/components/dashboard/DashboardPieChart"), {
    ssr: false,
    loading: () => <div className="w-full h-[250px] bg-slate-50 dark:bg-meta-4/10 animate-pulse rounded-xl" />
});

const DashboardAreaChart = dynamic(() => import("@/components/dashboard/DashboardAreaChart"), {
    ssr: false,
    loading: () => <div className="w-full h-[350px] bg-slate-50 dark:bg-meta-4/10 animate-pulse rounded-xl" />
});

export default function DashboardPage() {
    const [stats, setStats] = useState<any>({
        totalBalance: 0,
        monthlyIncome: 0,
        monthlyExpenses: 0,
        recentTransactions: [],
        accounts: [],
        budgets: []
    });
    const [loading, setLoading] = useState(true);
    const [historyPeriod, setHistoryPeriod] = useState("1m");
    const [historyData, setHistoryData] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [newRecurringCount, setNewRecurringCount] = useState(0);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        // Detect mobile with debounce to minimize forced reflows during resize
        let resizeTimer: NodeJS.Timeout;
        const checkMobile = () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                setIsMobile(window.innerWidth < 768);
            }, 200);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        const loadStats = async () => {
            try {
                // Load stats
                const res = await fetch("/api/stats");
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (error) {
                console.error("Error loading stats:", error);
            } finally {
                setLoading(false);
            }
        };
        loadStats();
        loadHistory(historyPeriod);

        return () => {
            window.removeEventListener('resize', checkMobile);
            clearTimeout(resizeTimer);
        };
    }, []);

    const loadHistory = async (period: string) => {
        setHistoryLoading(true);
        try {
            const res = await fetch(`/api/stats/history?period=${period}`);
            if (res.ok) {
                const data = await res.json();
                setHistoryData(data);
            }
        } catch (error) {
            console.error("Error loading history:", error);
        } finally {
            setHistoryLoading(false);
        }
    };

    useEffect(() => {
        if (!loading) {
            loadHistory(historyPeriod);
        }
    }, [historyPeriod]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-40 text-muted-foreground space-y-4">
                <div className="w-10 h-10 border-4 border-muted border-t-primary rounded-full animate-spin" />
                <p className="font-black text-[10px] uppercase tracking-widest">Sincronizando Dashboard</p>
            </div>
        );
    }

    const sortedAccounts = [...(stats.accounts || [])].sort((a: any, b: any) => b.balance - a.balance);
    const spendPercentage = stats.budgets?.length > 0
        ? Math.round((stats.budgets?.reduce((acc: number, b: any) => acc + Number(b.current), 0) / (stats.budgets?.reduce((acc: number, b: any) => acc + Number(b.limit), 0) || 1)) * 100)
        : 0;
    const pieData = [
        { name: 'Gastado', value: stats.budgets?.reduce((acc: number, b: any) => acc + Number(b.current) || 0, 0) || 0 },
        { name: 'Restante', value: Math.max(0, stats.budgets?.reduce((acc: number, b: any) => acc + (Number(b.limit) - Number(b.current)) || 0, 0)) || 1 }
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {newRecurringCount > 0 && (
                <div className="bg-[#E1E7FF] dark:bg-[#2F374F] border border-[#BAC8FF] dark:border-[#3D4D77] p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-sm gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-xl shrink-0">
                            <Repeat className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <p className="font-bold text-sm text-primary uppercase tracking-wide leading-tight">Actualización Automática</p>
                            <p className="text-xs text-bodydark dark:text-bodydark1 font-medium italic mt-1">Se han generado {newRecurringCount} nuevos movimientos recurrentes hoy.</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setNewRecurringCount(0)}
                        className="text-primary hover:bg-primary/5 w-full sm:w-auto h-11 sm:h-9 font-bold"
                    >
                        Ocultar Aviso
                    </Button>
                </div>
            )}

            {/* Breadcrumbs Placeholder */}
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-black text-black dark:text-white uppercase tracking-tight">Dashboard</h1>
                <nav className="text-xs font-bold text-slate-500 uppercase tracking-widest hidden sm:block">
                    Mone.yo / <span className="text-primary">Estadísticas del Sistema</span>
                </nav>
            </div>

            {/* Data Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {/* Patrimonio Total */}
                <Card className="bg-white dark:bg-boxdark border-none shadow-sm p-4 sm:p-6 relative overflow-hidden group">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 relative z-10">
                        <div className="p-2.5 sm:p-3 bg-[#3c50e0] rounded-lg text-white shadow-sm w-fit">
                            <Wallet className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div>
                            <p className="text-muted-foreground font-black uppercase text-[9px] sm:text-[11px] lg:text-[13px] tracking-widest mb-0.5 sm:mb-1">Patrimonio Total</p>
                            <h2 className="text-lg sm:text-2xl font-black text-[#3c50e0] dark:text-white tracking-tight leading-none">
                                {formatCurrency(stats.totalBalance)}
                            </h2>
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-[#3c50e0] opacity-30 group-hover:opacity-100 transition-opacity" />
                </Card>

                {/* Ingresos Mes */}
                <Card className="bg-white dark:bg-boxdark border-none shadow-sm p-4 sm:p-6 relative overflow-hidden group">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 relative z-10">
                        <div className="p-2.5 sm:p-3 rounded-lg bg-emerald-500 text-white shadow-sm w-fit">
                            <ArrowDownLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div>
                            <p className="text-muted-foreground font-black uppercase text-[9px] sm:text-[11px] lg:text-[13px] tracking-widest mb-0.5 sm:mb-1">Ingresos Mes</p>
                            <h2 className="text-lg sm:text-2xl font-black tracking-tight text-emerald-500 leading-none">
                                +{formatCurrency(stats.monthlyIncome)}
                            </h2>
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-500 opacity-30 group-hover:opacity-100 transition-opacity" />
                </Card>

                {/* Gastos Mes */}
                <Card className="bg-white dark:bg-boxdark border-none shadow-sm p-4 sm:p-6 relative overflow-hidden group">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 relative z-10">
                        <div className="p-2.5 sm:p-3 rounded-lg bg-rose-500 text-white shadow-sm w-fit">
                            <ArrowUpRight className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div>
                            <p className="text-muted-foreground font-black uppercase text-[9px] sm:text-[11px] lg:text-[13px] tracking-widest mb-0.5 sm:mb-1">Gastos Mes</p>
                            <h2 className="text-lg sm:text-2xl font-black tracking-tight text-rose-500 leading-none">
                                -{formatCurrency(stats.monthlyExpenses)}
                            </h2>
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-rose-500 opacity-30 group-hover:opacity-100 transition-opacity" />
                </Card>

                {/* Cuentas Activas */}
                <Card className="bg-white dark:bg-boxdark border-none shadow-sm p-4 sm:p-6 relative overflow-hidden group">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 relative z-10">
                        <div className="p-2.5 sm:p-3 bg-slate-800 dark:bg-meta-4 rounded-lg text-white shadow-sm w-fit">
                            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div>
                            <p className="text-muted-foreground font-black uppercase text-[9px] sm:text-[11px] lg:text-[13px] tracking-widest mb-0.5 sm:mb-1">Cuentas Activas</p>
                            <h2 className="text-lg sm:text-2xl font-black text-black dark:text-white tracking-tight leading-none">
                                {stats.accounts.length}
                            </h2>
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-800 opacity-30 group-hover:opacity-100 transition-opacity" />
                </Card>
            </div>


            {/* Main Analysis Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
                {/* Patrimonio Card */}
                <Card className="bg-white dark:bg-boxdark border-none shadow-sm p-8 min-h-[500px] flex flex-col relative overflow-hidden group">
                    <div className="w-full mb-8 relative z-10 text-center lg:text-left">
                        <h3 className="text-xl font-black text-black dark:text-white uppercase tracking-tight">Distribución de Patrimonio</h3>
                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-1">Saldos en tiempo real</p>
                    </div>

                    <div className="flex-1 relative min-h-[300px] flex flex-col justify-center">
                        <DashboardBarChart data={sortedAccounts} isMobile={isMobile} />

                        {/* Summary Footer */}
                        <div className="flex justify-center gap-8 mt-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                <div>
                                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none">Activos</p>
                                    <p className="text-xs font-black text-emerald-500 leading-tight">
                                        {formatCurrency(stats.accounts?.reduce((acc: number, cur: any) => Number(cur.balance) > 0 ? acc + Number(cur.balance) : acc, 0))}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-rose-500" />
                                <div>
                                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none">Pasivos</p>
                                    <p className="text-xs font-black text-rose-500 leading-tight">
                                        {formatCurrency(stats.accounts?.reduce((acc: number, cur: any) => Number(cur.balance) < 0 ? acc + Number(cur.balance) : acc, 0))}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-center relative z-10">
                        <Link href="/accounts">
                            <Button variant="outline" className="h-9 px-6 border-stroke dark:border-strokedark text-[10px] font-black uppercase tracking-widest rounded-md hover:bg-slate-50 dark:hover:bg-meta-4">
                                Gestionar Cuentas
                            </Button>
                        </Link>
                    </div>
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-[#3c50e0] opacity-20 group-hover:opacity-100 transition-opacity" />
                </Card>

                {/* Budget Card */}
                <Card className="bg-white dark:bg-boxdark border-none shadow-sm p-8 min-h-[500px] flex flex-col relative overflow-hidden group font-sans">
                    <div className="w-full mb-8 relative z-10 text-center lg:text-left">
                        <h3 className="text-xl font-black text-black dark:text-white uppercase tracking-tight">Presupuesto Mensual</h3>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
                            {formatMonthYear(new Date()).toUpperCase()}
                        </p>
                    </div>

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 items-center relative z-10">
                        <DashboardPieChart data={pieData} percentage={spendPercentage} />

                        {/* Insights Panel */}
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-slate-50 dark:bg-meta-4/10 border border-stroke dark:border-strokedark">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2 text-left">
                                    <Sparkles className="w-3 h-3 text-primary" /> Sugerencia IA
                                </p>

                                {stats.budgets?.some((b: any) => Number(b.current) > Number(b.limit)) ? (
                                    <div className="space-y-3">
                                        <div className="flex gap-3 text-left">
                                            <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0">
                                                <AlertTriangle className="w-4 h-4 text-rose-500" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-rose-500 uppercase tracking-tight">Límites Superados</p>
                                                <p className="text-[9px] font-medium text-slate-500 mt-0.5">Te has excedido en {stats.budgets.filter((b: any) => Number(b.current) > Number(b.limit)).length} categorías. Reduce gastos innecesarios.</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : stats.budgets?.length > 0 ? (
                                    <div className="space-y-3 text-left">
                                        <div className="flex gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                                                <TrendingDown className="w-4 h-4 text-emerald-500" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-emerald-500 uppercase tracking-tight">Todo en Orden</p>
                                                <p className="text-[9px] font-medium text-slate-500 mt-0.5">¡Estás bajo control! Continúa así para maximizar tu ahorro mensual.</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex gap-3 text-left">
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                            <Info className="w-4 h-4 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-primary uppercase tracking-tight">Inicia un Plan</p>
                                            <p className="text-[9px] font-medium text-slate-500 mt-0.5">Crea presupuestos para evitar gastos impulsivos y ahorrar más.</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-lg bg-slate-50 dark:bg-meta-4/10">
                                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1 text-left">Límite Total</p>
                                    <p className="text-[11px] font-black text-black dark:text-white text-left">
                                        {formatCurrency(stats.budgets?.reduce((acc: number, b: any) => acc + Number(b.limit), 0))}
                                    </p>
                                </div>
                                <div className="p-3 rounded-lg bg-slate-50 dark:bg-meta-4/10">
                                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1 text-left">Disponible</p>
                                    <p className="text-[11px] font-black text-emerald-500 text-left">
                                        {formatCurrency(Math.max(0, stats.budgets?.reduce((acc: number, b: any) => acc + (Number(b.limit) - Number(b.current)), 0)))}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-center relative z-10">
                        <Link href="/budgets">
                            <Button variant="outline" className="h-9 px-6 border-stroke dark:border-strokedark text-[9px] font-black uppercase tracking-widest rounded-md hover:bg-slate-50 dark:hover:bg-meta-4">
                                Detalles de Presupuesto
                            </Button>
                        </Link>
                    </div>
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-rose-500 opacity-20 group-hover:opacity-100 transition-opacity" />
                </Card>
            </div>

            {/* Wealth Evolution Chart */}
            <Card className="bg-white dark:bg-boxdark border-none shadow-sm p-8 relative overflow-hidden group mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 relative z-10">
                    <div>
                        <h3 className="text-xl font-black text-black dark:text-white uppercase tracking-tight">Evolución de Patrimonio</h3>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Histórico de balance consolidado</p>
                    </div>
                    <div className="flex items-center bg-slate-50 dark:bg-meta-4/20 p-1 rounded-lg border border-stroke dark:border-strokedark self-start">
                        {[
                            { label: "1M", value: "1m" },
                            { label: "3M", value: "3m" },
                            { label: "6M", value: "6m" },
                            { label: "1Y", value: "1y" },
                            { label: "Total", value: "total" },
                        ].map((p) => (
                            <button
                                key={p.value}
                                onClick={() => setHistoryPeriod(p.value)}
                                className={cn(
                                    "px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all",
                                    historyPeriod === p.value
                                        ? "bg-white dark:bg-boxdark text-primary shadow-sm ring-1 ring-black/5"
                                        : "text-muted-foreground hover:text-slate-600 dark:hover:text-slate-200"
                                )}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="h-[350px] w-full relative">
                    {historyLoading && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/50 dark:bg-boxdark/50 backdrop-blur-[1px]">
                            <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
                        </div>
                    )}
                    <DashboardAreaChart data={historyData} isMobile={isMobile} />
                </div>
            </Card>

            {/* Recent Transactions Section */}
            <Card className="bg-white dark:bg-boxdark border-none shadow-sm p-8 relative overflow-hidden group mb-12">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-xl font-black text-black dark:text-white uppercase tracking-tight leading-none mb-1.5">Últimos Movimientos</h3>
                        <p className="text-xs font-black uppercase text-muted-foreground tracking-widest leading-none">Actividad reciente en tus cuentas</p>
                    </div>
                    <Link href="/transactions">
                        <Button variant="ghost" className="text-primary font-black uppercase tracking-widest text-[10px] gap-2 hover:bg-primary/5 min-h-[44px]">
                            Ver Todo <ArrowRight className="w-3 h-3" />
                        </Button>
                    </Link>
                </div>

                <div className="space-y-4">
                    {stats.recentTransactions && stats.recentTransactions.length > 0 ? (
                        stats.recentTransactions.slice(0, 5).map((tx: any) => (
                            <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-meta-4/10 transition-colors group/row border border-transparent hover:border-stroke dark:hover:border-strokedark gap-3">
                                <div className="flex items-center gap-3 sm:gap-4 overflow-hidden min-w-0 flex-1">
                                    <div className={cn(
                                        "w-10 h-10 rounded-lg flex items-center justify-center transition-all shrink-0",
                                        tx.type === 'INGRESO' ? "bg-emerald-500/10 text-emerald-500" :
                                            tx.type === 'GASTO' ? "bg-rose-500/10 text-rose-500" :
                                                "bg-blue-500/10 text-blue-500"
                                    )}>
                                        {tx.type === 'INGRESO' ? <ArrowDownLeft className="w-5 h-5" /> :
                                            tx.type === 'GASTO' ? <ArrowUpRight className="w-5 h-5" /> :
                                                <ArrowLeftRight className="w-5 h-5" />}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-bold text-black dark:text-white uppercase tracking-tight truncate">{tx.description}</p>
                                        <div className="flex items-center gap-2 mt-0.5 min-w-0">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground shrink-0">{formatDate(tx.date)}</span>
                                            <span className="text-slate-300 dark:text-slate-700 font-bold">•</span>
                                            <span className="text-[9px] font-black uppercase tracking-widest text-primary truncate">{tx.category?.name || "Global"}</span>
                                            {tx.isVerified ? (
                                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
                                            ) : (
                                                <AlertTriangle className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className={cn(
                                        "text-base font-black tracking-tight",
                                        tx.type === 'INGRESO' ? "text-emerald-500" :
                                            tx.type === 'GASTO' ? "text-rose-500" :
                                                "text-primary"
                                    )}>
                                        {tx.type === 'INGRESO' ? '+' : tx.type === 'GASTO' ? '-' : ''}{formatCurrency(tx.amount)}
                                    </p>
                                    <p className="text-[10px] lg:text-[11px] font-black uppercase tracking-widest text-muted-foreground mt-0.5">{tx.account?.name}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-20 text-center">
                            <ArrowLeftRight className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                            <p className="text-xs font-black uppercase text-muted-foreground tracking-widest leading-none">No hay transacciones registradas</p>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}

