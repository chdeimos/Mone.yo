"use client";

import { useState, useEffect, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDate, formatShortDate, formatDayMonth, formatDateTime } from "@/lib/utils";
import { TrendingUp, PieChart as PieChartIcon, ArrowUp, ArrowDown, Target, FilterX, Calendar, ArrowUpRight, ArrowDownLeft, Wallet, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/Logo";

const CustomBudgetTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const gasto = payload.find((p: any) => p.dataKey === 'Gasto')?.value || 0;
        const presupuesto = payload.find((p: any) => p.dataKey === 'Presupuesto')?.value || 0;
        const percentage = presupuesto > 0 ? (gasto / presupuesto) * 100 : 0;

        return (
            <div className="p-4 bg-slate-900/95 dark:bg-black/95 backdrop-blur-sm rounded-md shadow-2xl border border-white/5 ring-1 ring-white/10 min-w-[180px]">
                <p className="font-black text-white text-[10px] uppercase tracking-widest mb-3 border-b border-white/10 pb-2">{label}</p>
                <div className="space-y-2">
                    <div className="flex justify-between items-center gap-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Gasto Real</span>
                        <span className="text-sm font-black text-white">{formatCurrency(gasto)}</span>
                    </div>
                    <div className="flex justify-between items-center gap-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Presupuesto</span>
                        <span className="text-sm font-bold text-slate-300">{formatCurrency(presupuesto)}</span>
                    </div>
                </div>
                {presupuesto > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                        <p className={`text-[10px] font-black uppercase tracking-widest ${percentage > 100 ? 'text-rose-500' : 'text-emerald-500'}`}>
                            {percentage > 100 ? `Excedido en un ${(percentage - 100).toFixed(0)}%` : `Cumplimiento: ${percentage.toFixed(0)}%`}
                        </p>
                    </div>
                )}
            </div>
        );
    }
    return null;
};


const CustomBudgetTick = ({ x, y, payload, data }: any) => {
    if (!payload || !payload.value) return null;
    const entry = data?.find((d: any) => d.name === payload.value);
    const isExceeded = entry && entry.Gasto > entry.Presupuesto;

    return (
        <g transform={`translate(${x},${y})`}>
            <text
                x={0}
                y={0}
                dy={16}
                textAnchor="middle"
                fill={isExceeded ? "#f43f5e" : "#94a3b8"}
                fontSize={9}
                fontWeight={isExceeded ? "900" : "700"}
                className="uppercase tracking-widest"
            >
                {payload.value}
            </text>
        </g>
    );
};


// Helper to get date ranges
const getDateRange = (rangeKey: string) => {
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    switch (rangeKey) {
        case 'this_month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            break;
        case 'last_month':
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            endDate = new Date(now.getFullYear(), now.getMonth(), 0);
            break;
        case 'last_6_months':
            startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            break;
        case 'last_year':
            startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth(), 0);
            break;
        default: // 'this_month'
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            break;
    }
    return { startDate: startDate.toISOString().split('T')[0], endDate: endDate.toISOString().split('T')[0] };
}


