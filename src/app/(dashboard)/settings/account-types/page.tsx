"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { ArrowLeft, Plus, Pencil, Trash2, Wallet, Building2, Banknote, TrendingUp, Coins, PiggyBank, CreditCard, Landmark, Briefcase, Vault, Landmark as Bank, Gem, BadgeDollarSign, Receipt, Smartphone, Globe, Lock, ShieldCheck, Key, ShoppingBag, Store, Factory, Home, Car, Plane, Smartphone as Phone } from "lucide-react";
import Link from "next/link";

const iconMap: any = {
    Wallet, Building2, Banknote, TrendingUp, Coins, PiggyBank, CreditCard, Landmark, Briefcase, Vault,
    Bank, Gem, BadgeDollarSign, Receipt, Smartphone, Globe, Lock, ShieldCheck, Key, ShoppingBag, Store,
    Factory, Home, Car, Plane, Phone
};

const AVAILABLE_ICONS = Object.keys(iconMap).sort();

export default function AccountTypesPage() {
    const [types, setTypes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingType, setEditingType] = useState<any>(null);
    const [name, setName] = useState("");
    const [icon, setIcon] = useState("Wallet");

    useEffect(() => {
        loadTypes();
    }, []);

    const loadTypes = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/account-types");
            if (res.ok) {
                const data = await res.json();
                setTypes(data);
            }
        } catch (error) {
            console.error("Error loading types", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!name) return;

        const payload = { name, icon };
        const method = editingType ? "PUT" : "POST";
        const url = editingType ? `/api/account-types/${editingType.id}` : "/api/account-types";

        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setIsModalOpen(false);
                loadTypes();
                resetForm();
            } else {
                alert("Error al guardar");
            }
        } catch (error) {
            console.error("Error saving", error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar este tipo de cuenta?")) return;
        try {
            const res = await fetch(`/api/account-types/${id}`, { method: "DELETE" });
            if (res.ok) {
                loadTypes();
            } else {
                const data = await res.json();
                alert(data.error || "Error al eliminar");
            }
        } catch (error) {
            console.error("Error deleting", error);
        }
    };

    const resetForm = () => {
        setEditingType(null);
        setName("");
        setIcon("Wallet");
    };

    const openEdit = (type: any) => {
        setEditingType(type);
        setName(type.name);
        setIcon(type.icon || "Wallet");
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            {/* Header / Breadcrumb */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-500 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-black dark:text-white uppercase tracking-tight">
                        Tipos de Cuenta
                    </h1>
                    <nav className="flex mt-1">
                        <ol className="flex items-center space-x-2 text-xs font-semibold text-slate-400 uppercase tracking-widest">
                            <li><Link href="/" className="hover:text-primary transition-colors">Dashboard</Link></li>
                            <li><span className="mx-1">/</span></li>
                            <li><Link href="/settings" className="hover:text-primary transition-colors">Configuración</Link></li>
                            <li><span className="mx-1">/</span></li>
                            <li className="text-primary">Tipos de Cuenta</li>
                        </ol>
                    </nav>
                </div>
                <Button
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="bg-blue-600 hover:bg-blue-700 text-white gap-2 rounded-md h-11 px-6 font-bold shadow-md transition-all uppercase text-[10px] tracking-widest border-none"
                >
                    <Plus className="w-4 h-4" /> Nuevo Tipo
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading && types.length === 0 ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <Card key={i} className="h-24 bg-white dark:bg-boxdark animate-pulse border-stroke dark:border-strokedark rounded-md shadow-sm" />
                    ))
                ) : types.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-white dark:bg-boxdark rounded-md border border-dashed border-stroke dark:border-strokedark">
                        <Wallet className="w-12 h-12 text-slate-300 dark:text-slate-500 mx-auto mb-4" />
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No hay tipos de cuenta configurados</p>
                    </div>
                ) : (
                    types.map((type) => {
                        const IconComponent = iconMap[type.icon] || Wallet;
                        return (
                            <Card key={type.id} className="p-5 flex items-center justify-between border-none bg-white dark:bg-boxdark hover:shadow-md transition-all duration-300 group rounded-md shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-md bg-slate-50 dark:bg-meta-4 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300">
                                        <IconComponent className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-black dark:text-white text-sm uppercase tracking-tight group-hover:text-primary transition-colors">{type.name}</p>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 opacity-80">
                                            {type._count?.accounts || 0} cuentas vinculadas
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                    <Button variant="ghost" size="icon" onClick={() => openEdit(type)} className="h-8 w-8 rounded-md bg-white dark:bg-boxdark text-slate-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-meta-4 border border-stroke dark:border-strokedark">
                                        <Pencil className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(type.id)} className="h-8 w-8 rounded-md bg-white dark:bg-boxdark text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-stroke dark:border-strokedark">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </Card>
                        );
                    })
                )}
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-white dark:bg-boxdark border-none shadow-2xl rounded-md">
                    <DialogHeader className="p-8 border-b border-stroke dark:border-strokedark">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-md flex items-center justify-center text-primary">
                                <Wallet className="w-6 h-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-black text-black dark:text-white uppercase tracking-tight leading-none mb-1.5">
                                    {editingType ? "Modificar Tipo" : "Registrar Activo"}
                                </DialogTitle>
                                <DialogDescription className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">
                                    Define un grupo para organizar tus recursos.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-8 space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Denominación</Label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ej: Efectivo, Banco, Cripto..."
                                className="h-11 rounded-md bg-slate-50 dark:bg-meta-4 border-stroke dark:border-strokedark font-bold text-black dark:text-white text-xs focus:ring-1 focus:ring-primary"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Identificador Visual</Label>
                            <Select value={icon} onValueChange={setIcon}>
                                <SelectTrigger className="h-11 rounded-md bg-slate-50 dark:bg-meta-4 border-stroke dark:border-strokedark font-bold text-black dark:text-white text-xs focus:ring-1 focus:ring-primary">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-boxdark border-stroke dark:border-strokedark rounded-md">
                                    {AVAILABLE_ICONS.map(iconName => {
                                        const IconComp = iconMap[iconName];
                                        return (
                                            <SelectItem key={iconName} value={iconName} className="font-bold text-xs uppercase tracking-widest text-slate-500 focus:text-primary focus:bg-slate-50 dark:focus:bg-meta-4 cursor-pointer p-3">
                                                <div className="flex items-center gap-3">
                                                    <IconComp className="w-4 h-4" />
                                                    <span>{iconName}</span>
                                                </div>
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter className="p-8 bg-slate-50 dark:bg-meta-4/10 flex-col sm:flex-row gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => setIsModalOpen(false)}
                            className="h-11 rounded-md font-black uppercase text-[10px] tracking-widest text-slate-400 hover:text-rose-500 transition-colors"
                        >
                            Ignorar
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={!name}
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-md font-black uppercase tracking-widest px-8 shadow-md h-11 text-[10px] border-none"
                        >
                            {editingType ? "Actualizar" : "Confirmar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}