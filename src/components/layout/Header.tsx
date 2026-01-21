"use client";

import { Bell, Search, UserCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";

export function Header() {
    return (
        <header className="h-20 border-b border-slate-100 bg-white/50 backdrop-blur-xl sticky top-0 z-40 px-6 md:px-10 flex items-center justify-between">
            <div className="relative w-full max-w-md hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                    placeholder="Buscar transacciones, cuentas..."
                    className="pl-10 h-11 bg-slate-50 border-none rounded-xl focus-visible:ring-1 focus-visible:ring-slate-200 transition-all"
                />
            </div>

            <div className="flex items-center gap-4 ml-auto">
                <button className="w-11 h-11 bg-slate-50 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-colors relative">
                    <Bell className="w-5 h-5 text-slate-600" />
                    <div className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                </button>
                <div className="h-11 pl-4 flex items-center gap-3 border-l border-slate-100 ml-2">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-slate-900">Usuario Premium</p>
                        <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Plan Pro</p>
                    </div>
                    <div className="w-11 h-11 bg-orange-100 rounded-xl flex items-center justify-center border border-orange-200">
                        <UserCircle2 className="w-6 h-6 text-orange-600" />
                    </div>
                </div>
            </div>
        </header>
    );
}
