import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
    className?: string;
    iconOnly?: boolean;
    dark?: boolean;
    priority?: boolean;
}

export function Logo({ className, iconOnly = false, dark = false, priority = false }: LogoProps) {
    return (
        <div className={cn("flex items-center gap-3 select-none", className)}>
            <div className={cn(
                "relative flex items-center justify-center transition-all duration-300 overflow-hidden",
                iconOnly ? "w-14 h-14" : "w-10 h-10"
            )}>
                {/* Brand Mark: Using the custom image provided by the user with Next.js Optimization */}
                <Image
                    src="/logo.png"
                    alt="Mone.yo Logo"
                    fill
                    sizes="(max-width: 768px) 100vw, 56px"
                    priority={priority}
                    className="object-contain filter drop-shadow-md"
                />
            </div>

            {!iconOnly && (
                <span className={cn(
                    "text-2xl font-black tracking-tighter uppercase italic transition-colors duration-300",
                    dark ? "text-white" : "text-slate-900"
                )}>
                    <span className="text-[#3c50e0]">Mone</span><span className="text-[#10b981]">.yo</span>
                </span>
            )}
        </div>
    );
}

export function MobileLogo({ className }: { className?: string }) {
    return <Logo className={className} iconOnly />;
}

export function DetailedLogo({ className, dark }: { className?: string; dark?: boolean }) {
    return <Logo className={className} dark={dark} />;
}
