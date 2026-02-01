"use client";

import { useState, useEffect } from "react";
import {
    Repeat,
    Plus,
    PauseCircle,
    PlayCircle,
    Trash2,
    Settings,
    ArrowUpRight,
    ArrowDownLeft,
    ArrowLeftRight,
    Calendar,
    Clock,
    CheckCircle,
    Circle,
    Check,
    X,
    Loader2,
    RefreshCcw,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency, formatDate as utilsFormatDate } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

export default function RecurringPage() {
    const [recurrences, setRecurrences] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [frequencies, setFrequencies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal & Form States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTx, setEditingTx] = useState<any>(null);
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [type, setType] = useState("GASTO");
    const [accountId, setAccountId] = useState("");
    const [destinationAccountId, setDestinationAccountId] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [isPaused, setIsPaused] = useState(false);
    const [frequencyId, setFrequencyId] = useState("none");
    const [recurrencePeriod, setRecurrencePeriod] = useState("MENSUAL");
    const [recurrenceInterval, setRecurrenceInterval] = useState(1);
    const [nextDate, setNextDate] = useState(new Date().toISOString().split('T')[0]);

    // Bulk Actions state
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
    const [bulkCategoryId, setBulkCategoryId] = useState("no_change");
    const [bulkAccountId, setBulkAccountId] = useState("no_change");
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [isBulkUpdating, setIsBulkUpdating] = useState(false);

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === recurrences.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(recurrences.map(r => r.id));
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`¿Estás seguro de que deseas eliminar ${selectedIds.length} recurrencias?`)) return;

        setIsBulkDeleting(true);
        try {
            const res = await fetch("/api/subscriptions/bulk-delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: selectedIds })
            });

            if (res.ok) {
                setSelectedIds([]);
                loadData();
            } else {
                throw new Error("Error deleting subscriptions");
            }
        } catch (error) {
            console.error("Error bulk deleting:", error);
            alert("Error al eliminar las recurrencias");
        } finally {
            setIsBulkDeleting(false);
        }
    };

    const handleBulkUpdate = async () => {
        if (bulkCategoryId === "no_change" && bulkAccountId === "no_change") {
            alert("No has seleccionado ningún cambio para aplicar");
            return;
        }

        setIsBulkUpdating(true);
        try {
            const res = await fetch("/api/subscriptions/bulk-update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ids: selectedIds,
                    categoryId: bulkCategoryId === "no_change" ? undefined : bulkCategoryId,
                    accountId: bulkAccountId === "no_change" ? undefined : bulkAccountId
                })
            });

            if (res.ok) {
                setSelectedIds([]);
                setIsBulkEditModalOpen(false);
                loadData();
            } else {
                throw new Error("Error updating subscriptions");
            }
        } catch (error) {
            console.error("Error bulk updating:", error);
            alert("Error al actualizar las recurrencias");
        } finally {
            setIsBulkUpdating(false);
        }
    };

    const handleExecute = async (id: string) => {
        if (!confirm("¿Ejecutar esta recurrencia manualmente ahora? Se creará un nuevo movimiento y la fecha programada avanzará al siguiente ciclo.")) return;

        try {
            const res = await fetch(`/api/subscriptions/${id}/execute`, {
                method: "POST"
            });

            if (res.ok) {
                loadData();
            } else {
                const data = await res.json();
                alert(data.error || "Error al ejecutar la recurrencia");
            }
        } catch (error) {
            console.error("Error executing subscription:", error);
            alert("Error de conexión al ejecutar la recurrencia");
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [recRes, accRes, catRes, freqRes] = await Promise.all([
                fetch("/api/subscriptions"),
                fetch("/api/accounts"),
                fetch("/api/categories"),
                fetch("/api/frequencies")
            ]);

            const [recData, accData, catData, freqData] = await Promise.all([
                recRes.json(),
                accRes.json(),
                catRes.json(),
                freqRes.json()
            ]);

            setRecurrences(Array.isArray(recData) ? recData : []);
            setAccounts(accData);
            setCategories(catData);
            setFrequencies(Array.isArray(freqData) ? freqData : []);
        } catch (error) {
            console.error("Error loading subscriptions:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        const payload = {
            amount: parseFloat(amount),
            description,
            type,
            accountId,
            destinationAccountId: type === "TRASPASO" ? destinationAccountId : null,
            originAccountId: accountId,
            categoryId: type === "TRASPASO" ? null : categoryId,
            nextExecutionDate: new Date(nextDate).toISOString(),
            isPaused,
            frequencyId: (frequencyId && frequencyId !== "none") ? frequencyId : null,
            recurrencePeriod: (!frequencyId || frequencyId === "none") ? recurrencePeriod : null,
            recurrenceInterval: (!frequencyId || frequencyId === "none") ? (parseInt(recurrenceInterval.toString()) || 1) : null
        };

        const method = editingTx ? "PUT" : "POST";
        const url = editingTx ? `/api/subscriptions/${editingTx.id}` : "/api/subscriptions";

        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            setIsModalOpen(false);
            loadData();
            resetForm();
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar esta recurrencia? Los movimientos generados anteriormente se mantendrán.")) return;
        const res = await fetch(`/api/subscriptions/${id}`, { method: "DELETE" });
        if (res.ok) loadData();
    };

    const handleTogglePause = async (sub: any) => {
        const res = await fetch(`/api/subscriptions/${sub.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isPaused: !sub.isPaused })
        });
        if (res.ok) loadData();
    };

    const resetForm = () => {
        setEditingTx(null);
        setAmount("");
        setDescription("");
        setType("GASTO");
        setAccountId("");
        setDestinationAccountId("");
        setCategoryId("");
        setIsPaused(false);
        setFrequencyId("none");
        setRecurrencePeriod("MENSUAL");
        setRecurrenceInterval(1);
        setNextDate(new Date().toISOString().split('T')[0]);
    };

    const openEdit = (sub: any) => {
        setEditingTx(sub);
        setAmount(Math.abs(sub.amount).toString());
        setDescription(sub.description || "");
        setType(sub.type);
        setAccountId(sub.accountId);
        setDestinationAccountId(sub.destinationAccountId || "");
        setCategoryId(sub.categoryId || "");
        setIsPaused(sub.isPaused || false);
        setFrequencyId(sub.frequencyId || "none");
        setRecurrencePeriod(sub.recurrencePeriod || "MENSUAL");
        setRecurrenceInterval(sub.recurrenceInterval || 1);
        setNextDate(new Date(sub.nextExecutionDate).toISOString().split('T')[0]);
        setIsModalOpen(true);
    };

    const calculateNextDate = (sub: any) => {
        return new Date(sub.nextExecutionDate);
    };

    const formattedNextDate = (date: Date) => {
        return utilsFormatDate(date);
    };

    return (
        <div className="space-y-6">
            {/* Header / Breadcrumb */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 px-4 md:px-0">
                <div>
                    <h1 className="text-3xl font-black text-black dark:text-white uppercase tracking-tight leading-none mb-2">
                        Recurrencias
                    </h1>
                    <nav className="flex items-center space-x-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] opacity-70">
                        <Link href="/" className="hover:text-primary transition-colors">Dashboard</Link>
                        <span>/</span>
                        <Link href="/settings" className="hover:text-primary transition-colors">Configuración</Link>
                        <span>/</span>
                        <span className="text-primary">Recurrencias</span>
                    </nav>
                </div>
                <Button
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="bg-primary hover:bg-primary-dark text-white font-black h-14 md:h-12 px-8 rounded-xl gap-3 shadow-lg shadow-primary/20 transition-all active:scale-95 uppercase text-[10px] tracking-[0.2em] border-none w-full md:w-auto"
                >
                    <Plus className="w-5 h-5" /> Nueva Recurrencia
                </Button>
            </div>

            {/* Bulk Actions Bar */}
            {selectedIds.length > 0 && (
                <div className="mx-4 md:mx-0 bg-slate-900 dark:bg-boxdark border-none p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in slide-in-from-top-6 duration-500 shadow-2xl relative overflow-hidden group mb-8">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-50" />
                    <div className="flex items-center gap-6 relative z-10">
                        <div
                            onClick={toggleSelectAll}
                            className="cursor-pointer w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center transition-all hover:scale-110 active:scale-95 border border-white/10"
                        >
                            {selectedIds.length === recurrences.length ? (
                                <CheckCircle className="w-5 h-5 text-primary shadow-[0_0_15px_rgba(60,80,224,0.5)]" />
                            ) : (
                                <div className="w-2.5 h-2.5 bg-white/20 rounded-sm" />
                            )}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-black text-white uppercase tracking-[0.1em]">
                                {selectedIds.length} Recurrencias
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                                Seleccionadas para acción masiva
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 relative z-10 w-full md:w-auto">
                        <Button
                            variant="ghost"
                            onClick={() => setIsBulkEditModalOpen(true)}
                            className="flex-1 md:flex-none h-11 px-6 gap-2 text-[10px] font-black uppercase text-slate-200 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                        >
                            <Settings className="w-4 h-4" /> <span>Editar</span>
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={handleBulkDelete}
                            disabled={isBulkDeleting}
                            className="flex-1 md:flex-none h-11 px-6 gap-2 text-[10px] font-black uppercase text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 rounded-xl transition-all"
                        >
                            {isBulkDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            <span>Eliminar</span>
                        </Button>
                        <div className="w-px h-8 bg-white/10 mx-2 hidden md:block" />
                        <Button
                            variant="ghost"
                            onClick={() => setSelectedIds([])}
                            className="h-11 w-11 p-0 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            )}

            {/* List */}
            <div className="grid grid-cols-1 gap-4 px-4 md:px-0">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-6 bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-sm">
                        <div className="relative">
                            <div className="w-12 h-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Clock className="w-4 h-4 text-primary animate-pulse" />
                            </div>
                        </div>
                        <p className="font-black text-[10px] uppercase tracking-[0.2em] text-primary">Sincronizando registros...</p>
                    </div>
                ) : recurrences.length === 0 ? (
                    <div className="p-24 text-center flex flex-col items-center gap-6 bg-white dark:bg-boxdark rounded-2xl border border-dashed border-stroke dark:border-strokedark shadow-sm animate-in fade-in zoom-in duration-500">
                        <div className="w-20 h-20 bg-blue-50 dark:bg-meta-4 rounded-3xl flex items-center justify-center shadow-inner">
                            <Repeat className="w-10 h-10 text-blue-300" />
                        </div>
                        <div>
                            <p className="text-black dark:text-white font-black uppercase text-xs tracking-widest mb-2">No hay movimientos activos</p>
                            <p className="text-slate-400 font-bold uppercase text-[9px] tracking-widest opacity-70 max-w-[200px] mx-auto leading-relaxed">Configura tus ciclos de pago y facturación automática.</p>
                        </div>
                    </div>
                ) : (
                    recurrences.map((tx) => (
                        <Card key={tx.id} className={cn(
                            "group border-none shadow-sm dark:shadow-none transition-all duration-300 relative overflow-hidden rounded-2xl",
                            tx.isPaused ? "bg-slate-50 dark:bg-meta-4/5 opacity-70" : "bg-white dark:bg-boxdark hover:shadow-xl hover:-translate-y-0.5",
                            selectedIds.includes(tx.id) && "ring-2 ring-primary ring-inset"
                        )}>
                            <div className="absolute top-0 left-0 w-1.5 md:w-2 h-full opacity-70" style={{ backgroundColor: tx.category?.color || (tx.type === 'TRASPASO' ? '#3c50e0' : '#94a3b8') }} />

                            <div className="p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-8">
                                <div className="flex items-start md:items-center gap-4 md:gap-6 flex-1">
                                    <div
                                        onClick={() => toggleSelect(tx.id)}
                                        className="cursor-pointer transition-all active:scale-90 mt-1.5 md:mt-0"
                                    >
                                        {selectedIds.includes(tx.id) ? (
                                            <CheckCircle className="w-6 h-6 text-primary shadow-sm" />
                                        ) : (
                                            <Circle className="w-6 h-6 text-slate-200 dark:text-slate-700 hover:text-primary/30 transition-colors" />
                                        )}
                                    </div>
                                    <div className={cn(
                                        "flex h-12 w-12 md:h-14 md:w-14 shrink-0 items-center justify-center rounded-2xl text-sm font-bold border shadow-inner transition-transform group-hover:scale-105",
                                        tx.type === "INGRESO" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/10" :
                                            tx.type === "GASTO" ? "bg-rose-500/10 text-rose-600 border-rose-500/10" : "bg-blue-500/10 text-blue-600 border-blue-500/10"
                                    )}>
                                        {tx.type === "INGRESO" ? <ArrowDownLeft className="w-6 h-6" /> :
                                            tx.type === "GASTO" ? <ArrowUpRight className="w-6 h-6" /> : <ArrowLeftRight className="w-6 h-6" />}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                            <h4 className="font-black text-black dark:text-white uppercase tracking-tight text-sm md:text-lg truncate group-hover:text-primary transition-colors">{tx.description}</h4>
                                            {tx.isPaused && (
                                                <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[8px] font-black rounded-lg uppercase tracking-widest border border-amber-500/20">
                                                    Pausado
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 dark:bg-meta-4/20 rounded-lg border border-stroke dark:border-strokedark shadow-sm">
                                                <div className="w-2 h-2 rounded-full shadow-inner" style={{ backgroundColor: tx.category?.color || '#94a3b8' }} />
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{tx.category?.name || "Global"}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 dark:bg-meta-4/20 rounded-lg border border-stroke dark:border-strokedark shadow-sm">
                                                <div className="w-2 h-2 rounded-full shadow-inner" style={{ backgroundColor: tx.account?.color || '#3c50e0' }} />
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{tx.account?.name}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/5 rounded-lg border border-primary/10 shadow-sm text-primary">
                                                <Clock className="w-3.5 h-3.5" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">
                                                    {tx.frequency?.name || (tx.recurrencePeriod ? `${tx.recurrencePeriod} ${tx.recurrenceInterval > 1 ? `(x${tx.recurrenceInterval})` : ''}` : "Mensual")}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3 md:gap-2">
                                    <div className="flex flex-col items-start md:items-end">
                                        <p className={cn("text-xl md:text-2xl font-black tracking-tight", tx.type === "INGRESO" ? "text-emerald-500" : tx.type === "GASTO" ? "text-rose-500" : "text-blue-500")}>
                                            {tx.type === "GASTO" ? "-" : tx.type === "INGRESO" ? "+" : ""}{formatCurrency(Math.abs(tx.amount))}
                                        </p>
                                        <div className="flex items-center gap-1.5 text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                            <Calendar className="w-3.5 h-3.5 text-primary opacity-50" />
                                            <span>Próximo: <span className="text-slate-600 dark:text-slate-300">{formattedNextDate(calculateNextDate(tx))}</span></span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 md:mt-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleExecute(tx.id)}
                                            className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-slate-50 dark:bg-meta-4 text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10 border border-stroke dark:border-strokedark group/btn"
                                            title="Ejecutar ahora"
                                        >
                                            <PlayCircle className="w-5 h-5 transition-transform group-hover/btn:scale-110" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleTogglePause(tx)}
                                            className={cn(
                                                "h-9 w-9 md:h-10 md:w-10 rounded-xl border border-stroke dark:border-strokedark group/btn",
                                                tx.isPaused ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-50 dark:bg-meta-4 text-slate-400 hover:text-primary hover:bg-primary/10"
                                            )}
                                            title={tx.isPaused ? "Reanudar" : "Pausar"}
                                        >
                                            {tx.isPaused ? <PlayCircle className="w-5 h-5 fill-current" /> : <PauseCircle className="w-5 h-5 transition-transform group-hover/btn:scale-110" />}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => openEdit(tx)}
                                            className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-slate-50 dark:bg-meta-4 text-slate-400 hover:text-primary hover:bg-primary/10 border border-stroke dark:border-strokedark group/btn"
                                            title="Ajustar"
                                        >
                                            <Settings className="w-4 h-4 transition-transform group-hover/btn:rotate-90" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(tx.id)}
                                            className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-slate-50 dark:bg-meta-4 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 border border-stroke dark:border-strokedark group/btn"
                                            title="Eliminar"
                                        >
                                            <Trash2 className="w-4 h-4 transition-transform group-hover/btn:scale-110" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            {/* Form Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="w-[95vw] sm:max-w-xl bg-white dark:bg-boxdark border-none shadow-2xl p-0 overflow-hidden flex flex-col max-h-[95vh] rounded-2xl">
                    <DialogHeader className="bg-boxdark dark:bg-boxdark-2 p-6 md:p-8 text-white text-left relative overflow-hidden shrink-0">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full -mr-16 -mt-16" />
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20">
                                <RefreshCcw className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl md:text-2xl font-black text-white uppercase tracking-tight leading-none mb-1.5">
                                    {editingTx ? "Editar" : "Nueva"} <span className="text-primary italic">Recurrencia</span>
                                </DialogTitle>
                                <DialogDescription className="text-[10px] md:text-xs font-bold uppercase text-slate-400 tracking-widest leading-none opacity-70">
                                    AUTOMATIZA TUS FLUJOS DE DINERO.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-6 md:p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 opacity-70">Tipo de Operación</Label>
                                <Select value={type} onValueChange={setType}>
                                    <SelectTrigger className="h-12 bg-slate-50 dark:bg-meta-4/20 border-none rounded-xl font-bold text-black dark:text-white shadow-sm focus:ring-2 focus:ring-primary/20 transition-all">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-boxdark border-none rounded-xl shadow-2xl z-[60] p-2">
                                        <SelectItem value="GASTO" className="text-rose-500 font-bold text-[10px] uppercase tracking-widest py-3 px-4 focus:bg-rose-500/5 cursor-pointer rounded-lg">GASTO</SelectItem>
                                        <SelectItem value="INGRESO" className="text-emerald-500 font-bold text-[10px] uppercase tracking-widest py-3 px-4 focus:bg-emerald-500/5 cursor-pointer rounded-lg">INGRESO</SelectItem>
                                        <SelectItem value="TRASPASO" className="text-primary font-bold text-[10px] uppercase tracking-widest py-3 px-4 focus:bg-primary/5 cursor-pointer rounded-lg">TRASPASO</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 opacity-70">Importe Fijo</Label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 bg-primary/10 rounded-md text-primary font-black text-xs">€</div>
                                    <Input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="h-12 bg-primary/5 dark:bg-primary/10 border-none rounded-xl font-black text-xl text-primary text-center pl-14 shadow-sm focus:ring-2 focus:ring-primary/20 transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 opacity-70">Nombre / Identificador</Label>
                            <Input
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Ej: Netflix, Nómina, Alquiler..."
                                className="h-12 bg-slate-50 dark:bg-meta-4/20 border-none rounded-xl font-bold text-black dark:text-white px-5 shadow-sm focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 opacity-70">Cuenta {type === "TRASPASO" ? "Origen" : ""}</Label>
                                <Select value={accountId} onValueChange={setAccountId}>
                                    <SelectTrigger className="h-12 bg-slate-50 dark:bg-meta-4/20 border-none rounded-xl font-bold text-black dark:text-white shadow-sm focus:ring-2 focus:ring-primary/20 transition-all">
                                        <SelectValue placeholder="Elegir..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-boxdark border-none rounded-xl shadow-2xl z-[60] p-2">
                                        {accounts.map(acc => (
                                            <SelectItem key={acc.id} value={acc.id} className="font-bold text-[10px] uppercase tracking-widest py-3 px-4 focus:bg-primary/5 cursor-pointer rounded-lg">{acc.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 opacity-70">Frecuencia Especial</Label>
                                <Select value={frequencyId} onValueChange={setFrequencyId}>
                                    <SelectTrigger className="h-12 bg-primary/5 dark:bg-primary/10 border-none rounded-xl font-bold text-primary shadow-sm focus:ring-2 focus:ring-primary/20 transition-all">
                                        <SelectValue placeholder="Opcional..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-boxdark border-none rounded-xl shadow-2xl z-[60] p-2">
                                        <SelectItem value="none" className="font-bold text-[10px] uppercase tracking-widest py-3 px-4 focus:bg-slate-50 cursor-pointer rounded-lg text-slate-400 italic">Ninguna (Usar tiempo)</SelectItem>
                                        {frequencies.map(f => (
                                            <SelectItem key={f.id} value={f.id} className="font-bold text-[10px] uppercase tracking-widest py-3 px-4 focus:bg-primary/5 cursor-pointer rounded-lg">{f.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {(!frequencyId || frequencyId === "none") && (
                            <div className="grid grid-cols-2 gap-6 p-5 bg-slate-50 dark:bg-meta-4/20 rounded-2xl border border-dashed border-stroke dark:border-strokedark/50 animate-in fade-in slide-in-from-top-2">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 opacity-70">Ciclo</Label>
                                    <Select value={recurrencePeriod} onValueChange={setRecurrencePeriod}>
                                        <SelectTrigger className="h-10 bg-white dark:bg-boxdark border-none rounded-xl font-bold text-black dark:text-white shadow-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-boxdark border-none rounded-xl shadow-2xl z-[60] p-2">
                                            <SelectItem value="DIARIO" className="font-bold text-[10px] uppercase tracking-widest py-2 px-4 rounded-lg">DIARIO</SelectItem>
                                            <SelectItem value="SEMANAL" className="font-bold text-[10px] uppercase tracking-widest py-2 px-4 rounded-lg">SEMANAL</SelectItem>
                                            <SelectItem value="MENSUAL" className="font-bold text-[10px] uppercase tracking-widest py-2 px-4 rounded-lg">MENSUAL</SelectItem>
                                            <SelectItem value="ANUAL" className="font-bold text-[10px] uppercase tracking-widest py-2 px-4 rounded-lg">ANUAL</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 opacity-70">Intervalo</Label>
                                    <Input
                                        type="number"
                                        value={recurrenceInterval}
                                        onChange={(e) => setRecurrenceInterval(parseInt(e.target.value) || 1)}
                                        min="1"
                                        className="h-10 bg-white dark:bg-boxdark border-none rounded-xl font-black text-center text-primary shadow-sm"
                                    />
                                </div>
                            </div>
                        )}

                        {type === "TRASPASO" ? (
                            <div className="space-y-2 p-5 bg-primary/5 dark:bg-primary/10 rounded-2xl border border-dashed border-primary/20 animate-in slide-in-from-left-2">
                                <Label className="text-[10px] font-black uppercase text-primary tracking-widest ml-1">Cuenta Destino</Label>
                                <Select value={destinationAccountId} onValueChange={setDestinationAccountId}>
                                    <SelectTrigger className="h-12 bg-white dark:bg-boxdark border-none rounded-xl font-bold text-primary shadow-sm focus:ring-2 focus:ring-primary/40 transition-all">
                                        <SelectValue placeholder="Seleccionar destino..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-boxdark border-none rounded-xl shadow-2xl z-[60] p-2">
                                        {accounts.filter(a => a.id !== accountId).map(acc => (
                                            <SelectItem key={acc.id} value={acc.id} className="font-bold text-[10px] uppercase tracking-widest py-3 px-4 focus:bg-primary/5 cursor-pointer rounded-lg">{acc.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 opacity-70">Categoría / Sector</Label>
                                <Select value={categoryId} onValueChange={setCategoryId}>
                                    <SelectTrigger className="h-12 bg-slate-50 dark:bg-meta-4/20 border-none rounded-xl font-bold text-black dark:text-white shadow-sm focus:ring-2 focus:ring-primary/20 transition-all">
                                        <SelectValue placeholder="Sin categoría (Global)..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-boxdark border-none rounded-xl shadow-2xl z-[60] p-2">
                                        {categories.map(cat => (
                                            <SelectItem key={cat.id} value={cat.id} className="font-bold text-[10px] uppercase tracking-widest py-3 px-4 focus:bg-primary/5 cursor-pointer rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                                                    {cat.name}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-end">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 opacity-70">Próxima Ejecución</Label>
                                <div className="relative group">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        type="date"
                                        value={nextDate}
                                        onChange={(e) => setNextDate(e.target.value)}
                                        className="h-12 pl-12 bg-amber-50 dark:bg-amber-500/5 border-none rounded-xl font-bold text-amber-600 shadow-sm focus:ring-2 focus:ring-amber-500/20 transition-all"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center justify-between h-12 px-5 bg-slate-50 dark:bg-meta-4/20 rounded-xl border border-stroke dark:border-strokedark/50">
                                <div className="flex flex-col">
                                    <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest cursor-pointer leading-none" htmlFor="pause">Pausar</Label>
                                </div>
                                <Switch id="pause" checked={isPaused} onCheckedChange={setIsPaused} />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-6 md:p-8 bg-slate-50 dark:bg-meta-4/20 border-t border-stroke dark:border-strokedark flex flex-row gap-3 shrink-0">
                        <Button
                            variant="ghost"
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 rounded-xl font-black uppercase text-[10px] tracking-widest text-slate-400 hover:text-rose-500 transition-colors h-12"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSave}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black uppercase text-[10px] tracking-widest h-12 shadow-lg border-none active:scale-[0.98] transition-all"
                        >
                            {editingTx ? "Guardar Cambios" : "Activar Recurrencia"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Bulk Edit Modal */}
            <Dialog open={isBulkEditModalOpen} onOpenChange={setIsBulkEditModalOpen}>
                <DialogContent className="w-[95vw] sm:max-w-xl bg-white dark:bg-boxdark border-none shadow-2xl p-0 overflow-hidden flex flex-col max-h-[95vh] rounded-2xl">
                    <DialogHeader className="bg-boxdark dark:bg-boxdark-2 p-6 md:p-8 text-white text-left relative overflow-hidden shrink-0">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full -mr-16 -mt-16" />
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20">
                                <Settings className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl md:text-2xl font-black text-white uppercase tracking-tight leading-none mb-1.5">
                                    Edición <span className="text-primary italic">Masiva</span>
                                </DialogTitle>
                                <DialogDescription className="text-[10px] md:text-xs font-bold uppercase text-slate-400 tracking-widest leading-none opacity-70">
                                    PROCESANDO {selectedIds.length} RECURRENCIAS.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 opacity-70">Nueva Categoría</Label>
                                <Select value={bulkCategoryId} onValueChange={setBulkCategoryId}>
                                    <SelectTrigger className="h-12 bg-slate-50 dark:bg-meta-4/20 border-none rounded-xl font-bold text-black dark:text-white shadow-sm focus:ring-2 focus:ring-primary/20 transition-all">
                                        <SelectValue placeholder="Mantener originales..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-boxdark border-none rounded-xl shadow-2xl z-[60] p-2">
                                        <SelectItem value="no_change" className="font-bold text-[10px] uppercase tracking-widest py-3 px-4 focus:bg-slate-50 cursor-pointer rounded-lg text-slate-400 italic">No modificar</SelectItem>
                                        {categories.map(cat => (
                                            <SelectItem key={cat.id} value={cat.id} className="font-bold text-[10px] uppercase tracking-widest py-3 px-4 focus:bg-primary/5 cursor-pointer rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                                                    {cat.name}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 opacity-70">Nueva Cuenta</Label>
                                <Select value={bulkAccountId} onValueChange={setBulkAccountId}>
                                    <SelectTrigger className="h-12 bg-slate-50 dark:bg-meta-4/20 border-none rounded-xl font-bold text-black dark:text-white shadow-sm focus:ring-2 focus:ring-primary/20 transition-all">
                                        <SelectValue placeholder="Mantener originales..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-boxdark border-none rounded-xl shadow-2xl z-[60] p-2">
                                        <SelectItem value="no_change" className="font-bold text-[10px] uppercase tracking-widest py-3 px-4 focus:bg-slate-50 cursor-pointer rounded-lg text-slate-400 italic">No modificar</SelectItem>
                                        {accounts.map(acc => (
                                            <SelectItem key={acc.id} value={acc.id} className="font-bold text-[10px] uppercase tracking-widest py-3 px-4 focus:bg-primary/5 cursor-pointer rounded-lg">{acc.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-6 md:p-8 bg-slate-50 dark:bg-meta-4/20 border-t border-stroke dark:border-strokedark flex flex-row gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => setIsBulkEditModalOpen(false)}
                            className="flex-1 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest text-slate-400 hover:text-rose-500 transition-colors"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleBulkUpdate}
                            disabled={isBulkUpdating}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black uppercase text-[10px] tracking-widest h-12 shadow-lg border-none active:scale-[0.98] transition-all"
                        >
                            {isBulkUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Aplicar Cambios
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
