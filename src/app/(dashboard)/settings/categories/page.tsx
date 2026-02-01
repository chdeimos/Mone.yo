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
    ArrowLeft, Plus, Pencil, Trash2, Tag, ShoppingCart, Utensils, Car, Home, Zap, Heart, Briefcase,
    Plane, Gamepad2, GraduationCap, Gift, Coffee, Dumbbell, Dog, Stethoscope, Landmark, Receipt,
    Smartphone, Tv, Shirt, Scissors, Brush, Camera, Music, Star, Shield, Lock, HardDrive, Cpu,
    TrendingUp, Wallet2, Bitcoin, HelpCircle, AlertCircle, Fuel, Train, Bike, Ship, Bus
} from "lucide-react";
import Link from "next/link";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const iconMap: any = {
    Tag, ShoppingCart, Utensils, Car, Home, Zap, Heart, Briefcase, Plane, Gamepad2, GraduationCap, Gift,
    Coffee, Dumbbell, Dog, Stethoscope, Landmark, Receipt, Smartphone, Tv, Shirt, Scissors, Brush,
    Camera, Music, Star, Shield, Lock, HardDrive, Cpu, TrendingUp, Wallet2, Bitcoin,
    HelpCircle, AlertCircle, Fuel, Train, Bike, Ship, Bus
};

const AVAILABLE_ICONS = Object.keys(iconMap).sort();

