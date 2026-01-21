"use client";

import { useState, useRef } from "react";
import { Camera, Upload, Layers, X, Check, FilePlus2, Trash2, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import Image from "next/image";

interface VisionUploaderProps {
    onImagesSelected?: (files: File[]) => void;
    onImageSelected?: (file: File) => void;
    onManualEntry?: () => void;
}

export function VisionUploader({ onImagesSelected, onImageSelected, onManualEntry }: VisionUploaderProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isMultiPartModalOpen, setIsMultiPartModalOpen] = useState(false);
    const [multiPartFiles, setMultiPartFiles] = useState<File[]>([]);
    const [cameraMode, setCameraMode] = useState<'single' | 'multi'>('single');
    const multiPartInputRef = useRef<HTMLInputElement>(null);

    const handleSelection = (files: File[]) => {
        if (onImagesSelected) {
            onImagesSelected(files);
        } else if (onImageSelected && files.length > 0) {
            if (files.length > 1) {
                alert("⚠️ Atención: La página actual no está configurada para múltiples imágenes. Solo se procesará la primera.");
            }
            onImageSelected(files[0]);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleSelection([file]);
        }
    };

    const openCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" }
            });
            setStream(mediaStream);
            setIsCameraOpen(true);

            // Wait for dialog to render
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
            }, 100);
        } catch (error) {
            console.error("Error accessing camera:", error);
            alert("No se pudo acceder a la cámara. Verifica los permisos del navegador.");
        }
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.drawImage(video, 0, 0);

                canvas.toBlob((blob) => {
                    if (blob) {
                        const file = new File([blob], `camera-${Date.now()}.jpg`, { type: "image/jpeg" });
                        if (cameraMode === 'single') {
                            handleSelection([file]);
                        } else {
                            setMultiPartFiles(prev => [...prev, file]);
                        }
                        closeCamera(); // This closes the camera modal
                    }
                }, "image/jpeg", 0.95);
            }
        }
    };

    const closeCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setIsCameraOpen(false);
    };

    const handleMultiPartFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setMultiPartFiles(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const removeMultiPartFile = (index: number) => {
        setMultiPartFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleAnalyzeMultiPart = () => {
        if (multiPartFiles.length > 0) {
            handleSelection(multiPartFiles);
            setIsMultiPartModalOpen(false);
            setMultiPartFiles([]);
        }
    };


    return (
        <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                />

                <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="h-32 flex flex-col gap-3 bg-white dark:bg-meta-4/10 border-2 border-dashed border-slate-200 dark:border-strokedark text-slate-500 hover:border-[#3c50e0] hover:text-[#3c50e0] rounded-xl shadow-sm hover:shadow-md transition-all group"
                    variant="ghost"
                >
                    <Upload className="w-8 h-8 transition-transform group-hover:scale-110" />
                    <span className="font-black text-[10px] uppercase tracking-widest">Subir Foto/PDF</span>
                </Button>

                <Button
                    onClick={() => {
                        setCameraMode('single');
                        openCamera();
                    }}
                    className="h-32 flex flex-col gap-3 bg-white dark:bg-meta-4/10 border-2 border-dashed border-slate-200 dark:border-strokedark text-slate-500 hover:border-emerald-500 hover:text-emerald-600 rounded-xl shadow-sm hover:shadow-md transition-all group"
                    variant="ghost"
                >
                    <Camera className="w-8 h-8 transition-transform group-hover:scale-110" />
                    <span className="font-black text-[10px] uppercase tracking-widest">Cámara Directa</span>
                </Button>

                <Button
                    onClick={() => setIsMultiPartModalOpen(true)}
                    className="h-32 flex flex-col gap-3 bg-white dark:bg-meta-4/10 border-2 border-dashed border-slate-200 dark:border-strokedark text-slate-500 hover:border-violet-500 hover:text-violet-600 rounded-xl shadow-sm hover:shadow-md transition-all group"
                    variant="ghost"
                >
                    <Layers className="w-8 h-8 transition-transform group-hover:scale-110" />
                    <span className="font-black text-[10px] uppercase tracking-widest">Foto por Partes</span>
                </Button>

                <input type="file" ref={multiPartInputRef} className="hidden" accept="image/*,application/pdf" onChange={handleMultiPartFileChange} multiple />

                <Button
                    onClick={onManualEntry}
                    className="h-32 flex flex-col gap-3 bg-white dark:bg-meta-4/10 border-2 border-dashed border-slate-200 dark:border-strokedark text-slate-500 hover:border-amber-500 hover:text-amber-600 rounded-xl shadow-sm hover:shadow-md transition-all group"
                    variant="ghost"
                >
                    <Keyboard className="w-8 h-8 transition-transform group-hover:scale-110" />
                    <span className="font-black text-[10px] uppercase tracking-widest">Datos Manuales</span>
                </Button>
            </div>

            {/* Camera Modal */}
            <Dialog open={isCameraOpen} onOpenChange={closeCamera}>
                <DialogContent className="sm:max-w-3xl bg-white dark:bg-boxdark border-none p-0 overflow-hidden flex flex-col max-h-[90vh]">
                    <DialogHeader className="p-8 bg-boxdark text-white shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/10 rounded-lg text-emerald-400">
                                <Camera className="w-5 h-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-black text-white uppercase tracking-tight leading-none mb-1.5">
                                    Captura de Ticket
                                </DialogTitle>
                                <DialogDescription className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">
                                    Enfoca el documento y captura la imagen
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="relative bg-black flex-1 flex items-center justify-center overflow-hidden">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-contain"
                        />
                        <canvas ref={canvasRef} className="hidden" />
                    </div>

                    <DialogFooter className="p-4 bg-slate-50 dark:bg-meta-4/10 flex-row justify-end gap-3 shrink-0">
                        <Button
                            onClick={closeCamera}
                            variant="ghost"
                            className="h-11 rounded-md font-black uppercase text-[10px] tracking-widest text-slate-400 hover:text-rose-500 transition-colors px-6"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={capturePhoto}
                            className="bg-[#3c50e0] hover:bg-[#2e3ea1] text-white rounded-md font-black uppercase text-[10px] tracking-widest h-11 px-10 shadow-none cursor-pointer transition-colors"
                        >
                            Capturar Foto
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Multi-Part Photo Modal */}
            <Dialog open={isMultiPartModalOpen} onOpenChange={setIsMultiPartModalOpen}>
                <DialogContent className="sm:max-w-2xl bg-white dark:bg-boxdark border-none p-0 overflow-hidden flex flex-col max-h-[90vh]">
                    <DialogHeader className="p-8 bg-boxdark text-white shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/10 rounded-lg text-violet-400">
                                <Layers className="w-5 h-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-black text-white uppercase tracking-tight leading-none mb-1.5">
                                    Adjuntar Partes del Ticket
                                </DialogTitle>
                                <DialogDescription className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">
                                    Combina múltiples capturas para tickets largos
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-8 space-y-6 overflow-y-auto flex-1">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {multiPartFiles.map((file, index) => (
                                <div key={index} className="relative group border-2 border-slate-100 dark:border-strokedark rounded-xl overflow-hidden shadow-sm">
                                    <Image
                                        src={URL.createObjectURL(file)}
                                        alt={`Parte ${index + 1}`}
                                        width={200}
                                        height={200}
                                        className="w-full h-32 object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="rounded-full h-9 w-9 bg-rose-500 hover:bg-rose-600 text-white border-none"
                                            onClick={() => removeMultiPartFile(index)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            <div className="h-32 flex flex-col items-center justify-center gap-2 border-dashed border-2 border-slate-200 dark:border-strokedark rounded-xl bg-slate-50/50 dark:bg-meta-4/10 group hover:border-[#3c50e0] transition-colors">
                                <Button
                                    variant="ghost"
                                    className="flex-1 w-full flex flex-col h-auto hover:bg-transparent"
                                    onClick={() => {
                                        setCameraMode('multi');
                                        openCamera();
                                    }}
                                >
                                    <Camera className="w-6 h-6 text-slate-400 transition-transform group-hover:scale-110" />
                                    <span className="text-[10px] font-black uppercase tracking-widest mt-2 text-slate-400 group-hover:text-[#3c50e0]">Añadir Captura</span>
                                </Button>
                                <button
                                    onClick={() => multiPartInputRef.current?.click()}
                                    className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter pb-2 hover:text-[#3c50e0] transition-colors"
                                >
                                    o buscar archivo
                                </button>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-4 bg-slate-50 dark:bg-meta-4/10 flex-row justify-end gap-3 shrink-0">
                        <Button
                            variant="ghost"
                            onClick={() => setIsMultiPartModalOpen(false)}
                            className="h-11 rounded-md font-black uppercase text-[10px] tracking-widest text-slate-400 hover:text-rose-500 transition-colors px-6"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleAnalyzeMultiPart}
                            disabled={multiPartFiles.length === 0}
                            className="bg-[#3c50e0] hover:bg-[#2e3ea1] text-white rounded-md font-black uppercase text-[10px] tracking-widest h-11 px-10 shadow-none cursor-pointer transition-colors disabled:cursor-not-allowed disabled:pointer-events-auto"
                        >
                            <Check className="w-4 h-4 mr-2" /> Analizar Partes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
