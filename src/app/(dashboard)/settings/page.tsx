"use client";

import {
    Wallet,
    Tags,
    Repeat,
    Sparkles,
    Users,
    ShieldCheck,
    FileText,
    ChevronRight,
    Database
} from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
    const menuItems = [
        {
            title: "Gestión de Datos",
            items: [
                {
                    label: "Tipos de Cuentas",
                    href: "/settings/account-types",
                    icon: Wallet,
                    description: "Define los tipos de cuentas (Banco, Efectivo, etc.)",
                    color: "text-emerald-500",
                    bgColor: "bg-emerald-500/10"
                },
                {
                    label: "Categorías",
                    href: "/settings/categories",
                    icon: Tags,
                    description: "Administra las categorías de gastos e ingresos",
                    color: "text-blue-500",
                    bgColor: "bg-blue-500/10"
                },
                {
                    label: "Tipos de Frecuencia",
                    href: "/settings/frequencies",
                    icon: Repeat,
                    description: "Configura las periodicidades para movimientos recurrentes",
                    color: "text-primary",
                    bgColor: "bg-primary/10"
                },
                {
                    label: "Movimientos Recurrentes",
                    href: "/settings/recurring",
                    icon: Repeat,
                    description: "Gestiona cobros y pagos que se repiten automáticamente",
                    color: "text-blue-500",
                    bgColor: "bg-blue-500/10"
                }
            ]
        },
        {
            title: "Inteligencia Artificial",
            items: [
                {
                    label: "Modelo y Prompt",
                    href: "/settings/ai",
                    icon: Sparkles,
                    description: "Configura el modelo de IA y las instrucciones del sistema",
                    color: "text-primary",
                    bgColor: "bg-primary/10"
                }
            ]
        },
        {
            title: "Administración",
            items: [
                {
                    label: "Usuarios",
                    href: "/settings/users",
                    icon: Users,
                    description: "Gestión de usuarios y permisos",
                    color: "text-orange-500",
                    bgColor: "bg-orange-500/10"
                },
                {
                    label: "Logs de Accesos",
                    href: "/settings/access-logs",
                    icon: ShieldCheck,
                    description: "Historial de seguridad e inicios de sesión",
                    color: "text-muted-foreground",
                    bgColor: "bg-muted/10"
                },
                {
                    label: "Logs del Sistema",
                    href: "/settings/system-logs",
                    icon: FileText,
                    description: "Registro de errores e incidencias técnicas",
                    color: "text-rose-500",
                    bgColor: "bg-rose-500/10"
                }
            ]
        },
        {
            title: "Gestión Web",
            items: [
                {
                    label: "Base de Datos",
                    href: "/settings/database",
                    icon: Database,
                    description: "Copias de seguridad y restauración del sistema",
                    color: "text-indigo-500",
                    bgColor: "bg-indigo-500/10"
                }
            ]
        }
    ];

    return (
        <div className="space-y-8 pb-12">
            {/* Header / Breadcrumb */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 px-4 md:px-0">
                <div className="animate-in slide-in-from-left-4 duration-500">
                    <h1 className="text-3xl font-black text-black dark:text-white uppercase tracking-tight leading-none mb-2">
                        Configuración
                    </h1>
                    <nav className="flex items-center space-x-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] opacity-70">
                        <Link href="/" className="hover:text-primary transition-colors">Dashboard</Link>
                        <span>/</span>
                        <span className="text-primary underline underline-offset-4 decoration-2">Sistema</span>
                    </nav>
                </div>
            </div>

            <div className="grid gap-12 px-4 md:px-0">
                {menuItems.map((group, index) => (
                    <div key={index} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${index * 100}ms` }}>
                        <div className="flex items-center gap-4">
                            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary/60 border-b-2 border-primary/20 pb-1">{group.title}</h2>
                            <div className="flex-1 h-px bg-slate-100 dark:bg-strokedark" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {group.items.map((item, itemIndex) => (
                                <Link key={itemIndex} href={item.href}>
                                    <div className="p-6 flex items-center gap-5 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 cursor-pointer group bg-white dark:bg-boxdark border-none rounded-2xl shadow-sm relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-3xl rounded-full -mr-12 -mt-12 opacity-0 group-hover:opacity-100 transition-opacity" />

                                        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm",
                                            "bg-slate-50 dark:bg-meta-4/20 group-hover:bg-primary/10 group-hover:scale-110 group-hover:rotate-3")}>
                                            <item.icon className={cn("w-6 h-6", item.color)} />
                                        </div>
                                        <div className="flex-1 relative z-10">
                                            <h3 className="font-black text-black dark:text-white group-hover:text-primary transition-colors text-base uppercase tracking-tight leading-none mb-2">{item.label}</h3>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 opacity-80 leading-relaxed line-clamp-1">{item.description}</p>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all relative z-10" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
