"use client";

import { useState, useEffect, useRef, useMemo, useCallback, memo } from "react";
import * as XLSX from "xlsx";
import {
    Plus,
    Search,
    Filter,
    ArrowUpRight,
    ArrowDownLeft,
    ArrowLeftRight,
    ArrowRight,
    Calendar,
    Wallet,
    Tags,
    ChevronRight,
    MoreVertical,
    Trash2,
    Settings,
    Pencil,
    CheckCircle2,
    Circle,
    Repeat,
    PauseCircle,
    Paperclip,
    Download,
    Printer,
    FileSpreadsheet,
    Upload,
    ChevronUp,
    ChevronDown,
    ChevronLeft,
    ChevronsLeft,
    ChevronsRight,
    AlertCircle,
    AlertTriangle,
    Check,
    X,
    Loader2,
    FileUp,
    CheckCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [totalTransactions, setTotalTransactions] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState("25");
    const [totalPages, setTotalPages] = useState(1);
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'date', direction: 'desc' });
    const [accounts, setAccounts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [frequencies, setFrequencies] = useState<any[]>([]);
    const [summaryStats, setSummaryStats] = useState({ income: 0, expenses: 0, transfers: 0 });
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

    // Debounce search query
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 300);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    // Advanced Filter States
    const [showFilters, setShowFilters] = useState(false);
    const [filterCategoryId, setFilterCategoryId] = useState("all");
    const [filterAccountId, setFilterAccountId] = useState("all");
    const [filterType, setFilterType] = useState("all");
    const [filterIsVerified, setFilterIsVerified] = useState("all");
    const [filterMinAmount, setFilterMinAmount] = useState("");
    const [filterMaxAmount, setFilterMaxAmount] = useState("");
    const [filterStartDate, setFilterStartDate] = useState("");
    const [filterEndDate, setFilterEndDate] = useState("");

    // Modal & Form States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTx, setEditingTx] = useState<any>(null);
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [type, setType] = useState("GASTO");
    const [accountId, setAccountId] = useState("");
    const [destinationAccountId, setDestinationAccountId] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [isRecurring, setIsRecurring] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [recurrencePeriod, setRecurrencePeriod] = useState("MENSUAL");
    const [recurrenceInterval, setRecurrenceInterval] = useState(1);
    const [frequencyId, setFrequencyId] = useState("");
    const [viewingTx, setViewingTx] = useState<any>(null);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [refreshCount, setRefreshCount] = useState(0);

    const refreshData = useCallback(() => setRefreshCount(prev => prev + 1), []);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Bulk Actions state
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
    const [bulkCategoryId, setBulkCategoryId] = useState("no_change");
    const [bulkType, setBulkType] = useState("no_change");
    const [bulkDestinationAccountId, setBulkDestinationAccountId] = useState("no_change");
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [isBulkUpdating, setIsBulkUpdating] = useState(false);

    // Optimized selection set for O(1) lookups during render
    const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

    const toggleSelect = useCallback((id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    }, []);

    const toggleSelectAll = useCallback(() => {
        setSelectedIds(prev => {
            if (prev.length === transactions.length) {
                return [];
            } else {
                // Optimization: direct array map is fine, but avoid repeated re-renders
                return transactions.map(tx => tx.id);
            }
        });
    }, [transactions.length]); // Only depend on length if ids don't change often

    const handleBulkDelete = useCallback(async () => {
        if (!confirm(`¿Estás seguro de que deseas eliminar ${selectedIds.length} movimientos?`)) return;

        setIsBulkDeleting(true);
        try {
            const res = await fetch("/api/transactions/bulk-delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: selectedIds })
            });

            if (res.ok) {
                // Optimistic UI: remove from local state
                setTransactions(prev => prev.filter(tx => !selectedIds.includes(tx.id)));
                setSelectedIds([]);
                loadData(true); // Background reload to sync with server/summary
            } else {
                throw new Error("Error deleting transactions");
            }
        } catch (error) {
            console.error("Error bulk deleting:", error);
            alert("Error al eliminar los movimientos");
        } finally {
            setIsBulkDeleting(false);
        }
    }, [selectedIds, refreshData]);

    const handleBulkUpdate = useCallback(async () => {
        if (bulkCategoryId === "no_change" && bulkType === "no_change" && bulkDestinationAccountId === "no_change") {
            alert("No has seleccionado ningún cambio para aplicar");
            return;
        }

        setIsBulkUpdating(true);
        try {
            const res = await fetch("/api/transactions/bulk-update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ids: selectedIds,
                    categoryId: bulkCategoryId === "no_change" ? undefined : bulkCategoryId,
                    type: bulkType === "no_change" ? undefined : bulkType,
                    destinationAccountId: bulkDestinationAccountId === "no_change" ? undefined : bulkDestinationAccountId
                })
            });

            if (res.ok) {
                // Background reload to sync
                setSelectedIds([]);
                setIsBulkEditModalOpen(false);
                loadData(true);
            } else {
                const errorData = await res.json();
                throw new Error(errorData.error || "Error updating transactions");
            }
        } catch (error: any) {
            console.error("Error bulk updating:", error);
            alert("Error al actualizar los movimientos: " + error.message);
        } finally {
            setIsBulkUpdating(false);
        }
    }, [selectedIds, bulkCategoryId, bulkType, bulkDestinationAccountId, refreshData]);

    useEffect(() => {
        setCurrentPage(1); // Reset page on filter change
    }, [debouncedSearchQuery, filterCategoryId, filterAccountId, filterType, filterIsVerified, filterMinAmount, filterMaxAmount, filterStartDate, filterEndDate, pageSize]);

    useEffect(() => {
        loadData();
    }, [debouncedSearchQuery, filterCategoryId, filterAccountId, filterType, filterIsVerified, filterMinAmount, filterMaxAmount, filterStartDate, filterEndDate, currentPage, pageSize, refreshCount]);

    // Load static metadata only once
    useEffect(() => {
        const loadMetadata = async () => {
            try {
                const [accRes, catRes, freqRes] = await Promise.all([
                    fetch("/api/accounts"),
                    fetch("/api/categories"),
                    fetch("/api/frequencies")
                ]);
                const [accData, catData, freqData] = await Promise.all([
                    accRes.json(),
                    catRes.json(),
                    freqRes.json()
                ]);
                setAccounts(accData);
                setCategories(catData);
                setFrequencies(Array.isArray(freqData) ? freqData : []);
            } catch (err) {
                console.error("Error loading metadata:", err);
            }
        };
        loadMetadata();
    }, []);

    const loadData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        else setIsRefreshing(true);

        try {
            const params = new URLSearchParams();
            if (debouncedSearchQuery) params.append("query", debouncedSearchQuery);
            if (filterCategoryId !== "all") params.append("categoryId", filterCategoryId);
            if (filterAccountId !== "all") params.append("accountId", filterAccountId);
            if (filterType !== "all") params.append("type", filterType);
            if (filterIsVerified === "verified") params.append("isVerified", "true");
            if (filterIsVerified === "unverified") params.append("isVerified", "false");
            if (filterMinAmount) params.append("minAmount", filterMinAmount);
            if (filterMaxAmount) params.append("maxAmount", filterMaxAmount);
            if (filterStartDate) params.append("startDate", filterStartDate);
            if (filterEndDate) params.append("endDate", filterEndDate);

            // Pagination
            if (pageSize !== "all") {
                params.append("limit", pageSize);
                params.append("page", currentPage.toString());
            }

            const txRes = await fetch(`/api/transactions?${params.toString()}`);
            const txData = await txRes.json();

            if (txData.transactions) {
                setTransactions(txData.transactions);
                setTotalTransactions(txData.totalCount);
                setTotalPages(txData.totalPages);
                if (txData.summary) setSummaryStats(txData.summary);
            } else {
                // Fallback for array response if any
                setTransactions(Array.isArray(txData) ? txData : []);
                setTotalTransactions(Array.isArray(txData) ? txData.length : 0);
                setTotalPages(1);
            }
        } catch (error) {
            console.error("Error loading movements:", error);
        } finally {
            if (!silent) setLoading(false);
            else setIsRefreshing(false);
        }
    }, [debouncedSearchQuery, filterCategoryId, filterAccountId, filterType, filterIsVerified, filterMinAmount, filterMaxAmount, filterStartDate, filterEndDate, currentPage, pageSize]);

    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const stats = summaryStats;
    const netAmount = stats.income - stats.expenses;

    const sortedTransactions = useMemo(() => {
        return [...transactions].sort((a, b) => {
            if (!sortConfig) return 0;
            const { key, direction } = sortConfig;

            let aValue: any = a[key as keyof typeof a];
            let bValue: any = b[key as keyof typeof b];

            if (key === 'amount') {
                aValue = parseFloat(a.amount);
                bValue = parseFloat(b.amount);
            }

            if (aValue < bValue) return direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [transactions, sortConfig]);



    const handleSave = async () => {
        const payload = {
            amount: parseFloat(amount),
            description,
            type,
            accountId,
            destinationAccountId: type === "TRASPASO" ? destinationAccountId : null,
            originAccountId: accountId, // Origen siempre es la cuenta principal seleccionada
            categoryId: type === "TRASPASO" ? null : categoryId,
            date: new Date(date).toISOString(),
            isRecurring,
            isPaused: isRecurring ? isPaused : false,
            recurrencePeriod: isRecurring && !frequencyId ? recurrencePeriod : null,
            recurrenceInterval: isRecurring && !frequencyId ? (parseInt(recurrenceInterval.toString()) || 1) : null,
            frequencyId: isRecurring ? (frequencyId || null) : null,
            imageUrls: [] as string[]
        };

        setIsUploading(true);
        try {
            if (selectedFiles.length > 0) {
                for (const file of selectedFiles) {
                    const formData = new FormData();
                    formData.append("file", file);
                    const uploadRes = await fetch("/api/vision/upload", {
                        method: "POST",
                        body: formData
                    });
                    if (uploadRes.ok) {
                        const uploadData = await uploadRes.json();
                        payload.imageUrls.push(uploadData.path);
                    }
                }
            }

            const method = editingTx ? "PUT" : "POST";
            const url = editingTx ? `/api/transactions/${editingTx.id}` : "/api/transactions";

            const res = await fetch(url, {
                method,
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setIsModalOpen(false);
                loadData(true); // Silent reload
                resetForm();
            }
        } catch (error) {
            console.error("Error saving transaction:", error);
            alert("Error al guardar el movimiento");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = useCallback(async (id: string) => {
        if (!confirm("¿Eliminar este movimiento?")) return;

        // Optimistic UI
        setTransactions(prev => prev.filter(tx => tx.id !== id));

        const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
        if (res.ok) {
            loadData(true); // Refresh in background
        } else {
            refreshData(); // Revert on failure
        }
    }, [refreshData, loadData]);

    const handleToggleVerify = useCallback(async (tx: any) => {
        // Optimistic UI: update local state immediately
        setTransactions(prev => prev.map(item =>
            item.id === tx.id ? { ...item, isVerified: !tx.isVerified } : item
        ));

        const res = await fetch(`/api/transactions/${tx.id}`, {
            method: "PUT",
            body: JSON.stringify({ isVerified: !tx.isVerified })
        });

        if (res.ok) {
            loadData(true); // Sync with server for stats
        } else {
            // Optional: revert on failure if needed
            refreshData();
        }
    }, [refreshData, loadData]);

    const resetForm = useCallback(() => {
        setEditingTx(null);
        setAmount("");
        setDescription("");
        setType("GASTO");
        setAccountId("");
        setDestinationAccountId("");
        setCategoryId("");
        setDate(new Date().toISOString().split('T')[0]);
        setIsRecurring(false);
        setIsPaused(false);
        setRecurrencePeriod("MENSUAL");
        setRecurrenceInterval(1);
        setFrequencyId("");
        setSelectedFiles([]);
    }, []);

    const handleEdit = useCallback((tx: any) => {
        resetForm();
        setEditingTx(tx);
        setAmount(Math.abs(tx.amount).toString());
        setDescription(tx.description || "");
        setType(tx.type);
        setAccountId(tx.accountId);
        setDestinationAccountId(tx.destinationAccountId || "");
        setCategoryId(tx.categoryId || "");
        setDate(new Date(tx.date).toISOString().split('T')[0]);
        setIsRecurring(tx.isRecurring || false);
        setIsPaused(tx.isPaused || false);
        setRecurrencePeriod(tx.recurrencePeriod || "MENSUAL");
        setRecurrenceInterval(tx.recurrenceInterval || 1);
        setFrequencyId(tx.frequencyId || "");
        setIsModalOpen(true);
    }, [resetForm]);

    const exportToCSV = () => {
        if (transactions.length === 0) return;

        const headers = ["Fecha", "Descripción", "Categoría", "Cuenta", "Tipo", "Importe", "Estado"];
        const rows = transactions.map(tx => [
            formatDate(tx.date),
            tx.description,
            tx.category?.name || "Global",
            tx.account?.name || "Sin cuenta",
            tx.type,
            tx.amount,
            tx.isVerified ? "Conciliado" : "Pendiente"
        ]);

        const csvContent = "\uFEFF" + [
            headers.join(","),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `movimientos_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePrint = () => {
        // Un pequeño delay asegura que el navegador procese cualquier cambio de estado previo
        setTimeout(() => {
            window.print();
        }, 100);
    };

    const setPresetDate = (period: "month" | "quarter" | "year") => {
        const end = new Date();
        const start = new Date();
        if (period === "month") start.setMonth(end.getMonth() - 1);
        if (period === "quarter") start.setMonth(end.getMonth() - 3);
        if (period === "year") start.setFullYear(end.getFullYear() - 1);

        setFilterStartDate(start.toISOString().split('T')[0]);
        setFilterEndDate(end.toISOString().split('T')[0]);
    };

    const clearFilters = () => {
        setFilterCategoryId("all");
        setFilterAccountId("all");
        setFilterType("all");
        setFilterIsVerified("all");
        setFilterMinAmount("");
        setFilterMaxAmount("");
        setFilterStartDate("");
        setFilterEndDate("");
        setSearchQuery("");
    };

    const filteredTransactions = transactions; // Ahora el filtrado es en servidor

    return (
        <div className="space-y-6 print-content">
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page { 
                        size: A4;
                        margin: 0 !important; 
                    }
                    html, body, #__next, body > div, main {
                        background-color: white !important;
                        color: black !important;
                        font-size: 8pt !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        width: 100% !important;
                        height: auto !important;
                    }
                    .no-print, 
                    .Sub-Header-Actions,
                    aside, 
                    nav, 
                    header, 
                    button,
                    .actions-cell,
                    .dropdown-trigger {
                        display: none !important;
                    }
                    /* Force Desktop Grid */
                    .grid {
                        display: grid !important;
                    }
                    .md\\:grid-cols-12 {
                        grid-template-columns: repeat(12, minmax(0, 1fr)) !important;
                    }
                    .md\\:col-span-2 { grid-column: span 2 / span 2 !important; }
                    .md\\:col-span-1 { grid-column: span 1 / span 1 !important; }
                    .md\\:col-span-5 { grid-column: span 5 / span 5 !important; }
                    .col-span-3 { grid-column: span 3 / span 3 !important; }
                    
                    .Card {
                        border: none !important;
                        border-bottom: 1px solid #eee !important;
                        box-shadow: none !important;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0.2cm !important;
                        border-radius: 0 !important;
                    }
                    .print-content {
                        padding: 0.5cm !important;
                    }
                    .print-label {
                        display: inline !important;
                        font-size: 7pt !important;
                        font-weight: bold !important;
                        color: #555 !important;
                        margin-left: 2px;
                    }
                    .print-marker {
                        display: block !important;
                        font-size: 8pt !important;
                        text-align: center;
                        font-weight: bold;
                    }
                }
            `}} />
            {/* Header / Breadcrumbs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-500 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-black dark:text-white uppercase tracking-tight">
                        Historial de Movimientos
                    </h1>
                    <nav className="flex mt-1">
                        <ol className="flex items-center space-x-2 text-xs font-semibold text-slate-400 uppercase tracking-widest">
                            <li><a href="/" className="hover:text-primary transition-colors">Dashboard</a></li>
                            <li><span className="mx-1">/</span></li>
                            <li className="text-primary">Libro Diario</li>
                        </ol>
                    </nav>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => window.location.href = "/transactions/import"}
                        className="bg-slate-100 dark:bg-meta-4 border border-stroke dark:border-strokedark hover:bg-slate-200 dark:hover:bg-meta-4/80 text-slate-600 dark:text-white font-bold h-11 px-6 rounded-md gap-3 shadow-none transition-all active:scale-95 uppercase text-[10px] tracking-widest no-print"
                    >
                        <Upload className="w-4 h-4" /> Importar
                    </Button>
                    <Button
                        onClick={() => { resetForm(); setIsModalOpen(true); }}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 px-8 rounded-md gap-3 shadow-md transition-all active:scale-95 uppercase text-[10px] tracking-widest no-print border-none"
                    >
                        <Plus className="w-4 h-4" /> Nuevo
                    </Button>
                </div>
            </div>

            {/* Sub-Header Actions */}
            <Card className="bg-white dark:bg-boxdark border-none shadow-sm p-4 sm:p-6 Sub-Header-Actions">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Buscar por descripción..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-12 h-11 bg-slate-50 dark:bg-meta-4 border-stroke dark:border-strokedark rounded-md focus:ring-primary/20"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={() => setShowFilters(!showFilters)}
                            variant="outline"
                            className={cn(
                                "h-11 px-6 rounded-md gap-2 font-bold transition-all",
                                showFilters
                                    ? "bg-primary/10 border border-primary/20 text-primary"
                                    : "border-stroke dark:border-strokedark text-slate-600 dark:text-white"
                            )}
                        >
                            <Filter className="w-4 h-4" /> Filtros
                        </Button>
                        <Button
                            onClick={() => window.location.href = "/settings/recurring"}
                            variant="outline"
                            className="h-11 px-4 rounded-md gap-2 font-bold text-slate-600 dark:text-white border-stroke dark:border-strokedark hover:text-primary transition-all"
                            title="Gestionar Recurrencias"
                        >
                            <Repeat className="w-4 h-4" />
                        </Button>
                        <div className="h-11 w-[1px] bg-stroke dark:bg-strokedark mx-1 hidden md:block" />
                        <Button
                            onClick={exportToCSV}
                            variant="outline"
                            className="h-11 px-4 rounded-md gap-2 font-bold text-slate-600 dark:text-white border-stroke dark:border-strokedark hover:text-emerald-500 transition-all"
                            title="Exportar CSV"
                        >
                            <FileSpreadsheet className="w-4 h-4" />
                            <span className="hidden lg:inline">CSV</span>
                        </Button>
                        <Button
                            onClick={handlePrint}
                            variant="outline"
                            className="h-11 px-4 rounded-md gap-2 font-bold text-slate-600 dark:text-white border-stroke dark:border-strokedark hover:text-primary transition-all"
                            title="Imprimir PDF"
                        >
                            <Printer className="w-4 h-4" />
                            <span className="hidden lg:inline">PDF</span>
                        </Button>
                    </div>
                </div>

                {showFilters && (
                    <div className="mt-6 pt-6 border-t border-stroke dark:border-strokedark animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Categoría</Label>
                                <Select value={filterCategoryId} onValueChange={setFilterCategoryId}>
                                    <SelectTrigger className="h-11 bg-slate-50 dark:bg-meta-4 border-stroke dark:border-strokedark rounded-md font-bold">
                                        <SelectValue placeholder="Todas" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-boxdark border-stroke dark:border-strokedark rounded-md">
                                        <SelectItem value="all" className="font-bold">Todas las categorías</SelectItem>
                                        {categories.map(cat => (
                                            <SelectItem key={cat.id} value={cat.id} className="font-bold">{cat.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Tipo de Movimiento</Label>
                                <Select value={filterType} onValueChange={setFilterType}>
                                    <SelectTrigger className="h-11 bg-slate-50 dark:bg-meta-4 border-stroke dark:border-strokedark rounded-md font-bold">
                                        <SelectValue placeholder="Todos" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-boxdark border-stroke dark:border-strokedark rounded-md">
                                        <SelectItem value="all" className="font-bold">Todos los tipos</SelectItem>
                                        <SelectItem value="GASTO" className="font-bold text-rose-500">Solo Gastos</SelectItem>
                                        <SelectItem value="INGRESO" className="font-bold text-emerald-500">Solo Ingresos</SelectItem>
                                        <SelectItem value="TRASPASO" className="font-bold text-primary">Solo Traspasos</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Estado</Label>
                                <Select value={filterIsVerified} onValueChange={setFilterIsVerified}>
                                    <SelectTrigger className="h-11 bg-slate-50 dark:bg-meta-4 border-stroke dark:border-strokedark rounded-md font-bold">
                                        <SelectValue placeholder="Estado" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-boxdark border-stroke dark:border-strokedark rounded-md">
                                        <SelectItem value="all" className="font-bold">Todo el Historial</SelectItem>
                                        <SelectItem value="verified" className="font-bold text-emerald-500">Solo Conciliados</SelectItem>
                                        <SelectItem value="unverified" className="font-bold text-rose-500">Solo Pendientes</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Cuenta</Label>
                                <Select value={filterAccountId} onValueChange={setFilterAccountId}>
                                    <SelectTrigger className="h-11 bg-slate-50 dark:bg-meta-4 border-stroke dark:border-strokedark rounded-md font-bold">
                                        <SelectValue placeholder="Todas" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-boxdark border-stroke dark:border-strokedark rounded-md">
                                        <SelectItem value="all" className="font-bold">Todas las cuentas</SelectItem>
                                        {accounts.map(acc => (
                                            <SelectItem key={acc.id} value={acc.id} className="font-bold">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: acc.color }} />
                                                    {acc.name}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Rango de Importe</Label>
                                <div className="flex items-center gap-3">
                                    <Input
                                        type="number"
                                        placeholder="Min"
                                        value={filterMinAmount}
                                        onChange={(e) => setFilterMinAmount(e.target.value)}
                                        className="h-11 bg-slate-50 dark:bg-meta-4 border-stroke dark:border-strokedark rounded-md font-bold"
                                    />
                                    <span className="text-slate-400 font-bold">-</span>
                                    <Input
                                        type="number"
                                        placeholder="Max"
                                        value={filterMaxAmount}
                                        onChange={(e) => setFilterMaxAmount(e.target.value)}
                                        className="h-11 bg-slate-50 dark:bg-meta-4 border-stroke dark:border-strokedark rounded-md font-bold"
                                    />
                                </div>
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Período</Label>
                                <div className="flex flex-col gap-3">
                                    <div className="flex flex-col sm:flex-row items-center gap-3">
                                        <Input
                                            type="date"
                                            value={filterStartDate}
                                            onChange={(e) => setFilterStartDate(e.target.value)}
                                            className="h-11 bg-slate-50 dark:bg-meta-4 border-stroke dark:border-strokedark rounded-md font-bold w-full"
                                        />
                                        <span className="text-slate-400 font-bold">al</span>
                                        <Input
                                            type="date"
                                            value={filterEndDate}
                                            onChange={(e) => setFilterEndDate(e.target.value)}
                                            className="h-11 bg-slate-50 dark:bg-meta-4 border-stroke dark:border-strokedark rounded-md font-bold w-full"
                                        />
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                        <Button variant="ghost" onClick={() => setPresetDate("month")} className="h-7 text-[9px] font-black uppercase tracking-widest bg-slate-100 dark:bg-meta-4">Último Mes</Button>
                                        <Button variant="ghost" onClick={() => setPresetDate("quarter")} className="h-7 text-[9px] font-black uppercase tracking-widest bg-slate-100 dark:bg-meta-4">Trimestre</Button>
                                        <Button variant="ghost" onClick={() => setPresetDate("year")} className="h-7 text-[9px] font-black uppercase tracking-widest bg-slate-100 dark:bg-meta-4">Año</Button>
                                        <Button
                                            onClick={clearFilters}
                                            variant="ghost"
                                            className="h-7 text-[9px] font-black uppercase tracking-widest ml-auto text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20"
                                        >
                                            Reset
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Card>

            {/* Transactions List */}
            <Card className="bg-white dark:bg-boxdark border-none shadow-sm dark:shadow-none overflow-hidden">
                <div className="hidden md:grid grid-cols-12 border-b border-stroke dark:border-strokedark px-6 py-5 text-[12px] font-black uppercase text-slate-400 tracking-widest bg-slate-50 dark:bg-meta-4/20 items-center">
                    <div className="col-span-5 flex items-center gap-4">
                        <div
                            className="flex items-center justify-center cursor-pointer hover:text-primary"
                            onClick={toggleSelectAll}
                        >
                            {selectedIds.length > 0 && selectedIds.length === transactions.length ? (
                                <CheckCircle className="w-5 h-5 text-primary" />
                            ) : selectedIds.length > 0 ? (
                                <Circle className="w-5 h-5 text-primary fill-primary/20" />
                            ) : (
                                <Circle className="w-5 h-5" />
                            )}
                        </div>
                        <div
                            className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors select-none"
                            onClick={() => requestSort('description')}
                        >
                            Descripción / Concepto
                            {sortConfig?.key === 'description' && (
                                sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                            )}
                        </div>
                    </div>
                    <div
                        className="col-span-2 text-center flex items-center justify-center gap-2 cursor-pointer hover:text-primary transition-colors select-none"
                        onClick={() => requestSort('date')}
                    >
                        Fecha
                        {sortConfig?.key === 'date' && (
                            sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                        )}
                        {isRefreshing && <div className="ml-1 w-2 h-2 bg-primary rounded-full animate-pulse" title="Sincronizando..." />}
                    </div>
                    <div
                        className="col-span-2 text-center flex items-center justify-center gap-2 cursor-pointer hover:text-primary transition-colors select-none"
                        onClick={() => requestSort('isVerified')}
                    >
                        Estado
                        {sortConfig?.key === 'isVerified' && (
                            sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                        )}
                    </div>
                    <div className="col-span-3 flex items-center justify-between md:justify-end gap-6">
                        <div
                            className="text-right flex-1 flex items-center justify-end gap-2 cursor-pointer hover:text-primary transition-colors select-none"
                            onClick={() => requestSort('amount')}
                        >
                            Importe
                            {sortConfig?.key === 'amount' && (
                                sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                            )}
                        </div>
                        <div className="text-center w-18 actions-cell">Acción</div>
                    </div>
                </div>

                <CardContent className="flex flex-col relative min-h-[400px] p-0">
                    {/* Silent/Background Loading Overlay */}
                    {(loading || isRefreshing) && transactions.length > 0 && (
                        <div className="absolute inset-0 bg-white/40 dark:bg-boxdark/40 backdrop-blur-[1px] z-10 transition-opacity flex items-start justify-center pt-20 pointer-events-none">
                            <div className="bg-white dark:bg-boxdark p-4 rounded-full shadow-2xl border border-stroke dark:border-strokedark animate-bounce">
                                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            </div>
                        </div>
                    )}

                    {loading && transactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-4">
                            <div className="w-10 h-10 border-4 border-slate-100 border-t-primary rounded-full animate-spin" />
                            <p className="font-bold text-xs uppercase tracking-widest">Cargando Libro Diario...</p>
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="p-20 text-center flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-slate-50 dark:bg-meta-4 rounded-full flex items-center justify-center">
                                <History className="w-8 h-8 text-slate-300" />
                            </div>
                            <p className="text-slate-400 font-bold italic uppercase text-sm tracking-widest">Sin movimientos registrados</p>
                        </div>
                    ) : (
                        <TransactionList
                            transactions={sortedTransactions}
                            selectedSet={selectedSet}
                            toggleSelect={toggleSelect}
                            handleToggleVerify={handleToggleVerify}
                            handleDelete={handleDelete}
                            setViewingTx={setViewingTx}
                            handleEdit={handleEdit}
                        />
                    )}

                    {/* Pagination Controls */}
                    {!loading && totalTransactions > 0 && (
                        <div className="bg-white dark:bg-boxdark border-t border-stroke dark:border-strokedark px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 no-print">
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Mostrar</span>
                                <Select value={pageSize} onValueChange={(val) => { setPageSize(val); setCurrentPage(1); }}>
                                    <SelectTrigger className="h-9 w-[100px] bg-slate-50 dark:bg-meta-4 border-stroke dark:border-strokedark font-bold text-xs rounded-md">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-boxdark border-stroke dark:border-strokedark rounded-md">
                                        <SelectItem value="25" className="font-bold text-xs">25 reg.</SelectItem>
                                        <SelectItem value="50" className="font-bold text-xs">50 reg.</SelectItem>
                                        <SelectItem value="100" className="font-bold text-xs">100 reg.</SelectItem>
                                        <SelectItem value="500" className="font-bold text-xs">500 reg.</SelectItem>
                                        <SelectItem value="all" className="font-bold text-xs italic text-primary">Todas</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {pageSize !== "all" && totalPages > 1 && (
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 rounded-md bg-slate-50 dark:bg-meta-4 text-slate-400 disabled:opacity-30 border border-stroke dark:border-strokedark"
                                        onClick={() => setCurrentPage(1)}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronsLeft className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 rounded-md bg-slate-50 dark:bg-meta-4 text-slate-400 disabled:opacity-30 border border-stroke dark:border-strokedark"
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </Button>

                                    <div className="flex items-center px-4 h-9 bg-primary/5 dark:bg-primary/10 rounded-md border border-primary/10">
                                        <span className="text-[11px] font-black text-primary uppercase tracking-widest">
                                            {currentPage} / {totalPages}
                                        </span>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 rounded-md bg-slate-50 dark:bg-meta-4 text-slate-400 disabled:opacity-30 border border-stroke dark:border-strokedark"
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 rounded-md bg-slate-50 dark:bg-meta-4 text-slate-400 disabled:opacity-30 border border-stroke dark:border-strokedark"
                                        onClick={() => setCurrentPage(totalPages)}
                                        disabled={currentPage === totalPages}
                                    >
                                        <ChevronsRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            )}

                            <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest bg-slate-50 dark:bg-meta-4/30 px-3 py-1.5 rounded-full border border-stroke dark:border-strokedark">
                                Mostrando {transactions.length} de {totalTransactions} registros
                            </div>
                        </div>
                    )}

                    {/* Sumatorio de Movimientos */}
                    {!loading && totalTransactions > 0 && (
                        <div className="bg-slate-50/50 dark:bg-meta-4/5 border-t border-stroke dark:border-strokedark px-6 py-8 flex flex-col md:flex-row justify-between items-center gap-8 no-print">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Resumen de Filtros</span>
                                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">Calculado sobre el historial completo filtrado</p>
                            </div>

                            <div className="flex flex-wrap items-center justify-center md:justify-end gap-10 lg:gap-16">
                                <div className="flex flex-col items-center md:items-end">
                                    <span className="text-[9px] font-black uppercase text-emerald-500 tracking-widest mb-1">Total Ingresos</span>
                                    <span className="text-xl font-black text-emerald-500 tabular-nums">+{formatCurrency(stats.income)}</span>
                                </div>
                                <div className="flex flex-col items-center md:items-end">
                                    <span className="text-[9px] font-black uppercase text-rose-500 tracking-widest mb-1">Total Gastos</span>
                                    <span className="text-xl font-black text-rose-500 tabular-nums">-{formatCurrency(stats.expenses)}</span>
                                </div>
                                <div className="flex flex-col items-center md:items-end">
                                    <span className="text-[9px] font-black uppercase text-blue-500 tracking-widest mb-1">Total Traspasos</span>
                                    <span className="text-xl font-black text-blue-500 tabular-nums">≈{formatCurrency(stats.transfers)}</span>
                                </div>
                                <div className="h-10 w-[1px] bg-stroke dark:bg-strokedark hidden md:block" />
                                <div className="flex flex-col items-center md:items-end p-4 px-6 bg-white dark:bg-meta-4 rounded-2xl shadow-sm border border-stroke dark:border-strokedark transition-all hover:scale-105">
                                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Balance Neto</span>
                                    <span className={cn(
                                        "text-2xl font-black tabular-nums tracking-tighter",
                                        netAmount >= 0 ? "text-emerald-500" : "text-rose-500"
                                    )}>
                                        {netAmount >= 0 ? "+" : ""}{formatCurrency(netAmount)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card >

            {/* Bulk Actions Bar */}
            {
                selectedIds.length > 0 && (
                    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300 no-print">
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-3 pl-8 flex items-center gap-8 shadow-2xl shadow-blue-500/20">
                            <div className="flex flex-col">
                                <span className="text-white font-black text-lg leading-none">{selectedIds.length}</span>
                                <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest mt-1">Seleccionados</span>
                            </div>

                            <div className="h-10 w-[1px] bg-slate-800" />

                            <div className="flex items-center gap-3">
                                <Button
                                    onClick={() => {
                                        setBulkCategoryId("no_change");
                                        setBulkType("no_change");
                                        setBulkDestinationAccountId("no_change");
                                        setIsBulkEditModalOpen(true);
                                    }}
                                    className="h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest px-6 gap-3 transition-all active:scale-95 shadow-lg shadow-blue-600/20 shadow-none border-none"
                                >
                                    <Settings className="w-4 h-4" /> Editar
                                </Button>
                                <Button
                                    onClick={handleBulkDelete}
                                    disabled={isBulkDeleting}
                                    className="h-12 bg-rose-600/10 hover:bg-rose-600 border border-rose-600/20 text-rose-500 hover:text-white rounded-2xl font-black uppercase text-[10px] tracking-widest px-6 gap-3 transition-all active:scale-95 shadow-none"
                                >
                                    {isBulkDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                    Eliminar
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => setSelectedIds([])}
                                    className="h-12 text-slate-400 hover:text-white hover:bg-white/5 rounded-2xl font-black uppercase text-[10px] tracking-widest px-4"
                                >
                                    Cancelar
                                </Button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Modal de Movimiento */}
            <Dialog open={isModalOpen} onOpenChange={(val) => {
                setIsModalOpen(val);
                if (!val) resetForm();
            }}>
                <DialogContent className="sm:max-w-lg bg-white dark:bg-boxdark border-none shadow-2xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
                    <DialogHeader className="bg-boxdark dark:bg-boxdark-2 p-6 sm:p-8 text-white space-y-1 shrink-0">
                        <DialogTitle className="text-xl font-bold uppercase tracking-tight">
                            {editingTx ? "Editar" : "Nuevo"}
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 text-xs font-semibold uppercase tracking-widest italic opacity-70">
                            Registro Oficial de Contabilidad
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-6 sm:p-8 space-y-6 overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Tipo</Label>
                                <Select value={type} onValueChange={(val) => {
                                    setType(val);
                                    if (val === "TRASPASO") setDescription("TRASPASO");
                                    else if (description === "TRASPASO") setDescription("");
                                }}>
                                    <SelectTrigger className="h-11 bg-slate-50 dark:bg-meta-4 border-stroke dark:border-strokedark rounded-md font-bold">
                                        <SelectValue placeholder="Seleccionar..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-boxdark border-stroke dark:border-strokedark rounded-md">
                                        <SelectItem value="GASTO" className="text-rose-500 font-bold">SALIDA / GASTO</SelectItem>
                                        <SelectItem value="INGRESO" className="text-emerald-500 font-bold">ENTRADA / INGRESO</SelectItem>
                                        <SelectItem value="TRASPASO" className="text-primary font-bold">INTER-TRASPASO</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Importe Bruto</Label>
                                <Input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="h-11 bg-primary/5 dark:bg-primary/10 border-stroke dark:border-strokedark rounded-md font-black text-lg text-primary text-center"
                                    autoFocus
                                    inputMode="decimal"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Descripción / Concepto</Label>
                            <Input
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                disabled={type === "TRASPASO"}
                                placeholder="Ej: Supermercado Semanal..."
                                className="h-11 bg-slate-50 dark:bg-meta-4 border-stroke dark:border-strokedark rounded-md font-bold"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                    {type === "TRASPASO" ? "Origen" : "Cuenta"}
                                </Label>
                                <Select value={accountId} onValueChange={setAccountId}>
                                    <SelectTrigger className="h-11 bg-slate-50 dark:bg-meta-4 border-stroke dark:border-strokedark rounded-md font-bold text-sm">
                                        <SelectValue placeholder="Seleccionar..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-boxdark border-stroke dark:border-strokedark rounded-md">
                                        {accounts.map(acc => (
                                            <SelectItem key={acc.id} value={acc.id} className="font-bold">{acc.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {type === "TRASPASO" ? (
                                <div className="space-y-2 animate-in fade-in slide-in-from-left-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Destino</Label>
                                    <Select value={destinationAccountId} onValueChange={setDestinationAccountId}>
                                        <SelectTrigger className="h-11 bg-primary/5 dark:bg-primary/10 border-primary/20 rounded-md font-bold text-primary">
                                            <SelectValue placeholder="Seleccionar..." />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-boxdark border-stroke dark:border-strokedark rounded-md">
                                            {accounts.filter(a => a.id !== accountId).map(acc => (
                                                <SelectItem key={acc.id} value={acc.id} className="font-bold">{acc.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Categoría</Label>
                                    <Select value={categoryId} onValueChange={setCategoryId}>
                                        <SelectTrigger className="h-11 bg-slate-50 dark:bg-meta-4 border-stroke dark:border-strokedark rounded-md font-bold text-sm text-center">
                                            <SelectValue placeholder="Opcional..." />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-boxdark border-stroke dark:border-strokedark rounded-md">
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
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Fecha</Label>
                                <Input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="h-11 bg-slate-50 dark:bg-meta-4 border-stroke dark:border-strokedark rounded-md font-bold"
                                />
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Adjuntar Soportes (Fotos/PDFs)</Label>
                                <div className="space-y-3">
                                    <Input
                                        type="file"
                                        multiple
                                        accept="image/*,application/pdf"
                                        onChange={(e) => {
                                            const files = Array.from(e.target.files || []);
                                            setSelectedFiles(prev => [...prev, ...files]);
                                            // Reset value to allow selecting same file again if deleted
                                            e.target.value = "";
                                        }}
                                        className="h-11 bg-slate-50 dark:bg-meta-4 border-stroke dark:border-strokedark rounded-md font-bold text-xs"
                                    />

                                    {selectedFiles.length > 0 && (
                                        <div className="space-y-2">
                                            {selectedFiles.map((file, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-meta-4/50 border border-dashed border-stroke dark:border-strokedark rounded-md group">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <Paperclip className="w-3.5 h-3.5 text-primary shrink-0" />
                                                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 truncate">
                                                            {file.name}
                                                        </span>
                                                        <span className="text-[9px] text-slate-400 font-medium">
                                                            ({(file.size / 1024).toFixed(1)} KB)
                                                        </span>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))}
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Recurrencia</Label>
                                <div className="flex w-full items-center justify-between h-11 px-4 bg-slate-50 dark:bg-meta-4 border border-stroke dark:border-strokedark rounded-md">
                                    <span className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Activar Movimiento Automático</span>
                                    <Switch
                                        id="recurring"
                                        checked={isRecurring}
                                        onCheckedChange={setIsRecurring}
                                    />
                                </div>
                            </div>
                        </div>

                        {isRecurring && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Estado de Ejecución</Label>
                                    <div className="flex items-center justify-between h-11 px-4 bg-slate-50 dark:bg-meta-4 border border-stroke dark:border-strokedark rounded-md transition-colors">
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <PauseCircle className="w-4 h-4" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">Pausar</span>
                                        </div>
                                        <Switch
                                            id="paused"
                                            checked={isPaused}
                                            onCheckedChange={setIsPaused}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-primary">Frecuencia</Label>
                                    <Select value={frequencyId} onValueChange={setFrequencyId}>
                                        <SelectTrigger className="h-11 bg-primary/5 dark:bg-primary/10 border-primary/20 rounded-md font-bold text-primary focus:ring-primary/20">
                                            <SelectValue placeholder="Opcional (Personalizada)..." />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-boxdark border-stroke dark:border-strokedark rounded-md">
                                            <SelectItem value="none" className="font-bold">Ninguna (Usar estándar)</SelectItem>
                                            {frequencies.map((freq) => (
                                                <SelectItem key={freq.id} value={freq.id} className="font-bold">
                                                    {freq.name} ({freq.days} días)
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}

                        {isRecurring && (!frequencyId || frequencyId === "none") && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Periodo Estándar</Label>
                                    <Select value={recurrencePeriod} onValueChange={setRecurrencePeriod}>
                                        <SelectTrigger className="h-11 bg-slate-50 dark:bg-meta-4 border-stroke dark:border-strokedark rounded-md font-bold">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-boxdark border-stroke dark:border-strokedark rounded-md">
                                            <SelectItem value="DIARIO" className="font-bold">DIARIO</SelectItem>
                                            <SelectItem value="SEMANAL" className="font-bold">SEMANAL</SelectItem>
                                            <SelectItem value="MENSUAL" className="font-bold">MENSUAL</SelectItem>
                                            <SelectItem value="ANUAL" className="font-bold">ANUAL</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Intervalo</Label>
                                    <Input
                                        type="number"
                                        value={recurrenceInterval}
                                        onChange={(e) => setRecurrenceInterval(parseInt(e.target.value) || 1)}
                                        min="1"
                                        className="h-11 bg-slate-50 dark:bg-meta-4 border-stroke dark:border-strokedark rounded-md font-bold text-center"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="p-4 bg-slate-50 dark:bg-meta-4/20 border-t border-stroke dark:border-strokedark flex flex-row gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 rounded-md font-bold uppercase text-[10px] tracking-widest text-slate-400 hover:text-black dark:hover:text-white h-12"
                        >
                            Cerrar
                        </Button>
                        <Button
                            onClick={handleSave}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold uppercase text-[10px] tracking-widest h-12 cursor-pointer transition-colors shadow-md disabled:pointer-events-auto disabled:cursor-not-allowed border-none"
                        >
                            {isUploading ? (editingTx ? "Actualizando..." : "Registrando...") : (editingTx ? "Actualizar" : "Registrar")}
                            {isUploading && <div className="ml-2 w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal de Galería de Adjuntos */}
            <Dialog open={!!viewingTx} onOpenChange={() => setViewingTx(null)}>
                <DialogContent className="sm:max-w-3xl bg-white dark:bg-boxdark border-none shadow-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
                    <DialogHeader className="p-6 bg-boxdark text-white shrink-0">
                        <DialogTitle className="text-xl font-bold uppercase tracking-tight">
                            Documentos Adjuntos
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 text-xs font-semibold uppercase tracking-widest">
                            Visualización de Soporte Digital
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {(viewingTx?.images?.length > 0 || viewingTx?.imageUrls?.length > 0) ? (
                            (viewingTx.images?.map((img: any) => img.url) || viewingTx.imageUrls).map((url: string, index: number) => (
                                <div key={index} className="rounded-md overflow-hidden border border-stroke dark:border-strokedark shadow-sm group relative">
                                    {url.toLowerCase().endsWith('.pdf') ? (
                                        <object data={url} type="application/pdf" className="w-full h-96 bg-slate-50" aria-label={`PDF ${index + 1}`} />
                                    ) : (
                                        <img src={url} alt={`Doc ${index + 1}`} className="w-full h-auto object-contain bg-slate-50" />
                                    )}
                                    <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-sm">
                                        {index + 1} / {(viewingTx.images || viewingTx.imageUrls).length}
                                    </div>
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <a href={url} download target="_blank" rel="noopener noreferrer">
                                            <Button size="icon" variant="secondary" className="bg-white/90 hover:bg-white rounded-full h-8 w-8">
                                                <Download className="w-4 h-4 text-slate-700" />
                                            </Button>
                                        </a>
                                    </div>
                                </div>
                            ))
                        ) : viewingTx?.attachmentPath && (
                            <div className="rounded-md overflow-hidden border border-stroke dark:border-strokedark shadow-sm group relative mx-auto col-span-2 max-w-md">
                                <img src={viewingTx.attachmentPath} alt="Doc" className="w-full h-auto object-contain bg-slate-50" />
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <a href={viewingTx.attachmentPath} download target="_blank" rel="noopener noreferrer">
                                        <Button size="icon" variant="secondary" className="bg-white/90 hover:bg-white rounded-full h-8 w-8">
                                            <Download className="w-4 h-4 text-slate-700" />
                                        </Button>
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="p-6 bg-slate-50 dark:bg-meta-4/20 border-t border-stroke dark:border-strokedark text-right shrink-0">
                        <Button onClick={() => setViewingTx(null)} className="bg-boxdark text-white rounded-md uppercase text-xs font-bold tracking-widest px-8">
                            Cerrar Visor
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>


            {/* Bulk Edit Dialog */}
            <Dialog open={isBulkEditModalOpen} onOpenChange={setIsBulkEditModalOpen}>
                <DialogContent className="max-w-md bg-white dark:bg-boxdark border-none rounded-3xl p-0 overflow-hidden shadow-2xl">
                    <DialogHeader className="p-8 pb-0">
                        <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-600/20 rounded-xl">
                                <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            Edición Masiva
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-2 leading-relaxed">
                            Se actualizarán <span className="text-blue-600">{selectedIds.length}</span> movimientos seleccionados.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-8 space-y-6">
                        {/* Categoría */}
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Categoría</Label>
                            <Select value={bulkCategoryId} onValueChange={setBulkCategoryId}>
                                <SelectTrigger className="h-14 bg-slate-50 dark:bg-meta-4 border-stroke dark:border-strokedark rounded-2xl font-bold group hover:border-blue-400 transition-all">
                                    <SelectValue placeholder="Mantener actual..." />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-boxdark border-stroke dark:border-strokedark rounded-2xl shadow-xl p-2 max-h-[300px]">
                                    <SelectItem value="no_change" className="font-bold py-3 rounded-xl italic text-slate-400">Mantener actual</SelectItem>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id} className="font-bold py-3 rounded-xl focus:bg-blue-50 dark:focus:bg-blue-600/10">
                                            <div className="flex items-center gap-3">
                                                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }} />
                                                {cat.name}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Tipo de Movimiento */}
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Tipo de Movimiento</Label>
                            <Select value={bulkType} onValueChange={setBulkType}>
                                <SelectTrigger className="h-14 bg-slate-50 dark:bg-meta-4 border-stroke dark:border-strokedark rounded-2xl font-bold group hover:border-blue-400 transition-all">
                                    <SelectValue placeholder="Mantener actual..." />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-boxdark border-stroke dark:border-strokedark rounded-2xl shadow-xl p-2">
                                    <SelectItem value="no_change" className="font-bold py-3 rounded-xl italic text-slate-400">Mantener actual</SelectItem>
                                    <SelectItem value="GASTO" className="font-bold py-3 rounded-xl text-rose-500">SALIDA / GASTO</SelectItem>
                                    <SelectItem value="INGRESO" className="font-bold py-3 rounded-xl text-emerald-500">ENTRADA / INGRESO</SelectItem>
                                    <SelectItem value="TRASPASO" className="font-bold py-3 rounded-xl text-primary">INTER-TRASPASO</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Cuenta Destino (Solo si es Traspaso) */}
                        {bulkType === "TRASPASO" && (
                            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 text-primary">Cuenta de Destino</Label>
                                <Select value={bulkDestinationAccountId} onValueChange={setBulkDestinationAccountId}>
                                    <SelectTrigger className="h-14 bg-blue-50 dark:bg-blue-600/10 border-blue-100 dark:border-blue-600/20 rounded-2xl font-bold group hover:border-blue-400 transition-all">
                                        <SelectValue placeholder="Selecciona el destino..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-boxdark border-stroke dark:border-strokedark rounded-2xl shadow-xl p-2 max-h-[300px]">
                                        <SelectItem value="no_change" className="font-bold py-3 rounded-xl italic text-slate-400">Seleccionar...</SelectItem>
                                        {accounts.map((acc) => (
                                            <SelectItem key={acc.id} value={acc.id} className="font-bold py-3 rounded-xl focus:bg-blue-50 dark:focus:bg-blue-600/10">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: acc.color }} />
                                                    {acc.name}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="p-8 bg-slate-50 dark:bg-meta-4/20 border-t border-stroke dark:border-strokedark flex-row gap-4">
                        <Button
                            variant="ghost"
                            onClick={() => setIsBulkEditModalOpen(false)}
                            className="flex-1 h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleBulkUpdate}
                            disabled={isBulkUpdating || (bulkType === "TRASPASO" && (bulkDestinationAccountId === "no_change" || !bulkDestinationAccountId))}
                            className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-500/20 group active:scale-95 transition-all outline-none border-none"
                        >
                            {isBulkUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                            Aplicar Cambios
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}

const TransactionList = memo(({
    transactions,
    selectedSet,
    toggleSelect,
    handleToggleVerify,
    handleDelete,
    setViewingTx,
    handleEdit
}: any) => {
    return (
        <>
            {transactions.map((tx: any) => (
                <TransactionRow
                    key={tx.id}
                    tx={tx}
                    isSelected={selectedSet.has(tx.id)}
                    toggleSelect={toggleSelect}
                    handleToggleVerify={handleToggleVerify}
                    handleDelete={handleDelete}
                    setViewingTx={setViewingTx}
                    onEdit={handleEdit}
                />
            ))}
        </>
    );
});

function History(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M12 7v5l4 2" />
        </svg>
    );
}

const TransactionRow = memo(({
    tx,
    isSelected,
    toggleSelect,
    handleToggleVerify,
    handleDelete,
    setViewingTx,
    onEdit
}: any) => {
    return (
        <div className={cn(
            "grid grid-cols-1 md:grid-cols-12 border-b border-stroke dark:border-strokedark px-6 py-6 hover:bg-slate-50 dark:hover:bg-meta-4/10 transition-colors group relative",
            isSelected && "bg-primary/5 hover:bg-primary/10"
        )}>
            <div className="col-span-5 flex items-center gap-4">
                <div
                    className="flex items-center justify-center cursor-pointer no-print"
                    onClick={() => toggleSelect(tx.id)}
                >
                    {isSelected ? (
                        <CheckCircle className="w-5 h-5 text-primary" />
                    ) : (
                        <Circle className="w-5 h-5 text-slate-300 group-hover:text-slate-400" />
                    )}
                </div>
                <div className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-xs font-bold no-print",
                    tx.type === "INGRESO" ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/10" :
                        tx.type === "GASTO" ? "bg-rose-500/10 text-rose-600 border border-rose-500/10" : "bg-blue-500/10 text-blue-600 border border-blue-500/10"
                )}>
                    {tx.type === "INGRESO" ? <ArrowDownLeft className="w-5 h-5" /> :
                        tx.type === "GASTO" ? <ArrowUpRight className="w-5 h-5" /> : <ArrowLeftRight className="w-5 h-5" />}
                </div>
                <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="text-base font-bold text-black dark:text-white uppercase tracking-tight truncate">{tx.description}</p>
                        {tx.isRecurring && (
                            <>
                                <Repeat className="w-4 h-4 text-blue-500 shrink-0 no-print" />
                                <span className="hidden print-label text-blue-600">[REC]</span>
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[12px] font-bold uppercase tracking-widest truncate">
                            {tx.type === "TRASPASO" ? (
                                <span className="flex items-center gap-1.5">
                                    <span style={{ color: tx.originAccount?.color || tx.account?.color || '#3c50e0' }}>
                                        {tx.originAccount?.name || tx.account?.name}
                                    </span>
                                    <ArrowRight className="w-3 h-3 text-slate-400" />
                                    <span style={{ color: tx.destinationAccount?.color || '#3c50e0' }}>
                                        {tx.destinationAccount?.name || "Destino"}
                                    </span>
                                </span>
                            ) : (
                                <>
                                    <span style={{ color: tx.category?.color || '#94a3b8' }}>
                                        {tx.category?.name || "Sin categoría"}
                                    </span>
                                    <span className="mx-1.5 text-slate-300 dark:text-slate-600">•</span>
                                    <span style={{ color: tx.account?.color || '#3c50e0' }}>
                                        {tx.account?.name}
                                    </span>
                                </>
                            )}
                        </span>
                        {(tx.images?.length > 0 || tx.imageUrls?.length > 0 || tx.attachmentPath) && (
                            <button
                                onClick={(e) => { e.stopPropagation(); setViewingTx(tx); }}
                                className="w-4 h-4 text-primary hover:scale-110 transition-transform flex items-center justify-center p-0.5 bg-primary/5 rounded-sm"
                                title="Ver Adjuntos"
                            >
                                <Paperclip className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="md:col-span-2 flex items-center justify-start md:justify-center mt-2 md:mt-0">
                <div className="flex items-center gap-1.5 text-[12px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                    <Calendar className="w-3 h-3 md:hidden" /> {formatDate(tx.date)}
                </div>
            </div>

            <div className="md:col-span-2 flex items-center justify-start md:justify-center mt-1 md:mt-0">
                <button
                    onClick={(e) => { e.stopPropagation(); handleToggleVerify(tx); }}
                    className={cn(
                        "transition-all hover:scale-110 p-1 rounded-full no-print",
                        tx.isVerified
                            ? "text-emerald-500 hover:text-emerald-600"
                            : "text-slate-300 dark:text-slate-600 hover:text-amber-500"
                    )}
                    title={tx.isVerified ? "Marcar como pendiente" : "Marcar como conciliado"}
                >
                    {tx.isVerified ? (
                        <CheckCircle2 className="w-6 h-6 fill-emerald-500/10" />
                    ) : (
                        <Circle className="w-6 h-6" />
                    )}
                </button>
                <span className="hidden print-marker">
                    {tx.isVerified ? "Conciliado" : "Pendiente"}
                </span>
            </div>

            <div className="col-span-3 flex items-center justify-between md:justify-end gap-6 mt-4 md:mt-0">
                <p className={cn(
                    "text-right flex-1 text-lg font-bold tracking-tight",
                    tx.type === "INGRESO" ? "text-emerald-500" :
                        tx.type === "GASTO" ? "text-rose-500" : "text-blue-500"
                )}>
                    {tx.type === "GASTO" ? "-" : tx.type === "INGRESO" ? "+" : ""}{formatCurrency(Math.abs(tx.amount))}
                </p>
                <div className="flex items-center gap-2 w-18 justify-center actions-cell">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild className="dropdown-trigger">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-md bg-slate-50 dark:bg-meta-4 text-slate-400 hover:text-primary border border-stroke dark:border-strokedark transition-colors"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white dark:bg-boxdark border-stroke dark:border-strokedark rounded-md shadow-2xl min-w-[160px]">
                            <DropdownMenuItem
                                className="flex items-center gap-2 font-bold text-[11px] uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary cursor-pointer p-3"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(tx);
                                }}
                            >
                                <Pencil className="w-3.5 h-3.5" />
                                Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="flex items-center gap-2 font-bold text-[11px] uppercase tracking-widest text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer p-3"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(tx.id);
                                }}
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Eliminar
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    );
});
