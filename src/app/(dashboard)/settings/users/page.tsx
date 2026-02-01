"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Users,
    UserPlus,
    Search,
    MoreVertical,
    Edit2,
    Trash2,
    Shield,
    ShieldCheck,
    ArrowLeft,
    Mail,
    User as UserIcon,
    RefreshCcw,
    AlertCircle,
    Lock,
    Sparkles,
    ArrowLeftRight,
    PieChart,
    TrendingUp,
    Settings,
    Wallet,
    LayoutDashboard
} from "lucide-react";
import Link from "next/link";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { cn, formatDate } from "@/lib/utils";

interface User {
    id: string;
    email: string;
    name: string;
    role: "ADMIN" | "USER";
    twoFactorEnabled: boolean;
    permissions: any;
    createdAt: string;
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setOpenDeleteDialog] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "USER" as "ADMIN" | "USER",
        twoFactorEnabled: false,
        permissions: {
            dashboard: true,
            vision: true,
            transactions: false,
            budgets: false,
            accounts: false,
            reports: false,
            settings: false
        }
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/users");
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            } else {
                setError("No se pudieron cargar los usuarios.");
            }
        } catch (err) {
            console.error(err);
            setError("Error de conexión al cargar usuarios.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleOpenCreateDialog = () => {
        setSelectedUser(null);
        setFormData({
            name: "",
            email: "",
            password: "",
            role: "USER",
            twoFactorEnabled: false,
            permissions: {
                dashboard: true,
                vision: true,
                transactions: false,
                budgets: false,
                accounts: false,
                reports: false,
                settings: false
            }
        });
        setError(null);
        setIsDialogOpen(true);
    };

    const handleOpenEditDialog = (user: User) => {
        setSelectedUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            password: "", // Don't show password
            role: user.role,
            twoFactorEnabled: user.twoFactorEnabled,
            permissions: user.permissions || {
                dashboard: true,
                vision: true,
                transactions: false,
                budgets: false,
                accounts: false,
                reports: false,
                settings: false
            }
        });
        setError(null);
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        const url = selectedUser ? `/api/users/${selectedUser.id}` : "/api/users";
        const method = selectedUser ? "PUT" : "POST";

        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setIsDialogOpen(false);
                loadUsers();
            } else {
                const data = await res.json();
                setError(data.error || "Algo salió mal.");
            }
        } catch (err) {
            setError("Error de red al procesar la solicitud.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedUser) return;

        try {
            const res = await fetch(`/api/users/${selectedUser.id}`, {
                method: "DELETE"
            });

            if (res.ok) {
                setOpenDeleteDialog(false);
                loadUsers();
            } else {
                const data = await res.json();
                alert(data.error || "No se pudo eliminar al usuario.");
            }
        } catch (err) {
            alert("Error de red al eliminar usuario.");
        }
    };

    return (
        <div className="space-y-6">
            {/* Header / Breadcrumb */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-500 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-black dark:text-white uppercase tracking-tight">
                        Usuarios
                    </h1>
                    <nav className="flex mt-1">
                        <ol className="flex items-center space-x-2 text-xs font-semibold text-slate-400 uppercase tracking-widest">
                            <li><Link href="/" className="hover:text-primary transition-colors">Dashboard</Link></li>
                            <li><span className="mx-1">/</span></li>
                            <li><Link href="/settings" className="hover:text-primary transition-colors">Configuración</Link></li>
                            <li><span className="mx-1">/</span></li>
                            <li className="text-primary">Usuarios y Permisos</li>
                        </ol>
                    </nav>
                </div>
                <Button
                    onClick={handleOpenCreateDialog}
                    className="bg-blue-600 hover:bg-blue-700 text-white gap-2 rounded-md h-11 px-6 font-bold shadow-md transition-all uppercase text-[10px] tracking-widest border-none"
                >
                    <UserPlus className="w-4 h-4" /> Nuevo Miembro
                </Button>
            </div>

            <Card className="border-none bg-white dark:bg-boxdark rounded-md shadow-sm overflow-hidden">
                <div className="p-6 border-b border-stroke dark:border-strokedark flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative flex-1 w-full max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Buscar operador..."
                            className="pl-11 h-11 rounded-md bg-slate-50 dark:bg-meta-4 border-stroke dark:border-strokedark font-bold text-xs text-black dark:text-white focus:ring-1 focus:ring-primary"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="ghost" size="icon" onClick={loadUsers} className="h-11 w-11 rounded-md bg-slate-50 dark:bg-meta-4 text-slate-400 hover:text-primary border border-stroke dark:border-strokedark">
                        <RefreshCcw className={cn("w-4 h-4", loading && "animate-spin")} />
                    </Button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-meta-4/20">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Identidad</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Rango</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Protección 2FA</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Registro</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stroke dark:divide-strokedark">
                            {loading && users.length === 0 ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        <td colSpan={5} className="px-6 py-8">
                                            <div className="h-10 bg-slate-50 dark:bg-meta-4 animate-pulse rounded-md" />
                                        </td>
                                    </tr>
                                ))
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <Users className="w-12 h-12 text-slate-300 dark:text-slate-500 mx-auto mb-4" />
                                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Sin coincidencias en la nómina</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-meta-4/10 transition-colors group">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center text-primary font-bold text-base border border-primary/5">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex flex-col">
                                                    <p className="font-bold text-black dark:text-white text-sm uppercase tracking-tight">{user.name}</p>
                                                    <p className="text-[10px] font-semibold text-slate-400 lowercase">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <Badge className={cn(
                                                "rounded-md border-none px-2.5 py-1 text-[9px] font-black tracking-widest uppercase",
                                                user.role === 'ADMIN'
                                                    ? "bg-primary text-white"
                                                    : "bg-slate-100 dark:bg-meta-4 text-slate-500 dark:text-slate-400"
                                            )}>
                                                {user.role}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex justify-center">
                                                {user.twoFactorEnabled ? (
                                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded-md">
                                                        <ShieldCheck className="w-3.5 h-3.5" />
                                                        <span className="text-[9px] font-black uppercase tracking-widest">Activo</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 dark:bg-meta-4 text-slate-400 rounded-md opacity-60">
                                                        <Shield className="w-3.5 h-3.5" />
                                                        <span className="text-[9px] font-black uppercase tracking-widest">Off</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-slate-400 text-[10px] font-bold font-mono">
                                            {formatDate(user.createdAt)}
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md bg-white dark:bg-boxdark text-slate-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-meta-4 border border-stroke dark:border-strokedark">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="rounded-md border border-stroke dark:border-strokedark bg-white dark:bg-boxdark shadow-2xl p-1.5 min-w-[160px]">
                                                    <DropdownMenuItem onClick={() => handleOpenEditDialog(user)} className="flex items-center gap-2.5 px-3 py-2 cursor-pointer rounded-md focus:bg-slate-50 dark:focus:bg-meta-4 text-slate-600 dark:text-white transition-colors">
                                                        <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                                                        <span className="font-bold text-[11px] uppercase tracking-tight">Modificar</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setSelectedUser(user);
                                                            setOpenDeleteDialog(true);
                                                        }}
                                                        className="flex items-center gap-2.5 px-3 py-2 cursor-pointer text-rose-500 focus:text-rose-500 focus:bg-rose-50 dark:focus:bg-rose-500/10 rounded-md transition-colors"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                        <span className="font-bold text-[11px] uppercase tracking-tight">Expulsar</span>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="w-[95vw] sm:max-w-lg p-0 overflow-hidden bg-white dark:bg-boxdark border-none shadow-2xl rounded-2xl flex flex-col max-h-[95vh]">
                    <DialogHeader className="bg-boxdark dark:bg-boxdark-2 p-6 md:p-8 text-white text-left relative overflow-hidden shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20">
                                <Users className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl md:text-2xl font-black text-white uppercase tracking-tight leading-none mb-1.5">
                                    {selectedUser ? "Perfil Operador" : "Nuevo Recluta"}
                                </DialogTitle>
                                <DialogDescription className="text-[10px] md:text-xs font-bold uppercase text-slate-400 tracking-widest leading-none opacity-70">
                                    CONTROL DE CREDENCIALES Y FACULTADES.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto p-5 md:p-8 custom-scrollbar">
                        {error && (
                            <div className="mb-6 p-4 bg-rose-500/10 text-rose-500 rounded-xl flex items-center gap-3 text-[10px] border border-rose-500/20 font-black uppercase tracking-widest animate-in fade-in slide-in-from-top-2">
                                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                            </div>
                        )}

                        <form id="user-form" onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 opacity-70">Firma del Usuario</Label>
                                    <div className="relative group">
                                        <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Nombre completo..."
                                            className="pl-12 h-12 rounded-xl bg-slate-50 dark:bg-meta-4/20 border-none font-bold text-black dark:text-white text-sm focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 opacity-70">Correo Electrónico</Label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                                        <Input
                                            id="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="correo@dominio.com"
                                            className="pl-12 h-12 rounded-xl bg-slate-50 dark:bg-meta-4/20 border-none font-bold text-black dark:text-white text-sm focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 opacity-70">
                                        {selectedUser ? "Nueva Clave (Opcional)" : "Salvoconducto (Clave)"}
                                    </Label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                                        <Input
                                            id="password"
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            placeholder="••••••••"
                                            className="pl-12 h-12 rounded-xl bg-slate-50 dark:bg-meta-4/20 border-none font-bold text-black dark:text-white text-sm focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                                            required={!selectedUser}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <Label htmlFor="role" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 opacity-70">Autoridad</Label>
                                    <Select
                                        value={formData.role}
                                        onValueChange={(val: any) => setFormData({ ...formData, role: val })}
                                    >
                                        <SelectTrigger className="h-12 rounded-xl bg-slate-50 dark:bg-meta-4/20 border-none font-bold text-black dark:text-white text-xs focus:ring-2 focus:ring-primary/20 transition-all shadow-sm">
                                            <SelectValue placeholder="Rol" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-boxdark border-none rounded-xl shadow-2xl p-2 z-[60]">
                                            <SelectItem value="USER" className="font-bold text-[10px] uppercase tracking-widest py-3 px-4 focus:bg-primary/5 cursor-pointer rounded-lg">
                                                Operador Estándar
                                            </SelectItem>
                                            <SelectItem value="ADMIN" className="font-bold text-[10px] uppercase tracking-widest py-3 px-4 focus:bg-primary/5 text-primary cursor-pointer rounded-lg">
                                                Administrador Total
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 opacity-70">Blindaje 2FA</Label>
                                    <div className="h-12 flex items-center justify-between px-4 bg-slate-50 dark:bg-meta-4/20 rounded-xl shadow-sm">
                                        <div className="flex items-center gap-2">
                                            <ShieldCheck className={cn("w-4 h-4 transition-colors", formData.twoFactorEnabled ? "text-emerald-500" : "text-slate-300 dark:text-slate-500")} />
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Activo</span>
                                        </div>
                                        <Switch
                                            checked={formData.twoFactorEnabled}
                                            onCheckedChange={(checked) => setFormData({ ...formData, twoFactorEnabled: checked })}
                                            className="data-[state=checked]:bg-primary"
                                        />
                                    </div>
                                </div>
                            </div>

                            {formData.role === "USER" && (
                                <div className="space-y-4 pt-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Facultades de Acceso</Label>
                                    <div className="grid grid-cols-1 gap-2 bg-slate-50 dark:bg-meta-4/10 p-4 rounded-xl border border-dashed border-stroke dark:border-strokedark">
                                        {[
                                            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                                            { id: 'vision', label: 'IA Vision', icon: Sparkles },
                                            { id: 'transactions', label: 'Movimientos', icon: ArrowLeftRight },
                                            { id: 'budgets', label: 'Presupuestos', icon: PieChart },
                                            { id: 'accounts', label: 'Mis Cuentas', icon: Wallet },
                                            { id: 'reports', label: 'Reportes', icon: TrendingUp },
                                        ].map((perm) => (
                                            <div key={perm.id} className="flex items-center justify-between py-1 px-1">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                                        (formData.permissions as any)[perm.id] ? "bg-primary/10 text-primary shadow-sm" : "bg-white dark:bg-meta-4 text-slate-400"
                                                    )}>
                                                        <perm.icon className="w-4 h-4" />
                                                    </div>
                                                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-tight">{perm.label}</span>
                                                </div>
                                                <Switch
                                                    checked={(formData.permissions as any)[perm.id]}
                                                    onCheckedChange={(checked) => setFormData({
                                                        ...formData,
                                                        permissions: { ...formData.permissions, [perm.id]: checked }
                                                    })}
                                                    className="data-[state=checked]:bg-primary scale-75"
                                                />
                                            </div>
                                        ))}

                                        <div className="flex items-center justify-between py-2 border-t border-stroke dark:border-strokedark mt-2 pt-3 px-1">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                                    formData.permissions.settings ? "bg-rose-500/10 text-rose-500 shadow-sm" : "bg-white dark:bg-meta-4 text-slate-400"
                                                )}>
                                                    <Settings className="w-4 h-4" />
                                                </div>
                                                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-tight">Configuración</span>
                                            </div>
                                            <Switch
                                                checked={formData.permissions.settings}
                                                onCheckedChange={(checked) => setFormData({
                                                    ...formData,
                                                    permissions: { ...formData.permissions, settings: checked }
                                                })}
                                                className="data-[state=checked]:bg-rose-500 scale-75"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-[9px] text-slate-400 font-bold italic mt-1 leading-tight px-1 uppercase tracking-tighter">
                                        Administradores poseen autoridad total sobre todos los sectores.
                                    </p>
                                </div>
                            )}
                        </form>
                    </div>

                    <DialogFooter className="p-6 md:p-8 bg-slate-50 dark:bg-meta-4/20 flex flex-row gap-3 shrink-0 border-t border-stroke dark:border-strokedark">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setIsDialogOpen(false)}
                            className="flex-1 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest text-slate-400 hover:text-rose-500 transition-colors"
                        >
                            Ignorar
                        </Button>
                        <Button
                            form="user-form"
                            type="submit"
                            disabled={submitting}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black uppercase tracking-widest px-8 shadow-lg h-12 text-[10px] border-none active:scale-[0.98] transition-all"
                        >
                            {submitting ? "..." : "Confirmar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setOpenDeleteDialog}>
                <AlertDialogContent className="w-[95vw] sm:max-w-md bg-white dark:bg-boxdark border-none shadow-2xl p-0 overflow-hidden flex flex-col max-h-[95vh] rounded-2xl">
                    <div className="p-8 text-center bg-white dark:bg-boxdark">
                        <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-rose-500 border border-rose-500/10 shadow-inner">
                            <AlertCircle className="w-8 h-8" />
                        </div>
                        <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-black dark:text-white mb-3">¿Revocar <span className="text-rose-500 italic">Acceso</span>?</h2>
                        <p className="text-[10px] md:text-xs text-slate-500 font-bold leading-relaxed uppercase tracking-[0.1em] max-w-[280px] mx-auto opacity-80">
                            Estás a punto de eliminar permanentemente a <span className="font-black text-black dark:text-white underline decoration-rose-500/30 decoration-2">{selectedUser?.name}</span> del sistema operativo.
                        </p>
                    </div>
                    <AlertDialogFooter className="p-6 md:p-8 bg-slate-50 dark:bg-meta-4/20 flex flex-row gap-3 border-t border-stroke dark:border-strokedark shrink-0">
                        <AlertDialogCancel className="h-12 flex-1 rounded-xl font-black uppercase text-[10px] tracking-widest text-slate-400 hover:text-black dark:hover:text-white border-none bg-transparent m-0 transition-all">
                            No, Retened
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="h-12 flex-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black uppercase text-[10px] tracking-widest border-none m-0 shadow-lg shadow-rose-600/30 active:scale-[0.98] transition-all">
                            Sí, Expulsar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div >
    );
}
