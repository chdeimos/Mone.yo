"use client";

import { useState } from "react";
import {
    Database,
    Download,
    Upload,
    AlertTriangle,
    CheckCircle2,
    Loader2,
    Trash2,
    AlertCircle,
    XCircle,
    FileArchive,
    FolderSync,
    FileUp
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { signOut } from "next-auth/react";
// import { toast } from "sonner"; // Removed because it's not installed

export default function DatabaseSettingsPage() {
    const [isBackingUp, setIsBackingUp] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [restoreFile, setRestoreFile] = useState<File | null>(null);

    // Reset State
    const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
    const [resetStep, setResetStep] = useState(1);
    const [resetKeyword, setResetKeyword] = useState("");
    const [isReseting, setIsReseting] = useState(false);

    // Uploads State
    const [isBackingUpUploads, setIsBackingUpUploads] = useState(false);
    const [isRestoringUploads, setIsRestoringUploads] = useState(false);
    const [restoreUploadsFile, setRestoreUploadsFile] = useState<File | null>(null);

    const handleBackup = async () => {
        setIsBackingUp(true);
        try {
            const response = await fetch("/api/admin/database/backup");
            if (!response.ok) throw new Error("Error al generar copia de seguridad");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            const date = new Date().toISOString().split('T')[0];
            a.download = `moneyo_backup_${date}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();

            alert("Copia de seguridad generada correctamente");
        } catch (error) {
            console.error(error);
            alert("Error al generar copia de seguridad");
        } finally {
            setIsBackingUp(false);
        }
    };

    const handleRestore = async () => {
        if (!restoreFile) {
            alert("Por favor, selecciona un archivo de respaldo");
            return;
        }

        if (!confirm("ADVERTENCIA: Esto reemplazará TODOS los datos actuales. ¿Estás seguro?")) {
            return;
        }

        setIsRestoring(true);
        try {
            const formData = new FormData();
            formData.append("file", restoreFile);

            const response = await fetch("/api/admin/database/restore", {
                method: "POST",
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Error al restaurar base de datos");
            }

            alert("Base de datos restaurada correctamente. Recargando página...");
            setTimeout(() => window.location.reload(), 2000);
        } catch (error: any) {
            console.error(error);
            alert(error.message || "Error al restaurar base de datos");
        } finally {
            setIsRestoring(false);
        }
    };

    const handleRestoreClick = () => {
        if (!restoreFile) {
            alert("Por favor, selecciona un archivo de respaldo");
            return;
        }

        if (!confirm("ADVERTENCIA: Esto reemplazará TODOS los datos actuales. ¿Estás seguro?")) {
            return;
        }

        handleRestore();
    };

    const handleBackupUploads = async () => {
        setIsBackingUpUploads(true);
        try {
            const response = await fetch("/api/admin/uploads/download");
            if (!response.ok) throw new Error("Error al descargar archivos");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            const date = new Date().toISOString().split('T')[0];
            a.download = `uploads_backup_${date}.zip`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();

            alert("Archivos descargados correctamente");
        } catch (error) {
            console.error(error);
            alert("Error al descargar archivos");
        } finally {
            setIsBackingUpUploads(false);
        }
    };

    const handleRestoreUploads = async () => {
        if (!restoreUploadsFile) {
            alert("Por favor, selecciona un archivo ZIP");
            return;
        }

        if (!confirm("ADVERTENCIA: Esto reemplazará TODOS los archivos actuales en la carpeta de uploads. ¿Estás seguro?")) {
            return;
        }

        setIsRestoringUploads(true);
        try {
            const formData = new FormData();
            formData.append("file", restoreUploadsFile);

            const response = await fetch("/api/admin/uploads/restore", {
                method: "POST",
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Error al restaurar archivos");
            }

            alert("Archivos restaurados correctamente");
            setRestoreUploadsFile(null);
        } catch (error: any) {
            console.error(error);
            alert(error.message || "Error al restaurar archivos");
        } finally {
            setIsRestoringUploads(false);
        }
    };

    const handleSystemReset = async () => {
        if (resetKeyword !== "moneyo") {
            alert("La palabra clave es incorrecta");
            return;
        }

        setIsReseting(true);
        try {
            const response = await fetch("/api/admin/database/reset", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ keyword: resetKeyword })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Error al resetear sistema");
            }

            alert("Sistema reseteado correctamente. Serás redirigido al login.");
            signOut({ callbackUrl: "/login" });
        } catch (error: any) {
            console.error(error);
            alert(error.message);
        } finally {
            setIsReseting(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold text-black dark:text-white uppercase tracking-tight flex items-center gap-2">
                    <Database className="w-6 h-6 text-primary" />
                    Gestión de Base de Datos
                </h1>
                <nav className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                    Configuración / Gestión Web / <span className="text-primary">Base de Datos</span>
                </nav>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Backup Section */}
                <Card className="bg-white dark:bg-boxdark border-none shadow-sm h-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Download className="w-5 h-5 text-emerald-500" />
                            Respaldar Datos
                        </CardTitle>
                        <CardDescription>
                            Descarga una copia completa de toda la información de la aplicación en formato JSON.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg border border-emerald-100 dark:border-emerald-500/20">
                            <ul className="text-xs space-y-2 text-emerald-800 dark:text-emerald-400 font-medium">
                                <li className="flex gap-2">
                                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                                    Incluye Usuarios, Transacciones y Cuentas.
                                </li>
                                <li className="flex gap-2">
                                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                                    Incluye Categorías y Presupuestos.
                                </li>
                                <li className="flex gap-2">
                                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                                    Incluye Logs de sistema y accesos.
                                </li>
                            </ul>
                        </div>
                        <Button
                            onClick={handleBackup}
                            disabled={isBackingUp}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 gap-2"
                        >
                            {isBackingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            GENERAR COPIA DE SEGURIDAD
                        </Button>
                    </CardContent>
                </Card>

                {/* Restore Section */}
                <Card className="bg-white dark:bg-boxdark border-none shadow-sm h-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Upload className="w-5 h-5 text-rose-500" />
                            Restaurar Datos
                        </CardTitle>
                        <CardDescription>
                            Sube un archivo de respaldo previamente generado para recuperar la información.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="p-4 bg-rose-50 dark:bg-rose-500/10 rounded-lg border border-rose-100 dark:border-rose-500/20">
                            <div className="flex gap-3">
                                <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
                                <p className="text-xs text-rose-800 dark:text-rose-400 font-bold uppercase tracking-tight">
                                    ¡PELIGRO!: Esta acción eliminará permanentemente todos los datos actuales y los reemplazará con el contenido del archivo subido.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Seleccionar Archivo JSON</Label>
                            <Input
                                type="file"
                                accept=".json"
                                onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
                                className="h-11 bg-slate-50 dark:bg-meta-4 border-stroke dark:border-strokedark rounded-md font-bold text-xs"
                            />
                        </div>

                        <Button
                            onClick={handleRestoreClick}
                            disabled={isRestoring || !restoreFile}
                            variant="destructive"
                            className="w-full font-bold h-12 gap-2"
                        >
                            {isRestoring ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                            RESTAURAR BASE DE DATOS
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Uploads Management Section */}
            <div className="mt-10 space-y-4">
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 ml-1">Gestión de Archivos (Uploads)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Backup Uploads */}
                    <Card className="bg-white dark:bg-boxdark border-none shadow-sm h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <FileArchive className="w-5 h-5 text-primary" />
                                Respaldar Imágenes
                            </CardTitle>
                            <CardDescription>
                                Descarga un archivo ZIP con todas las imágenes y tickets subidos al sistema.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-4 bg-primary/5 dark:bg-primary/10 rounded-lg border border-primary/10 dark:border-primary/20">
                                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                                    Este archivo contiene la carpeta completa <code className="font-bold text-primary">public/uploads</code>. Es importante guardarlo junto con el respaldo de la base de datos para mantener la integridad de los movimientos.
                                </p>
                            </div>
                            <Button
                                onClick={handleBackupUploads}
                                disabled={isBackingUpUploads}
                                className="w-full bg-primary hover:bg-opacity-90 text-white font-bold h-12 gap-2"
                            >
                                {isBackingUpUploads ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                DESCARGAR UPLOADS (.ZIP)
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Restore Uploads */}
                    <Card className="bg-white dark:bg-boxdark border-none shadow-sm h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <FolderSync className="w-5 h-5 text-orange-500" />
                                Restaurar Imágenes
                            </CardTitle>
                            <CardDescription>
                                Sube un archivo ZIP para restaurar la carpeta de archivos multimedia.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-4 bg-orange-50 dark:bg-orange-500/10 rounded-lg border border-orange-100 dark:border-orange-500/20">
                                <div className="flex gap-3">
                                    <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0" />
                                    <p className="text-xs text-orange-800 dark:text-orange-400 font-bold uppercase tracking-tight">
                                        ¡AVISO!: Se eliminarán los archivos actuales antes de extraer el contenido del ZIP seleccionado.
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Seleccionar Archivo ZIP</Label>
                                <Input
                                    type="file"
                                    accept=".zip"
                                    onChange={(e) => setRestoreUploadsFile(e.target.files?.[0] || null)}
                                    className="h-11 bg-white dark:bg-meta-4 border-stroke dark:border-strokedark rounded-md font-bold text-xs"
                                />
                            </div>
                            <Button
                                onClick={handleRestoreUploads}
                                disabled={isRestoringUploads || !restoreUploadsFile}
                                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold h-12 gap-2"
                            >
                                {isRestoringUploads ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
                                RESTAURAR ARCHIVOS
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="mt-8">
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 mb-4 ml-1">Zona de Peligro</h2>
                <Card className="border-2 border-rose-500/20 bg-rose-500/[0.02] dark:bg-rose-500/[0.01]">
                    <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-md bg-rose-500/10 flex items-center justify-center shrink-0">
                                <Trash2 className="w-6 h-6 text-rose-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-black dark:text-white uppercase tracking-tight">Borrar Base de Datos</h3>
                                <p className="text-xs text-slate-500 font-medium mt-1">
                                    Elimina todas las transacciones, cuentas, categorías y usuarios. Solo se mantendrá el administrador por defecto.
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="destructive"
                            className="bg-rose-500 hover:bg-rose-600 px-8 font-black uppercase text-[10px] tracking-widest h-12 shadow-lg shadow-rose-500/20"
                            onClick={() => {
                                setResetStep(1);
                                setResetKeyword("");
                                setIsResetDialogOpen(true);
                            }}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            RESETEAR SISTEMA A 0
                        </Button>
                    </div>
                </Card>
            </div>

            {/* Reset Dialog */}
            <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden bg-white dark:bg-boxdark border-none shadow-2xl rounded-md">
                    <DialogHeader className="p-8 border-b border-stroke dark:border-strokedark bg-rose-500/5">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-rose-500/10 rounded-md flex items-center justify-center text-rose-500">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-black text-black dark:text-white uppercase tracking-tight leading-none mb-1.5">
                                    Acción Destructiva
                                </DialogTitle>
                                <DialogDescription className="text-[10px] font-black uppercase text-rose-500 tracking-widest leading-none">
                                    Esta operación no se puede deshacer.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-8 space-y-6">
                        {resetStep === 1 ? (
                            <div className="space-y-4">
                                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                                    Se van a eliminar <span className="font-bold text-black dark:text-white uppercase">TODOS</span> los registros de la base de datos:
                                </p>
                                <ul className="space-y-2 text-[11px] font-bold uppercase tracking-tight text-slate-500">
                                    <li className="flex items-center gap-2"><XCircle className="w-4 h-4 text-rose-500" /> Todas las Transacciones</li>
                                    <li className="flex items-center gap-2"><XCircle className="w-4 h-4 text-rose-500" /> Todas las Cuentas</li>
                                    <li className="flex items-center gap-2"><XCircle className="w-4 h-4 text-rose-500" /> Todas las Categorías</li>
                                    <li className="flex items-center gap-2"><XCircle className="w-4 h-4 text-rose-500" /> Todos los Usuarios (excepto admin@moneyo.com)</li>
                                </ul>
                                <div className="pt-4 p-4 bg-orange-500/10 border border-orange-500/20 rounded-md text-orange-600 dark:text-orange-400 text-xs font-bold uppercase tracking-tight">
                                    ADVERTENCIA: Deberás volver a iniciar sesión después de esta operación.
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Confirmación de Seguridad</Label>
                                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium italic">
                                    Para confirmar la eliminación total, escribe la palabra clave <span className="font-black text-rose-500 uppercase">'moneyo'</span> a continuación.
                                </p>
                                <Input
                                    placeholder="Escribe la palabra clave aquí..."
                                    className="h-12 bg-slate-50 dark:bg-meta-4 border-rose-500/30 font-bold text-center text-sm uppercase tracking-widest"
                                    value={resetKeyword}
                                    onChange={(e) => setResetKeyword(e.target.value.toLowerCase())}
                                />
                            </div>
                        )}
                    </div>

                    <DialogFooter className="p-8 bg-slate-50 dark:bg-meta-4/20 flex gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => setIsResetDialogOpen(false)}
                            className="flex-1 h-12 rounded-md font-black uppercase text-[10px] tracking-widest text-slate-400"
                        >
                            Cancelar
                        </Button>
                        {resetStep === 1 ? (
                            <Button
                                onClick={() => setResetStep(2)}
                                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white rounded-md font-black uppercase tracking-widest h-12 text-[10px]"
                            >
                                Siguiente Paso
                            </Button>
                        ) : (
                            <Button
                                onClick={handleSystemReset}
                                disabled={resetKeyword !== "moneyo" || isReseting}
                                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md font-black uppercase tracking-widest h-12 text-[10px] shadow-lg shadow-rose-500/20"
                            >
                                {isReseting ? <Loader2 className="w-4 h-4 animate-spin" /> : "BORRAR TODO"}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

