"use client";

import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";
import {
    Plus,
    Wallet,
    MoreVertical,
    Pencil,
    Trash2,
    AlertCircle,
    CheckCircle2,
    TrendingUp,
    ChevronLeft,
    ChevronRight,
    Calendar,
    Copy,
    Tag, ShoppingCart, Utensils, Car, Home, Zap, Heart, Briefcase, Plane, Gamepad2, GraduationCap, Gift
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MONTHS = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const iconMap: any = {
    Tag, ShoppingCart, Utensils, Car, Home, Zap, Heart, Briefcase, Plane, Gamepad2, GraduationCap, Gift
};

const BudgetCard = ({ budget, onEdit, onDelete }: { budget: any, onEdit: (b: any) => void, onDelete: (id: string) => void }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const progress = (budget.current / budget.limit) * 100;
    const isExceeded = progress >= 100;
    const isWarning = progress >= 80 && !isExceeded;

    return (
        <Card className="bg-white dark:bg-boxdark border-none shadow-sm p-6 hover:shadow-md transition-all group relative overflow-hidden">
            {/* Barra Lateral de Color de Categoría */}
            <div
                className="absolute left-0 top-0 bottom-0 w-1.5 opacity-80"
                style={{ backgroundColor: budget.category.color || "#3c50e0" }}
            />

            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-xl shadow-inner border border-stroke/20 dark:border-strokedark/20 transition-transform group-hover:scale-110"
                        style={{ backgroundColor: (budget.category.color || "#3c50e0") + '15', color: budget.category.color || "#3c50e0" }}
                    >
                        {(() => {
                            const Icon = iconMap[budget.category.icon] || Tag;
                            return <Icon className="w-6 h-6" />;
                        })()}
                    </div>
                    <div>
                        <h3 className="font-black text-black dark:text-white text-sm uppercase tracking-tight leading-none">{budget.category.name}</h3>
                        <p className="text-[9px] font-black text-slate-400 mt-1.5 uppercase tracking-widest flex items-center gap-1.5">
                            <Calendar className="w-3 h-3" /> Mensual
                        </p>
                    </div>
                </div>

                <Dialog open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild className="hidden md:flex">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-primary">
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-md border-stroke dark:border-strokedark bg-white dark:bg-boxdark shadow-lg">
                            <DropdownMenuItem onClick={() => onEdit(budget)} className="font-bold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-meta-4 gap-2 cursor-pointer uppercase tracking-widest p-3">
                                <Pencil className="w-3 h-3" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDelete(budget.id)} className="font-bold text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 gap-2 cursor-pointer uppercase tracking-widest p-3">
                                <Trash2 className="w-3 h-3" /> Eliminar
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-300 hover:text-primary md:hidden"
                        onClick={() => setIsMobileMenuOpen(true)}
                    >
                        <MoreVertical className="w-4 h-4" />
                    </Button>

                    <DialogContent className="w-[98vw] max-w-none m-0 rounded-t-[32px] rounded-b-none bg-white dark:bg-boxdark border-none shadow-[0_-10px_40px_rgba(0,0,0,0.3)] p-0 flex flex-col fixed bottom-0 left-0 right-0 top-auto translate-x-0 translate-y-0 max-h-[85vh] h-auto animate-in slide-in-from-bottom duration-300 z-[200]">
                        <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mt-4 mb-2 opacity-50" />

                        <DialogHeader className="px-8 pb-4 text-left">
                            <DialogTitle className="text-2xl font-black uppercase text-slate-800 dark:text-white tracking-tighter">Opciones de <span className="text-primary italic">Presupuesto</span></DialogTitle>
                            <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400 opacity-70">
                                GESTIÓN DE {budget.category.name}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex flex-col p-6 gap-3 pb-12 overflow-y-auto flex-1 min-h-0">
                            <Button onClick={() => { setIsMobileMenuOpen(false); onEdit(budget); }} variant="outline" className="h-16 justify-start px-6 rounded-2xl gap-5 border-none bg-slate-50 dark:bg-meta-4/20 hover:bg-slate-100 dark:hover:bg-meta-4/40 text-slate-700 dark:text-white font-black uppercase tracking-widest text-xs shadow-sm transition-all active:scale-[0.98]">
                                <div className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 rounded-xl shadow-sm text-primary"><Pencil className="w-5 h-5" /></div>
                                <span>Editar Límite</span>
                            </Button>

                            <div className="h-px bg-slate-100 dark:bg-slate-800/50 my-2" />

                            <Button onClick={() => { setIsMobileMenuOpen(false); onDelete(budget.id); }} variant="ghost" className="h-14 justify-center gap-2 rounded-2xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 font-black uppercase tracking-widest text-[10px] active:scale-[0.98] transition-all">
                                <Trash2 className="w-4 h-4" /> Eliminar Presupuesto
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="space-y-4">
                <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-black text-black dark:text-white tracking-tighter">{formatCurrency(budget.current)}</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">de {formatCurrency(budget.limit)}</span>
                </div>

                <div className="relative h-2.5 w-full bg-slate-100 dark:bg-meta-4 rounded-full overflow-hidden">
                    <div
                        className={cn(
                            "h-full transition-all duration-500 rounded-full",
                            isExceeded ? "bg-rose-500" : isWarning ? "bg-amber-500" : "bg-emerald-500"
                        )}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                </div>

                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                    <div className="flex items-center gap-1.5">
                        <span className={isExceeded ? "text-rose-500" : isWarning ? "text-amber-500" : "text-emerald-500"}>
                            {Math.round(progress)}% EJECUTADO
                        </span>
                        {isExceeded && <AlertCircle className="w-3 h-3 text-rose-500" />}
                    </div>
                    <span className="text-[#3c50e0]">
                        RESTAN: {formatCurrency(Math.max(0, budget.limit - budget.current))}
                    </span>
                </div>
            </div>
        </Card>
    );
};

