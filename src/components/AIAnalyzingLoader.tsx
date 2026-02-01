"use client";

import { memo } from "react";
import { Sparkles, Brain, ScanLine } from "lucide-react";

interface AIAnalyzingLoaderProps {
    message?: string;
    submessage?: string;
}

function AIAnalyzingLoader({
    message = "La inteligencia artificial está analizando el documento",
    submessage = "Extrayendo datos y categorizando..."
}: AIAnalyzingLoaderProps) {
    return (
        <div className="fixed inset-0 bg-white/95 dark:bg-boxdark/95 backdrop-blur-md z-[999] flex flex-col items-center justify-center">
            {/* Animated Background Gradient */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-[#3c50e0]/20 via-emerald-500/20 to-[#3c50e0]/20 rounded-full blur-3xl animate-pulse" />
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center max-w-md px-6">
                {/* Animated Icon Container */}
                <div className="relative mb-8">
                    {/* Outer Ring */}
                    <div className="absolute inset-0 w-32 h-32 border-4 border-slate-200 dark:border-strokedark rounded-full animate-ping opacity-20" />

                    {/* Middle Ring */}
                    <div className="absolute inset-0 w-32 h-32 border-4 border-[#3c50e0]/30 rounded-full animate-spin" style={{ animationDuration: '3s' }} />

                    {/* Inner Ring */}
                    <div className="absolute inset-2 w-28 h-28 border-4 border-emerald-500/30 rounded-full animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }} />

                    {/* Center Icon Container */}
                    <div className="relative w-32 h-32 bg-gradient-to-br from-[#3c50e0] to-emerald-500 rounded-full flex items-center justify-center shadow-2xl shadow-[#3c50e0]/50">
                        <div className="absolute inset-0 bg-white/10 rounded-full animate-pulse" />
                        <Brain className="w-16 h-16 text-white animate-pulse" style={{ animationDuration: '1.5s' }} />

                        {/* Floating Sparkles */}
                        <Sparkles className="absolute top-2 right-2 w-5 h-5 text-yellow-300 animate-bounce" style={{ animationDelay: '0s' }} />
                        <Sparkles className="absolute bottom-2 left-2 w-4 h-4 text-yellow-300 animate-bounce" style={{ animationDelay: '0.3s' }} />
                        <ScanLine className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 text-white/30 animate-pulse" style={{ animationDuration: '2s' }} />
                    </div>
                </div>

                {/* Text Content */}
                <div className="text-center space-y-4">
                    {/* Main Message */}
                    <h3 className="text-lg font-black uppercase tracking-tight text-[#3c50e0] dark:text-white">
                        {message}
                    </h3>

                    {/* Animated Dots */}
                    <div className="flex items-center justify-center gap-2">
                        <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                            Espere
                        </span>
                        <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 bg-[#3c50e0] rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                            <span className="w-1.5 h-1.5 bg-[#3c50e0] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                            <span className="w-1.5 h-1.5 bg-[#3c50e0] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                        </div>
                    </div>

                    {/* Submessage */}
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        {submessage}
                    </p>

                    {/* Progress Bar */}
                    <div className="w-full max-w-xs mx-auto mt-6">
                        <div className="h-1.5 bg-slate-200 dark:bg-strokedark rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-[#3c50e0] via-emerald-500 to-[#3c50e0] rounded-full animate-pulse"
                                style={{
                                    width: '100%',
                                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite, shimmer 2s linear infinite',
                                    backgroundSize: '200% 100%'
                                }}
                            />
                        </div>
                    </div>

                    {/* AI Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#3c50e0]/10 dark:bg-[#3c50e0]/20 rounded-full border border-[#3c50e0]/20 mt-4">
                        <Sparkles className="w-3.5 h-3.5 text-[#3c50e0]" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-[#3c50e0]">
                            Powered by Gemini AI
                        </span>
                    </div>
                </div>
            </div>

            {/* Add shimmer animation */}
            <style jsx>{`
                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
            `}</style>
        </div>
    );
}

export default memo(AIAnalyzingLoader);
