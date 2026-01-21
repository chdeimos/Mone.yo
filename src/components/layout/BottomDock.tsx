"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    ArrowLeftRight,
    PieChart,
    Wallet,
    Plus,
    Sparkles
} from "lucide-react";
import { useSession } from "next-auth/react";

export function BottomDock() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const role = (session?.user as any)?.role;

    const allItems = [
        { label: "Inicio", icon: LayoutDashboard, href: "/" },
        { label: "Flujo", icon: ArrowLeftRight, href: "/transactions" },
        { label: "Meta", icon: Plus, href: "/new", isAction: true },
        { label: "Presu", icon: PieChart, href: "/budgets" },
        { label: "Cuentas", icon: Wallet, href: "/accounts" },
        { label: "IA Vision", icon: Sparkles, href: "/vision" },
    ];

    const items = role === 'USER'
        ? allItems.filter(item => item.href === '/vision')
        : allItems.filter(item => item.href !== '/vision');

    return (
        <nav className={cn("lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-2xl border-t border-slate-100 px-6 py-3 z-50 flex items-center pb-8", items.length > 1 ? "justify-between" : "justify-center")}>
            {items.map((item) => {
                const isActive = pathname === item.href;

                if (item.isAction) {
                    return (
                        <button key={item.label} className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200 -mt-8 active:scale-90 transition-transform">
                            <Plus className="text-white w-7 h-7" />
                        </button>
                    );
                }

                return (
                    <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 group">
                        <div className={cn(
                            "p-2 rounded-xl transition-all",
                            isActive ? "text-orange-600 bg-orange-50" : "text-slate-400 group-hover:text-slate-900"
                        )}>
                            <item.icon className="w-6 h-6" />
                        </div>
                        <span className={cn(
                            "text-[10px] font-bold uppercase tracking-tighter",
                            isActive ? "text-orange-600" : "text-slate-400"
                        )}>
                            {item.label}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
}
