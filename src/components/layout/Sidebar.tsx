"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    ArrowLeftRight,
    PieChart,
    Wallet,
    Settings,
    LogOut,
    Smartphone,
    TrendingUp,
    Sparkles,
    ShieldCheck
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { Logo } from "@/components/brand/Logo";
import { hasPermission, Permission } from "@/lib/permissions";

const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/", permission: "accounts" as Permission },
    { label: "Movimientos", icon: ArrowLeftRight, href: "/transactions", permission: "transactions" as Permission },
    { label: "Presupuestos", icon: PieChart, href: "/budgets", permission: "budgets" as Permission },
    { label: "Mis Cuentas", icon: Wallet, href: "/accounts", permission: "accounts" as Permission },
    { label: "IA Vision", icon: Sparkles, href: "/vision", permission: "vision" as Permission },
    { label: "Reportes", icon: TrendingUp, href: "/reports", permission: "reports" as Permission },
];

export function Sidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const user = session?.user as any;
    const role = user?.role;

    const filteredNavItems = navItems.filter(item => {
        if (role === 'ADMIN') return true;
        return hasPermission(user, item.permission);
    });

    const canSeeDashboard = role === 'ADMIN' || hasPermission(user, "dashboard");
    const canSeeVision = hasPermission(user, "vision");
    const canSeeSettings = role === 'ADMIN' || hasPermission(user, "settings");
    const homeHref = canSeeDashboard ? "/" : (canSeeVision ? "/vision" : "/");
    return (
        <aside className="hidden lg:flex w-72 flex-col fixed inset-y-0 border-r border-border bg-boxdark z-[60] print:hidden">
            <div className="p-8 pb-4">
                <Link href={homeHref} className="block">
                    <Logo dark />
                </Link>
            </div>

            <nav className="flex-1 px-4 py-8 space-y-1.5 overflow-y-auto text-bodydark1">
                <p className="px-5 text-[10px] font-black uppercase text-bodydark tracking-[0.2em] mb-4 opacity-70">MENU</p>

                {filteredNavItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link key={item.href} href={item.href}>
                            <div className={cn(
                                "flex items-center gap-4 px-5 py-3 rounded-lg transition-all duration-300 group cursor-pointer",
                                isActive
                                    ? "bg-meta-4 text-white"
                                    : "text-bodydark1 hover:bg-meta-4 hover:text-white"
                            )}>
                                <item.icon className={cn(
                                    "w-5 h-5",
                                    isActive ? "text-white" : "text-bodydark1 group-hover:text-white"
                                )} />
                                <span className="font-semibold text-sm tracking-wide">{item.label}</span>
                            </div>
                        </Link>
                    );
                })}

                {canSeeSettings && (
                    <div className="mt-10 pt-6 border-t border-bodydark/20">
                        <p className="px-5 text-[10px] font-black uppercase text-bodydark tracking-[0.2em] mb-4 opacity-70">SISTEMA</p>
                        <Link href="/settings">
                            <div className={cn(
                                "flex items-center gap-4 px-5 py-3 rounded-lg transition-all duration-300 group cursor-pointer",
                                pathname.startsWith("/settings")
                                    ? "bg-meta-4 text-white"
                                    : "text-bodydark1 hover:bg-meta-4 hover:text-white"
                            )}>
                                <Settings className={cn(
                                    "w-5 h-5 transition-transform duration-500 group-hover:rotate-90",
                                    pathname.startsWith("/settings") ? "text-white" : "text-bodydark1 group-hover:text-white"
                                )} />
                                <span className="font-semibold text-sm tracking-wide">Configuración</span>
                            </div>
                        </Link>
                    </div>
                )}
            </nav>

            <div className="p-6 mt-auto">
                <div className="p-5 bg-meta-4/30 rounded-xl border border-bodydark/10 group hover:border-primary/20 transition-all">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-bodydark uppercase tracking-widest leading-none mb-1">Status</p>
                            <p className="text-xs font-bold text-white uppercase italic">{(session?.user as any)?.twoFactorEnabled ? 'Seguro' : 'Vulnerable'}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => signOut()}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-meta-4/50 hover:bg-destructive text-white rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-bodydark/10"
                    >
                        <LogOut className="w-4 h-4" /> Finalizar Sesión
                    </button>
                </div>
            </div>
        </aside>
    );
}

