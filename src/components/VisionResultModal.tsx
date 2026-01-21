"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, X, Calendar, DollarSign, Store, Wallet, AlertTriangle, BadgeEuro, Sparkles } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface VisionResultModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageFile?: File | null;
    imageFiles?: File[];
    analysisData: any;
    onSave: (data: any) => Promise<void>;
}

export function VisionResultModal({ isOpen, onClose, imageFile, imageFiles, analysisData, onSave }: VisionResultModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<any>({
        amount: "",
        date: "",
        description: "",
        categoryId: "",
        accountId: ""
    });

    const [accounts, setAccounts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen) {
            loadContext();
        }
    }, [isOpen]);

    useEffect(() => {
        if (analysisData && accounts.length > 0 && categories.length > 0) {
            // Match Category by Name (fuzzy or exact)
            const matchedCat = categories.find(c => c.name.toLowerCase() === analysisData.categoryName?.toLowerCase())
                || categories.find(c => c.name === "Otros") || categories[0];

            // Match Account by Name
            const matchedAcc = accounts.find(a => a.name.toLowerCase() === analysisData.accountName?.toLowerCase())
                || accounts.find(a => a.name === "Efectivo") || accounts[0];

            setFormData({
                amount: analysisData.amount || "",
                date: analysisData.date || new Date().toISOString().split('T')[0],
                description: analysisData.description || "",
                categoryId: matchedCat?.id || "",
                accountId: matchedAcc?.id || ""
            });
        }
    }, [analysisData, accounts, categories]);

    const loadContext = async () => {
        const [accRes, catRes] = await Promise.all([fetch("/api/accounts"), fetch("/api/categories")]);
        if (accRes.ok) setAccounts(await accRes.json());
        if (catRes.ok) setCategories(await catRes.json());
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await onSave(formData);
            onClose();
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const filesToDisplay = imageFiles && imageFiles.length > 0 ? imageFiles : (imageFile ? [imageFile] : []);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-4xl bg-white dark:bg-boxdark border-none p-0 overflow-hidden max-h-[90vh] flex flex-col">
                <DialogHeader className="p-8 bg-boxdark text-white shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/10 rounded-lg text-emerald-400">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-black text-white uppercase tracking-tight leading-none mb-1.5">
                                {filesToDisplay.length > 0 ? "Validación IA" : "Registro Manual"}
                            </DialogTitle>
                            <DialogDescription className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">
                                {filesToDisplay.length > 0 ? "Confirma los datos extraídos por Gemini AI" : "Introduce los datos del movimiento"}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-8">
                    <div className={cn("grid gap-12 h-full", filesToDisplay.length > 0 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1")}>
                        {/* Document Preview */}
                        {filesToDisplay.length > 0 && (
                            <div className="bg-slate-50 dark:bg-meta-4/10 border border-slate-100 dark:border-strokedark rounded-xl p-4 flex flex-col gap-4 items-center relative min-h-[300px] overflow-y-auto max-h-[600px] shadow-inner">
                                {filesToDisplay.map((file, index) => (
                                    <div key={index} className="w-full shadow-lg rounded-xl overflow-hidden">
                                        {file.type === 'application/pdf' ? (
                                            <embed
                                                src={URL.createObjectURL(file)}
                                                type="application/pdf"
                                                className="w-full h-[500px] bg-white"
                                            />
                                        ) : (
                                            <img
                                                src={URL.createObjectURL(file)}
                                                alt={`Ticket part ${index + 1}`}
                                                className="w-full object-contain bg-white"
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Form */}
                        <div className="space-y-6">
                            {/* Alert Warning */}
                            {filesToDisplay.length > 0 && (
                                <div className="bg-amber-500/10 p-4 rounded-lg flex items-start gap-3 border border-amber-500/20">
                                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                    <p className="text-[10px] text-amber-600 dark:text-amber-500 font-bold uppercase tracking-wider leading-relaxed">
                                        La IA puede cometer errores. Verifica el importe y la fecha con el ticket original.
                                    </p>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Descripción / Comercio</Label>
                                <div className="relative">
                                    <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                    <Input
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="pl-12 h-12 rounded-md bg-slate-50 dark:bg-meta-4/20 border-none font-bold text-black dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Importe</Label>
                                    <div className="relative">
                                        <BadgeEuro className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input
                                            type="number"
                                            value={formData.amount}
                                            onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                            className="pl-12 h-12 rounded-md bg-slate-50 dark:bg-meta-4/20 border-none font-black text-xl text-black dark:text-white"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Fecha Pago</Label>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                        <Input
                                            type="date"
                                            value={formData.date}
                                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                                            className="pl-12 h-12 rounded-md bg-slate-50 dark:bg-meta-4/20 border-none font-bold text-black dark:text-white w-full text-left"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Categoría IA</Label>
                                    <Select value={formData.categoryId} onValueChange={val => setFormData({ ...formData, categoryId: val })}>
                                        <SelectTrigger className="h-12 rounded-md bg-slate-50 dark:bg-meta-4/20 border-none font-bold text-black dark:text-white">
                                            <SelectValue placeholder="Seleccionar..." />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-boxdark rounded-md shadow-xl border-slate-100 dark:border-strokedark z-[60]">
                                            {categories.map(c => (
                                                <SelectItem key={c.id} value={c.id}>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                                                        {c.name}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Cuenta Origen</Label>
                                    <Select value={formData.accountId} onValueChange={val => setFormData({ ...formData, accountId: val })}>
                                        <SelectTrigger className="h-12 rounded-md bg-slate-50 dark:bg-meta-4/20 border-none font-bold text-black dark:text-white">
                                            <SelectValue placeholder="Seleccionar..." />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-boxdark rounded-md shadow-xl border-slate-100 dark:border-strokedark z-[60]">
                                            {accounts.map(a => (
                                                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-4 bg-slate-50 dark:bg-meta-4/10 flex-row justify-end gap-3 shrink-0 border-t border-slate-100 dark:border-strokedark">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="h-11 rounded-md font-black uppercase text-[10px] tracking-widest text-slate-400 hover:text-rose-500 transition-colors px-6"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={loading}
                        className="bg-[#3c50e0] hover:bg-[#2e3ea1] text-white rounded-md font-black uppercase text-[10px] tracking-widest h-11 px-10 shadow-none cursor-pointer transition-colors disabled:cursor-not-allowed disabled:pointer-events-auto"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
