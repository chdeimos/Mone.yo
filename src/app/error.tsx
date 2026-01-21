'use client' // Los componentes de error deben ser Client Components

import { useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCcw, Home } from "lucide-react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Aquí podrías registrar el error en un servicio de reporte (ej. Sentry)
    console.error("Error global capturado:", error)

    // Registrar en base de datos interna
    fetch('/api/system-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            level: 'ERROR',
            message: error.message,
            stack: error.stack,
            context: { digest: error.digest }
        })
    }).catch(e => console.error("Error al guardar log:", e));
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center space-y-8">
      <div className="relative">
        <div className="w-24 h-24 bg-rose-100 rounded-[2rem] flex items-center justify-center shadow-xl shadow-rose-100/50 animate-in zoom-in duration-300">
          <AlertTriangle className="w-12 h-12 text-rose-500" />
        </div>
        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md border border-slate-100">
            <span className="text-xl">😓</span>
        </div>
      </div>
      
      <div className="space-y-3 max-w-md">
        <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">¡Sistema Interrumpido!</h2>
        <p className="text-slate-500 font-medium leading-relaxed">
          Hemos detectado un error inesperado en el procesamiento de datos. No te preocupes, tu información financiera está segura.
        </p>
        {error.digest && (
            <div className="mt-4 p-3 bg-slate-100 rounded-xl border border-slate-200">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ID de Referencia</p>
                <p className="text-xs font-mono text-slate-600 break-all">{error.digest}</p>
            </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs">
        <Button
          onClick={
            // Intenta recuperar el segmento volviendo a renderizarlo
            () => reset()
          }
          className="flex-1 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold h-14 shadow-xl shadow-slate-200 transition-all active:scale-95"
        >
          <RefreshCcw className="w-4 h-4 mr-2" /> Reintentar
        </Button>
        <Button
            variant="outline"
            onClick={() => window.location.href = "/"}
            className="flex-1 border-slate-200 hover:bg-white hover:text-orange-500 hover:border-orange-200 rounded-2xl font-bold h-14 transition-all"
        >
            <Home className="w-4 h-4 mr-2" /> Ir al Inicio
        </Button>
      </div>
      
      <p className="text-[10px] text-slate-400 font-medium">
          Si el problema persiste, contacta con soporte.
      </p>
    </div>
  )
}