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
    CheckCircle,
    Copy
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
    const [bulkAccountId, setBulkAccountId] = useState("no_change");
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
                return transactions.map(tx => tx.id);
            }
        });
    }, [transactions.length]);

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
                setTransactions(prev => prev.filter(tx => !selectedIds.includes(tx.id)));
                setSelectedIds([]);
                loadData(true);
            } else {
                throw new Error("Error deleting transactions");
            }
        } catch (error) {
            console.error("Error bulk deleting:", error);
            alert("Error al eliminar los movimientos");
        } finally {
            setIsBulkDeleting(false);
        }
    }, [selectedIds]);

    const handleBulkUpdate = useCallback(async () => {
        if (bulkCategoryId === "no_change" && bulkType === "no_change" && bulkAccountId === "no_change" && bulkDestinationAccountId === "no_change") {
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
                    accountId: bulkAccountId === "no_change" ? undefined : bulkAccountId,
                    destinationAccountId: bulkDestinationAccountId === "no_change" ? undefined : bulkDestinationAccountId
                })
            });

            if (res.ok) {
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
    }, [selectedIds, bulkCategoryId, bulkType, bulkAccountId, bulkDestinationAccountId]);

    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearchQuery, filterCategoryId, filterAccountId, filterType, filterIsVerified, filterMinAmount, filterMaxAmount, filterStartDate, filterEndDate, pageSize, sortConfig]);

    useEffect(() => {
        loadData();
    }, [debouncedSearchQuery, filterCategoryId, filterAccountId, filterType, filterIsVerified, filterMinAmount, filterMaxAmount, filterStartDate, filterEndDate, currentPage, pageSize, sortConfig, refreshCount]);

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

            if (pageSize !== "all") {
                params.append("limit", pageSize);
                params.append("page", currentPage.toString());
            }

            if (sortConfig) {
                params.append("sortBy", sortConfig.key);
                params.append("sortOrder", sortConfig.direction);
            }

            const txRes = await fetch(`/api/transactions?${params.toString()}`);
            const txData = await txRes.json();

            if (txData.transactions) {
                setTransactions(txData.transactions);
                setTotalTransactions(txData.totalCount);
                setTotalPages(txData.totalPages);
                if (txData.summary) setSummaryStats(txData.summary);
            } else {
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
    }, [debouncedSearchQuery, filterCategoryId, filterAccountId, filterType, filterIsVerified, filterMinAmount, filterMaxAmount, filterStartDate, filterEndDate, currentPage, pageSize, sortConfig]);

    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
        setCurrentPage(1); // Reiniciar a la primera página al cambiar el orden
    };

    const stats = summaryStats;
    const netAmount = stats.income - stats.expenses;

    const sortedTransactions = transactions;

    const handleSave = async () => {
        const payload = {
            amount: parseFloat(amount),
            description,
            type,
            accountId,
            destinationAccountId: type === "TRASPASO" ? destinationAccountId : null,
            originAccountId: accountId,
            categoryId: type === "TRASPASO" ? null : categoryId,
            date: new Date(date).toISOString(),
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
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setIsModalOpen(false);
                loadData(true);
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
        setTransactions(prev => prev.filter(tx => tx.id !== id));
        const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
        if (res.ok) loadData(true);
        else refreshData();
    }, [refreshData, loadData]);

    const handleToggleVerify = useCallback(async (tx: any) => {
        setTransactions(prev => prev.map(item =>
            item.id === tx.id ? { ...item, isVerified: !tx.isVerified } : item
        ));
        const res = await fetch(`/api/transactions/${tx.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isVerified: !tx.isVerified })
        });
        if (res.ok) loadData(true);
        else refreshData();
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
        setSelectedFiles([]);
    }, []);

    const handleCloneToRecurring = useCallback(async (tx: any) => {
        if (!confirm("¿Deseas convertir este movimiento en una recurrencia programada?")) return;

        try {
            const res = await fetch("/api/subscriptions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: Math.abs(tx.amount),
                    description: tx.description,
                    type: tx.type,
                    accountId: tx.accountId,
                    categoryId: tx.categoryId,
                    originAccountId: tx.originAccountId,
                    destinationAccountId: tx.destinationAccountId,
                    recurrencePeriod: "MENSUAL",
                    recurrenceInterval: 1,
                    nextExecutionDate: new Date().toISOString()
                })
            });

            if (res.ok) {
                alert("Recurrencia creada satisfactoriamente. Puedes gestionarla en Configuración > Recurrencias.");
            }
        } catch (error) {
            console.error("Error cloning to recurring:", error);
        }
    }, []);

    const handleClone = useCallback((tx: any) => {
        resetForm();
        setAmount(Math.abs(tx.amount).toString());
        setDescription(tx.description || "");
        setType(tx.type);
        setAccountId(tx.accountId);
        setDestinationAccountId(tx.destinationAccountId || "");
        setCategoryId(tx.categoryId || "");
        setDate(new Date().toISOString().split('T')[0]); // Current date for clone
        setIsModalOpen(true);
    }, [resetForm]);

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
        setTimeout(() => window.print(), 100);
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

    return (
        <div className="space-y-6 print-content">
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page { size: A4; margin: 0 !important; }
                    html, body { background-color: white !important; color: black !important; font-size: 8pt !important; margin: 0 !important; width: 100% !important; }
                    .no-print, .Sub-Header-Actions, aside, nav, header, button, .actions-cell, .dropdown-trigger { display: none !important; }
                    .grid { display: grid !important; }
                    .md\\:grid-cols-12 { grid-template-columns: repeat(12, minmax(0, 1fr)) !important; }
                    .md\\:col-span-2 { grid-column: span 2 / span 2 !important; }
                    .md\\:col-span-5 { grid-column: span 5 / span 5 !important; }
                    .col-span-3 { grid-column: span 3 / span 3 !important; }
                    .Card { border: none !important; border-bottom: 1px solid #eee !important; box-shadow: none !important; width: 100% !important; margin: 0 !important; padding: 0.2cm !important; border-radius: 0 !important; }
                    .print-content { padding: 0.5cm !important; }
                    .print-label { display: inline !important; font-size: 7pt !important; font-weight: bold !important; color: #555 !important; margin-left: 2px; }
                    .print-marker { display: block !important; font-size: 8pt !important; text-align: center; font-weight: bold; }
                }
            `}} />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-500 mb-6 font-primary">
                <div>
                    <h1 className="text-2xl font-bold text-black dark:text-white uppercase tracking-tight">Historial de Movimientos</h1>
                    <nav className="flex mt-1">
                        <ol className="flex items-center space-x-2 text-xs font-semibold text-slate-400 uppercase tracking-widest">
                            <li><a href="/" className="hover:text-primary transition-colors">Dashboard</a></li>
                            <li><span className="mx-1">/</span></li>
                            <li className="text-primary">Libro Diario</li>
                        </ol>
                    </nav>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={() => window.location.href = "/transactions/import"} className="bg-slate-100 dark:bg-meta-4 border border-stroke dark:border-strokedark hover:bg-slate-200 dark:hover:bg-meta-4/80 text-slate-600 dark:text-white font-bold h-11 px-6 rounded-md gap-3 shadow-none transition-all active:scale-95 uppercase text-[10px] tracking-widest no-print"><Upload className="w-4 h-4" /> Importar</Button>
                    <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 px-8 rounded-md gap-3 shadow-md transition-all active:scale-95 uppercase text-[10px] tracking-widest no-print border-none"><Plus className="w-4 h-4" /> Nuevo</Button>
                </div>
            </div>

            <Card className="bg-white dark:bg-boxdark border-none shadow-sm p-4 sm:p-6 Sub-Header-Actions">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input placeholder="Buscar por descripción..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-12 h-11 bg-slate-50 dark:bg-meta-4 border-stroke dark:border-strokedark rounded-md focus:ring-primary/20" />
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={() => setShowFilters(!showFilters)} variant="outline" className={cn("h-11 px-6 rounded-md gap-2 font-bold transition-all", showFilters ? "bg-primary/10 border border-primary/20 text-primary" : "border-stroke dark:border-strokedark text-slate-600 dark:text-white")}><Filter className="w-4 h-4" /> Filtros</Button>
                        <Button onClick={() => window.location.href = "/settings/recurring"} variant="outline" className="h-11 px-4 rounded-md gap-2 font-bold text-slate-600 dark:text-white border-stroke dark:border-strokedark hover:text-primary transition-all" title="Gestionar Recurrencias"><Repeat className="w-4 h-4" /></Button>
                        <div className="h-11 w-[1px] bg-stroke dark:bg-strokedark mx-1 hidden md:block" />
                        <Button onClick={exportToCSV} variant="outline" className="h-11 px-4 rounded-md gap-2 font-bold text-slate-600 dark:text-white border-stroke dark:border-strokedark hover:text-emerald-500 transition-all" title="Exportar CSV"><FileSpreadsheet className="w-4 h-4" /> <span className="hidden lg:inline">CSV</span></Button>
                        <Button onClick={handlePrint} variant="outline" className="h-11 px-4 rounded-md gap-2 font-bold text-slate-600 dark:text-white border-stroke dark:border-strokedark hover:text-primary transition-all" title="Imprimir PDF"><Printer className="w-4 h-4" /> <span className="hidden lg:inline">PDF</span></Button>
                    </div>
                </div>

                {showFilters && (
                    <div className="mt-6 pt-6 border-t border-stroke dark:border-strokedark animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-primary">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Categoría</Label>
                                <Select value={filterCategoryId} onValueChange={setFilterCategoryId}>
                                    <SelectTrigger className="h-11 bg-slate-50 dark:bg-meta-4 border-stroke dark:border-strokedark rounded-md font-bold italic"><SelectValue placeholder="Todas" /></SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-boxdark border-stroke dark:border-strokedark rounded-md"><SelectItem value="all" className="font-bold">Todas las categorías</SelectItem>{categories.map(cat => (<SelectItem key={cat.id} value={cat.id} className="font-bold">{cat.name}</SelectItem>))}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Tipo</Label>
                                <Select value={filterType} onValueChange={setFilterType}>
                                    <SelectTrigger className="h-11 bg-slate-50 dark:bg-meta-4 border-stroke dark:border-strokedark rounded-md font-bold italic"><SelectValue placeholder="Todos" /></SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-boxdark border-stroke dark:border-strokedark rounded-md"><SelectItem value="all" className="font-bold">Todos</SelectItem><SelectItem value="GASTO" className="font-bold text-rose-500">Gastos</SelectItem><SelectItem value="INGRESO" className="font-bold text-emerald-500">Ingresos</SelectItem><SelectItem value="TRASPASO" className="font-bold text-primary">Traspasos</SelectItem></SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Estado</Label>
                                <Select value={filterIsVerified} onValueChange={setFilterIsVerified}>
                                    <SelectTrigger className="h-11 bg-slate-50 dark:bg-meta-4 border-stroke dark:border-strokedark rounded-md font-bold italic"><SelectValue placeholder="Todos" /></SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-boxdark border-stroke dark:border-strokedark rounded-md"><SelectItem value="all" className="font-bold">Todos</SelectItem><SelectItem value="verified" className="font-bold text-emerald-500">Conciliados</SelectItem><SelectItem value="unverified" className="font-bold text-rose-500">Pendientes</SelectItem></SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Cuenta</Label>
                                <Select value={filterAccountId} onValueChange={setFilterAccountId}>
                                    <SelectTrigger className="h-11 bg-slate-50 dark:bg-meta-4 border-stroke dark:border-strokedark rounded-md font-bold italic"><SelectValue placeholder="Todas" /></SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-boxdark border-stroke dark:border-strokedark rounded-md"><SelectItem value="all" className="font-bold">Todas las cuentas</SelectItem>{accounts.map(acc => (<SelectItem key={acc.id} value={acc.id} className="font-bold">{acc.name}</SelectItem>))}</SelectContent>
                                </Select>
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Importe</Label>
                                <div className="flex gap-3"><Input type="number" placeholder="Min" value={filterMinAmount} onChange={(e) => setFilterMinAmount(e.target.value)} className="h-11 bg-slate-50 dark:bg-meta-4 border-stroke dark:border-strokedark rounded-md font-bold" /><Input type="number" placeholder="Max" value={filterMaxAmount} onChange={(e) => setFilterMaxAmount(e.target.value)} className="h-11 bg-slate-50 dark:bg-meta-4 border-stroke dark:border-strokedark rounded-md font-bold" /></div>
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Período</Label>
                                <div className="flex flex-col gap-2"><div className="flex gap-2"><Input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} className="h-11 bg-slate-50 dark:bg-meta-4 border-stroke dark:border-strokedark rounded-md font-bold w-full" /><Input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} className="h-11 bg-slate-50 dark:bg-meta-4 border-stroke dark:border-strokedark rounded-md font-bold w-full" /></div><div className="flex gap-2"><Button variant="ghost" onClick={() => setPresetDate("month")} className="h-7 text-[9px] font-black uppercase bg-slate-100 dark:bg-meta-4">Mes</Button><Button variant="ghost" onClick={() => setPresetDate("quarter")} className="h-7 text-[9px] font-black uppercase bg-slate-100 dark:bg-meta-4">Trimestre</Button><Button variant="ghost" onClick={() => setPresetDate("year")} className="h-7 text-[9px] font-black uppercase bg-slate-100 dark:bg-meta-4">Año</Button><Button onClick={clearFilters} variant="ghost" className="h-7 text-[9px] font-black uppercase ml-auto text-rose-500 bg-rose-50 dark:bg-rose-500/10">Reset</Button></div></div>
                            </div>
                        </div>
                    </div>
                )}
            </Card>

            {/* Bulk Actions Bar */}
            {selectedIds.length > 0 && (
                <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl flex items-center justify-between animate-in slide-in-from-top-4 duration-300 Sub-Header-Actions no-print">
                    <div className="flex items-center gap-4">
                        <div onClick={toggleSelectAll} className="cursor-pointer">
                            {selectedIds.length === transactions.length ? (
                                <CheckCircle className="w-5 h-5 text-primary" />
                            ) : (
                                <div className="w-5 h-5 border-2 border-primary/30 rounded-full flex items-center justify-center">
                                    <div className="w-2 h-2 bg-primary rounded-full" />
                                </div>
                            )}
                        </div>
                        <span className="text-sm font-bold text-primary uppercase tracking-widest">
                            {selectedIds.length} Seleccionados
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            onClick={() => setIsBulkEditModalOpen(true)}
                            className="h-10 px-4 gap-2 text-[10px] font-black uppercase text-primary hover:bg-primary/20"
                        >
                            <Settings className="w-4 h-4" /> Edición Masiva
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={handleBulkDelete}
                            disabled={isBulkDeleting}
                            className="h-10 px-4 gap-2 text-[10px] font-black uppercase text-rose-500 hover:bg-rose-500/10"
                        >
                            {isBulkDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            Eliminar
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => setSelectedIds([])}
                            className="h-10 w-10 p-0 text-slate-400 hover:text-black dark:hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            )}

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-xl bg-white dark:bg-boxdark border-none shadow-2xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
                    <DialogHeader className="bg-boxdark p-8 text-white"><DialogTitle className="text-xl font-bold uppercase">{editingTx ? "Editar" : "Nuevo"} Movimiento</DialogTitle></DialogHeader>
                    <div className="p-8 space-y-6 overflow-y-auto">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400">Tipo</Label><Select value={type} onValueChange={setType}><SelectTrigger className="h-11 bg-slate-50 dark:bg-meta-4 font-bold"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="GASTO" className="text-rose-500 font-bold">GASTO</SelectItem><SelectItem value="INGRESO" className="text-emerald-500 font-bold">INGRESO</SelectItem><SelectItem value="TRASPASO" className="text-primary font-bold">TRASPASO</SelectItem></SelectContent></Select></div>
                            <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400">Importe</Label><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="h-11 font-black text-lg text-primary text-center bg-primary/5" /></div>
                        </div>
                        <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400">Descripción</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} className="h-11 font-bold" /></div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400">Cuenta</Label><Select value={accountId} onValueChange={setAccountId}><SelectTrigger className="h-11 font-bold"><SelectValue placeholder="Elegir..." /></SelectTrigger><SelectContent>{accounts.map(acc => (<SelectItem key={acc.id} value={acc.id} className="font-bold">{acc.name}</SelectItem>))}</SelectContent></Select></div>
                            <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400">Fecha</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11 font-bold" /></div>
                        </div>
                        {type === "TRASPASO" ? (
                            <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400 text-primary">Cuenta Destino</Label><Select value={destinationAccountId} onValueChange={setDestinationAccountId}><SelectTrigger className="h-11 font-bold text-primary bg-primary/5"><SelectValue placeholder="Seleccionar..." /></SelectTrigger><SelectContent>{accounts.filter(a => a.id !== accountId).map(acc => (<SelectItem key={acc.id} value={acc.id} className="font-bold">{acc.name}</SelectItem>))}</SelectContent></Select></div>
                        ) : (
                            <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400">Categoría</Label><Select value={categoryId} onValueChange={setCategoryId}><SelectTrigger className="h-11 font-bold"><SelectValue placeholder="Opcional..." /></SelectTrigger><SelectContent>{categories.map(cat => (<SelectItem key={cat.id} value={cat.id} className="font-bold">{cat.name}</SelectItem>))}</SelectContent></Select></div>
                        )}
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400">Adjuntos</Label>
                            <Input type="file" multiple onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))} className="h-11 text-xs" />
                        </div>
                    </div>
                    <DialogFooter className="p-8 bg-slate-50 dark:bg-meta-4/20 border-t flex flex-row gap-3">
                        <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1 uppercase text-[10px] font-black">Cancelar</Button>
                        <Button onClick={handleSave} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white uppercase text-[10px] font-black">{isUploading ? "Guardando..." : "Registrar"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Card className="bg-white dark:bg-boxdark border-none shadow-sm overflow-hidden">
                <div className="hidden md:grid grid-cols-12 bg-slate-50 dark:bg-meta-4/20 px-6 py-4 border-b border-stroke dark:border-strokedark">
                    <div className="col-span-5 flex items-center gap-4">
                        <div className="w-5" />
                        <button
                            onClick={() => requestSort('description')}
                            className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest pl-10 hover:text-primary transition-colors group"
                        >
                            <span className="underline decoration-primary decoration-2 underline-offset-4">Descripción y Detalles</span>
                            {sortConfig?.key === 'description' && (
                                sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                            )}
                        </button>
                    </div>
                    <div className="col-span-2 flex items-center justify-center">
                        <button
                            onClick={() => requestSort('date')}
                            className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest hover:text-primary transition-colors group"
                        >
                            Fecha
                            {sortConfig?.key === 'date' && (
                                sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                            )}
                        </button>
                    </div>
                    <div className="col-span-2 flex items-center justify-center">
                        <button
                            onClick={() => requestSort('isVerified')}
                            className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest hover:text-primary transition-colors group"
                        >
                            Estado
                            {sortConfig?.key === 'isVerified' && (
                                sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                            )}
                        </button>
                    </div>
                    <div className="col-span-3 flex items-center justify-end">
                        <button
                            onClick={() => requestSort('amount')}
                            className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest pr-10 hover:text-primary transition-colors group"
                        >
                            {sortConfig?.key === 'amount' && (
                                sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                            )}
                            Importe
                        </button>
                    </div>
                </div>
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4"><Loader2 className="w-8 h-8 animate-spin text-primary" /><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Cargando Libro Diario...</p></div>
                ) : transactions.length === 0 ? (
                    <div className="py-20 text-center"><p className="text-slate-400 font-bold uppercase text-xs">No hay movimientos registrados</p></div>
                ) : (
                    <TransactionList
                        transactions={sortedTransactions}
                        selectedSet={selectedSet}
                        toggleSelect={toggleSelect}
                        handleToggleVerify={handleToggleVerify}
                        handleDelete={handleDelete}
                        setViewingTx={setViewingTx}
                        handleEdit={handleEdit}
                        handleClone={handleClone}
                        handleCloneToRecurring={handleCloneToRecurring}
                        filterAccountId={filterAccountId}
                    />
                )}

                {/* Summary Bar */}
                {!loading && transactions.length > 0 && (
                    <div className="bg-white dark:bg-boxdark border-t border-stroke dark:border-strokedark px-6 py-4">
                        <div className="flex flex-wrap items-center justify-end gap-4 md:gap-8">
                            <div className="flex items-center gap-3">
                                <div className="flex flex-col items-end">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total Ingresos</span>
                                    <span className="text-sm font-bold text-emerald-500">+{formatCurrency(summaryStats.income)}</span>
                                </div>
                                <div className="h-8 w-[2px] bg-emerald-500/20 rounded-full" />
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="flex flex-col items-end">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total Gastos</span>
                                    <span className="text-sm font-bold text-rose-500">-{formatCurrency(summaryStats.expenses)}</span>
                                </div>
                                <div className="h-8 w-[2px] bg-rose-500/20 rounded-full" />
                            </div>

                            {(summaryStats.transfers > 0 || filterAccountId === "all") && (
                                <div className="flex items-center gap-3">
                                    <div className="flex flex-col items-end">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Volumen Traspasos</span>
                                        <span className="text-sm font-bold text-blue-500">{formatCurrency(summaryStats.transfers)}</span>
                                    </div>
                                    <div className="h-8 w-[2px] bg-blue-500/20 rounded-full" />
                                </div>
                            )}

                            <div className="flex items-center gap-3 bg-slate-50 dark:bg-meta-4/20 px-4 py-2 rounded-lg border border-stroke dark:border-strokedark shadow-sm">
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">Balance Neto</span>
                                    <span className={cn("text-base font-black tracking-tight", (summaryStats.income - summaryStats.expenses) >= 0 ? "text-emerald-500" : "text-rose-500")}>
                                        {(summaryStats.income - summaryStats.expenses) >= 0 ? "+" : ""}{formatCurrency(summaryStats.income - summaryStats.expenses)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Pagination Footer */}
                <div className="bg-slate-50 dark:bg-meta-4/10 px-6 py-4 border-t border-stroke dark:border-strokedark flex flex-col md:flex-row items-center justify-between gap-4 no-print">
                    <div className="flex items-center gap-4 order-2 md:order-1">
                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setCurrentPage(1)}
                                disabled={currentPage === 1 || loading}
                                className="h-8 w-8 rounded-md border-stroke dark:border-strokedark"
                            >
                                <ChevronsLeft className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1 || loading}
                                className="h-8 w-8 rounded-md border-stroke dark:border-strokedark"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                        </div>

                        <div className="flex items-center gap-2 font-black text-xs uppercase tracking-widest text-slate-400">
                            Página <span className="text-primary">{currentPage}</span> de <span className="text-black dark:text-white">{totalPages}</span>
                        </div>

                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages || loading}
                                className="h-8 w-8 rounded-md border-stroke dark:border-strokedark"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={currentPage === totalPages || loading}
                                className="h-8 w-8 rounded-md border-stroke dark:border-strokedark"
                            >
                                <ChevronsRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center gap-6 order-1 md:order-2">
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mostrar</span>
                            <Select value={pageSize} onValueChange={(val) => { setPageSize(val); setCurrentPage(1); }}>
                                <SelectTrigger className="h-9 w-24 bg-white dark:bg-boxdark border-stroke dark:border-strokedark font-bold text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-boxdark border-stroke dark:border-strokedark">
                                    <SelectItem value="25" className="font-bold">25</SelectItem>
                                    <SelectItem value="50" className="font-bold">50</SelectItem>
                                    <SelectItem value="100" className="font-bold">100</SelectItem>
                                    <SelectItem value="500" className="font-bold">500</SelectItem>
                                    <SelectItem value="all" className="font-bold">Todo</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 hidden lg:block">
                            Total: <span className="text-black dark:text-white">{totalTransactions}</span> Movimientos
                        </div>
                    </div>
                </div>
            </Card>

            {/* Bulk Edit Modal */}
            <Dialog open={isBulkEditModalOpen} onOpenChange={setIsBulkEditModalOpen}>
                <DialogContent className="sm:max-w-xl bg-white dark:bg-boxdark border-none shadow-2xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
                    <DialogHeader className="bg-boxdark p-8 text-white">
                        <DialogTitle className="text-xl font-bold uppercase tracking-tight">
                            Edición Masiva
                        </DialogTitle>
                        <DialogDescription className="text-white/70 text-xs font-semibold uppercase tracking-widest italic mt-1">
                            Actualizando {selectedIds.length} movimientos seleccionados
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-8 space-y-6 overflow-y-auto">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400">Nuevo Tipo</Label>
                                <Select value={bulkType} onValueChange={setBulkType}>
                                    <SelectTrigger className="h-11 bg-slate-50 dark:bg-meta-4 font-bold border-stroke dark:border-strokedark rounded-md">
                                        <SelectValue placeholder="Sin cambios" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-boxdark border-stroke dark:border-strokedark rounded-md">
                                        <SelectItem value="no_change" className="font-bold">Mantener actuales</SelectItem>
                                        <SelectItem value="GASTO" className="text-rose-500 font-bold">GASTO</SelectItem>
                                        <SelectItem value="INGRESO" className="text-emerald-500 font-bold">INGRESO</SelectItem>
                                        <SelectItem value="TRASPASO" className="text-primary font-bold">TRASPASO</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400">Nueva Categoría</Label>
                                <Select value={bulkCategoryId} onValueChange={setBulkCategoryId}>
                                    <SelectTrigger className="h-11 bg-slate-50 dark:bg-meta-4 font-bold border-stroke dark:border-strokedark rounded-md">
                                        <SelectValue placeholder="Sin cambios" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-boxdark border-stroke dark:border-strokedark rounded-md">
                                        <SelectItem value="no_change" className="font-bold">Mantener actuales</SelectItem>
                                        {categories.map(cat => (
                                            <SelectItem key={cat.id} value={cat.id} className="font-bold">
                                                <div className="flex items-center gap-2 font-bold">{cat.name}</div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400">Nueva Cuenta (Origen)</Label>
                                <Select value={bulkAccountId} onValueChange={setBulkAccountId}>
                                    <SelectTrigger className="h-11 bg-slate-50 dark:bg-meta-4 font-bold border-stroke dark:border-strokedark rounded-md">
                                        <SelectValue placeholder="Sin cambios" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-boxdark border-stroke dark:border-strokedark rounded-md">
                                        <SelectItem value="no_change" className="font-bold">Mantener actuales</SelectItem>
                                        {accounts.map(acc => (
                                            <SelectItem key={acc.id} value={acc.id} className="font-bold">{acc.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {bulkType === "TRASPASO" && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-left-2">
                                    <Label className="text-[10px] font-black uppercase text-primary">Nueva Cuenta Destino</Label>
                                    <Select value={bulkDestinationAccountId} onValueChange={setBulkDestinationAccountId}>
                                        <SelectTrigger className="h-11 bg-primary/5 dark:bg-primary/10 border-primary/20 rounded-md font-bold text-primary">
                                            <SelectValue placeholder="Sin cambios" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-boxdark border-stroke dark:border-strokedark rounded-md">
                                            <SelectItem value="no_change" className="font-bold">Mantener actuales</SelectItem>
                                            {accounts.map(acc => (
                                                <SelectItem key={acc.id} value={acc.id} className="font-bold">{acc.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="p-8 bg-slate-50 dark:bg-meta-4/20 border-t border-stroke dark:border-strokedark flex flex-row gap-3">
                        <Button variant="ghost" onClick={() => setIsBulkEditModalOpen(false)} className="flex-1 rounded-md font-bold uppercase text-[10px] tracking-widest text-slate-400 h-12 transition-all hover:bg-slate-100 dark:hover:bg-white/5">Cancelar</Button>
                        <Button onClick={handleBulkUpdate} disabled={isBulkUpdating} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold uppercase text-[10px] tracking-widest h-12 shadow-md border-none transition-all active:scale-95">
                            {isBulkUpdating ? "Actualizando..." : "Aplicar Cambios"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

const TransactionList = memo(({ transactions, selectedSet, toggleSelect, handleToggleVerify, handleDelete, setViewingTx, handleEdit, handleClone, handleCloneToRecurring, filterAccountId }: any) => {
    return (<>{transactions.map((tx: any) => (<TransactionRow key={tx.id} tx={tx} isSelected={selectedSet.has(tx.id)} toggleSelect={toggleSelect} handleToggleVerify={handleToggleVerify} handleDelete={handleDelete} setViewingTx={setViewingTx} onEdit={handleEdit} onClone={handleClone} onCloneToRecurring={handleCloneToRecurring} filterAccountId={filterAccountId} />))}</>);
});

const TransactionRow = memo(({ tx, isSelected, toggleSelect, handleToggleVerify, handleDelete, setViewingTx, onEdit, onClone, onCloneToRecurring, filterAccountId }: any) => {

    return (
        <div className={cn("grid grid-cols-1 md:grid-cols-12 border-b border-stroke dark:border-strokedark px-6 py-6 hover:bg-slate-50 dark:hover:bg-meta-4/10 group", isSelected && "bg-primary/5")}>
            <div className="col-span-5 flex items-center gap-4">
                <div onClick={() => toggleSelect(tx.id)} className="cursor-pointer no-print">{isSelected ? <CheckCircle className="w-5 h-5 text-primary" /> : <Circle className="w-5 h-5 text-slate-300" />}</div>
                <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-md font-bold", tx.type === "INGRESO" ? "bg-emerald-500/10 text-emerald-600" : tx.type === "GASTO" ? "bg-rose-500/10 text-rose-600" : "bg-blue-500/10 text-blue-600")}>
                    {tx.type === "INGRESO" ? <ArrowDownLeft className="w-5 h-5" /> : tx.type === "GASTO" ? <ArrowUpRight className="w-5 h-5" /> : <ArrowLeftRight className="w-5 h-5" />}
                </div>
                <div className="flex flex-col min-w-0">
                    <p className="text-base font-bold text-black dark:text-white uppercase truncate">{tx.description}</p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                        <span style={{ color: tx.category?.color }}>{tx.category?.name || "Global"}</span>
                        <span>•</span>
                        <span style={{ color: tx.account?.color }}>{tx.account?.name}</span>
                    </div>
                </div>
            </div>
            <div className="md:col-span-2 flex items-center justify-center font-mono text-[11px] font-bold text-slate-400 uppercase tracking-widest">{formatDate(tx.date)}</div>
            <div className="md:col-span-2 flex items-center justify-center no-print">
                <button onClick={(e) => { e.stopPropagation(); handleToggleVerify(tx); }} className={cn("transition-all", tx.isVerified ? "text-emerald-500" : "text-slate-200 dark:text-slate-700")}>
                    {tx.isVerified ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                </button>
            </div>
            <div className="col-span-3 flex items-center justify-end gap-6 text-right">
                <p className={cn("text-lg font-bold tracking-tight", tx.type === "INGRESO" ? "text-emerald-500" : tx.type === "GASTO" ? "text-rose-500" : "text-blue-500")}>
                    {(() => {
                        if (tx.type === "GASTO") return "-";
                        if (tx.type === "INGRESO") return "+";
                        if (tx.type === "TRASPASO") {
                            const isOrigin = filterAccountId === tx.originAccountId || filterAccountId === tx.accountId;
                            const isDestination = filterAccountId === tx.destinationAccountId;
                            if (isOrigin) return "-";
                            if (isDestination) return "+";
                        }
                        return "";
                    })()}
                    {formatCurrency(Math.abs(tx.amount))}
                </p>
                <div className="actions-cell no-print">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 bg-slate-50 dark:bg-meta-4"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white dark:bg-boxdark p-2 rounded-xl shadow-2xl">
                            <DropdownMenuItem onClick={() => onEdit(tx)} className="font-bold flex gap-2 p-3 text-xs uppercase tracking-widest cursor-pointer hover:bg-slate-50 dark:hover:bg-meta-4/20 rounded-lg"><Pencil className="w-3.5 h-3.5" /> Editar</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onClone(tx)} className="font-bold flex gap-2 p-3 text-xs uppercase tracking-widest cursor-pointer hover:bg-slate-50 dark:hover:bg-meta-4/20 rounded-lg"><Copy className="w-3.5 h-3.5" /> Clonar Movimiento</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onCloneToRecurring(tx)} className="font-bold flex gap-2 p-3 text-xs uppercase tracking-widest text-blue-500 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg"><Repeat className="w-3.5 h-3.5" /> Programar Futuro</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(tx.id)} className="font-bold flex gap-2 p-3 text-xs uppercase tracking-widest text-rose-500 cursor-pointer hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg"><Trash2 className="w-3.5 h-3.5" /> Eliminar</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    );
});
