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
    Tags,
    Wallet,
    History,
    CheckCircle,
    Circle,
    Check,
    X,
    Loader2,
    Filter,
    ArrowRight
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
            {/* Header / Breadcrumbs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-500 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-black dark:text-white uppercase tracking-tight">
                        Movimientos Recurrentes
                    </h1>
                    <nav className="flex mt-1">
                        <ol className="flex items-center space-x-2 text-xs font-semibold text-slate-400 uppercase tracking-widest">
                            <li><Link href="/" className="hover:text-primary transition-colors">Dashboard</Link></li>
                            <li><span className="mx-1">/</span></li>
                            <li><Link href="/settings" className="hover:text-primary transition-colors">Configuración</Link></li>
                            <li><span className="mx-1">/</span></li>
                            <li className="text-primary">Recurrencias</li>
                        </ol>
                    </nav>
                </div>
                <Button
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 px-8 rounded-md gap-3 shadow-md transition-all active:scale-95 uppercase text-[10px] tracking-widest border-none"
                >
                    <Plus className="w-4 h-4" /> Nueva
                </Button>
            </div>

            {/* Bulk Actions Bar */}
            {selectedIds.length > 0 && (
                <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl flex items-center justify-between animate-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center gap-4">
                        <div onClick={toggleSelectAll} className="cursor-pointer">
                            {selectedIds.length === recurrences.length ? (
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
                            <Settings className="w-4 h-4" /> Editar Categoría/Cuenta
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

            {/* List */}
            <div className="grid grid-cols-1 gap-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-4 bg-white dark:bg-boxdark rounded-md">
                        <div className="w-10 h-10 border-4 border-slate-100 border-t-primary rounded-full animate-spin" />
                        <p className="font-bold text-xs uppercase tracking-widest">Sincronizando Suscripciones...</p>
                    </div>
                ) : recurrences.length === 0 ? (
                    <div className="p-20 text-center flex flex-col items-center gap-4 bg-white dark:bg-boxdark rounded-md border border-dashed border-stroke dark:border-strokedark">
                        <div className="w-16 h-16 bg-blue-50 dark:bg-meta-4 rounded-full flex items-center justify-center">
                            <Repeat className="w-8 h-8 text-blue-300" />
                        </div>
                        <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">No hay movimientos recurrentes activos</p>
                    </div>
                ) : (
                    recurrences.map((tx) => (
                        <Card key={tx.id} className={cn(
                            "group border-none shadow-sm dark:shadow-none transition-all duration-300 relative overflow-hidden",
                            tx.isPaused ? "bg-slate-50 dark:bg-meta-4/10 opacity-70" : "bg-white dark:bg-boxdark hover:shadow-md",
                            selectedIds.includes(tx.id) && "ring-2 ring-primary ring-inset"
                        )}>
                            <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: tx.category?.color || (tx.type === 'TRASPASO' ? '#3c50e0' : '#94a3b8') }} />

                            <div className="p-5 flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-4 flex-1">
                                    <div
                                        onClick={() => toggleSelect(tx.id)}
                                        className="cursor-pointer transition-all active:scale-90"
                                    >
                                        {selectedIds.includes(tx.id) ? (
                                            <CheckCircle className="w-6 h-6 text-primary" />
                                        ) : (
                                            <Circle className="w-6 h-6 text-slate-300 dark:text-slate-700" />
                                        )}
                                    </div>
                                    <div className={cn(
                                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-md text-sm font-bold border",
                                        tx.type === "INGRESO" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/10" :
                                            tx.type === "GASTO" ? "bg-rose-500/10 text-rose-600 border-rose-500/10" : "bg-blue-500/10 text-blue-600 border-blue-500/10"
                                    )}>
                                        {tx.type === "INGRESO" ? <ArrowDownLeft className="w-6 h-6" /> :
                                            tx.type === "GASTO" ? <ArrowUpRight className="w-6 h-6" /> : <ArrowLeftRight className="w-6 h-6" />}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-3">
                                            <h4 className="font-bold text-black dark:text-white uppercase tracking-tight text-base truncate">{tx.description}</h4>
                                            {tx.isPaused && (
                                                <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest">Pausado</span>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[12px] font-bold uppercase tracking-widest">
                                            <span style={{ color: tx.category?.color || '#94a3b8' }}>{tx.category?.name || "Global"}</span>
                                            <span className="text-slate-300 dark:text-slate-600">•</span>
                                            <span style={{ color: tx.account?.color || '#3c50e0' }}>{tx.account?.name}</span>
                                            <span className="text-slate-300 dark:text-slate-600">•</span>
                                            <span className="text-primary flex items-center gap-1">
                                                <Clock className="w-3 h-3" /> {tx.frequency?.name ||
                                                    (tx.recurrencePeriod ? `${tx.recurrencePeriod} ${tx.recurrenceInterval > 1 ? `(x${tx.recurrenceInterval})` : ''}` : "Mensual")}
                                            </span>
                                            <span className="text-slate-300 dark:text-slate-600">•</span>
                                            <span className="text-amber-600 dark:text-amber-500 flex items-center gap-1">
                                                <Calendar className="w-3 h-3" /> Próximo: {formattedNextDate(calculateNextDate(tx))}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-2 pr-4 border-r border-stroke dark:border-strokedark">
                                    <p className={cn(
                                        "text-2xl font-black tracking-tight",
                                        tx.type === "INGRESO" ? "text-emerald-500" :
                                            tx.type === "GASTO" ? "text-rose-500" : "text-blue-500"
                                    )}>
                                        {tx.type === "GASTO" ? "-" : tx.type === "INGRESO" ? "+" : ""}{formatCurrency(Math.abs(tx.amount))}
                                    </p>
                                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                                        {tx.recurrenceInterval} ejecuciones rest.
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleExecute(tx.id)}
                                        className="h-10 w-10 rounded-md bg-blue-50 dark:bg-blue-500/10 text-blue-500 border border-blue-200 dark:border-blue-500/20 hover:bg-blue-100 dark:hover:bg-blue-500/20"
                                        title="Ejecutar ahora"
                                    >
                                        <PlayCircle className="w-5 h-5" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleTogglePause(tx)}
                                        className={cn(
                                            "h-10 w-10 rounded-md border transition-all",
                                            tx.isPaused
                                                ? "bg-emerald-50 text-emerald-500 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20"
                                                : "bg-amber-50 text-amber-500 border-amber-200 hover:bg-amber-100 dark:bg-amber-500/10 dark:border-amber-500/20"
                                        )}
                                        title={tx.isPaused ? "Reanudar" : "Pausar"}
                                    >
                                        {tx.isPaused ? <PlayCircle className="w-5 h-5" /> : <PauseCircle className="w-5 h-5" />}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => openEdit(tx)}
                                        className="h-10 w-10 rounded-md bg-slate-50 dark:bg-meta-4 text-slate-400 hover:text-primary border border-stroke dark:border-strokedark transition-colors"
                                    >
                                        <Settings className="w-5 h-5" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDelete(tx.id)}
                                        className="h-10 w-10 rounded-md bg-slate-50 dark:bg-meta-4 text-slate-400 hover:text-rose-500 border border-stroke dark:border-strokedark transition-colors"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            {/* Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-lg bg-white dark:bg-boxdark border-none shadow-2xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
                    <DialogHeader className="bg-boxdark dark:bg-boxdark-2 p-8 text-white space-y-1">
                        <DialogTitle className="text-xl font-bold uppercase tracking-tight">
                            {editingTx ? "Editar" : "Nueva"}
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 text-xs font-semibold uppercase tracking-widest italic opacity-70">
                            Configuración de flujo automatizado
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-8 space-y-6 overflow-y-auto">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Tipo</Label>
                                <Select value={type} onValueChange={setType}>
                                    <SelectTrigger className="h-11 bg-slate-50 dark:bg-meta-4 border-stroke dark:border-strokedark rounded-md font-bold">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-boxdark border-stroke dark:border-strokedark rounded-md">
                                        <SelectItem value="GASTO" className="text-rose-500 font-bold">GASTO</SelectItem>
                                        <SelectItem value="INGRESO" className="text-emerald-500 font-bold">INGRESO</SelectItem>
                                        <SelectItem value="TRASPASO" className="text-primary font-bold">TRASPASO</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Importe</Label>
                                <Input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="h-11 bg-primary/5 dark:bg-primary/10 border-stroke dark:border-strokedark rounded-md font-black text-lg text-primary text-center"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Descripción / Alias</Label>
                            <Input
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Ej: Netflix, Nómina, Alquiler..."
                                className="h-11 bg-slate-50 dark:bg-meta-4 border-stroke dark:border-strokedark rounded-md font-bold"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Cuenta</Label>
                                <Select value={accountId} onValueChange={setAccountId}>
                                    <SelectTrigger className="h-11 bg-slate-50 dark:bg-meta-4 border-stroke dark:border-strokedark rounded-md font-bold">
                                        <SelectValue placeholder="Elegir..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-boxdark border-stroke dark:border-strokedark rounded-md">
                                        {accounts.map(acc => (
                                            <SelectItem key={acc.id} value={acc.id} className="font-bold">{acc.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Frecuencia Personalizada</Label>
                                <Select value={frequencyId} onValueChange={setFrequencyId}>
                                    <SelectTrigger className="h-11 bg-primary/5 dark:bg-primary/10 border-primary/20 rounded-md font-bold text-primary">
                                        <SelectValue placeholder="Opcional..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-boxdark border-stroke dark:border-strokedark rounded-md">
                                        <SelectItem value="none" className="font-bold">Ninguna (Usar estándar)</SelectItem>
                                        {frequencies.map(f => (
                                            <SelectItem key={f.id} value={f.id} className="font-bold">{f.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {!frequencyId || frequencyId === "none" ? (
                            <div className="grid grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2">
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
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Nº de Ejecuciones</Label>
                                    <Input
                                        type="number"
                                        value={recurrenceInterval}
                                        onChange={(e) => setRecurrenceInterval(parseInt(e.target.value) || 1)}
                                        min="1"
                                        className="h-11 bg-slate-50 dark:bg-meta-4 border-stroke dark:border-strokedark rounded-md font-bold"
                                    />
                                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 italic">
                                        Se pausará tras llegar a 0.
                                    </p>
                                </div>
                            </div>
                        ) : null}

                        {type === "TRASPASO" ? (
                            <div className="space-y-2 animate-in fade-in slide-in-from-left-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Cuenta Destino</Label>
                                <Select value={destinationAccountId} onValueChange={setDestinationAccountId}>
                                    <SelectTrigger className="h-11 bg-primary/5 dark:bg-primary/10 border-primary/20 rounded-md font-bold text-primary">
                                        <SelectValue placeholder="Seleccionar destino..." />
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
                                    <SelectTrigger className="h-11 bg-slate-50 dark:bg-meta-4 border-stroke dark:border-strokedark rounded-md font-bold">
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

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Próxima Ejecución</Label>
                            <Input
                                type="date"
                                value={nextDate}
                                onChange={(e) => setNextDate(e.target.value)}
                                className="h-11 bg-amber-50 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/20 rounded-md font-bold text-amber-600"
                            />
                            <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 italic">
                                El movimiento se generará automáticamente a partir de este día.
                            </p>
                        </div>

                        <div className="flex items-center justify-between h-14 px-5 bg-slate-50 dark:bg-meta-4/20 border border-stroke dark:border-strokedark rounded-md">
                            <div className="flex flex-col">
                                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest cursor-pointer" htmlFor="pause">Estado</Label>
                                <span className="text-[9px] text-slate-400 font-bold uppercase italic">Pausar generación</span>
                            </div>
                            <Switch id="pause" checked={isPaused} onCheckedChange={setIsPaused} />
                        </div>
                    </div>

                    <DialogFooter className="p-8 bg-slate-50 dark:bg-meta-4/20 border-t border-stroke dark:border-strokedark flex flex-row gap-3">
                        <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1 rounded-md font-bold uppercase text-[10px] tracking-widest text-slate-400 h-12">Cancelar</Button>
                        <Button onClick={handleSave} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold uppercase text-[10px] tracking-widest h-12 shadow-md border-none">
                            {editingTx ? "Actualizar" : "Activar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Bulk Edit Modal */}
            <Dialog open={isBulkEditModalOpen} onOpenChange={setIsBulkEditModalOpen}>
                <DialogContent className="sm:max-w-md bg-white dark:bg-boxdark border-none shadow-2xl p-0 overflow-hidden">
                    <DialogHeader className="bg-primary p-8 text-white">
                        <DialogTitle className="text-xl font-bold uppercase tracking-tight">
                            Edición Masiva
                        </DialogTitle>
                        <DialogDescription className="text-white/70 text-xs font-semibold uppercase tracking-widest italic">
                            Actualizando {selectedIds.length} recurrencias seleccionadas
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-8 space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Nueva Categoría</Label>
                                <Select value={bulkCategoryId} onValueChange={setBulkCategoryId}>
                                    <SelectTrigger className="h-11 bg-slate-50 dark:bg-meta-4 border-stroke dark:border-strokedark rounded-md font-bold italic">
                                        <SelectValue placeholder="Sin cambios" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-boxdark border-stroke dark:border-strokedark rounded-md">
                                        <SelectItem value="no_change" className="font-bold">Mantener actuales</SelectItem>
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
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Nueva Cuenta</Label>
                                <Select value={bulkAccountId} onValueChange={setBulkAccountId}>
                                    <SelectTrigger className="h-11 bg-slate-50 dark:bg-meta-4 border-stroke dark:border-strokedark rounded-md font-bold italic">
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
                        </div>
                    </div>

                    <DialogFooter className="p-8 bg-slate-50 dark:bg-meta-4/20 border-t border-stroke dark:border-strokedark flex flex-row gap-3">
                        <Button variant="ghost" onClick={() => setIsBulkEditModalOpen(false)} className="flex-1 rounded-md font-bold uppercase text-[10px] tracking-widest text-slate-400 h-12">Cancelar</Button>
                        <Button onClick={handleBulkUpdate} disabled={isBulkUpdating} className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-md font-bold uppercase text-[10px] tracking-widest h-12 shadow-md border-none">
                            {isBulkUpdating ? "Actualizando..." : "Aplicar Cambios"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