export default function ReportsPage() {
    const [loading, setLoading] = useState(true);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [transactionsList, setTransactionsList] = useState<any[]>([]);
    const [allBudgets, setAllBudgets] = useState<any[]>([]);
    const [isMobile, setIsMobile] = useState(false);

    // Filter States
    const [filterAccountId, setFilterAccountId] = useState("all");
    const [filterCategoryId, setFilterCategoryId] = useState("all");
    const [filterDateRange, setFilterDateRange] = useState("this_month");
    const [startDate, setStartDate] = useState(() => getDateRange("this_month").startDate);
    const [endDate, setEndDate] = useState(() => getDateRange("this_month").endDate);

    // Table state
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: string } | null>({ key: 'date', direction: 'descending' });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);
    const [selectedPieCategory, setSelectedPieCategory] = useState<string | null>(null);

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

        // Load initial data for filters and budgets
        const loadInitialData = async () => {
            try {
                const [accRes, catRes, budgetRes] = await Promise.all([
                    fetch("/api/accounts"),
                    fetch("/api/categories"),
                    fetch("/api/budgets")
                ]);

                if (accRes.ok) setAccounts(await accRes.json());
                if (catRes.ok) setCategories(await catRes.json());
                if (budgetRes.ok) setAllBudgets(await budgetRes.json());
            } catch (error) {
                console.error("Error loading filter data:", error);
            }
        };
        loadInitialData();
        return () => {
            window.removeEventListener('resize', checkMobile);
            clearTimeout(resizeTimer);
        };
    }, []);

    // Aggregated Data with useMemo for performance
    const evolutionData = useMemo(() => {
        const evolutionMap = new Map();
        if (!Array.isArray(transactionsList)) return [];

        transactionsList.forEach((tx: any) => {
            const dateObj = new Date(tx.date);
            const dateKey = formatDayMonth(dateObj);
            const isoKey = dateObj.toISOString().split('T')[0];

            if (!evolutionMap.has(isoKey)) {
                evolutionMap.set(isoKey, { date: isoKey, displayDate: dateKey, Ingresos: 0, Gastos: 0 });
            }
            const entry = evolutionMap.get(isoKey);
            const amount = Math.abs(parseFloat(tx.amount));
            if (tx.type === 'INGRESO') entry.Ingresos += amount;
            else if (tx.type === 'GASTO') entry.Gastos += amount;
        });
        return Array.from(evolutionMap.values()).sort((a: any, b: any) => a.date.localeCompare(b.date));
    }, [transactionsList]);

    const reportData = useMemo(() => {
        if (!Array.isArray(transactionsList) || !Array.isArray(allBudgets)) return [];
        if (!transactionsList.length && !allBudgets.length) return [];
        const start = new Date(startDate);
        const end = new Date(endDate);
        const budgetMap: Record<string, number> = {};

        if (Array.isArray(allBudgets)) {
            allBudgets.forEach((b: any) => {
                const bDate = new Date(b.year, b.month - 1, 1);
                if (bDate >= start && bDate <= end) {
                    const catName = b.category?.name;
                    if (catName) budgetMap[catName] = (budgetMap[catName] || 0) + parseFloat(b.limit);
                }
            });
        }

        if (!Array.isArray(transactionsList)) return [];

        const dataByCategory = transactionsList
            .filter((tx: any) => tx.type === 'GASTO')
            .reduce((acc: any, tx: any) => {
                const categoryName = tx.category?.name || "Sin Categoría";
                if (!acc[categoryName]) {
                    acc[categoryName] = { name: categoryName, Gasto: 0, Presupuesto: 0, color: tx.category?.color || '#8884d8' };
                }
                acc[categoryName].Gasto += Math.abs(parseFloat(tx.amount));
                return acc;
            }, {});

        Object.keys(budgetMap).forEach(catName => {
            if (!dataByCategory[catName]) {
                const cat = categories.find(c => c.name === catName);
                dataByCategory[catName] = { name: catName, Gasto: 0, Presupuesto: 0, color: cat?.color || '#94a3b8' };
            }
            dataByCategory[catName].Presupuesto = budgetMap[catName];
        });
        return Object.values(dataByCategory);
    }, [transactionsList, allBudgets, startDate, endDate, categories]);

    useEffect(() => {
        const abortController = new AbortController();
        const fetchData = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                params.append("startDate", startDate);
                params.append("endDate", endDate);
                if (filterAccountId !== "all") params.append("accountId", filterAccountId);
                if (filterCategoryId !== "all") params.append("categoryId", filterCategoryId);

                const res = await fetch(`/api/transactions?${params.toString()}`, { signal: abortController.signal });
                if (res.ok) {
                    const data = await res.json();
                    const txs = data.transactions || (Array.isArray(data) ? data : []);
                    setTransactionsList(txs);
                    setSelectedPieCategory(null);
                }
            } catch (error: any) {
                if (error.name !== 'AbortError') console.error("Error loading report data:", error);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(fetchData, 300); // Small debounce
        return () => {
            clearTimeout(timeoutId);
            abortController.abort();
        };
    }, [filterAccountId, filterCategoryId, startDate, endDate]);

    const handleRangeChange = (value: string) => {
        setFilterDateRange(value);
        if (value !== 'custom') {
            const range = getDateRange(value);
            setStartDate(range.startDate);
            setEndDate(range.endDate);
        }
    };

    const resetFilters = () => {
        setFilterAccountId("all");
        setFilterCategoryId("all");
        setFilterDateRange("this_month");
        const range = getDateRange("this_month");
        setStartDate(range.startDate);
        setEndDate(range.endDate);
    };

    const requestSort = (key: string) => {
        let direction = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
        setCurrentPage(1);
    };

    const filteredTransactionsList = useMemo(() => {
        if (!Array.isArray(transactionsList)) return [];
        if (!selectedPieCategory) return transactionsList;
        return transactionsList.filter(tx => {
            const catName = tx.category?.name || "Sin Categoría";
            return catName === selectedPieCategory;
        });
    }, [transactionsList, selectedPieCategory]);

    const sortedTransactions = useMemo(() => {
        let sortableItems = [...filteredTransactionsList];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                let aValue, bValue;

                switch (sortConfig.key) {
                    case 'category':
                        aValue = a.category?.name || '';
                        bValue = b.category?.name || '';
                        break;
                    case 'account':
                        aValue = a.account?.name || '';
                        bValue = b.account?.name || '';
                        break;
                    case 'amount':
                        aValue = Math.abs(parseFloat(a.amount));
                        bValue = Math.abs(parseFloat(b.amount));
                        break;
                    default:
                        aValue = a[sortConfig.key];
                        bValue = b[sortConfig.key];
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [filteredTransactionsList, sortConfig]);

    const paginatedTransactions = useMemo(() => {
        if (itemsPerPage === 0) { // "All" option
            return sortedTransactions;
        }
        const startIndex = (currentPage - 1) * itemsPerPage;
        return sortedTransactions.slice(startIndex, startIndex + itemsPerPage);
    }, [sortedTransactions, currentPage, itemsPerPage]);

    const totalPages = itemsPerPage > 0 ? Math.ceil(filteredTransactionsList.length / itemsPerPage) : 1;

    const budgetChartData = useMemo(() => {
        return reportData.filter((item: any) => item.Presupuesto > 0);
    }, [reportData]);

    const handlePrint = () => {
        setTimeout(() => {
            window.print();
        }, 100);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Print Only Header */}
            <div className="hidden print:flex flex-col items-center justify-center border-b-2 border-slate-900 pb-8 mb-10 w-full">
                <Logo className="mb-4" />
                <h1 className="text-3xl font-black uppercase tracking-tighter italic mb-2">Reporte de Actividad</h1>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-[0.3em]">
                    {formatDate(startDate)} — {formatDate(endDate)}
                </p>
                <div className="mt-4 flex gap-8">
                    <div className="text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Generado el</p>
                        <p className="text-xs font-bold">{formatDateTime(new Date())}</p>
                    </div>
                </div>
            </div>

            {/* Header / Breadcrumbs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold text-black dark:text-white uppercase tracking-tight">Reportes</h1>
                    <nav className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                        Mone.yo / <span className="text-primary">Análisis de Datos</span>
                    </nav>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        onClick={handlePrint}
                        variant="outline"
                        className="h-[44px] md:h-11 px-6 rounded-md gap-2 font-bold text-slate-600 dark:text-white border-stroke dark:border-strokedark hover:text-primary transition-all shadow-sm bg-white dark:bg-boxdark"
                    >
                        <Printer className="w-4 h-4" />
                        <span className="hidden sm:inline uppercase tracking-widest text-[10px]">Imprimir PDF</span>
                    </Button>
                </div>
            </div>

            {/* Filter Bar */}
            <Card className="bg-white dark:bg-boxdark border-none shadow-sm p-4 sm:p-8 no-print">
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Cuenta/Entidad</Label>
                            <Select value={filterAccountId} onValueChange={setFilterAccountId}>
                                <SelectTrigger className="h-[44px] md:h-11 bg-slate-50 dark:bg-meta-4 border-stroke dark:border-strokedark rounded-md font-bold text-xs">
                                    <SelectValue placeholder="Todas">
                                        {filterAccountId === "all" ? "Todas las Cuentas" : accounts.find(a => a.id === filterAccountId)?.name}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-boxdark border-stroke dark:border-strokedark rounded-md">
                                    <SelectItem value="all" className="font-bold">Todas las Cuentas</SelectItem>
                                    {accounts.map(acc => (
                                        <SelectItem key={acc.id} value={acc.id} className="font-bold">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: acc.color || '#3c50e0' }} />
                                                {acc.name}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Categoría</Label>
                            <Select value={filterCategoryId} onValueChange={setFilterCategoryId}>
                                <SelectTrigger className="h-[44px] md:h-11 bg-slate-50 dark:bg-meta-4 border-stroke dark:border-strokedark rounded-md font-bold text-xs">
                                    <SelectValue placeholder="Todas">
                                        {filterCategoryId === "all" ? "Todas las Categorías" : categories.find(c => c.id === filterCategoryId)?.name}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-boxdark border-stroke dark:border-strokedark rounded-md">
                                    <SelectItem value="all" className="font-bold">Todas las Categorías</SelectItem>
                                    {categories.map(cat => (
                                        <SelectItem key={cat.id} value={cat.id} className="font-bold">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                                                {cat.name}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Período Rápido</Label>
                            <Select value={filterDateRange} onValueChange={handleRangeChange}>
                                <SelectTrigger className="h-[44px] md:h-11 bg-slate-50 dark:bg-meta-4 border-stroke dark:border-strokedark rounded-md font-bold text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-boxdark border-stroke dark:border-strokedark rounded-md">
                                    <SelectItem value="this_month" className="font-bold">Este Mes</SelectItem>
                                    <SelectItem value="last_month" className="font-bold">Último Mes</SelectItem>
                                    <SelectItem value="last_6_months" className="font-bold">Últimos 6 Meses</SelectItem>
                                    <SelectItem value="last_year" className="font-bold">Último Año</SelectItem>
                                    <SelectItem value="custom" className="font-bold">Personalizado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2 lg:col-span-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Rango de Fechas</Label>
                            <div className="flex flex-col sm:flex-row items-center gap-2 md:gap-3">
                                <div className="w-full">
                                    <Input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => { setStartDate(e.target.value); setFilterDateRange('custom'); }}
                                        className="h-[44px] md:h-11 bg-slate-50 dark:bg-meta-4 border-stroke dark:border-strokedark rounded-md font-bold text-xs px-3 w-full"
                                    />
                                </div>
                                <div className="hidden sm:block text-slate-300 font-bold">/</div>
                                <div className="w-full">
                                    <Input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => { setEndDate(e.target.value); setFilterDateRange('custom'); }}
                                        className="h-[44px] md:h-11 bg-slate-50 dark:bg-meta-4 border-stroke dark:border-strokedark rounded-md font-bold text-xs px-3 w-full"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button
                            variant="ghost"
                            onClick={resetFilters}
                            className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-md gap-2 font-bold text-[10px] sm:text-xs uppercase tracking-widest h-[44px] md:h-9"
                        >
                            <FilterX className="w-4 h-4" /> Limpiar Filtros
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Evolution Chart */}
            <Card className="bg-white dark:bg-boxdark border-none shadow-sm p-6 sm:p-8">
                <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h3 className="text-lg font-bold text-black dark:text-white flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary" />
                            Evolución Monetaria
                        </h3>
                        <p className="text-xs text-slate-500 font-medium tracking-tight">Balance temporal de ingresos y gastos</p>
                    </div>
                </div>
                <div className="mt-4 pb-4">
                    <div className="h-[350px] w-full">
                        {loading ? (
                            <div className="h-full flex flex-col items-center justify-center space-y-4">
                                <div className="w-10 h-10 border-4 border-slate-100 border-t-primary rounded-full animate-spin" />
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Procesando Línea de Tiempo...</p>
                            </div>
                        ) : evolutionData.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-2">
                                <TrendingUp className="w-12 h-12 opacity-20" />
                                <p className="text-sm font-bold uppercase tracking-widest italic">Sin datos disponibles</p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%" debounce={100}>
                                <LineChart data={evolutionData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-strokedark" />
                                    <XAxis
                                        dataKey="displayDate"
                                        tick={{ fontSize: isMobile ? 8 : 10, fontWeight: 600, fill: '#94a3b8' }}
                                        axisLine={false}
                                        tickLine={false}
                                        tickMargin={isMobile ? 5 : 10}
                                        interval={isMobile ? "preserveStartEnd" : 0}
                                    />

                                    <YAxis
                                        width={isMobile ? 65 : 100}
                                        tickFormatter={(value) => `€${Math.abs(value) >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
                                        tick={{ fontSize: isMobile ? 8 : 10, fontWeight: 600, fill: '#94a3b8' }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#1c2434', color: '#fff', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: isMobile ? '8px' : '12px' }}
                                        itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                        labelStyle={{ color: '#94a3b8', marginBottom: '4px', fontSize: '10px', fontWeight: 'black', textTransform: 'uppercase' }}
                                        formatter={(value: number) => [formatCurrency(value)]}
                                    />
                                    <Legend
                                        verticalAlign="top"
                                        align="right"
                                        iconType="circle"
                                        wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                                    />
                                    <Line
                                        isAnimationActive={!isMobile}
                                        type="monotone"
                                        dataKey="Ingresos"
                                        stroke="#10b981"
                                        strokeWidth={3}
                                        dot={{ r: 0 }}
                                        activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2, fill: '#fff' }}
                                    />
                                    <Line
                                        isAnimationActive={!isMobile}
                                        type="monotone"
                                        dataKey="Gastos"
                                        stroke="#f43f5e"
                                        strokeWidth={3}
                                        dot={{ r: 0 }}
                                        activeDot={{ r: 6, stroke: '#f43f5e', strokeWidth: 2, fill: '#fff' }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </Card>

            {/* Distribution Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white dark:bg-boxdark border-none shadow-sm p-6 sm:p-8">
                    <div className="mb-6 flex flex-col gap-1">
                        <h3 className="text-lg font-bold text-black dark:text-white flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary rotate-90" />
                            Gasto por Categoría
                        </h3>
                        <p className="text-xs text-slate-500 font-medium tracking-tight">Desglose volumétrico de egresos</p>
                    </div>
                    <div className="mt-4 pb-4">
                        <div className="h-[350px] w-full">
                            {loading ? (
                                <div className="h-full flex items-center justify-center">
                                    <div className="w-8 h-8 border-4 border-slate-100 border-t-primary rounded-full animate-spin" />
                                </div>
                            ) : reportData.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-2">
                                    <TrendingUp className="w-12 h-12 opacity-20" />
                                    <p className="text-sm font-bold uppercase tracking-widest italic text-center">Sin gastos registrados</p>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%" debounce={100}>
                                    <BarChart data={reportData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-strokedark" />
                                        <XAxis
                                            dataKey="name"
                                            tick={{ fontSize: isMobile ? 8 : 10, fontWeight: 600, fill: '#94a3b8' }}
                                            axisLine={false}
                                            tickLine={false}
                                            tickMargin={isMobile ? 5 : 10}
                                            interval={isMobile ? "preserveStartEnd" : 0}
                                        />

                                        <YAxis
                                            width={isMobile ? 65 : 100}
                                            tickFormatter={(value) => `€${Math.abs(value) >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
                                            tick={{ fontSize: isMobile ? 8 : 10, fontWeight: 600, fill: '#94a3b8' }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip
                                            cursor={{ fill: '#f1f5f9', opacity: 0.1 }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#1c2434', color: '#fff', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: isMobile ? '8px' : '12px' }}
                                            itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                            labelStyle={{ color: '#94a3b8', marginBottom: '4px', fontSize: '10px', fontWeight: 'black', textTransform: 'uppercase' }}
                                            formatter={(value: number) => [formatCurrency(value), "Total"]}
                                        />
                                        <Bar
                                            isAnimationActive={!isMobile}
                                            dataKey="Gasto"
                                            radius={[4, 4, 0, 0]}
                                            onClick={(data) => {
                                                setSelectedPieCategory(prev => prev === data.name ? null : data.name);
                                                setCurrentPage(1);
                                            }}
                                            className="cursor-pointer"
                                        >
                                            {reportData.map((entry: any, index: number) => (
                                                <Cell
                                                    key={`cell-bar-${index}`}
                                                    fill={entry.color}
                                                    opacity={selectedPieCategory && selectedPieCategory !== entry.name ? 0.3 : 1}
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </Card>

                <Card className="bg-white dark:bg-boxdark border-none shadow-sm p-6 sm:p-8">
                    <div className="mb-6 flex flex-col gap-1">
                        <h3 className="text-lg font-bold text-black dark:text-white flex items-center gap-2">
                            <PieChartIcon className="w-5 h-5 text-primary" />
                            Distribución Relativa
                        </h3>
                        <p className="text-xs text-slate-500 font-medium tracking-tight">Porcentaje del capital por sector</p>
                    </div>
                    <div className="h-[350px] w-full mt-4">
                        {loading ? (
                            <div className="h-full flex items-center justify-center">
                                <div className="w-8 h-8 border-4 border-slate-100 border-t-primary rounded-full animate-spin" />
                            </div>
                        ) : reportData.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-2">
                                <PieChartIcon className="w-12 h-12 opacity-20" />
                                <p className="text-sm font-bold uppercase tracking-widest italic text-center">Sin datos de distribución</p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%" debounce={100}>
                                <PieChart>
                                    <Pie
                                        data={reportData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        innerRadius={80}
                                        outerRadius={120}
                                        paddingAngle={5}
                                        dataKey="Gasto"
                                        nameKey="name"
                                        label={({ name, percent }) => percent > 0.05 ? `${name}` : ''}
                                        onClick={(data) => {
                                            setSelectedPieCategory(prev => prev === data.name ? null : data.name);
                                            setCurrentPage(1);
                                        }}
                                        className="cursor-pointer"
                                    >
                                        {reportData.map((entry: any, index: number) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.color}
                                                opacity={selectedPieCategory && selectedPieCategory !== entry.name ? 0.3 : 1}
                                                stroke={selectedPieCategory === entry.name ? "rgba(255,255,255,0.8)" : "none"}
                                                strokeWidth={2}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#1c2434', color: '#fff', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                        itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                        formatter={(value: number, name: string) => [formatCurrency(value), name]}
                                    />
                                    <Legend
                                        verticalAlign="bottom"
                                        align="center"
                                        iconType="circle"
                                        wrapperStyle={{ paddingTop: '20px', fontSize: isMobile ? '8px' : '9px', fontWeight: 'bold', textTransform: 'uppercase' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </Card>
            </div>

            {/* Budget vs Spent Chart */}
            <Card className="bg-white dark:bg-boxdark border-none shadow-sm p-6 sm:p-8">
                <div className="mb-6 flex flex-col gap-1">
                    <h3 className="text-lg font-bold text-black dark:text-white flex items-center gap-2">
                        <Target className="w-5 h-5 text-primary" />
                        Control de Límites
                    </h3>
                    <p className="text-xs text-slate-500 font-medium tracking-tight">Comparativa de ejecución presupuestaria</p>
                </div>
                <div className="mt-4 pb-4">
                    <div className="h-[350px] w-full">
                        {loading ? (
                            <div className="h-full flex items-center justify-center">
                                <div className="w-8 h-8 border-4 border-slate-100 border-t-primary rounded-full animate-spin" />
                            </div>
                        ) : budgetChartData.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4 py-12 border-2 border-dashed border-slate-100 dark:border-strokedark rounded-md">
                                <Target className="w-12 h-12 opacity-10" />
                                <p className="text-xs font-black uppercase tracking-widest italic text-center max-w-[200px]">No se han configurado presupuestos para este lapso</p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%" debounce={100}>
                                <BarChart data={budgetChartData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }} barGap={-24}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-strokedark" />
                                    <XAxis
                                        dataKey="name"
                                        tick={<CustomBudgetTick data={budgetChartData} />}
                                        interval={isMobile ? "preserveStartEnd" : 0}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        width={isMobile ? 65 : 100}
                                        tickFormatter={(value) => `€${Math.abs(value) >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
                                        tick={{ fontSize: isMobile ? 8 : 10, fontWeight: 600, fill: '#94a3b8' }}
                                        axisLine={false}
                                        tickLine={false}
                                    />

                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        content={<CustomBudgetTooltip />}
                                    />
                                    <Legend
                                        verticalAlign="top"
                                        align="right"
                                        iconType="circle"
                                        wrapperStyle={{ paddingBottom: '24px', fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase' }}
                                    />
                                    <Bar
                                        isAnimationActive={!isMobile}
                                        dataKey="Presupuesto"
                                        fill="#E2E8F0"
                                        radius={[4, 4, 0, 0]}
                                        barSize={24}
                                        name="Límite Asignado"
                                        className="dark:fill-slate-800"
                                    />
                                    <Bar isAnimationActive={!isMobile} dataKey="Gasto" radius={[4, 4, 0, 0]} barSize={12} name="Gasto Ejecutado">
                                        {budgetChartData.map((entry: any, index: number) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.Gasto > entry.Presupuesto ? "#f43f5e" : "#3c50e0"}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </Card>

            {/* Transaction Details Table */}
            <Card className="bg-white dark:bg-boxdark border-none shadow-sm p-6 sm:p-8">
                <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h3 className="text-lg font-bold text-black dark:text-white">Auditoría de Movimientos</h3>
                        <p className="text-xs text-slate-500 font-medium tracking-tight">
                            {selectedPieCategory ? (
                                <span className="flex items-center gap-1.5">
                                    Filtrado por: <b className="text-primary uppercase tracking-wider">{selectedPieCategory}</b>
                                    <button onClick={() => setSelectedPieCategory(null)} className="text-[10px] text-rose-500 hover:underline ml-1">Quitar filtro</button>
                                </span>
                            ) : "Registro cronológico detallado"}
                        </p>
                    </div>
                </div>

                <div className="overflow-x-auto custom-scrollbar pb-4">
                    {/* Desktop Table (Only Render on Desktop) */}
                    {!isMobile && (
                        <table className="w-full text-sm text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-meta-4 border-y border-stroke dark:border-strokedark">
                                    <th className="px-6 py-4">
                                        <button onClick={() => requestSort('date')} className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                            Fecha {sortConfig?.key === 'date' && (sortConfig.direction === 'ascending' ? <ArrowUp className="w-3 h-3 text-primary" /> : <ArrowDown className="w-3 h-3 text-primary" />)}
                                        </button>
                                    </th>
                                    <th className="px-6 py-4">
                                        <button onClick={() => requestSort('description')} className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                            Concepto {sortConfig?.key === 'description' && (sortConfig.direction === 'ascending' ? <ArrowUp className="w-3 h-3 text-primary" /> : <ArrowDown className="w-3 h-3 text-primary" />)}
                                        </button>
                                    </th>
                                    <th className="px-6 py-4">
                                        <button onClick={() => requestSort('category')} className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                            Sector {sortConfig?.key === 'category' && (sortConfig.direction === 'ascending' ? <ArrowUp className="w-3 h-3 text-primary" /> : <ArrowDown className="w-3 h-3 text-primary" />)}
                                        </button>
                                    </th>
                                    <th className="px-6 py-4">
                                        <button onClick={() => requestSort('account')} className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                            Origen {sortConfig?.key === 'account' && (sortConfig.direction === 'ascending' ? <ArrowUp className="w-3 h-3 text-primary" /> : <ArrowDown className="w-3 h-3 text-primary" />)}
                                        </button>
                                    </th>
                                    <th className="px-6 py-4 text-right">
                                        <button onClick={() => requestSort('amount')} className="flex items-center gap-2 justify-end w-full text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                            Importe {sortConfig?.key === 'amount' && (sortConfig.direction === 'ascending' ? <ArrowUp className="w-3 h-3 text-primary" /> : <ArrowDown className="w-3 h-3 text-primary" />)}
                                        </button>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stroke dark:divide-strokedark">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-3">
                                                <div className="w-6 h-6 border-2 border-slate-100 border-t-primary rounded-full animate-spin" />
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sincronizando registros...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : paginatedTransactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center">
                                            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest italic">No se encontraron movimientos coincidentes</span>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedTransactions.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-meta-4/20 transition-colors">
                                            <td className="px-6 py-4 text-xs font-semibold text-slate-500 whitespace-nowrap uppercase">
                                                {formatDate(tx.date)}
                                            </td>
                                            <td className="px-6 py-4 font-bold text-black dark:text-white uppercase tracking-tight text-xs">
                                                {tx.description}
                                            </td>
                                            <td className="px-6 py-4">
                                                {tx.category ? (
                                                    <span className="inline-block px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-slate-100 dark:bg-meta-4 text-slate-600 dark:text-slate-300">
                                                        {tx.category.name}
                                                    </span>
                                                ) : <span className="text-slate-200">--</span>}
                                            </td>
                                            <td className="px-6 py-4 text-xs font-bold text-slate-400 uppercase italic">
                                                {tx.account?.name}
                                            </td>
                                            <td className={`px-6 py-4 text-right font-black tracking-tight ${tx.type === 'GASTO' ? 'text-rose-500' : tx.type === 'INGRESO' ? 'text-emerald-500' : 'text-primary'}`}>
                                                {tx.type === 'GASTO' ? '-' : tx.type === 'INGRESO' ? '+' : ''}
                                                {formatCurrency(Math.abs(tx.amount))}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}

                    {/* Mobile Card List (Only Render on Mobile) */}
                    {isMobile && (
                        <div className="space-y-4 px-2 py-4">
                            {loading ? (
                                <div className="py-12 flex flex-col items-center justify-center space-y-3">
                                    <div className="w-6 h-6 border-2 border-slate-100 border-t-primary rounded-full animate-spin" />
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cargando movimientos...</span>
                                </div>
                            ) : paginatedTransactions.length === 0 ? (
                                <div className="py-12 flex flex-col items-center justify-center text-center">
                                    <FilterX className="w-10 h-10 text-slate-200 mb-3" />
                                    <span className="text-xs font-bold text-slate-300 uppercase tracking-widest italic">Sin resultados</span>
                                </div>
                            ) : (
                                paginatedTransactions.map((tx) => (
                                    <div key={tx.id} className="bg-slate-50/50 dark:bg-meta-4/10 rounded-xl p-4 border border-stroke dark:border-strokedark relative overflow-hidden group">
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 shadow-sm",
                                                tx.type === 'GASTO' ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-500"
                                            )}>
                                                {tx.type === 'GASTO' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start gap-2 mb-1">
                                                    <h4 className="font-bold text-black dark:text-white uppercase tracking-tight text-xs truncate">
                                                        {tx.description}
                                                    </h4>
                                                    <span className={cn(
                                                        "font-black tracking-tighter text-sm shrink-0",
                                                        tx.type === 'GASTO' ? "text-rose-500" : "text-emerald-500"
                                                    )}>
                                                        {tx.type === 'GASTO' ? '-' : '+'}{formatCurrency(Math.abs(tx.amount))}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                        <Calendar className="w-3 h-3" />
                                                        {formatShortDate(tx.date)}
                                                    </div>
                                                    {tx.category && (
                                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tx.category.color }} />
                                                            {tx.category.name}
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
                                                        <Wallet className="w-3 h-3 opacity-60" />
                                                        {tx.account?.name}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={cn(
                                            "absolute left-0 top-0 bottom-0 w-1 opacity-20",
                                            tx.type === 'GASTO' ? "bg-rose-500" : "bg-emerald-500"
                                        )} />
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 mt-6 border-t border-stroke dark:border-strokedark">
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Filas:</span>
                        <Select value={itemsPerPage.toString()} onValueChange={(value) => { setItemsPerPage(Number(value)); setCurrentPage(1); }}>
                            <SelectTrigger className="h-9 w-20 bg-slate-50 dark:bg-meta-4 border-stroke dark:border-strokedark rounded-md font-bold text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-boxdark border-stroke dark:border-strokedark">
                                <SelectItem value="25" className="font-bold">25</SelectItem>
                                <SelectItem value="50" className="font-bold">50</SelectItem>
                                <SelectItem value="100" className="font-bold">100</SelectItem>
                                <SelectItem value="0" className="font-bold">Todo</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-6">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                            {currentPage} / {totalPages}
                        </span>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                className="h-9 px-4 border-stroke dark:border-strokedark hover:bg-slate-50 dark:hover:bg-meta-4 text-[10px] font-black uppercase tracking-widest rounded-md"
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                            >
                                Anterior
                            </Button>
                            <Button
                                variant="outline"
                                className="h-9 px-4 border-stroke dark:border-strokedark hover:bg-slate-50 dark:hover:bg-meta-4 text-[10px] font-black uppercase tracking-widest rounded-md"
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages || totalPages === 0}
                            >
                                Siguiente
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}
