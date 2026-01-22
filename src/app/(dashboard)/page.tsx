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
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip
} from "recharts";

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

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {newRecurringCount > 0 && (
                <div className="bg-[#E1E7FF] dark:bg-[#2F374F] border border-[#BAC8FF] dark:border-[#3D4D77] p-4 rounded-md flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-md">
                            <Repeat className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <p className="font-bold text-sm text-primary uppercase tracking-wide">Actualización Automática</p>
                            <p className="text-xs text-bodydark dark:text-bodydark1 font-medium italic">Se han generado {newRecurringCount} nuevos movimientos recurrentes hoy.</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setNewRecurringCount(0)}
                        className="text-primary hover:bg-primary/5"
                    >
                        Ocultar
                    </Button>
                </div>
            )}

            {/* Breadcrumbs Placeholder for TailAdmin Look */}
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold text-black dark:text-white">Dashboard</h1>
                <nav className="text-sm font-semibold text-slate-500 uppercase tracking-widest">
                    Mone.yo / <span className="text-primary">Estadísticas del Sistema</span>
                </nav>
            </div>

            {/* Data Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Patrimonio Total */}
                <Card className="bg-white dark:bg-boxdark border-none shadow-sm p-6 relative overflow-hidden group">
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="p-3 bg-[#3c50e0] rounded-lg text-white shadow-sm">
                            <Wallet className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-slate-400 font-black uppercase text-[11px] lg:text-[13px] tracking-widest mb-1">Patrimonio Total</p>
                            <h2 className="text-2xl font-black text-[#3c50e0] dark:text-white tracking-tight">
                                {formatCurrency(stats.totalBalance)}
                            </h2>
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-[#3c50e0] opacity-30 group-hover:opacity-100 transition-opacity" />
                </Card>

                {/* Ingresos Mes */}
                <Card className="bg-white dark:bg-boxdark border-none shadow-sm p-6 relative overflow-hidden group">
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="p-3 rounded-lg bg-emerald-500 text-white shadow-sm">
                            <ArrowDownLeft className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-slate-400 font-black uppercase text-[11px] lg:text-[13px] tracking-widest mb-1">Ingresos Mes</p>
                            <h2 className="text-2xl font-black tracking-tight text-emerald-500">
                                +{formatCurrency(stats.monthlyIncome)}
                            </h2>
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-500 opacity-30 group-hover:opacity-100 transition-opacity" />
                </Card>

                {/* Gastos Mes */}
                <Card className="bg-white dark:bg-boxdark border-none shadow-sm p-6 relative overflow-hidden group">
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="p-3 rounded-lg bg-rose-500 text-white shadow-sm">
                            <ArrowUpRight className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-slate-400 font-black uppercase text-[11px] lg:text-[13px] tracking-widest mb-1">Gastos Mes</p>
                            <h2 className="text-2xl font-black tracking-tight text-rose-500">
                                -{formatCurrency(stats.monthlyExpenses)}
                            </h2>
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-rose-500 opacity-30 group-hover:opacity-100 transition-opacity" />
                </Card>

                {/* Cuentas Activas */}
                <Card className="bg-white dark:bg-boxdark border-none shadow-sm p-6 relative overflow-hidden group">
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="p-3 bg-slate-800 dark:bg-meta-4 rounded-lg text-white shadow-sm">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-slate-400 font-black uppercase text-[11px] lg:text-[13px] tracking-widest mb-1">Cuentas Activas</p>
                            <h2 className="text-2xl font-black text-black dark:text-white tracking-tight">
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
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Saldos en tiempo real</p>
                    </div>

                    <div className="flex-1 relative min-h-[300px] flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.accounts?.map((acc: any) => ({
                                        ...acc,
                                        value: Number(acc.balance)
                                    }))}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={90}
                                    outerRadius={130}
                                    paddingAngle={5}
                                    dataKey="value"
                                    nameKey="name"
                                    animationBegin={200}
                                    animationDuration={1500}
                                >
                                    {(stats.accounts || []).map((entry: any, index: number) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.color || ["#3c50e0", "#80caee", "#10b981", "#f59e0b", "#ef4444"][index % 5]}
                                            stroke="none"
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    content={({ active, payload }: any) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-slate-900/95 dark:bg-black/95 backdrop-blur-sm p-3 rounded-md border border-white/10 shadow-2xl">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{payload[0].name}</p>
                                                    <p className="text-sm font-black text-white">{formatCurrency(payload[0].value)}</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>

                        {/* Center Text */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Patrimonio</span>
                            <span className="text-2xl font-black text-black dark:text-white tracking-tighter">
                                {formatCurrency(stats.accounts?.reduce((acc: number, curr: any) => acc + Number(curr.balance), 0))}
                            </span>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-center relative z-10">
                        <Link href="/accounts">
                            <Button variant="outline" className="h-10 px-6 border-stroke dark:border-strokedark text-[11px] lg:text-[12px] font-black uppercase tracking-widest rounded-md hover:bg-slate-50 dark:hover:bg-meta-4">
                                Detalles de Cuentas
                            </Button>
                        </Link>
                    </div>
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-[#3c50e0] opacity-20 group-hover:opacity-100 transition-opacity" />
                </Card>

                {/* Budget Card */}
                <Card className="bg-white dark:bg-boxdark border-none shadow-sm p-8 min-h-[500px] flex flex-col relative overflow-hidden group font-sans">
                    <div className="w-full mb-8 relative z-10 text-center lg:text-left">
                        <h3 className="text-xl font-black text-black dark:text-white uppercase tracking-tight">Presupuesto Mensual</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                            {formatMonthYear(new Date()).toUpperCase()}
                        </p>
                    </div>

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 items-center relative z-10">
                        {/* Donut Chart */}
                        <div className="h-[250px] relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: 'Gastado', value: stats.budgets?.reduce((acc: number, b: any) => acc + Number(b.current) || 0, 0) || 0 },
                                            { name: 'Restante', value: Math.max(0, stats.budgets?.reduce((acc: number, b: any) => acc + (Number(b.limit) - Number(b.current)) || 0, 0)) || 1 }
                                        ]}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={95}
                                        paddingAngle={5}
                                        dataKey="value"
                                        animationBegin={400}
                                        animationDuration={1500}
                                    >
                                        <Cell fill="#ef4444" stroke="none" />
                                        <Cell fill="#10b981" stroke="none" className="opacity-20" />
                                    </Pie>
                                    <Tooltip
                                        content={({ active, payload }: any) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="bg-slate-900/95 dark:bg-black/95 backdrop-blur-sm p-3 rounded-md border border-white/10 shadow-2xl">
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{payload[0].name}</p>
                                                        <p className="text-sm font-black text-white">{formatCurrency(payload[0].value)}</p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Gasto Total</span>
                                <span className="text-xl font-black text-black dark:text-white tracking-tighter">
                                    {stats.budgets?.length > 0 ? Math.round((stats.budgets?.reduce((acc: number, b: any) => acc + Number(b.current), 0) / (stats.budgets?.reduce((acc: number, b: any) => acc + Number(b.limit), 0) || 1)) * 100) : 0}%
                                </span>
                            </div>
                        </div>

                        {/* Insights Panel */}
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-slate-50 dark:bg-meta-4/10 border border-stroke dark:border-strokedark">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2 text-left">
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
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 text-left">Límite Total</p>
                                    <p className="text-[11px] font-black text-black dark:text-white text-left">
                                        {formatCurrency(stats.budgets?.reduce((acc: number, b: any) => acc + Number(b.limit), 0))}
                                    </p>
                                </div>
                                <div className="p-3 rounded-lg bg-slate-50 dark:bg-meta-4/10">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 text-left">Disponible</p>
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
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Histórico de balance consolidado</p>
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
                                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
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
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={historyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3c50e0" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#3c50e0" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fontWeight: 700, fill: '#64748B' }}
                                dy={10}
                                interval="preserveStartEnd"
                            />
                            <YAxis
                                hide={isMobile}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fontWeight: 700, fill: '#64748B' }}
                                tickFormatter={(val) => `€${val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val}`}
                            />
                            <Tooltip
                                content={({ active, payload }: any) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-slate-900/95 dark:bg-black/95 backdrop-blur-sm p-4 rounded-lg border border-white/10 shadow-2xl">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{payload[0].payload.date}</p>
                                                <p className="text-lg font-black text-white">{formatCurrency(payload[0].value)}</p>
                                                <div className="mt-2 pt-2 border-t border-white/5">
                                                    <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                                                        <TrendingUp className="w-3 h-3" /> Tendencia Activa
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#3c50e0"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorValue)"
                                animationDuration={1500}
                                animationBegin={300}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* Recent Transactions Section */}
            <Card className="bg-white dark:bg-boxdark border-none shadow-sm p-8 relative overflow-hidden group mb-12">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-xl font-black text-black dark:text-white uppercase tracking-tight leading-none mb-1.5">Últimos Movimientos</h3>
                        <p className="text-xs font-black uppercase text-slate-400 tracking-widest leading-none">Actividad reciente en tus cuentas</p>
                    </div>
                    <Link href="/transactions">
                        <Button variant="ghost" className="text-primary font-black uppercase tracking-widest text-[10px] gap-2 hover:bg-primary/5 h-9">
                            Ver Todo <ArrowRight className="w-3 h-3" />
                        </Button>
                    </Link>
                </div>

                <div className="space-y-4">
                    {stats.recentTransactions && stats.recentTransactions.length > 0 ? (
                        stats.recentTransactions.slice(0, 5).map((tx: any) => (
                            <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-meta-4/10 transition-colors group/row border border-transparent hover:border-stroke dark:hover:border-strokedark">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "w-10 h-10 rounded-lg flex items-center justify-center transition-all",
                                        tx.type === 'INGRESO' ? "bg-emerald-500/10 text-emerald-500" :
                                            tx.type === 'GASTO' ? "bg-rose-500/10 text-rose-500" :
                                                "bg-blue-500/10 text-blue-500"
                                    )}>
                                        {tx.type === 'INGRESO' ? <ArrowDownLeft className="w-5 h-5" /> :
                                            tx.type === 'GASTO' ? <ArrowUpRight className="w-5 h-5" /> :
                                                <ArrowLeftRight className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-black dark:text-white uppercase tracking-tight">{tx.description}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{formatDate(tx.date)}</span>
                                            <span className="text-slate-300 dark:text-slate-700 font-bold">•</span>
                                            <span className="text-[9px] font-black uppercase tracking-widest text-primary">{tx.category?.name || "Global"}</span>
                                            {tx.isVerified ? (
                                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                                            ) : (
                                                <AlertTriangle className="w-2.5 h-2.5 text-amber-500" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={cn(
                                        "text-base font-black tracking-tight",
                                        tx.type === 'INGRESO' ? "text-emerald-500" :
                                            tx.type === 'GASTO' ? "text-rose-500" :
                                                "text-primary"
                                    )}>
                                        {tx.type === 'INGRESO' ? '+' : tx.type === 'GASTO' ? '-' : ''}{formatCurrency(tx.amount)}
                                    </p>
                                    <p className="text-[10px] lg:text-[11px] font-black uppercase tracking-widest text-slate-400 mt-0.5">{tx.account?.name}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-20 text-center">
                            <ArrowLeftRight className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                            <p className="text-xs font-black uppercase text-slate-400 tracking-widest leading-none">No hay transacciones registradas</p>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}