export default function BudgetsPage() {
    const [budgets, setBudgets] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());

    // Form states
    const [selectedCategoryId, setSelectedCategoryId] = useState("");
    const [limit, setLimit] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedCloneMonths, setSelectedCloneMonths] = useState<number[]>([]);

    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    useEffect(() => {
        loadData();
    }, [currentMonth, currentYear]);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/budgets?month=${currentMonth}&year=${currentYear}`);
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    setBudgets(data);
                } else {
                    console.error("Format error: Budgets response is not an array", data);
                    setBudgets([]);
                }
            } else {
                console.error("API error loading budgets");
                setBudgets([]);
            }
        } catch (error) {
            console.error("Error loading budgets:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadCategories = async () => {
        try {
            const res = await fetch("/api/categories");
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    setCategories(data);
                }
            }
        } catch (error) {
            console.error("Error loading categories:", error);
        }
    };

    const handleSave = async () => {
        if (!selectedCategoryId || !limit) return;

        const url = editingId ? `/api/budgets/${editingId}` : "/api/budgets";
        const method = editingId ? "PUT" : "POST";

        try {
            const res = await fetch(url, {
                method,
                body: JSON.stringify({
                    categoryId: selectedCategoryId,
                    limit: parseFloat(limit),
                    month: currentMonth,
                    year: currentYear,
                    cloneMonths: selectedCloneMonths
                })
            });

            if (res.ok) {
                setIsModalOpen(false);
                loadData();
                resetForm();
            } else {
                const data = await res.json();
                alert(data.error || "Error al guardar el presupuesto");
            }
        } catch (error) {
            console.error("Error saving budget:", error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar este presupuesto?")) return;
        try {
            await fetch(`/api/budgets/${id}`, { method: "DELETE" });
            loadData();
        } catch (error) {
            console.error("Error deleting budget:", error);
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setSelectedCategoryId("");
        setLimit("");
        setSelectedCloneMonths([]);
    };

    const handleCopyPreviousMonth = async () => {
        if (!confirm("¿Deseas copiar todos los presupuestos del mes anterior a este mes?")) return;

        try {
            const res = await fetch("/api/budgets/copy-previous", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    targetMonth: currentMonth,
                    targetYear: currentYear
                })
            });

            if (res.ok) {
                loadData();
            } else {
                const data = await res.json();
                alert(data.error || "Error al copiar presupuestos");
            }
        } catch (error) {
            console.error("Error copying previous month budgets:", error);
        }
    };

    const openEditModal = (budget: any) => {
        setEditingId(budget.id);
        setSelectedCategoryId(budget.categoryId);
        setLimit(budget.limit.toString());
        setSelectedCloneMonths([]);
        setIsModalOpen(true);
    };

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)));
    };

    // Stats
    const totalBudget = budgets.reduce((acc, curr) => acc + curr.limit, 0);
    const totalSpent = budgets.reduce((acc, curr) => acc + curr.current, 0);
    const totalRemaining = totalBudget - totalSpent;

    return (
        <div className="space-y-8 pb-20">
            {/* Header / Breadcrumb */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-500">
                <div>
                    <h1 className="text-2xl font-bold text-black dark:text-white uppercase tracking-tight">
                        Presupuestos
                    </h1>
                    <nav className="flex mt-1">
                        <ol className="flex items-center space-x-2 text-xs font-semibold text-slate-500 uppercase tracking-widest">
                            <li><a href="/" className="hover:text-primary transition-colors">Dashboard</a></li>
                            <li><span className="mx-1">/</span></li>
                            <li className="text-primary">Presupuestos</li>
                        </ol>
                    </nav>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center bg-white dark:bg-boxdark rounded-md shadow-sm border border-stroke dark:border-strokedark p-1">
                        <Button variant="ghost" size="icon" onClick={prevMonth} className="h-9 w-9 text-slate-500 hover:text-primary rounded-md">
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <div className="min-w-[140px] text-center font-bold text-black dark:text-white uppercase tracking-widest text-[10px]">
                            {MONTHS[currentMonth - 1]} <span className="text-slate-400">{currentYear}</span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={nextMonth} className="h-9 w-9 text-slate-500 hover:text-primary rounded-md">
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>

                    <Button
                        onClick={() => { resetForm(); setIsModalOpen(true); }}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 px-6 rounded-md gap-2 shadow-md transition-all uppercase text-[10px] tracking-widest border-none"
                    >
                        <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Nuevo</span>
                    </Button>
                </div>
            </div>

            {/* Resumen Global */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-white dark:bg-boxdark border-none shadow-sm p-6 relative overflow-hidden group">
                    <div className="flex items-start justify-between relative z-10">
                        <div>
                            <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest mb-2">Presupuesto Total</p>
                            <h2 className="text-2xl font-black text-[#3c50e0] tracking-tight">{formatCurrency(totalBudget)}</h2>
                        </div>
                        <div className="p-3 bg-[#3c50e0]/10 rounded-lg text-[#3c50e0]">
                            <Wallet className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-[#3c50e0] opacity-20 group-hover:opacity-100 transition-opacity" />
                </Card>

                <Card className="bg-white dark:bg-boxdark border-none shadow-sm p-6 relative overflow-hidden group">
                    <div className="flex items-start justify-between relative z-10">
                        <div>
                            <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest mb-2">Gasto Consumido</p>
                            <h2 className="text-2xl font-black tracking-tight text-rose-500">
                                {formatCurrency(totalSpent)}
                            </h2>
                        </div>
                        <div className="p-3 rounded-lg bg-rose-500/10 text-rose-500">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-rose-500 opacity-20 group-hover:opacity-100 transition-opacity" />
                </Card>

                <Card className="bg-white dark:bg-boxdark border-none shadow-sm p-6 relative overflow-hidden group">
                    <div className="flex items-start justify-between relative z-10">
                        <div>
                            <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest mb-2">Disponible Global</p>
                            <h2 className="text-2xl font-black text-emerald-500 tracking-tight">{formatCurrency(totalRemaining)}</h2>
                        </div>
                        <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-500">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-500 opacity-20 group-hover:opacity-100 transition-opacity" />
                </Card>
            </div>

            {/* Lista de Presupuestos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {budgets.map((budget) => (
                    <BudgetCard
                        key={budget.id}
                        budget={budget}
                        onEdit={openEditModal}
                        onDelete={handleDelete}
                    />
                ))}
            </div>

            {budgets.length === 0 && !loading && (
                <div className="text-center py-20 bg-white dark:bg-boxdark border border-dashed border-stroke dark:border-strokedark rounded-md">
                    <div className="bg-slate-50 dark:bg-meta-4 p-5 rounded-full w-fit mx-auto mb-6">
                        <Wallet className="w-10 h-10 text-slate-300 dark:text-slate-500" />
                    </div>
                    <h3 className="text-lg font-black text-black dark:text-white uppercase tracking-tight mb-2">Fronteras Financieras Limpias</h3>
                    <p className="text-slate-500 text-xs font-medium max-w-xs mx-auto mb-8 tracking-tight">Crea un presupuesto para establecer límites inteligentes en tus categorías de gasto.</p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-[#3c50e0] hover:bg-opacity-90 text-white font-black h-11 px-8 rounded-md shadow-md uppercase text-[10px] tracking-widest"
                        >
                            Configurar Primer Límite
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleCopyPreviousMonth}
                            className="border-stroke dark:border-strokedark hover:bg-slate-50 dark:hover:bg-meta-4 font-black h-11 px-8 rounded-md uppercase text-[10px] tracking-widest gap-2"
                        >
                            <Copy className="w-4 h-4" /> Importar del mes anterior
                        </Button>
                    </div>
                </div>
            )}

            {/* Modal Crear/Editar */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="w-[95vw] sm:max-w-md bg-white dark:bg-boxdark rounded-2xl border-none shadow-2xl p-0 overflow-hidden max-h-[95vh] flex flex-col">
                    <DialogHeader className="bg-boxdark dark:bg-boxdark-2 p-6 md:p-8 text-white text-left relative overflow-hidden shrink-0">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full -mr-16 -mt-16" />
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20">
                                <Wallet className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl md:text-2xl font-black text-white uppercase tracking-tight leading-none mb-1.5">
                                    {editingId ? "Ajustar" : "Nuevo"} <span className="text-primary italic">Límite</span>
                                </DialogTitle>
                                <DialogDescription className="text-[10px] md:text-xs font-bold uppercase text-slate-400 tracking-widest leading-none opacity-70">
                                    Vigencia: <span className="text-primary font-black">{MONTHS[currentMonth - 1]} {currentYear}</span>
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                        {!editingId && (
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 opacity-70">Categoría Objetivo</Label>
                                <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                                    <SelectTrigger className="h-12 bg-slate-50 dark:bg-meta-4/20 border-none rounded-xl font-bold text-black dark:text-white shadow-sm focus:ring-2 focus:ring-primary/20 transition-all">
                                        <SelectValue placeholder="Seleccionar sector...">
                                            {categories.find(c => c.id === selectedCategoryId)?.name}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-boxdark border-none rounded-xl shadow-2xl z-[60] p-2">
                                        {categories.map((cat) => (
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

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 opacity-70">Tope Máximo</Label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 bg-primary/10 rounded-md text-primary font-black text-xs">€</div>
                                <Input
                                    type="number"
                                    value={limit}
                                    onChange={(e) => setLimit(e.target.value)}
                                    placeholder="0.00"
                                    className="h-12 bg-primary/5 dark:bg-primary/10 border-none rounded-xl font-black text-xl text-primary text-center pl-14 shadow-sm focus:ring-2 focus:ring-primary/20 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-4 p-5 bg-slate-50 dark:bg-meta-4/20 rounded-2xl border border-dashed border-stroke dark:border-strokedark/50">
                            <div className="flex flex-col gap-1.5 px-1">
                                <Label className="text-[10px] font-black uppercase text-black dark:text-white tracking-widest leading-none">Replicar en otros periodos</Label>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight opacity-70">
                                    SELECCIONA PARA CLONAR ESTE LÍMITE AUTOMÁTICAMENTE.
                                </p>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                {MONTHS.map((monthName, index) => {
                                    const monthNum = index + 1;
                                    const isSelected = selectedCloneMonths.includes(monthNum);
                                    const isCurrent = monthNum === currentMonth;

                                    if (isCurrent) return null;

                                    return (
                                        <button
                                            key={monthNum}
                                            type="button"
                                            onClick={() => {
                                                setSelectedCloneMonths(prev =>
                                                    prev.includes(monthNum)
                                                        ? prev.filter(m => m !== monthNum)
                                                        : [...prev, monthNum]
                                                );
                                            }}
                                            className={cn(
                                                "h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border shadow-sm",
                                                isSelected
                                                    ? "bg-blue-600 border-blue-600 text-white"
                                                    : "bg-white dark:bg-boxdark border-stroke dark:border-strokedark text-slate-500 hover:border-primary/50"
                                            )}
                                        >
                                            {monthName.substring(0, 3)}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-6 md:p-8 bg-slate-50 dark:bg-meta-4/20 border-t border-stroke dark:border-strokedark flex flex-row gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest text-slate-400 hover:text-rose-500 transition-colors"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={!selectedCategoryId || !limit}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black uppercase text-[10px] tracking-widest h-12 shadow-lg border-none active:scale-[0.98] transition-all"
                        >
                            {editingId ? "Actualizar" : "Confirmar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
