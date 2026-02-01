"use client";

import { useState, useEffect } from "react";
import {
    Plus,
    Wallet,
    CreditCard,
    Building2,
    Smartphone,
    ArrowUpRight,
    ArrowDownLeft,
    ChevronRight,
    TrendingUp,
    History,
    Settings,
    Trash2,
    MoreVertical,
    Pencil,
    RefreshCw,
    Loader2
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency, formatShortDate } from "@/lib/utils";
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
import { Switch } from "@/components/ui/switch";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AccountsPage() {
    const [accounts, setAccounts] = useState<any[]>([]);
    const [accountTypes, setAccountTypes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<any>(null);

    // Reassign state
    const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
    const [accountToDelete, setAccountToDelete] = useState<any>(null);
    const [reassignToAccountId, setReassignToAccountId] = useState("");
    const [historyData, setHistoryData] = useState<any[]>([]);
    const [timeRange, setTimeRange] = useState("30");
    const [isRecalculating, setIsRecalculating] = useState(false);

    // Form states
    const [name, setName] = useState("");
    const [balance, setBalance] = useState("");
    const [typeId, setTypeId] = useState("");
    const [color, setColor] = useState("#fb923c");

    const [adjustModalOpen, setAdjustModalOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<any>(null);
    const [targetBalance, setTargetBalance] = useState("");

    useEffect(() => {
        loadData();
    }, [timeRange]);

    const loadData = async () => {
        setLoading(true);
        try {
            let startDateStr = "";
            let range = 30;

            if (timeRange !== "total") {
                range = parseInt(timeRange);
                const startDate = new Date();
                startDate.setDate(startDate.getDate() - range);
                startDateStr = startDate.toISOString();
            }

            const [accRes, typeRes, txRes] = await Promise.all([
                fetch("/api/accounts"),
                fetch("/api/account-types"),
                fetch(timeRange === "total" ? "/api/transactions" : `/api/transactions?startDate=${startDateStr}`)
            ]);

            const accountsData = await accRes.json();
            setAccounts(accountsData);
            setAccountTypes(await typeRes.json());

            if (txRes.ok) {
                const rawData = await txRes.json();
                const transactionsData = rawData.transactions || (Array.isArray(rawData) ? rawData : []);

                // Calcular historial de saldo
                const currentTotal = accountsData.reduce((sum: any, acc: any) => sum + parseFloat(acc.balance), 0);

                let daysToGenerate = range;

                if (timeRange === "total") {
                    if (transactionsData.length > 0) {
                        const oldestDate = new Date(transactionsData[transactionsData.length - 1].date);
                        const now = new Date();
                        const diffTime = Math.abs(now.getTime() - oldestDate.getTime());
                        daysToGenerate = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                    } else {
                        daysToGenerate = 30;
                    }
                }

                const days = Array.from({ length: daysToGenerate }, (_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    return d.toISOString().split('T')[0];
                });

                const txByDay = transactionsData.reduce((acc: any, tx: any) => {
                    const date = tx.date.split('T')[0];
                    if (!acc[date]) acc[date] = 0;
                    const amount = parseFloat(tx.amount);
                    if (tx.type === 'INGRESO') acc[date] += amount;
                    else if (tx.type === 'GASTO') acc[date] -= amount;
                    return acc;
                }, {});

                let runningBalance = currentTotal;
                const history = days.map(day => {
                    const balance = runningBalance;
                    const change = txByDay[day] || 0;
                    runningBalance -= change; // Retrocedemos en el tiempo
                    return {
                        date: formatShortDate(day),
                        balance
                    };
                }).reverse();

                setHistoryData(history);
            }
        } catch (error) {
            console.error("Error loading accounts:", error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setEditingAccount(null);
        setName("");
        setBalance("");
        setTypeId("");
        setColor("#fb923c");
    };

    const handleSave = async () => {
        const payload = editingAccount
            ? { name, typeId, color }
            : {
                name,
                initialBalance: parseFloat(balance) || 0,
                typeId,
                color
            };

        const method = editingAccount ? "PUT" : "POST";
        const url = editingAccount ? `/api/accounts/${editingAccount.id}` : "/api/accounts";

        const res = await fetch(url, {
            method,
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            setIsModalOpen(false);
            loadData();
            resetForm();
        }
    };

    const handleDeleteAccount = async (account: any) => {
        if (!confirm("¿Estás seguro de que quieres eliminar esta cuenta? Esta acción no se puede deshacer.")) return;
        const res = await fetch(`/api/accounts/${account.id}`, { method: "DELETE" });
        if (res.ok) {
            loadData();
        } else {
            // Asumimos que el fallo se debe a que tiene movimientos asociados.
            setAccountToDelete(account);
            setReassignToAccountId("");
            setIsReassignModalOpen(true);
        }
    };

    const handleReassignAndDelete = async () => {
        if (!accountToDelete || !reassignToAccountId) {
            alert("Por favor, selecciona una cuenta a la que reasignar los movimientos.");
            return;
        }

        const res = await fetch(`/api/accounts/${accountToDelete.id}/reassign-and-delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newAccountId: reassignToAccountId }),
        });

        if (res.ok) {
            setIsReassignModalOpen(false);
            loadData();
        } else {
            const error = await res.json();
            alert(`Error: ${error.error || 'No se pudo completar la operación.'}`);
        }
    };

    const handleAdjustBalance = async () => {
        if (!selectedAccount || !targetBalance) return;

        try {
            const res = await fetch(`/api/accounts/${selectedAccount.id}/adjust`, {
                method: "POST",
                body: JSON.stringify({ targetBalance: parseFloat(targetBalance) })
            });

            if (res.ok) {
                setAdjustModalOpen(false);
                setTargetBalance("");
                setSelectedAccount(null);
                loadData();
            } else {
                console.error("Error adjusting balance");
            }
        } catch (error) {
            console.error("Error adjusting balance", error);
        }
    };

    const openAdjustModal = (account: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedAccount(account);
        setTargetBalance(account.balance?.toString() || "0");
        setAdjustModalOpen(true);
    }

    const handleToggleDashboard = async (account: any) => {
        const updatedAccounts = accounts.map(a =>
            a.id === account.id ? { ...a, showOnDashboard: !a.showOnDashboard } : a
        );
        setAccounts(updatedAccounts);

        try {
            await fetch(`/api/accounts/${account.id}`, {
                method: "PUT",
                body: JSON.stringify({ showOnDashboard: !account.showOnDashboard })
            });
        } catch (error) {
            console.error("Error updating account visibility", error);
            loadData();
        }
    };

    const handleRecalculate = async () => {
        setIsRecalculating(true);
        try {
            const res = await fetch("/api/admin/recalculate-balances", {
                method: "POST"
            });
            if (res.ok) {
                alert("Saldos recalculados correctamente basándose en el historial de movimientos.");
                loadData();
            } else {
                throw new Error("Error al recalcular");
            }
        } catch (error) {
            console.error("Recalculate error:", error);
            alert("Hubo un problema al recalcular los saldos.");
        } finally {
            setIsRecalculating(false);
        }
    };

    const totalBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0);

    const pieData = accounts
        .filter(acc => parseFloat(acc.balance) > 0)
        .map(acc => ({
            name: acc.name,
            value: parseFloat(acc.balance),
            color: acc.color || "#3c50e0"
        }));

    const typePieData = accounts
        .reduce((acc: any[], current) => {
            const typeName = current.type?.name || "Otras";
            const existing = acc.find(item => item.name === typeName);
            if (existing) {
                existing.value += 1;
            } else {
                const typeColors: Record<string, string> = {
                    "Cuenta Corriente": "#3c50e0",
                    "Ahorro": "#10b981",
                    "Inversión": "#10b981",
                    "Tarjeta de Crédito": "#f59e0b",
                    "Efectivo": "#64748b"
                };
                acc.push({
                    name: typeName,
                    value: 1,
                    color: typeColors[typeName] || current.color || "#3c50e0"
                });
            }
            return acc;
        }, []);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header / Breadcrumbs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold text-black dark:text-white uppercase tracking-tight">Cuentas</h1>
                    <nav className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                        Mone.yo / <span className="text-primary">Mis Activos</span>
                    </nav>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={handleRecalculate}
                        disabled={isRecalculating}
                        className="border-slate-200 dark:border-strokedark hover:bg-slate-50 dark:hover:bg-meta-4 text-slate-600 dark:text-slate-300 font-black h-11 px-6 rounded-md gap-3 transition-all active:scale-95 uppercase text-[10px] tracking-widest cursor-pointer"
                    >
                        {isRecalculating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4 text-primary" />}
                        Recalcular Saldos
                    </Button>
                    <Button
                        onClick={() => { resetForm(); setIsModalOpen(true); }}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-black h-11 px-8 rounded-md gap-3 shadow-md transition-all active:scale-95 uppercase text-[10px] tracking-widest cursor-pointer border-none"
                    >
                        <Plus className="w-5 h-5" /> Nueva
                    </Button>
                </div>
            </div>


            {/* Wealth Distribution Charts */}
            {!loading && accounts.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
                    {/* Donut 1: Por Entidad */}
                    <Card className="bg-white dark:bg-boxdark border-none shadow-sm p-8 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-primary opacity-10" />
                        <h3 className="text-center text-[10px] font-black uppercase text-slate-400 tracking-widest mb-6">Distribución por Entidad</h3>
                        <div className="h-[280px] w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={75}
                                        outerRadius={100}
                                        paddingAngle={4}
                                        dataKey="value"
                                        stroke="none"
                                        animationBegin={200}
                                        animationDuration={1200}
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: number) => formatCurrency(value)}
                                        contentStyle={{
                                            borderRadius: '12px',
                                            border: 'none',
                                            backgroundColor: '#1c2434',
                                            color: '#fff',
                                            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                                            padding: '12px 16px'
                                        }}
                                        itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-slate-400 text-[8px] font-black uppercase tracking-widest mb-1 opacity-70">Patrimonio</span>
                                <span className="text-xl font-black text-black dark:text-white tracking-tighter">
                                    {formatCurrency(totalBalance)}
                                </span>
                            </div>
                        </div>
                        <div className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-2">
                            {pieData.map((entry, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                    <span className="text-[9px] font-bold uppercase text-slate-500 tracking-tight">{entry.name}</span>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Donut 2: Por Tipo de Cuenta */}
                    <Card className="bg-white dark:bg-boxdark border-none shadow-sm p-8 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 opacity-10" />
                        <h3 className="text-center text-[10px] font-black uppercase text-slate-400 tracking-widest mb-6">Distribución por Tipo</h3>
                        <div className="h-[280px] w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={typePieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={75}
                                        outerRadius={100}
                                        paddingAngle={4}
                                        dataKey="value"
                                        stroke="none"
                                        animationBegin={400}
                                        animationDuration={1200}
                                    >
                                        {typePieData.map((entry, index) => (
                                            <Cell key={`cell-type-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: number) => [`${value} Cuentas`, 'Cantidad']}
                                        contentStyle={{
                                            borderRadius: '12px',
                                            border: 'none',
                                            backgroundColor: '#1c2434',
                                            color: '#fff',
                                            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                                            padding: '12px 16px'
                                        }}
                                        itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-slate-400 text-[8px] font-black uppercase tracking-widest mb-1 opacity-70">Total Tipos</span>
                                <span className="text-xl font-black text-black dark:text-white tracking-tighter">
                                    {typePieData.length}
                                </span>
                            </div>
                        </div>
                        <div className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-2">
                            {typePieData.map((entry, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                    <span className="text-[9px] font-bold uppercase text-slate-500 tracking-tight">{entry.name}</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            )}

            {/* Listado de Cuentas */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest">Entidades y Ajustes</h3>
                    <div className="h-px bg-slate-200 dark:bg-strokedark flex-1" />
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-4">
                        <div className="w-10 h-10 border-4 border-slate-100 border-t-primary rounded-full animate-spin" />
                        <p className="font-bold text-xs uppercase tracking-widest">Cargando Activos...</p>
                    </div>
                ) : accounts.length === 0 ? (
                    <Card className="bg-slate-50 dark:bg-meta-4 border-none rounded-md p-16 text-center shadow-none">
                        <Wallet className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-400 font-bold italic uppercase text-sm tracking-widest">Sin cuentas registradas</p>
                        <Button variant="link" onClick={() => setIsModalOpen(true)} className="text-primary font-bold mt-2">Configurar primera cuenta</Button>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {accounts.map((acc) => (
                            <Card key={acc.id} className="bg-white dark:bg-boxdark border-none shadow-sm p-6 hover:shadow-md transition-all group flex flex-col justify-between h-full relative overflow-hidden">
                                {/* Color strip */}
                                <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: acc.color || '#3c50e0' }} />

                                <div>
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-4">
                                            <div
                                                className="w-12 h-12 rounded-md flex items-center justify-center text-slate-600 dark:text-white"
                                                style={{ backgroundColor: (acc.color || '#3c50e0') + '15', color: acc.color || '#3c50e0' }}
                                            >
                                                <Building2 className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-black dark:text-white uppercase tracking-tight">{acc.name}</h4>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{acc.type?.name || "Cuenta"}</span>
                                            </div>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-primary">
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="rounded-md border-stroke dark:border-strokedark bg-white dark:bg-boxdark shadow-lg">
                                                <DropdownMenuItem
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingAccount(acc);
                                                        setName(acc.name);
                                                        setBalance(acc.initialBalance.toString());
                                                        setTypeId(acc.typeId);
                                                        setColor(acc.color || "#3c50e0");
                                                        setIsModalOpen(true);
                                                    }}
                                                    className="font-bold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-meta-4 gap-2 cursor-pointer uppercase tracking-widest p-3"
                                                >
                                                    <Pencil className="w-3 h-3" /> Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteAccount(acc);
                                                    }}
                                                    className="font-bold text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 gap-2 cursor-pointer uppercase tracking-widest p-3"
                                                >
                                                    <Trash2 className="w-3 h-3" /> Eliminar
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-baseline">
                                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Saldo Real</span>
                                            <span className={cn(
                                                "text-xl font-bold tracking-tight",
                                                (acc.balance || 0) < 0 ? "text-rose-500" : "text-black dark:text-white"
                                            )}>
                                                {formatCurrency(acc.balance || 0)}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between pt-2">
                                            <div className="flex items-center gap-2">
                                                <Switch
                                                    checked={acc.showOnDashboard ?? true}
                                                    onCheckedChange={() => handleToggleDashboard(acc)}
                                                    className="scale-75"
                                                />
                                                <span className="text-[10px] font-bold uppercase text-slate-400">Panel Principal</span>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-300">INI: {formatCurrency(acc.initialBalance)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 pt-4 border-t border-stroke dark:border-strokedark">
                                    <Button
                                        variant="outline"
                                        className="w-full h-10 border-stroke dark:border-strokedark hover:bg-slate-50 dark:hover:bg-meta-4 text-xs font-bold uppercase tracking-widest rounded-md transition-all gap-2"
                                        onClick={(e) => openAdjustModal(acc, e)}
                                    >
                                        <ArrowUpRight className="w-3.5 h-3.5" /> Ajustar Saldo
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal de Nueva Cuenta */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-md bg-white dark:bg-boxdark border-none shadow-2xl p-0 overflow-hidden flex flex-col">
                    <DialogHeader className="bg-boxdark dark:bg-boxdark-2 p-6 sm:p-8 text-white space-y-1 shrink-0">
                        <DialogTitle className="text-xl font-bold uppercase tracking-tight">
                            {editingAccount ? "Editar" : "Nueva"}
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 text-xs font-semibold uppercase tracking-widest italic opacity-70">
                            Registro de Activo Financiero
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-6 sm:p-8 space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Nombre del Activo</Label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ej: Cuenta Nómina BBVA..."
                                className="h-11 bg-slate-50 dark:bg-meta-4 border-stroke dark:border-strokedark rounded-md font-bold"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Saldo Inicial</Label>
                                <Input
                                    type="number"
                                    value={balance}
                                    onChange={(e) => setBalance(e.target.value)}
                                    placeholder="0.00"
                                    className={cn("h-11 bg-slate-50 dark:bg-meta-4 border-stroke dark:border-strokedark rounded-md font-bold", !!editingAccount && "opacity-50 cursor-not-allowed")}
                                    disabled={!!editingAccount}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Tipo</Label>
                                <Select value={typeId} onValueChange={setTypeId}>
                                    <SelectTrigger className="h-11 bg-slate-50 dark:bg-meta-4 border-stroke dark:border-strokedark rounded-md font-bold">
                                        <SelectValue placeholder="Elegir..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-boxdark border-stroke dark:border-strokedark rounded-md">
                                        {accountTypes.map(t => (
                                            <SelectItem key={t.id} value={t.id} className="font-bold">{t.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Identificador Visual (Color)</Label>
                            <div className="flex items-center gap-4">
                                <Input
                                    type="color"
                                    value={color}
                                    onChange={(e) => setColor(e.target.value)}
                                    className="h-11 w-20 bg-slate-50 dark:bg-meta-4 border-stroke dark:border-strokedark p-1 cursor-pointer rounded-md"
                                />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{color}</span>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-4 bg-slate-50 dark:bg-meta-4/20 border-t border-stroke dark:border-strokedark flex flex-row justify-end gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => setIsModalOpen(false)}
                            className="h-11 rounded-md font-black uppercase text-[10px] tracking-widest text-slate-400 hover:text-black dark:hover:text-white px-6 transition-colors"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSave}
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-md font-black uppercase text-[10px] tracking-widest h-11 px-10 shadow-md cursor-pointer transition-colors disabled:cursor-not-allowed disabled:pointer-events-auto border-none"
                        >
                            {editingAccount ? "Actualizar" : "Activar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal de Cuadre de Saldo */}
            <Dialog open={adjustModalOpen} onOpenChange={setAdjustModalOpen}>
                <DialogContent className="sm:max-w-md bg-white dark:bg-boxdark border-none shadow-2xl p-0 overflow-hidden flex flex-col">
                    <DialogHeader className="bg-primary p-6 sm:p-8 text-white space-y-1 shrink-0">
                        <DialogTitle className="text-xl font-bold uppercase tracking-tight flex items-center gap-2">
                            <Wallet className="w-5 h-5" /> Cuadre de Caja
                        </DialogTitle>
                        <DialogDescription className="text-white/70 text-xs font-semibold uppercase tracking-widest italic opacity-70">
                            Sincronización de Saldo Real
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-6 sm:p-8 space-y-6">
                        <div className="bg-slate-50 dark:bg-meta-4 p-4 rounded-md border border-stroke dark:border-strokedark">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Cuenta</p>
                            <p className="text-base font-bold text-black dark:text-white uppercase">{selectedAccount?.name}</p>
                            <p className="text-xs font-medium text-slate-500 mt-1">Saldo en sistema: {formatCurrency(selectedAccount?.balance || 0)}</p>
                        </div>

                        <div className="space-y-2 text-center">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Nuevo Saldo Real</Label>
                            <Input
                                type="number"
                                value={targetBalance}
                                onChange={(e) => setTargetBalance(e.target.value)}
                                placeholder="0.00"
                                className="h-14 text-2xl bg-white dark:bg-meta-4 border-2 border-primary/20 focus:border-primary rounded-md font-black text-center text-primary"
                                autoFocus
                            />
                            <p className="text-[10px] text-slate-400 mt-2 font-bold italic">Se generará un ajuste automático para igualar este valor.</p>
                        </div>
                    </div>

                    <DialogFooter className="p-4 bg-slate-50 dark:bg-meta-4/20 border-t border-stroke dark:border-strokedark flex flex-row justify-end gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => setAdjustModalOpen(false)}
                            className="h-11 rounded-md font-black uppercase text-[10px] tracking-widest text-slate-400 hover:text-black dark:hover:text-white px-6 transition-colors"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleAdjustBalance}
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-md font-black uppercase text-[10px] tracking-widest h-11 px-10 shadow-md cursor-pointer transition-colors disabled:cursor-not-allowed disabled:pointer-events-auto border-none"
                        >
                            Confirmar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal de Reasignación */}
            <Dialog open={isReassignModalOpen} onOpenChange={setIsReassignModalOpen}>
                <DialogContent className="sm:max-w-md bg-white dark:bg-boxdark border-none shadow-2xl p-0 overflow-hidden flex flex-col">
                    <DialogHeader className="bg-rose-500 p-6 text-white shrink-0">
                        <DialogTitle className="text-xl font-bold uppercase tracking-tight">Acción Requerida</DialogTitle>
                        <DialogDescription className="text-rose-100 text-[10px] font-black uppercase tracking-widest italic pt-1">
                            La cuenta tiene movimientos activos
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-6 sm:p-8 space-y-6">
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                            No es posible eliminar <span className="font-bold text-black dark:text-white">"{accountToDelete?.name}"</span> sin procesar sus registros históricos.
                            Reubica todos los movimientos a una cuenta alternativa para proceder.
                        </p>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Cuenta de Destino</Label>
                            <Select value={reassignToAccountId} onValueChange={setReassignToAccountId}>
                                <SelectTrigger className="h-11 bg-slate-50 dark:bg-meta-4 border-stroke dark:border-strokedark rounded-md font-bold">
                                    <SelectValue placeholder="Seleccionar destino..." />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-boxdark border-stroke dark:border-strokedark rounded-md">
                                    {accounts.filter(acc => acc.id !== accountToDelete?.id).map(acc => (
                                        <SelectItem key={acc.id} value={acc.id} className="font-bold text-sm">{acc.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter className="p-6 bg-slate-50 dark:bg-meta-4/20 border-t border-stroke dark:border-strokedark flex gap-2">
                        <Button variant="ghost" className="flex-1 h-11 text-[10px] font-black uppercase tracking-widest text-slate-400 rounded-md" onClick={() => setIsReassignModalOpen(false)}>Cancelar</Button>
                        <Button
                            onClick={handleReassignAndDelete}
                            disabled={!reassignToAccountId}
                            className="flex-1 h-11 bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest rounded-md"
                        >
                            Migrar y Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
