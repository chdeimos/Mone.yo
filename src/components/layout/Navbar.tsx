"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    ArrowLeftRight,
    PieChart,
    Wallet,
    Settings,
    UserCircle2,
    LogOut,
    Smartphone,
    Menu,
    ShieldCheck,
    Sparkles,
    TrendingUp,
    CheckCircle2,
    XCircle,
    Sun,
    Moon
} from "lucide-react";
import { Logo, MobileLogo } from "@/components/brand/Logo";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import { hasPermission, Permission } from "@/lib/permissions";

const navItems = [
    { label: "Movimientos", icon: ArrowLeftRight, href: "/transactions", permission: "transactions" as Permission },
    { label: "Presupuestos", icon: PieChart, href: "/budgets", permission: "budgets" as Permission },
    { label: "Cuentas", icon: Wallet, href: "/accounts", permission: "accounts" as Permission },
    { label: "IA Vision", icon: Sparkles, href: "/vision", permission: "vision" as Permission },
    { label: "Reportes", icon: TrendingUp, href: "/reports", permission: "reports" as Permission },
];

export function Navbar() {
    const { data: session, update } = useSession();
    const pathname = usePathname();
    const router = useRouter();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const mobileMenuRef = useRef<HTMLDivElement>(null);
    const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const role = (session?.user as any)?.role;

    // Profile form state
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [monthlyReportEnabled, setMonthlyReportEnabled] = useState(true);
    const [qrCodeUrl, setQrCodeUrl] = useState("");
    const [verificationCode, setVerificationCode] = useState("");
    const [isConfiguring2FA, setIsConfiguring2FA] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Sync state with session
    useEffect(() => {
        if (session?.user) {
            setName(session.user.name || "");
            setEmail(session.user.email || "");
            setTwoFactorEnabled((session.user as any).twoFactorEnabled || false);
            setMonthlyReportEnabled((session.user as any).monthlyReportEnabled !== false); // Default to true if not defined
        }
    }, [session]);

    useEffect(() => {
        if (!session?.user) return;

        const canSeeDashboard = hasPermission(session.user, "dashboard");

        if (!canSeeDashboard && (pathname === '/' || pathname === '/dashboard')) {
            if (hasPermission(session.user, "vision")) {
                router.replace('/vision');
            }
        }
    }, [session, pathname, router]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                isMobileMenuOpen &&
                mobileMenuRef.current &&
                !mobileMenuRef.current.contains(event.target as Node) &&
                mobileMenuButtonRef.current &&
                !mobileMenuButtonRef.current.contains(event.target as Node)
            ) {
                setIsMobileMenuOpen(false);
            }
            if (
                isUserMenuOpen &&
                userMenuRef.current &&
                !userMenuRef.current.contains(event.target as Node)
            ) {
                setIsUserMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isMobileMenuOpen]);

    const handleSetup2FA = async () => {
        const res = await fetch("/api/auth/2fa/setup", { method: "POST" });
        const data = await res.json();
        if (data.qrCodeUrl) {
            setQrCodeUrl(data.qrCodeUrl);
            setIsConfiguring2FA(true);
        }
    };

    const handleVerify2FA = async () => {
        const res = await fetch("/api/auth/2fa/verify", {
            method: "POST",
            body: JSON.stringify({ code: verificationCode })
        });
        if (res.ok) {
            setTwoFactorEnabled(true);
            setIsConfiguring2FA(false);
            setQrCodeUrl("");
            setVerificationCode("");

            // Actualizar la sesión para reflejar el 2FA activado
            if (update) await update({ twoFactorEnabled: true });

            alert("✅ 2FA activado correctamente");
        } else {
            const err = await res.json();
            alert("❌ " + (err.error || "Código inválido"));
        }
    };

    const handleUpdateProfile = async () => {
        if (!session?.user) return;
        setSubmitting(true);

        try {
            const res = await fetch(`/api/users/${(session.user as any).id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    email,
                    password: password || undefined,
                    twoFactorEnabled,
                    monthlyReportEnabled
                })
            });

            if (res.ok) {
                setIsProfileOpen(false);
                setPassword("");
                if (update) await update({ name, email, twoFactorEnabled, monthlyReportEnabled });
                alert("✨ Perfil actualizado con éxito");
            } else {
                const err = await res.json();
                alert("❌ " + (err.error || "Error al actualizar perfil"));
            }
        } catch (err) {
            alert("❌ Error de conexión");
        } finally {
            setSubmitting(false);
        }
    };

    const filteredNavItems = navItems.filter(item => {
        return hasPermission(session?.user, item.permission);
    });

    return (
        <header className="fixed top-0 left-0 right-0 h-20 bg-white dark:bg-boxdark-2 border-b border-stroke dark:border-strokedark z-[50] print:hidden">
            <div className="flex w-full h-full items-center justify-between px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-4">
                        <button
                            ref={mobileMenuButtonRef}
                            className="xl:hidden p-2 text-muted-foreground hover:bg-whiten dark:hover:bg-boxdark rounded-md transition-colors"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            <Menu className="w-6 h-6" />
                        </button>

                        <Link href={role === 'USER' ? "/vision" : "/"} className="shrink-0 focus:outline-none">
                            <Logo />
                        </Link>
                    </div>

                    {/* Desktop Navigation Menu */}
                    <nav className="hidden xl:flex items-center gap-1">
                        {filteredNavItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 group",
                                        isActive
                                            ? "bg-primary/10 text-primary dark:bg-primary/20"
                                            : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-meta-4 hover:text-black dark:hover:text-white"
                                    )}
                                >
                                    <item.icon className={cn(
                                        "w-5 h-5 transition-transform group-hover:scale-110",
                                        isActive ? "text-primary" : "text-slate-400 dark:text-slate-500"
                                    )} />
                                    <span className="font-bold text-[11px] lg:text-[13px] uppercase tracking-widest">{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="flex items-center gap-3 sm:gap-6">
                    <div className="flex items-center gap-1.5 sm:gap-3">
                        {mounted && (
                            <button
                                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                className="relative flex h-8.5 w-8.5 items-center justify-center rounded-full border-[0.5px] border-stroke bg-gray hover:text-primary dark:border-strokedark dark:bg-meta-4 dark:text-white transition-all shadow-sm"
                            >
                                {theme === 'dark' ? (
                                    <Sun className="w-4 h-4" />
                                ) : (
                                    <Moon className="w-4 h-4" />
                                )}
                            </button>
                        )}

                        {role === 'ADMIN' && (
                            <Link href="/settings">
                                <button className={cn(
                                    "flex h-8.5 w-8.5 items-center justify-center rounded-full border-[0.5px] border-stroke bg-gray hover:text-primary dark:border-strokedark dark:bg-meta-4 dark:text-white transition-all shadow-sm group",
                                    pathname.startsWith("/settings") ? "text-primary border-primary" : ""
                                )}>
                                    <Settings className="w-4 h-4 group-hover:rotate-45 transition-transform" />
                                </button>
                            </Link>
                        )}
                    </div>

                    <div className="relative" ref={userMenuRef}>
                        <div
                            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                            className="flex items-center gap-3 cursor-pointer group"
                        >
                            <div className="hidden sm:block text-right">
                                <p className="text-sm font-medium text-black dark:text-white leading-none mb-1">
                                    {session?.user?.name || "Operador"}
                                </p>
                                <p className="text-[11px] lg:text-[12px] font-medium text-slate-500 uppercase tracking-tighter leading-none">
                                    {(session?.user as any)?.role || "USER"}
                                </p>
                            </div>
                            <div className="h-12 w-12 rounded-full border border-stroke dark:border-strokedark p-0.5 group-hover:border-primary transition-colors">
                                <div className="h-full w-full rounded-full bg-slate-100 dark:bg-meta-4 flex items-center justify-center overflow-hidden">
                                    <UserCircle2 className="w-8 h-8 text-primary" />
                                </div>
                            </div>
                        </div>

                        {/* User Dropdown Menu */}
                        {isUserMenuOpen && (
                            <div className="absolute right-0 mt-3 w-48 bg-white dark:bg-boxdark border border-stroke dark:border-strokedark shadow-2xl rounded-2xl p-2 animate-in fade-in zoom-in duration-200 z-[60]">
                                <button
                                    onClick={() => {
                                        setName(session?.user?.name || "");
                                        setEmail(session?.user?.email || "");
                                        setTwoFactorEnabled((session?.user as any)?.twoFactorEnabled || false);
                                        setPassword("");
                                        setIsConfiguring2FA(false);
                                        setIsProfileOpen(true);
                                        setIsUserMenuOpen(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-meta-4 rounded-xl transition-all"
                                >
                                    <UserCircle2 className="w-5 h-5" /> Perfil
                                </button>
                                <div className="h-[1px] bg-stroke dark:bg-strokedark my-1 mx-2" />
                                <button
                                    onClick={() => signOut()}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-widest text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all"
                                >
                                    <LogOut className="w-4 h-4" /> Salir
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {isMobileMenuOpen && (
                <div ref={mobileMenuRef} className="xl:hidden absolute top-20 left-0 right-0 bg-white dark:bg-boxdark border-b border-stroke dark:border-strokedark shadow-2xl animate-in slide-in-from-top-5 fade-in duration-300 z-50 backdrop-blur-xl">
                    <div className="p-4 flex flex-col gap-2 max-h-[calc(100vh-5rem)] overflow-y-auto">
                        {filteredNavItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <div className={cn(
                                        "flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-200",
                                        isActive
                                            ? "bg-primary/10 text-primary dark:bg-primary/20"
                                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                    )}>
                                        <item.icon className={cn(
                                            "w-6 h-6",
                                            isActive ? "text-orange-600" : "text-muted-foreground"
                                        )} />
                                        <span className="font-bold text-sm uppercase tracking-wide">{item.label}</span>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Modal de Perfil Propio */}
            <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
                <DialogContent className="sm:max-w-md bg-white dark:bg-boxdark border-none shadow-2xl p-0 overflow-hidden rounded-3xl">
                    <DialogHeader className="bg-slate-900 dark:bg-boxdark-2 p-8 text-white text-left relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full -mr-16 -mt-16" />
                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <DialogTitle className="text-2xl font-black italic tracking-tighter uppercase leading-none">
                                Mi Perfil <span className="text-primary italic">Mone.yo</span>
                            </DialogTitle>
                            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                                <UserCircle2 className="w-7 h-7 text-white" />
                            </div>
                        </div>
                        <DialogDescription className="text-slate-400 font-medium text-xs leading-relaxed max-w-[280px] relative z-10 uppercase tracking-widest">
                            GESTIONA TU IDENTIDAD DIGITAL Y REFUERZA LA SEGURIDAD DE TU CUENTA.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-8 space-y-6 bg-white dark:bg-boxdark">
                        <div className="space-y-4">
                            <div className="space-y-2 text-left">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 opacity-70">Nombre Público</Label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Tu nombre"
                                    className="h-12 bg-slate-50 dark:bg-meta-4 border-none rounded-2xl font-bold focus:ring-2 focus:ring-primary/20 transition-all text-slate-900 dark:text-white"
                                />
                            </div>
                            <div className="space-y-2 text-left">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 opacity-70">Correo Electrónico</Label>
                                <Input
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="correo@ejemplo.com"
                                    className="h-12 bg-slate-50 dark:bg-meta-4 border-none rounded-2xl font-bold focus:ring-2 focus:ring-primary/20 transition-all text-slate-900 dark:text-white"
                                />
                            </div>
                            <div className="space-y-2 text-left">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 opacity-70">Actualizar Contraseña</Label>
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="h-12 bg-slate-50 dark:bg-meta-4 border-none rounded-2xl font-bold focus:ring-2 focus:ring-primary/20 transition-all text-slate-900 dark:text-white"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className={cn(
                            "p-5 rounded-3xl border transition-all duration-300",
                            twoFactorEnabled
                                ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20"
                                : "bg-primary/5 dark:bg-primary/10 border-primary/10 dark:border-primary/20"
                        )}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm",
                                        twoFactorEnabled ? "bg-white dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-white dark:bg-primary/20 text-primary"
                                    )}>
                                        {twoFactorEnabled ? <ShieldCheck className="w-6 h-6" /> : <Smartphone className="w-6 h-6" />}
                                    </div>
                                    <div className="text-left">
                                        <p className={cn(
                                            "text-[10px] font-black uppercase tracking-widest leading-none mb-1",
                                            twoFactorEnabled ? "text-emerald-600 dark:text-emerald-400" : "text-primary"
                                        )}>
                                            {twoFactorEnabled ? "Seguridad Máxima" : "Doble Factor (2FA)"}
                                        </p>
                                        <p className="text-xs font-bold text-slate-900 dark:text-white leading-none italic uppercase">
                                            {twoFactorEnabled ? "Activado" : "Recomendado"}
                                        </p>
                                    </div>
                                </div>
                                <Switch
                                    checked={twoFactorEnabled || isConfiguring2FA}
                                    onCheckedChange={(checked) => {
                                        if (checked && !twoFactorEnabled) {
                                            handleSetup2FA();
                                        } else if (!checked) {
                                            setTwoFactorEnabled(false);
                                            setIsConfiguring2FA(false);
                                        }
                                    }}
                                    className={cn(
                                        "transition-colors",
                                        twoFactorEnabled ? "data-[state=checked]:bg-emerald-500" : "data-[state=checked]:bg-primary-500"
                                    )}
                                />
                            </div>

                            {isConfiguring2FA && (
                                <div className="mt-6 pt-6 border-t border-primary-200/50 animate-in fade-in slide-in-from-top-4 duration-500 text-left">
                                    <div className="space-y-4">
                                        <div className="bg-white p-4 rounded-2xl border-2 border-primary-100 shadow-inner flex justify-center mx-auto w-fit">
                                            <img src={qrCodeUrl} alt="QR 2FA" className="w-32 h-32" />
                                        </div>
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-medium text-slate-500 italic text-center px-4 leading-relaxed">
                                                Escanea con <span className="font-black text-slate-900">Google Authenticator</span> e introduce el código para blindar tu cuenta.
                                            </p>
                                            <div className="flex gap-2">
                                                <Input
                                                    value={verificationCode}
                                                    onChange={(e) => setVerificationCode(e.target.value)}
                                                    placeholder="000000"
                                                    maxLength={6}
                                                    className="h-12 bg-white border-none rounded-2xl font-black text-center tracking-[0.4em] text-xl text-slate-900 shadow-sm"
                                                />
                                                <Button
                                                    onClick={handleVerify2FA}
                                                    className="bg-slate-900 hover:bg-slate-800 text-white rounded-2xl h-12 px-6 font-bold shadow-lg"
                                                >
                                                    Validar
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Reporte Mensual Switch */}
                        <div className={cn(
                            "p-5 rounded-3xl border transition-all duration-300",
                            monthlyReportEnabled
                                ? "bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20"
                                : "bg-slate-50 dark:bg-slate-800/10 border-slate-100 dark:border-slate-800/20"
                        )}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm",
                                        monthlyReportEnabled ? "bg-white dark:bg-blue-500/20 text-blue-600 dark:text-blue-400" : "bg-white dark:bg-slate-800 text-slate-400"
                                    )}>
                                        <Sparkles className="w-6 h-6" />
                                    </div>
                                    <div className="text-left">
                                        <p className={cn(
                                            "text-[10px] font-black uppercase tracking-widest leading-none mb-1",
                                            monthlyReportEnabled ? "text-blue-600 dark:text-blue-400" : "text-slate-500"
                                        )}>
                                            IA Smart Reports
                                        </p>
                                        <p className="text-xs font-bold text-slate-900 dark:text-white leading-none italic uppercase">
                                            {monthlyReportEnabled ? "Reporte Mensual Activo" : "Reporte Desactivado"}
                                        </p>
                                    </div>
                                </div>
                                <Switch
                                    checked={monthlyReportEnabled}
                                    onCheckedChange={setMonthlyReportEnabled}
                                    className="data-[state=checked]:bg-blue-600"
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-8 bg-slate-50 dark:bg-meta-4/20 border-t border-stroke dark:border-strokedark shrink-0 flex flex-row gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex-1 rounded-2xl h-14 font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/5 transition-all"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleUpdateProfile}
                            disabled={submitting}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-14 font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-200 dark:shadow-none active:scale-[0.98] transition-all border-none"
                        >
                            {submitting ? "Cargando..." : "Guardar Perfil"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </header>
    );
}
