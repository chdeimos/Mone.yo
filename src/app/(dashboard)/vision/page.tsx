"use client";

import { useState, useEffect } from "react";
import { Plus, ScanLine, Wallet, PieChart, ArrowUpRight, ArrowDownLeft, ArrowLeftRight, Calendar, Sparkles, Download, Layers, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { VisionUploader } from "@/components/VisionUploader";
import { VisionResultModal } from "@/components/VisionResultModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

export default function VisionPage() {
    const [stats, setStats] = useState({ budget: 0, spent: 0, available: 0 });
    const [recentTx, setRecentTx] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [budgetChartData, setBudgetChartData] = useState<any[]>([]);

    // Vision State
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<any>(null);
    const [showValidation, setShowValidation] = useState(false);
    const [viewingTx, setViewingTx] = useState<any>(null);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            // Load transactions for list and stats
            // Fetching all transactions for the current month to calculate accurate stats
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

            const [txRes, budgetRes, recentRes] = await Promise.all([
                fetch(`/api/transactions?startDate=${startOfMonth}&endDate=${endOfMonth}`),
                fetch("/api/budgets"),
                fetch("/api/transactions?sortBy=createdAt&sortOrder=desc&limit=5")
            ]);

            if (txRes.ok && budgetRes.ok) {
                const rawTxData = await txRes.json();
                const txData = rawTxData.transactions || (Array.isArray(rawTxData) ? rawTxData : []);
                const budgetData = await budgetRes.json();

                // Handle Recent Scans independently
                if (recentRes.ok) {
                    const rawRecent = await recentRes.json();
                    const recentData = rawRecent.transactions || (Array.isArray(rawRecent) ? rawRecent : []);
                    setRecentTx(recentData);
                } else {
                    // Fallback to monthly data slice if distinct fetch fails
                    setRecentTx(txData.slice(0, 5));
                }

                // (Legacy slice removed, using distinct fetch)

                if (Array.isArray(budgetData) && Array.isArray(txData)) {
                    // Filter budgets for current month
                    const currentMonth = now.getMonth() + 1;
                    const currentYear = now.getFullYear();
                    const currentBudgets = budgetData.filter((b: any) => b.month === currentMonth && b.year === currentYear);

                    // Calculate Stats (Current Month)
                    const totalBudget = currentBudgets.reduce((acc: any, b: any) => acc + parseFloat(b.limit), 0);

                    // Calculate spent this month from transactions
                    const spent = txData
                        .filter((t: any) => t.type === 'GASTO')
                        .reduce((acc: any, t: any) => acc + Math.abs(parseFloat(t.amount)), 0);

                    setStats({
                        budget: totalBudget,
                        spent: spent,
                        available: totalBudget - spent
                    });

                    // Prepare Chart Data
                    const spendByCategory: Record<string, number> = {};
                    txData.forEach((tx: any) => {
                        if (tx.type === 'GASTO' && tx.category) {
                            spendByCategory[tx.category.name] = (spendByCategory[tx.category.name] || 0) + Math.abs(parseFloat(tx.amount));
                        }
                    });

                    const chartData = currentBudgets.map((b: any) => {
                        const catName = b.category.name;
                        const limit = parseFloat(b.limit);
                        const categorySpent = spendByCategory[catName] || 0;
                        return {
                            name: catName,
                            budget: limit,
                            spent: categorySpent,
                            isExceeded: categorySpent > limit
                        };
                    });

                    // Sort by spent descending
                    chartData.sort((a: any, b: any) => b.spent - a.spent);
                    setBudgetChartData(chartData);
                }
            }
        } catch (error) {
            console.error("Error loading dashboard", error);
        } finally {
            setLoading(false);
        }
    };

    const handleImagesSelected = async (files: File[]) => {
        setSelectedImages(files);
        setIsAnalyzing(true);

        try {
            const formData = new FormData();
            files.forEach(file => {
                formData.append("image", file);
            });

            const res = await fetch("/api/vision/analyze", {
                method: "POST",
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                setAnalysisResult(data);
                setShowValidation(true);
            } else {
                alert("Error analizando el documento. Inténtalo de nuevo.");
            }
        } catch (error) {
            console.error("Analysis error", error);
            alert("Error de conexión con la IA.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleManualEntry = () => {
        setAnalysisResult({
            amount: "",
            date: new Date().toISOString().split('T')[0],
            description: "",
            categoryName: "",
            accountName: ""
        });
        setSelectedImages([]);
        setShowValidation(true);
    };

    const handleSaveTransaction = async (data: any) => {
        // Use images from analysis result which are already uploaded
        const imageUrls = analysisResult?.imageUrls || (analysisResult?.imageUrl ? [analysisResult.imageUrl] : []);

        // Save Transaction
        const payload = {
            ...data,
            type: "GASTO", // Vision mostly for receipts = Expense
            imageUrls,
            // Fallback for legacy support if needed
            attachmentPath: imageUrls[0] || null
        };

        const saveRes = await fetch("/api/transactions", {
            method: "POST",
            body: JSON.stringify(payload)
        });

        if (saveRes.ok) {
            loadDashboardData();
            setSelectedImages([]);
            setAnalysisResult(null);
        } else {
            alert("Error guardando la transacción.");
        }
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Header / Breadcrumbs */}
            <div className="flex flex-col gap-1 mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-[#3c50e0]/10 rounded-lg text-[#3c50e0]">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <h1 className="text-2xl font-bold text-black dark:text-white uppercase tracking-tight">IA Vision & Scanner</h1>
                </div>
                <nav className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                    Mone.yo / <span className="text-[#3c50e0]">Digitalización Inteligente</span>
                </nav>
            </div>

            {/* Actions Area */}
            <div className={`transition-all duration-300 ${isAnalyzing ? 'opacity-50 pointer-events-none' : ''}`}>
                <VisionUploader onImagesSelected={handleImagesSelected} onManualEntry={handleManualEntry} />
            </div>

            {isAnalyzing && (
                <div className="fixed inset-0 bg-white/80 dark:bg-boxdark/80 backdrop-blur-sm z-[999] flex flex-col items-center justify-center">
                    <div className="w-12 h-12 border-4 border-slate-100 dark:border-strokedark border-t-[#3c50e0] rounded-full animate-spin mb-6" />
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[#3c50e0] animate-pulse">Analizando con Gemini AI</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">Extrayendo datos y categorizando...</p>
                </div>
            )}

            {/* Stats Cards */}
            {/* Global Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-white dark:bg-boxdark border-none shadow-sm p-6 relative overflow-hidden group">
                    <div className="flex items-start justify-between relative z-10">
                        <div>
                            <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest mb-2">Presupuesto</p>
                            <h2 className="text-2xl font-black text-[#3c50e0] tracking-tight">{formatCurrency(stats.budget)}</h2>
                        </div>
                        <div className="p-3 bg-[#3c50e0]/10 rounded-lg text-[#3c50e0]">
                            <PieChart className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-[#3c50e0] opacity-20 group-hover:opacity-100 transition-opacity" />
                </Card>

                <Card className="bg-white dark:bg-boxdark border-none shadow-sm p-6 relative overflow-hidden group">
                    <div className="flex items-start justify-between relative z-10">
                        <div>
                            <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest mb-2">Gastado</p>
                            <h2 className="text-2xl font-black text-rose-500 tracking-tight">{formatCurrency(stats.spent)}</h2>
                        </div>
                        <div className="p-3 bg-rose-500/10 rounded-lg text-rose-500">
                            <ArrowUpRight className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-rose-500 opacity-20 group-hover:opacity-100 transition-opacity" />
                </Card>

                <Card className="bg-white dark:bg-boxdark border-none shadow-sm p-6 relative overflow-hidden group">
                    <div className="flex items-start justify-between relative z-10">
                        <div>
                            <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest mb-2">Disponible</p>
                            <h2 className="text-2xl font-black text-emerald-500 tracking-tight">{formatCurrency(stats.available)}</h2>
                        </div>
                        <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-500">
                            <ArrowDownLeft className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-500 opacity-20 group-hover:opacity-100 transition-opacity" />
                </Card>
            </div>

            {/* Budget Chart */}
            {budgetChartData.length > 0 && (
                <Card className="p-6 bg-white dark:bg-boxdark border-none shadow-sm rounded-md">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-black uppercase text-black dark:text-white tracking-widest">Análisis de Presupuestos</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Gasto actual vs Objetivos por categoría</p>
                        </div>
                    </div>
                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={budgetChartData}
                                layout="vertical"
                                margin={{ top: 10, right: 30, left: 40, bottom: 0 }}
                                barGap={-20}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                                <XAxis
                                    type="number"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                                    tickFormatter={(value) => `${value}€`}
                                />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={({ x, y, payload }) => {
                                        const data = budgetChartData.find(d => d.name === payload.value);
                                        const isExceeded = data?.isExceeded;
                                        return (
                                            <g transform={`translate(${x},${y})`}>
                                                <text
                                                    x={-10}
                                                    y={0}
                                                    dy={4}
                                                    textAnchor="end"
                                                    fill={isExceeded ? "hsl(var(--destructive))" : "hsl(var(--muted-foreground))"}
                                                    fontSize={10}
                                                    fontWeight={isExceeded ? "700" : "500"}
                                                    className="uppercase font-black tracking-tighter"
                                                >
                                                    {payload.value}
                                                </text>
                                            </g>
                                        );
                                    }}
                                />
                                <Tooltip
                                    cursor={{ fill: 'hsl(var(--secondary))', opacity: 0.1 }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div className="bg-white dark:bg-boxdark p-4 rounded-md shadow-xl border border-stroke dark:border-strokedark text-xs min-w-[180px]">
                                                    <p className="font-black mb-2 text-black dark:text-white uppercase tracking-widest border-b border-stroke dark:border-strokedark pb-2">{data.name}</p>
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-slate-400 font-bold uppercase text-[9px]">Presupuesto</span>
                                                            <span className="font-bold text-black dark:text-white">{formatCurrency(data.budget)}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-slate-400 font-bold uppercase text-[9px]">Gasto Real</span>
                                                            <span className={cn("font-black", data.isExceeded ? "text-rose-500" : "text-emerald-500")}>
                                                                {formatCurrency(data.spent)}
                                                            </span>
                                                        </div>
                                                        {data.isExceeded && (
                                                            <div className="pt-1 text-[9px] font-black text-rose-500 uppercase tracking-tighter text-center">
                                                                ¡Presupuesto Excedido!
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.05em', paddingTop: '20px' }} />
                                <Bar
                                    dataKey="budget"
                                    name="Presupuesto"
                                    fill="hsl(var(--secondary))"
                                    radius={[0, 4, 4, 0]}
                                    barSize={20}
                                />
                                <Bar dataKey="spent" name="Gasto Real" radius={[0, 4, 4, 0]} barSize={8}>
                                    {budgetChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.isExceeded ? "hsl(var(--destructive))" : "#10b981"} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            )}

            {/* Recent Transactions */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                    <h2 className="text-sm font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                        <ScanLine className="w-4 h-4" />
                        Últimas Capturas Inteligentes
                    </h2>
                    <div className="h-px bg-slate-200 dark:bg-strokedark flex-1" />
                </div>

                {recentTx.length === 0 ? (
                    <Card className="bg-slate-50 dark:bg-meta-4 border-none rounded-md p-16 text-center shadow-none">
                        <ScanLine className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-400 font-bold italic uppercase text-sm tracking-widest">No hay registros recientes</p>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {recentTx.map((tx) => (
                            <Card key={tx.id} className="bg-white dark:bg-boxdark border-none shadow-sm p-4 md:p-5 hover:shadow-md transition-all group flex items-center gap-3 md:gap-6 relative overflow-hidden">
                                <div className={cn(
                                    "w-12 h-12 rounded-md flex items-center justify-center transition-transform group-hover:scale-110 shadow-inner",
                                    tx.type === 'GASTO' ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-500"
                                )}>
                                    {tx.imageUrls && tx.imageUrls.length > 1 ? <Layers className="w-5 h-5" /> : (tx.type === 'GASTO' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-black dark:text-white uppercase tracking-tight leading-tight mb-2 truncate">{tx.description}</h4>
                                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 shrink-0">
                                            <Calendar className="w-3 h-3" /> {formatDate(tx.date)}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-3">
                                            {tx.category && (
                                                <span className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter shrink-0" style={{ backgroundColor: tx.category.color + '15', color: tx.category.color }}>
                                                    {tx.category.name}
                                                </span>
                                            )}
                                            {(tx.images?.length > 0 || tx.imageUrls?.length > 0 || tx.attachmentPath) && (
                                                <button
                                                    onClick={() => setViewingTx(tx)}
                                                    className="p-1 rounded-md bg-primary/5 text-[#3c50e0] hover:bg-primary/10 transition-colors shrink-0"
                                                    title="Ver Documento"
                                                >
                                                    <Paperclip className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right pr-2">
                                    <p className={cn(
                                        "text-xl font-black tracking-tighter",
                                        tx.type === 'GASTO' ? "text-rose-500" : "text-emerald-500"
                                    )}>
                                        {tx.type === 'GASTO' ? '-' : '+'}{formatCurrency(Math.abs(tx.amount))}
                                    </p>
                                </div>
                                <div className={cn(
                                    "absolute left-0 top-0 bottom-0 w-1 opacity-20",
                                    tx.type === 'GASTO' ? "bg-rose-500" : "bg-emerald-500"
                                )} />
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <VisionResultModal
                isOpen={showValidation}
                onClose={() => setShowValidation(false)}
                imageFiles={selectedImages}
                analysisData={analysisResult}
                onSave={handleSaveTransaction}
            />

            <Dialog open={!!viewingTx} onOpenChange={() => setViewingTx(null)}>
                <DialogContent className="sm:max-w-3xl bg-white rounded-3xl border-none shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader className="p-6 pb-2">
                        <DialogTitle className="text-xl font-bold text-slate-900">
                            Documentos Adjuntos
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto p-6 pt-0 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {(viewingTx?.images?.length > 0 || viewingTx?.imageUrls?.length > 0) ? (
                            (viewingTx.images?.map((img: any) => img.url) || viewingTx.imageUrls).map((url: string, index: number) => (
                                <div key={index} className="rounded-xl overflow-hidden border border-slate-100 shadow-sm group relative">
                                    {url.toLowerCase().endsWith('.pdf') ? (
                                        <object data={url} type="application/pdf" className="w-full h-96 bg-slate-50" aria-label={`Visor de PDF para el documento ${index + 1}`} />
                                    ) : (
                                        <img src={url} alt={`Documento ${index + 1}`} className="w-full h-auto object-contain bg-slate-50" />
                                    )}
                                    <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-sm">
                                        {index + 1} / {(viewingTx.images || viewingTx.imageUrls).length}
                                    </div>
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <a href={url} download target="_blank" rel="noopener noreferrer">
                                            <Button size="icon" variant="ghost" className="bg-white/50 hover:bg-white rounded-full h-9 w-9">
                                                <Download className="w-4 h-4 text-slate-700" />
                                            </Button>
                                        </a>
                                    </div>
                                </div>
                            ))
                        ) : viewingTx?.attachmentPath && (
                            <div className="rounded-xl overflow-hidden border border-slate-100 shadow-sm group relative">
                                <img src={viewingTx.attachmentPath} alt="Documento" className="w-full h-auto object-contain bg-slate-50" />
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <a href={viewingTx.attachmentPath} download target="_blank" rel="noopener noreferrer">
                                        <Button size="icon" variant="ghost" className="bg-white/50 hover:bg-white rounded-full h-9 w-9">
                                            <Download className="w-4 h-4 text-slate-700" />
                                        </Button>
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
