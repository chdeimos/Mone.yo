"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import {
    Plus,
    Search,
    Filter,
    ArrowUpRight,
    ArrowDownLeft,
    ArrowLeftRight,
    ArrowRight,
    Calendar,
    Wallet,
    Tags,
    ChevronRight,
    MoreVertical,
    Trash2,
    Settings,
    Pencil,
    CheckCircle2,
    Circle,
    Repeat,
    PauseCircle,
    Paperclip,
    Download,
    Printer,
    FileSpreadsheet,
    Upload,
    ChevronUp,
    ChevronDown,
    AlertCircle,
    AlertTriangle,
    Check,
    X,
    Loader2,
    FileUp,
    CheckCircle,
    ChevronLeft
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function ImportTransactionsPage() {
    const router = useRouter();
    const [accounts, setAccounts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Import States
    const [importAccountId, setImportAccountId] = useState("");
    const [importData, setImportData] = useState<any[]>([]);
    const [isParsing, setIsParsing] = useState(false);
    const [isSavingImport, setIsSavingImport] = useState(false);
    const [existingTransactions, setExistingTransactions] = useState<any[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [accRes, catRes, txRes] = await Promise.all([
                fetch("/api/accounts"),
                fetch("/api/categories"),
                fetch("/api/transactions?limit=500") // Para detectar duplicados
            ]);

            const [accData, catData, txData] = await Promise.all([
                accRes.json(),
                catRes.json(),
                txRes.json()
            ]);

            setAccounts(accData);
            setCategories(catData);
            setExistingTransactions(txData.transactions || (Array.isArray(txData) ? txData : []));
        } catch (error) {
            console.error("Error loading data for import:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsParsing(true);
        try {
            if (file.type === "application/pdf") {
                // Proceso vía IA para PDFs (Trade Republic, etc)
                const formData = new FormData();
                formData.append("file", file);

                const res = await fetch("/api/import/bank-pdf", {
                    method: "POST",
                    body: formData
                });

                if (!res.ok) throw new Error("Error en la respuesta de la API de PDF");

                const aiTransactions = await res.json();

                const processedData = aiTransactions.map((tx: any) => {
                    const dateObj = new Date(tx.date);
                    return {
                        ...tx,
                        date: dateObj.toISOString(),
                        selected: true,
                        isVerified: true,
                        isDuplicate: existingTransactions.some(etx => {
                            const eDate = new Date(etx.date);
                            return eDate.getFullYear() === dateObj.getFullYear() &&
                                eDate.getMonth() === dateObj.getMonth() &&
                                eDate.getDate() === dateObj.getDate() &&
                                Math.abs(parseFloat(etx.amount)) === Math.abs(tx.amount) &&
                                ((etx.description || "").toLowerCase().includes((tx.description || "").toLowerCase().substring(0, 10)) ||
                                    (tx.description || "").toLowerCase().includes((etx.description || "").toLowerCase().substring(0, 10)))
                        })
                    };
                }).map((tx: any) => ({
                    ...tx,
                    selected: !tx.isDuplicate
                }));

                setImportData(processedData);
                return;
            }

            // Proceso estándar para Excel/CSV
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            let jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            // Detección y corrección de CSVs mal procesados (común en MyInvestor)
            // Si detectamos que XLSX no ha separado bien las columnas (común con ;)
            const singleColWithSemicolon = jsonData.slice(0, 10).filter(row => row.length <= 1 && String(row[0] || '').includes(';')).length;
            if (singleColWithSemicolon >= 2) {
                const newJsonData: any[][] = [];
                for (const row of jsonData) {
                    if (row.length <= 1 && String(row[0] || '').includes(';')) {
                        // Split manual básico para CSVs con punto y coma
                        const parts = String(row[0] || '').split(';');
                        newJsonData.push(parts);
                    } else if (row.length > 1) {
                        newJsonData.push(row);
                    }
                }
                jsonData = newJsonData;
            }

            // Identificar el formato basado en las cabeceras
            let bankFormat: 'caixa' | 'caixa_new' | 'myinvestor' | 'generic' = 'generic';
            let startRow = 0;

            for (let i = 0; i < Math.min(jsonData.length, 20); i++) {
                const rowStr = JSON.stringify(jsonData[i]).toLowerCase();
                const normalizedRow = rowStr.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

                // MyInvestor Detection
                if ((normalizedRow.includes('fecha') && normalizedRow.includes('concepto')) || normalizedRow.includes('divisa')) {
                    if (normalizedRow.includes('divisa') || normalizedRow.includes('importe')) {
                        bankFormat = 'myinvestor';
                        startRow = i + 1;
                        break;
                    }
                }

                if (normalizedRow.includes('f. operacion') || (normalizedRow.includes('valor') && (normalizedRow.includes('detalle') || normalizedRow.includes('mas datos')))) {
                    if (normalizedRow.includes('movimiento') && normalizedRow.includes('importe')) {
                        bankFormat = 'caixa_new';
                    } else {
                        bankFormat = 'caixa';
                    }
                    startRow = i + 1;
                    break;
                }
            }

            const rawTransactions = jsonData.slice(startRow)
                .filter(row => {
                    const dateCandidate = String(row[0] || '');
                    return dateCandidate.includes('/') && dateCandidate.length >= 8;
                })
                .map((row, idx) => {
                    try {
                        let dateObj: Date;
                        let description: string = 'Sin concepto';
                        let amountRaw: number = 0;
                        let cleanEntity: string = '';

                        if (bankFormat === 'myinvestor') {
                            const dateStr = String(row[0] || '').trim();
                            const [day, month, year] = dateStr.split('/').map(Number);
                            dateObj = new Date(year, month - 1, day);
                            description = String(row[2] || '').trim();
                            cleanEntity = description;

                            const parseAmount = (val: any) => {
                                if (typeof val === 'number') return val;
                                let s = String(val || '0').trim();
                                if (s === '') return 0;
                                if (s.includes(',') && s.includes('.')) {
                                    return parseFloat(s.replace(/\./g, '').replace(',', '.'));
                                }
                                if (s.includes(',')) {
                                    return parseFloat(s.replace(',', '.'));
                                }
                                if (s.match(/^-?\d+\.\d{3}$/)) {
                                    return parseFloat(s.replace(/\./g, ''));
                                }
                                return parseFloat(s);
                            };
                            amountRaw = parseAmount(row[3]);
                        } else if (bankFormat === 'caixa_new') {
                            const dateVal = row[0];
                            if (typeof dateVal === 'number') {
                                dateObj = new Date(Math.round((dateVal - 25569) * 86400 * 1000));
                            } else {
                                const [day, month, year] = String(dateVal).split('/').map(Number);
                                dateObj = new Date(year, month - 1, day);
                            }
                            const movimiento = String(row[2] || '').trim();
                            const masDatos = String(row[3] || '').trim();
                            cleanEntity = movimiento;
                            description = (movimiento + (masDatos ? ' - ' + masDatos : '')).trim();
                            amountRaw = typeof row[4] === 'number' ? row[4] : parseFloat(String(row[4] || '0').replace(/\./g, '').replace(',', '.'));
                        } else if (bankFormat === 'caixa') {
                            const dateStr = String(row[4] || row[5]).trim();
                            const [day, month, year] = dateStr.split('/').map(Number);
                            dateObj = new Date(year, month - 1, day);
                            const entityRaw = String(row[14] || '').trim();
                            const detail = String(row[18] || '').trim();
                            cleanEntity = entityRaw.replace(/^CORE\s*/i, '').trim();
                            description = (cleanEntity + (detail ? ' - ' + detail : '')).trim();
                            if (typeof row[7] === 'number') amountRaw = -Math.abs(row[7]);
                            else if (typeof row[6] === 'number') amountRaw = Math.abs(row[6]);
                            else {
                                const val7 = parseFloat(String(row[7] || '0').replace(/\./g, '').replace(',', '.'));
                                const val6 = parseFloat(String(row[6] || '0').replace(/\./g, '').replace(',', '.'));
                                if (val7 !== 0) amountRaw = -Math.abs(val7);
                                else if (val6 !== 0) amountRaw = Math.abs(val6);
                            }
                        } else {
                            // Generic
                            const dateStr = String(row[0] || '').trim();
                            const [day, month, year] = dateStr.split('/').map(Number);
                            dateObj = new Date(year, month - 1, day);
                            description = String(row[1] || '').trim();
                            amountRaw = typeof row[2] === 'number' ? row[2] : parseFloat(String(row[2] || '0').replace(/\./g, '').replace(',', '.'));
                        }

                        if (amountRaw === 0 || isNaN(amountRaw)) return null;

                        return {
                            date: dateObj.toISOString(),
                            description: description.substring(0, 150),
                            amount: Math.abs(amountRaw),
                            type: amountRaw > 0 ? "INGRESO" : "GASTO",
                            isVerified: true,
                            selected: true,
                            isDuplicate: existingTransactions.some(tx => {
                                const eDate = new Date(tx.date);
                                return eDate.getFullYear() === dateObj.getFullYear() &&
                                    eDate.getMonth() === dateObj.getMonth() &&
                                    eDate.getDate() === dateObj.getDate() &&
                                    Math.abs(parseFloat(tx.amount)) === Math.abs(amountRaw) &&
                                    (tx.description || "").toLowerCase().includes((cleanEntity || "").toLowerCase().substring(0, 10))
                            })
                        };
                    } catch (err) {
                        return null;
                    }
                })
                .filter(tx => tx !== null);

            setImportData(rawTransactions.map((tx: any) => ({
                ...tx,
                selected: !tx.isDuplicate
            })));

        } catch (error) {
            console.error("Error parsing file:", error);
            alert("Error al leer el archivo.");
        } finally {
            setIsParsing(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleSaveImport = async () => {
        if (!importAccountId) {
            alert("Selecciona una cuenta de origen para los movimientos");
            return;
        }

        const toSave = importData.filter(d => d.selected);
        if (toSave.length === 0) {
            alert("No hay movimientos seleccionados para importar");
            return;
        }

        setIsSavingImport(true);
        try {
            const res = await fetch("/api/transactions/bulk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    accountId: importAccountId,
                    transactions: toSave
                })
            });

            if (res.ok) {
                alert(`Se han importado ${toSave.length} movimientos con éxito`);
                router.push("/transactions");
            } else {
                throw new Error("Error en el servidor");
            }
        } catch (error) {
            console.error("Error saving import:", error);
            alert("Error al guardar los movimientos.");
        } finally {
            setIsSavingImport(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-8 space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
            {/* Header / Breadcrumbs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <button
                        onClick={() => router.back()}
                        className="group flex items-center gap-2 text-slate-400 hover:text-primary transition-colors text-xs font-black uppercase tracking-widest mb-2"
                    >
                        <chevronleft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Volver a Movimientos
                    </button>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-4">
                        <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/30 text-white">
                            <FileUp className="w-8 h-8" />
                        </div>
                        Importación Bancaria
                    </h1>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="ghost"
                        onClick={() => router.push("/transactions")}
                        className="h-14 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest text-slate-400"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSaveImport}
                        disabled={isSavingImport || importData.filter(d => d.selected).length === 0}
                        className="h-14 px-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all border-none"
                    >
                        {isSavingImport ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                        {isSavingImport ? "Procesando..." : "Finalizar Importación"}
                    </Button>
                </div>
            </div>

            <div className="flex flex-col gap-8">
                {/* Panel de Configuración Superior */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {/* 1. Origen de Datos */}
                    <Card className="bg-white dark:bg-boxdark border-none shadow-sm rounded-3xl overflow-hidden p-6">
                        <div className="space-y-4">
                            <Label className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">1. Origen de Datos</Label>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-stroke dark:border-strokedark rounded-2xl p-6 flex flex-col items-center justify-center gap-3 hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-600/5 transition-all cursor-pointer group h-32"
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept=".xls,.xlsx,.csv,.pdf"
                                    onChange={handleFileChange}
                                />
                                <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-meta-4 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <FileSpreadsheet className="w-6 h-6" />
                                </div>
                                <div className="text-center">
                                    <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">Subir Extracto</p>
                                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">Excel, CSV o PDF (Trade Republic)</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* 2. Cuenta de Registro */}
                    <Card className="bg-white dark:bg-boxdark border-none shadow-sm rounded-3xl overflow-hidden p-6">
                        <div className="space-y-4">
                            <Label className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">2. Cuenta de Registro</Label>
                            <div className="h-32 flex flex-col justify-center">
                                <Select value={importAccountId} onValueChange={setImportAccountId}>
                                    <SelectTrigger className="h-14 bg-slate-50 dark:bg-meta-4 border-none rounded-2xl font-black px-6 text-base text-slate-900 dark:text-white shadow-inner">
                                        <SelectValue placeholder="Seleccionar Cuenta..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-boxdark border-stroke dark:border-strokedark rounded-2xl p-2">
                                        {accounts.map(acc => (
                                            <SelectItem key={acc.id} value={acc.id} className="font-bold py-3 rounded-xl">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: acc.color }} />
                                                    {acc.name}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-3 px-1">Cuenta donde se registrarán los movimientos.</p>
                            </div>
                        </div>
                    </Card>

                    {/* 3. Resumen Inteligente */}
                    {importData.length > 0 ? (
                        <Card className="bg-slate-900 border-none shadow-xl rounded-3xl overflow-hidden p-6 flex flex-col justify-center">
                            <div className="space-y-4">
                                <p className="text-[11px] font-black uppercase text-blue-400 tracking-[0.2em]">Resumen Inteligente</p>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-white/5 p-3 rounded-2xl">
                                        <span className="block text-white font-black text-xl leading-none">{importData.length}</span>
                                        <span className="text-slate-400 text-[8px] font-black uppercase tracking-widest mt-1 block">Leídos</span>
                                    </div>
                                    <div className="bg-blue-500/10 p-3 rounded-2xl">
                                        <span className="block text-blue-400 font-black text-xl leading-none">{importData.filter(d => d.selected).length}</span>
                                        <span className="text-slate-400 text-[8px] font-black uppercase tracking-widest mt-1 block">OK</span>
                                    </div>
                                    <div className={cn(
                                        "p-3 rounded-2xl flex flex-col",
                                        importData.filter(d => d.isDuplicate).length > 0 ? "bg-rose-500/10" : "bg-emerald-500/10"
                                    )}>
                                        <span className={cn(
                                            "block font-black text-xl leading-none",
                                            importData.filter(d => d.isDuplicate).length > 0 ? "text-rose-500" : "text-emerald-500"
                                        )}>
                                            {importData.filter(d => d.isDuplicate).length}
                                        </span>
                                        <span className="text-slate-400 text-[8px] font-black uppercase tracking-widest mt-1 block">Dups</span>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ) : (
                        <Card className="bg-slate-50 dark:bg-meta-4/5 border-2 border-dashed border-stroke dark:border-strokedark rounded-3xl p-6 flex flex-col items-center justify-center opacity-40">
                            <div className="text-center space-y-2">
                                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Esperando archivo...</p>
                            </div>
                        </Card>
                    )}
                </div>

                {/* Panel de Tabla - Full Width */}
                <Card className="bg-white dark:bg-boxdark border-none shadow-sm rounded-3xl overflow-hidden flex flex-col min-h-[500px]">
                    <div className="p-8 border-b border-stroke dark:border-strokedark flex items-center justify-between bg-slate-50/50 dark:bg-meta-4/10">
                        <Label className="text-[12px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                            <Filter className="w-4 h-4" /> Clasificación de Movimientos
                        </Label>
                        {importData.length > 0 && (
                            <div className="flex gap-4">
                                <Button
                                    variant="ghost"
                                    onClick={() => setImportData(prev => prev.map(d => ({ ...d, selected: true })))}
                                    className="h-8 text-[10px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-50"
                                >
                                    Seleccionar Todo
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => setImportData(prev => prev.map(d => ({ ...d, selected: false })))}
                                    className="h-8 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50"
                                >
                                    Deseleccionar
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="flex-1">
                        {isParsing ? (
                            <div className="h-full flex flex-col items-center justify-center gap-6 text-blue-600 py-32">
                                <Loader2 className="w-16 h-16 animate-spin" />
                                <div className="text-center">
                                    <p className="text-sm font-black uppercase tracking-[0.3em] mb-2">Motor de Análisis Activo</p>
                                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Decodificando estructura del banco...</p>
                                </div>
                            </div>
                        ) : importData.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-stroke dark:border-strokedark text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                            <th className="px-8 py-4 w-16 text-center">OK</th>
                                            <th className="px-4 py-4 w-24">Fecha</th>
                                            <th className="px-4 py-4">Descripción</th>
                                            <th className="px-4 py-4 w-40">Clasificación</th>
                                            <th className="px-8 py-4 text-right w-32">Importe</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-stroke dark:divide-strokedark">
                                        {importData.map((row, idx) => (
                                            <tr
                                                key={idx}
                                                className={cn(
                                                    "hover:bg-slate-50 dark:hover:bg-meta-4/5 transition-colors group",
                                                    row.isDuplicate && "bg-rose-50/20 dark:bg-rose-500/5",
                                                    !row.selected && "opacity-40 grayscale-[0.8]"
                                                )}
                                            >
                                                <td className="px-8 py-5 text-center">
                                                    <button
                                                        onClick={() => {
                                                            const newData = [...importData];
                                                            newData[idx].selected = !newData[idx].selected;
                                                            setImportData(newData);
                                                        }}
                                                        className={cn(
                                                            "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                                                            row.selected ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20 scale-100" : "bg-slate-100 dark:bg-meta-4 text-slate-400 hover:scale-105"
                                                        )}
                                                    >
                                                        {row.selected ? <Check className="w-5 h-5 stroke-[3px]" /> : <X className="w-5 h-5" />}
                                                    </button>
                                                </td>
                                                <td className="px-4 py-5 text-xs font-mono font-bold text-slate-500">
                                                    {formatDate(row.date)}
                                                </td>
                                                <td className="px-4 py-5">
                                                    <div className="flex flex-col gap-1 max-w-sm xl:max-w-2xl">
                                                        <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">{row.description}</span>
                                                        {row.isDuplicate && (
                                                            <div className="flex items-center gap-1.5 py-0.5 px-2 bg-rose-500/10 rounded-md w-fit">
                                                                <AlertTriangle className="w-3 h-3 text-rose-500" />
                                                                <span className="text-[9px] text-rose-500 font-black uppercase tracking-tight">Registro Duplicado</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-5">
                                                    <div className="flex flex-col gap-2">
                                                        <select
                                                            value={row.type}
                                                            onChange={(e) => {
                                                                const newData = [...importData];
                                                                newData[idx].type = e.target.value;
                                                                setImportData(newData);
                                                            }}
                                                            className={cn(
                                                                "text-[10px] font-black uppercase tracking-[0.1em] px-3 py-1.5 rounded-lg border-none outline-none cursor-pointer transition-all",
                                                                row.type === "INGRESO" ? "bg-emerald-500/10 text-emerald-600 focus:ring-1 ring-emerald-500" :
                                                                    row.type === "GASTO" ? "bg-rose-500/10 text-rose-600 focus:ring-1 ring-rose-500" : "bg-blue-600/10 text-blue-600 focus:ring-1 ring-blue-600"
                                                            )}
                                                        >
                                                            <option value="GASTO">GASTO</option>
                                                            <option value="INGRESO">INGRESO</option>
                                                            <option value="TRASPASO">TRASPASO</option>
                                                        </select>

                                                        {row.type === "TRASPASO" ? (
                                                            <select
                                                                value={row.destinationAccountId || ""}
                                                                onChange={(e) => {
                                                                    const newData = [...importData];
                                                                    newData[idx].destinationAccountId = e.target.value;
                                                                    setImportData(newData);
                                                                }}
                                                                className="text-[9px] font-black uppercase tracking-tight px-3 py-1.5 rounded-lg bg-blue-600 text-white border-none outline-none cursor-pointer transition-all shadow-md shadow-blue-500/20"
                                                            >
                                                                <option value="">¿Destino?</option>
                                                                {accounts.filter(a => a.id !== importAccountId).map(acc => (
                                                                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                                                                ))}
                                                            </select>
                                                        ) : (
                                                            <select
                                                                value={row.categoryId || ""}
                                                                onChange={(e) => {
                                                                    const newData = [...importData];
                                                                    newData[idx].categoryId = e.target.value;
                                                                    setImportData(newData);
                                                                }}
                                                                className="text-[9px] font-black uppercase tracking-tight px-3 py-1.5 rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-none outline-none cursor-pointer transition-all"
                                                            >
                                                                <option value="">Categoría...</option>
                                                                {categories.map(cat => (
                                                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                                ))}
                                                            </select>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className={cn(
                                                    "px-8 py-5 text-right font-black text-lg tabular-nums tracking-tighter shrink-0",
                                                    row.type === "INGRESO" ? "text-emerald-500" :
                                                        row.type === "GASTO" ? "text-rose-500" : "text-blue-500"
                                                )}>
                                                    <span className="text-xs opacity-50 mr-1">{row.type === "INGRESO" ? "+" : row.type === "GASTO" ? "-" : "≈"}</span>
                                                    {formatCurrency(row.amount)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center gap-6 py-32">
                                {isParsing ? (
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
                                        <p className="text-sm font-black uppercase text-blue-600 tracking-widest">Analizando extracto...</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="w-24 h-24 bg-slate-50 dark:bg-meta-4 rounded-full flex items-center justify-center text-slate-200">
                                            <Search className="w-12 h-12" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-black uppercase text-slate-400 tracking-widest">Esperando Datos</p>
                                            <p className="text-[11px] text-slate-300 font-bold uppercase tracking-widest mt-1">Sube un extracto bancario para empezar</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
