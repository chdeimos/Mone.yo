"use client";

import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp } from "lucide-react";

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
    const [reportData, setReportData] = useState<any[]>([]);

    // Filter States
    const [filterAccountId, setFilterAccountId] = useState("all");
    const [filterCategoryId, setFilterCategoryId] = useState("all");
    const [filterDateRange, setFilterDateRange] = useState("this_month");

    useEffect(() => {
        // Load initial data for filters
        const loadFilterData = async () => {
            try {
                const [accRes, catRes] = await Promise.all([
                    fetch("/api/accounts"),
                    fetch("/api/categories"),
                ]);
                setAccounts(await accRes.json());
                setCategories(await catRes.json());
            } catch (error) {
                console.error("Error loading filter data:", error);
            }
        };
        loadFilterData();
    }, []);

    useEffect(() => {
        // Load report data when filters change
        const loadReportData = async () => {
            setLoading(true);
            try {
                const { startDate, endDate } = getDateRange(filterDateRange);
                const params = new URLSearchParams();
                params.append("startDate", startDate);
                params.append("endDate", endDate);
                params.append("type", "GASTO"); // Reports are usually for expenses

                if (filterAccountId !== "all") {
                    params.append("accountId", filterAccountId);
                }
                if (filterCategoryId !== "all") {
                    params.append("categoryId", filterCategoryId);
                }

                const res = await fetch(`/api/transactions?${params.toString()}`);
                const transactions = await res.json();

                // Process data for chart (group by category)
                const dataByCategory = transactions.reduce((acc: any, tx: any) => {
                    const categoryName = tx.category?.name || "Sin Categoría";
                    if (!acc[categoryName]) {
                        acc[categoryName] = { name: categoryName, Gasto: 0, color: tx.category?.color || '#8884d8' };
                    }
                    acc[categoryName].Gasto += Math.abs(parseFloat(tx.amount));
                    return acc;
                }, {});

                setReportData(Object.values(dataByCategory));

            } catch (error) {
                console.error("Error loading report data:", error);
            } finally {
                setLoading(false);
            }
        };

        loadReportData();
    }, [filterAccountId, filterCategoryId, filterDateRange]);

    return (
        <div className="space-y-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-100">
                <div className="space-y-1">
                    <p className="text-indigo-500 font-black uppercase text-[10px] tracking-[0.3em]">Análisis Financiero</p>
                    <h1 className="text-4xl font-bold tracking-tighter italic uppercase text-slate-900">Reportes</h1>
                </div>
            </div>

            {/* Filter Bar */}
            <Card className="bg-white border-slate-100 rounded-2xl p-6 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Cuenta</Label>
                        <Select value={filterAccountId} onValueChange={setFilterAccountId}>
                            <SelectTrigger className="h-12 bg-slate-50 border-none rounded-xl font-bold">
                                <SelectValue placeholder="Todas" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-slate-100 rounded-xl">
                                <SelectItem value="all" className="font-bold">Todas las Cuentas</SelectItem>
                                {accounts.map(acc => (
                                    <SelectItem key={acc.id} value={acc.id} className="font-bold">{acc.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Categoría</Label>
                        <Select value={filterCategoryId} onValueChange={setFilterCategoryId}>
                            <SelectTrigger className="h-12 bg-slate-50 border-none rounded-xl font-bold">
                                <SelectValue placeholder="Todas" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-slate-100 rounded-xl">
                                <SelectItem value="all" className="font-bold">Todas las Categorías</SelectItem>
                                {categories.map(cat => (
                                    <SelectItem key={cat.id} value={cat.id} className="font-bold">{cat.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Período</Label>
                        <Select value={filterDateRange} onValueChange={setFilterDateRange}>
                            <SelectTrigger className="h-12 bg-slate-50 border-none rounded-xl font-bold">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-slate-100 rounded-xl">
                                <SelectItem value="this_month" className="font-bold">Este Mes</SelectItem>
                                <SelectItem value="last_month" className="font-bold">Último Mes</SelectItem>
                                <SelectItem value="last_6_months" className="font-bold">Últimos 6 Meses</SelectItem>
                                <SelectItem value="last_year" className="font-bold">Último Año</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </Card>

            {/* Chart Area */}
            <Card className="bg-white border-slate-100 rounded-2xl p-8 shadow-sm">
                <CardHeader className="p-0 mb-6">
                    <CardTitle className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-indigo-500" />
                        Resumen de Gastos por Categoría
                    </CardTitle>
                    <CardDescription>Visualización de gastos para el período seleccionado.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="h-[350px] flex items-center justify-center">
                            <div className="w-10 h-10 border-4 border-slate-100 border-t-indigo-500 rounded-full animate-spin" />
                        </div>
                    ) : reportData.length === 0 ? (
                        <div className="h-[350px] flex items-center justify-center text-slate-400 font-medium italic">
                            No hay datos de gastos para mostrar con los filtros actuales.
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={reportData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                <YAxis tickFormatter={(value) => formatCurrency(value)} tick={{ fontSize: 12 }} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(239, 246, 255, 0.5)' }}
                                    contentStyle={{
                                        borderRadius: '1rem',
                                        border: '1px solid #f1f5f9',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                                    }}
                                    formatter={(value: number) => [formatCurrency(value), "Gasto"]}
                                />
                                <Legend />
                                <Bar dataKey="Gasto" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>

        </div>
    );
}