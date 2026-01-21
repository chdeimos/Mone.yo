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
        <div className="space-y-6">
            {/* Header / Breadcrumb */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-500 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-black dark:text-white uppercase tracking-tight">
                        Ajustes Generales
                    </h1>
                    <nav className="flex mt-1">
                        <ol className="flex items-center space-x-2 text-xs font-semibold text-slate-500 uppercase tracking-widest">
                            <li><Link href="/" className="hover:text-primary transition-colors">Dashboard</Link></li>
                            <li><span className="mx-1">/</span></li>
                            <li className="text-primary">Configuración</li>
                        </ol>
                    </nav>
                </div>
            </div>

            <div className="grid gap-10">
                {menuItems.map((group, index) => (
                    <div key={index} className="space-y-4">
                        <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{group.title}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {group.items.map((item, itemIndex) => (
                                <Link key={itemIndex} href={item.href}>
                                    <div className="p-5 flex items-center gap-4 hover:shadow-sm transition-all duration-300 cursor-pointer group bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-md hover:border-primary dark:hover:border-primary">
                                        <div className={cn("w-12 h-12 rounded-md flex items-center justify-center transition-colors duration-300",
                                            "bg-slate-50 dark:bg-meta-4 group-hover:bg-primary/10")}>
                                            <item.icon className={cn("w-6 h-6", item.color)} />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-black dark:text-white group-hover:text-primary transition-colors text-sm uppercase tracking-tight">{item.label}</h3>
                                            <p className="text-[10px] text-slate-500 font-medium tracking-tight mt-1 line-clamp-1">{item.description}</p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
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