export default function CategoriesPage() {
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<any>(null);

    // Form
    const [name, setName] = useState("");
    const [color, setColor] = useState("#3b82f6");
    const [icon, setIcon] = useState("Tag");

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/categories");
            if (res.ok) {
                const data = await res.json();
                setCategories(data);
            }
        } catch (error) {
            console.error("Error loading categories", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!name) return;

        const payload = { name, color, icon };
        const method = editingCategory ? "PUT" : "POST";
        const url = editingCategory ? `/api/categories/${editingCategory.id}` : "/api/categories";

        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setIsModalOpen(false);
                loadCategories();
                resetForm();
            } else {
                alert("Error al guardar");
            }
        } catch (error) {
            console.error("Error saving", error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar esta categoría?")) return;
        try {
            const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
            if (res.ok) {
                loadCategories();
            } else {
                const data = await res.json();
                alert(data.error || "Error al eliminar");
            }
        } catch (error) {
            console.error("Error deleting", error);
        }
    };

    const resetForm = () => {
        setEditingCategory(null);
        setName("");
        setColor("#3b82f6");
        setIcon("Tag");
    };

    const openEdit = (cat: any) => {
        setEditingCategory(cat);
        setName(cat.name);
        setColor(cat.color || "#3b82f6");
        setIcon(cat.icon || "Tag");
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            {/* Header / Breadcrumb */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-500 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-black dark:text-white uppercase tracking-tight">
                        Categorías
                    </h1>
                    <nav className="flex mt-1">
                        <ol className="flex items-center space-x-2 text-xs font-semibold text-slate-400 uppercase tracking-widest">
                            <li><Link href="/" className="hover:text-primary transition-colors">Dashboard</Link></li>
                            <li><span className="mx-1">/</span></li>
                            <li><Link href="/settings" className="hover:text-primary transition-colors">Configuración</Link></li>
                            <li><span className="mx-1">/</span></li>
                            <li className="text-primary">Categorías</li>
                        </ol>
                    </nav>
                </div>
                <Button
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="bg-blue-600 hover:bg-blue-700 text-white gap-2 rounded-md h-11 px-6 font-bold shadow-md transition-all uppercase text-[10px] tracking-widest border-none"
                >
                    <Plus className="w-4 h-4" /> Nueva Categoría
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading && categories.length === 0 ? (
                    Array.from({ length: 9 }).map((_, i) => (
                        <Card key={i} className="h-28 bg-white dark:bg-boxdark animate-pulse border border-stroke dark:border-strokedark rounded-2xl shadow-sm" />
                    ))
                ) : categories.length === 0 ? (
                    <div className="col-span-full py-24 text-center bg-white dark:bg-boxdark rounded-2xl border border-dashed border-stroke dark:border-strokedark shadow-sm">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-meta-4 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <Tag className="w-8 h-8 text-slate-300 dark:text-slate-500" />
                        </div>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No hay categorías configuradas</p>
                    </div>
                ) : (
                    categories.map((cat) => {
                        const IconComponent = iconMap[cat.icon] || Tag;
                        return (
                            <Card key={cat.id} className="p-6 flex items-center justify-between border-none bg-white dark:bg-boxdark hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group rounded-2xl shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-3xl rounded-full -mr-12 -mt-12 opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="flex items-center gap-5 relative z-10">
                                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-3" style={{ backgroundColor: cat.color }}>
                                        <IconComponent className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="font-black text-black dark:text-white text-base uppercase tracking-tight group-hover:text-primary transition-colors leading-none mb-1.5">{cat.name}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-80 flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                                            {cat._count?.transactions || 0} Movimientos
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-1.5 relative z-10 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-500">
                                    <Button variant="ghost" size="icon" onClick={() => openEdit(cat)} className="h-9 w-9 rounded-xl bg-slate-50 dark:bg-meta-4 text-slate-400 hover:text-primary hover:bg-primary/10 border border-stroke dark:border-strokedark shadow-sm transition-all hover:scale-110">
                                        <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(cat.id)} className="h-9 w-9 rounded-xl bg-slate-50 dark:bg-meta-4 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 border border-stroke dark:border-strokedark shadow-sm transition-all hover:scale-110">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </Card>
                        );
                    })
                )}
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="w-[95vw] sm:max-w-md p-0 overflow-hidden bg-white dark:bg-boxdark border-none shadow-2xl rounded-2xl flex flex-col max-h-[95vh]">
                    <DialogHeader className="bg-boxdark dark:bg-boxdark-2 p-6 md:p-8 text-white text-left relative overflow-hidden shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20">
                                <Tag className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl md:text-2xl font-black text-white uppercase tracking-tight leading-none mb-1.5">
                                    {editingCategory ? "Editar Sector" : "Nueva Clasificación"}
                                </DialogTitle>
                                <DialogDescription className="text-[10px] md:text-xs font-bold uppercase text-slate-400 tracking-widest leading-none opacity-70">
                                    ORGANIZA TUS FLUJOS DE DINERO.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-5 md:p-8 space-y-6 bg-white dark:bg-boxdark overflow-y-auto custom-scrollbar flex-1">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 opacity-70">Etiqueta de Categoría</Label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Ej: Servicios, Ocio, Supermercado..."
                                    className="h-12 rounded-xl bg-slate-50 dark:bg-meta-4 border-none font-bold text-black dark:text-white text-sm focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 opacity-70">Color de Marca</Label>
                                    <div className="flex items-center gap-3">
                                        <div className="relative w-12 h-12 shrink-0">
                                            <Input
                                                type="color"
                                                value={color}
                                                onChange={(e) => setColor(e.target.value)}
                                                className="absolute inset-0 h-full w-full p-0 bg-transparent border-none cursor-pointer opacity-0"
                                            />
                                            <div
                                                className="w-full h-full rounded-xl shadow-inner border border-white/20"
                                                style={{ backgroundColor: color }}
                                            />
                                        </div>
                                        <Input
                                            value={color}
                                            onChange={(e) => setColor(e.target.value)}
                                            className="h-12 flex-1 rounded-xl bg-slate-50 dark:bg-meta-4 border-none font-mono font-bold text-center uppercase text-[10px] text-black dark:text-white shadow-sm"
                                            maxLength={7}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 opacity-70">Iconografía</Label>
                                    <Select value={icon} onValueChange={setIcon}>
                                        <SelectTrigger className="h-12 rounded-xl bg-slate-50 dark:bg-meta-4 border-none font-bold text-black dark:text-white text-xs focus:ring-2 focus:ring-primary/20 transition-all shadow-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-boxdark border-none rounded-xl shadow-2xl z-[60]">
                                            <div className="max-h-[300px] overflow-y-auto p-2 grid grid-cols-1 gap-1">
                                                {AVAILABLE_ICONS.map(iconName => {
                                                    const IconComp = iconMap[iconName];
                                                    return (
                                                        <SelectItem key={iconName} value={iconName} className="font-bold text-[10px] uppercase tracking-widest text-slate-500 focus:text-primary focus:bg-primary/5 cursor-pointer p-3 rounded-lg transition-colors">
                                                            <div className="flex items-center gap-3">
                                                                <IconComp className="w-4 h-4" />
                                                                <span>{iconName}</span>
                                                            </div>
                                                        </SelectItem>
                                                    );
                                                })}
                                            </div>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-6 md:p-8 bg-slate-50 dark:bg-meta-4/20 flex flex-row gap-3 shrink-0 border-t border-stroke dark:border-strokedark">
                        <Button
                            variant="ghost"
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest text-slate-400 hover:text-rose-500 transition-colors"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={!name}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black uppercase tracking-widest px-8 shadow-lg h-12 text-[10px] border-none active:scale-[0.98] transition-all"
                        >
                            {editingCategory ? "Actualizar" : "Confirmar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}