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

const AccountCard = ({
    account,
    onEdit,
    onDelete,
    onAdjust,
    onToggleDashboard
}: {
    account: any,
    onEdit: (acc: any, e: any) => void,
    onDelete: (acc: any) => void,
    onAdjust: (acc: any, e: React.MouseEvent) => void,
    onToggleDashboard: (acc: any) => void
}) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <Card className="bg-white dark:bg-boxdark border-none shadow-sm p-6 hover:shadow-md transition-all group flex flex-col justify-between h-full relative overflow-hidden">
            {/* Color strip */}
            <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: account.color || '#3c50e0' }} />

            <div>
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                        <div
                            className="w-12 h-12 rounded-md flex items-center justify-center text-slate-600 dark:text-white"
                            style={{ backgroundColor: (account.color || '#3c50e0') + '15', color: account.color || '#3c50e0' }}
                        >
                            <Building2 className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="font-bold text-black dark:text-white uppercase tracking-tight">{account.name}</h4>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{account.type?.name || "Cuenta"}</span>
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
                                <DropdownMenuItem
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEdit(account, e);
                                    }}
                                    className="font-bold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-meta-4 gap-2 cursor-pointer uppercase tracking-widest p-3"
                                >
                                    <Pencil className="w-3 h-3" /> Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(account);
                                    }}
                                    className="font-bold text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 gap-2 cursor-pointer uppercase tracking-widest p-3"
                                >
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
                                <DialogTitle className="text-2xl font-black uppercase text-slate-800 dark:text-white tracking-tighter">Opciones de <span className="text-primary italic">Cuenta</span></DialogTitle>
                                <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400 opacity-70">
                                    GESTIÓN DE {account.name}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="flex flex-col p-6 gap-3 pb-12 overflow-y-auto flex-1 min-h-0">
                                <Button onClick={(e) => { setIsMobileMenuOpen(false); onEdit(account, e); }} variant="outline" className="h-16 justify-start px-6 rounded-2xl gap-5 border-none bg-slate-50 dark:bg-meta-4/20 hover:bg-slate-100 dark:hover:bg-meta-4/40 text-slate-700 dark:text-white font-black uppercase tracking-widest text-xs shadow-sm transition-all active:scale-[0.98]">
                                    <div className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 rounded-xl shadow-sm text-primary"><Pencil className="w-5 h-5" /></div>
                                    <span>Editar Entidad</span>
                                </Button>

                                <div className="h-px bg-slate-100 dark:bg-slate-800/50 my-2" />

                                <Button onClick={() => { setIsMobileMenuOpen(false); onDelete(account); }} variant="ghost" className="h-14 justify-center gap-2 rounded-2xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 font-black uppercase tracking-widest text-[10px] active:scale-[0.98] transition-all">
                                    <Trash2 className="w-4 h-4" /> Eliminar Definitivamente
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-baseline">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Saldo Real</span>
                        <span className={cn(
                            "text-xl font-bold tracking-tight",
                            (account.balance || 0) < 0 ? "text-rose-500" : "text-black dark:text-white"
                        )}>
                            {formatCurrency(account.balance || 0)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2">
                            <Switch
                                checked={account.showOnDashboard ?? true}
                                onCheckedChange={() => onToggleDashboard(account)}
                                className="scale-75"
                            />
                            <span className="text-[10px] font-bold uppercase text-slate-400">Panel Principal</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-300">INI: {formatCurrency(account.initialBalance)}</span>
                    </div>
                </div>
            </div>

            <div className="mt-6 pt-4 border-t border-stroke dark:border-strokedark">
                <Button
                    variant="outline"
                    className="w-full h-10 border-stroke dark:border-strokedark hover:bg-slate-50 dark:hover:bg-meta-4 text-xs font-bold uppercase tracking-widest rounded-md transition-all gap-2"
                    onClick={(e) => onAdjust(account, e)}
                >
                    <ArrowUpRight className="w-3.5 h-3.5" /> Ajustar Saldo
                </Button>
            </div>
        </Card>
    );
};

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
                            <AccountCard
                                key={acc.id}
                                account={acc}
                                onEdit={(acc, e) => {
                                    setEditingAccount(acc);
                                    setName(acc.name);
                                    setBalance(acc.initialBalance.toString());
                                    setTypeId(acc.typeId);
                                    setColor(acc.color || "#3c50e0");
                                    setIsModalOpen(true);
                                }}
                                onDelete={handleDeleteAccount}
                                onAdjust={openAdjustModal}
                                onToggleDashboard={handleToggleDashboard}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Modal de Nueva Cuenta */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="w-[95vw] sm:max-w-md bg-white dark:bg-boxdark border-none shadow-2xl p-0 overflow-hidden flex flex-col rounded-2xl">
                    <DialogHeader className="bg-boxdark dark:bg-boxdark-2 p-6 md:p-8 text-white text-left relative overflow-hidden shrink-0">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full -mr-16 -mt-16" />
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20">
                                <Building2 className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl md:text-2xl font-black text-white uppercase tracking-tight leading-none mb-1.5">
                                    {editingAccount ? "Editar" : "Nueva"} <span className="text-primary italic">Cuenta</span>
                                </DialogTitle>
                                <DialogDescription className="text-[10px] md:text-xs font-bold uppercase text-slate-400 tracking-widest leading-none opacity-70">
                                    REGISTRO DE ACTIVO FINANCIERO.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-6 md:p-8 space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 opacity-70">Nombre del Activo</Label>
                            <div className="relative group">
                                <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Ej: Cuenta Nómina BBVA..."
                                    className="pl-12 h-12 bg-slate-50 dark:bg-meta-4/20 border-none rounded-xl font-bold text-black dark:text-white shadow-sm focus:ring-2 focus:ring-primary/20 transition-all"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 opacity-70">Saldo Inicial</Label>
                                <div className="relative group">
                                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        type="number"
                                        value={balance}
                                        onChange={(e) => setBalance(e.target.value)}
                                        placeholder="0.00"
                                        className={cn("pl-12 h-12 bg-primary/5 dark:bg-primary/10 border-none rounded-xl font-black text-primary text-lg shadow-sm focus:ring-2 focus:ring-primary/20 transition-all", !!editingAccount && "opacity-50 cursor-not-allowed")}
                                        disabled={!!editingAccount}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 opacity-70">Tipo</Label>
                                <Select value={typeId} onValueChange={setTypeId}>
                                    <SelectTrigger className="h-12 bg-slate-50 dark:bg-meta-4/20 border-none rounded-xl font-bold text-black dark:text-white shadow-sm focus:ring-2 focus:ring-primary/20 transition-all">
                                        <SelectValue placeholder="Elegir..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-boxdark border-none rounded-xl shadow-2xl z-[60] p-2">
                                        {accountTypes.map(t => (
                                            <SelectItem key={t.id} value={t.id} className="font-bold text-[10px] uppercase tracking-widest py-3 px-4 focus:bg-primary/5 cursor-pointer rounded-lg">{t.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 opacity-70">Identificador Visual (Color)</Label>
                            <div className="flex items-center gap-4 bg-slate-50 dark:bg-meta-4/20 p-2 rounded-xl border border-dashed border-stroke dark:border-strokedark">
                                <Input
                                    type="color"
                                    value={color}
                                    onChange={(e) => setColor(e.target.value)}
                                    className="h-12 w-20 bg-white dark:bg-meta-4 border-none p-1 cursor-pointer rounded-lg shadow-sm"
                                />
                                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{color}</span>
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
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black uppercase text-[10px] tracking-widest h-12 shadow-lg border-none active:scale-[0.98] transition-all"
                        >
                            {editingAccount ? "Actualizar" : "Activar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal de Cuadre de Saldo */}
            <Dialog open={adjustModalOpen} onOpenChange={setAdjustModalOpen}>
                <DialogContent className="w-[95vw] sm:max-w-md bg-white dark:bg-boxdark border-none shadow-2xl p-0 overflow-hidden flex flex-col rounded-2xl">
                    <DialogHeader className="bg-boxdark dark:bg-boxdark-2 p-6 md:p-8 text-white text-left relative overflow-hidden shrink-0">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full -mr-16 -mt-16" />
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20">
                                <Wallet className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl md:text-2xl font-black text-white uppercase tracking-tight leading-none mb-1.5">
                                    Cuadre de <span className="text-primary italic">Caja</span>
                                </DialogTitle>
                                <DialogDescription className="text-[10px] md:text-xs font-bold uppercase text-slate-400 tracking-widest leading-none opacity-70">
                                    SINCRONIZACIÓN DE SALDO REAL.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-6 md:p-8 space-y-6">
                        <div className="bg-slate-50 dark:bg-meta-4/20 p-5 rounded-xl border border-dashed border-stroke dark:border-strokedark shadow-inner">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest opacity-70 mb-1">Cuenta</p>
                            <p className="text-lg font-black text-black dark:text-white uppercase tracking-tighter">{selectedAccount?.name}</p>
                            <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wider">Saldo en sistema: <span className="text-primary">{formatCurrency(selectedAccount?.balance || 0)}</span></p>
                        </div>

                        <div className="space-y-3 text-center">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 opacity-70">Nuevo Saldo Real</Label>
                            <Input
                                type="number"
                                value={targetBalance}
                                onChange={(e) => setTargetBalance(e.target.value)}
                                placeholder="0.00"
                                className="h-16 text-3xl bg-primary/5 dark:bg-primary/10 border-none rounded-xl font-black text-center text-primary shadow-sm focus:ring-2 focus:ring-primary/20 transition-all"
                                autoFocus
                            />
                            <p className="text-[9px] text-slate-400 font-bold italic uppercase tracking-tighter">
                                Se generará un ajuste automático para igualar este valor.
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="p-6 md:p-8 bg-slate-50 dark:bg-meta-4/20 border-t border-stroke dark:border-strokedark flex flex-row gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => setAdjustModalOpen(false)}
                            className="flex-1 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest text-slate-400 hover:text-rose-500 transition-colors"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleAdjustBalance}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black uppercase text-[10px] tracking-widest h-12 shadow-lg border-none active:scale-[0.98] transition-all"
                        >
                            Confirmar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal de Reasignación */}
            <Dialog open={isReassignModalOpen} onOpenChange={setIsReassignModalOpen}>
                <DialogContent className="w-[95vw] sm:max-w-md bg-white dark:bg-boxdark border-none shadow-2xl p-0 overflow-hidden flex flex-col rounded-2xl">
                    <DialogHeader className="bg-rose-500 p-6 md:p-8 text-white text-left relative overflow-hidden shrink-0">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full -mr-16 -mt-16" />
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-white/10 rounded-xl flex items-center justify-center text-white border border-white/20">
                                <TrendingUp className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl md:text-2xl font-black text-white uppercase tracking-tight leading-none mb-1.5">Acción <span className="underline decoration-white/30 italic">Requerida</span></DialogTitle>
                                <DialogDescription className="text-[10px] md:text-xs font-bold uppercase tracking-widest italic pt-1 text-rose-100 opacity-90">
                                    CUENTA CON MOVIMIENTOS ACTIVOS.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-6 md:p-8 space-y-6">
                        <div className="p-5 bg-rose-500/5 rounded-xl border border-dashed border-rose-500/20">
                            <p className="text-sm font-bold text-slate-600 dark:text-slate-400 leading-relaxed uppercase tracking-tight text-center">
                                NO ES POSIBLE ELIMINAR <span className="text-rose-500 font-black underline decoration-rose-500/20">"{accountToDelete?.name}"</span> SIN PROCESAR SUS REGISTROS HISTÓRICOS.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 opacity-70">Cuenta de Destino</Label>
                            <Select value={reassignToAccountId} onValueChange={setReassignToAccountId}>
                                <SelectTrigger className="h-12 bg-slate-50 dark:bg-meta-4/20 border-none rounded-xl font-bold text-black dark:text-white shadow-sm">
                                    <SelectValue placeholder="Seleccionar destino..." />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-boxdark border-none rounded-xl shadow-2xl z-[60] p-2">
                                    {accounts.filter(acc => acc.id !== accountToDelete?.id).map(acc => (
                                        <SelectItem key={acc.id} value={acc.id} className="font-bold text-[10px] uppercase tracking-widest py-3 px-4 focus:bg-primary/5 cursor-pointer rounded-lg">{acc.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-[9px] text-slate-400 font-bold italic uppercase tracking-tighter px-1 text-center">
                                Todos los movimientos serán reubicados permanentemente.
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="p-6 md:p-8 bg-slate-50 dark:bg-meta-4/20 border-t border-stroke dark:border-strokedark flex flex-row gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => setIsReassignModalOpen(false)}
                            className="flex-1 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest text-slate-400 hover:text-rose-500 transition-colors"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleReassignAndDelete}
                            disabled={!reassignToAccountId}
                            className="flex-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black uppercase text-[10px] tracking-widest h-12 shadow-lg border-none active:scale-[0.98] transition-all"
                        >
                            Migrar y Borrar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
