"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
    Lock,
    User,
    ArrowRight,
    Loader2,
    AlertCircle
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [code, setCode] = useState("");
    const [show2FA, setShow2FA] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const result = await signIn("credentials", {
                email,
                password,
                code: show2FA ? code : "",
                redirect: false,
            });

            console.log("Auth result:", result);

            if (result?.error) {
                if (result.error === "2FA_REQUIRED") {
                    setShow2FA(true);
                    setError("");
                } else if (result.error === "INVALID_2FA") {
                    setError("Código de seguridad incorrecto");
                } else if (result.error === "CredentialsSignin") {
                    // Password incorrecto o error genérico
                    setError("Credenciales no autorizadas (Email o Contraseña)");
                } else {
                    setError(result.error || "Error en el sistema de acceso");
                }
            } else {
                window.location.href = "/";
            }
        } catch (err) {
            console.error("Login catch error:", err);
            setError("Error en el sistema de acceso");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-background flex items-center justify-center p-6">
            <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="flex flex-col items-center text-center space-y-4">
                    <Logo iconOnly className="w-24 h-24 mb-2 drop-shadow-2xl" priority={true} />
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black tracking-tighter italic text-foreground uppercase">
                            <span className="text-[#3c50e0]">Mone</span><span className="text-[#10b981]">.yo</span>
                        </h1>
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.3em]">IA + Inteligencia Financiera Privada</p>
                    </div>
                </div>

                <Card className="bg-card border-border rounded-2xl shadow-2xl shadow-orange-500/5 overflow-hidden border">
                    <CardHeader className="pt-10 pb-6 px-10 text-center space-y-1">
                        <CardTitle className="text-xl font-bold text-foreground">Acceso Restringido</CardTitle>
                        <CardDescription className="text-sm font-medium text-muted-foreground italic">Introduce tus credenciales de administrador</CardDescription>
                    </CardHeader>

                    <CardContent className="px-10 pb-12">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex items-center gap-3 text-rose-600 text-xs font-bold animate-in shake duration-300">
                                    <AlertCircle className="w-4 h-4" />
                                    {error}
                                </div>
                            )}

                            {!show2FA ? (
                                <>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Usuario / Email</Label>
                                        <div className="relative group">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                            <Input
                                                type="email"
                                                placeholder="admin@moneyo.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                                autoComplete="email"
                                                className="pl-11 h-14 bg-muted border-none rounded-xl focus-visible:ring-1 focus-visible:ring-primary/20 transition-all font-medium text-foreground"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Clave de Seguridad</Label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                            <Input
                                                type="password"
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                autoComplete="current-password"
                                                className="pl-11 h-14 bg-muted border-none rounded-xl focus-visible:ring-1 focus-visible:ring-primary/20 transition-all text-foreground"
                                            />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                                    <div className="bg-primary/10 p-4 rounded-2xl border border-primary/20 flex flex-col items-center text-center gap-2">
                                        <div className="w-10 h-10 bg-background rounded-xl flex items-center justify-center shadow-sm border border-primary/20 mb-1">
                                            <Logo iconOnly className="w-6 h-6" />
                                        </div>
                                        <p className="text-[10px] font-black uppercase text-primary tracking-widest leading-none">Doble Factor Activo</p>
                                        <p className="text-xs font-bold text-foreground italic leading-none uppercase">Verifica tu Identidad</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Código de 6 dígitos</Label>
                                        <Input
                                            value={code}
                                            onChange={(e) => setCode(e.target.value)}
                                            placeholder="000000"
                                            maxLength={6}
                                            autoFocus
                                            autoComplete="one-time-code"
                                            className="h-16 bg-muted border-none rounded-xl font-bold text-center tracking-[0.8em] text-2xl focus-visible:ring-1 focus-visible:ring-primary/20 transition-all text-foreground"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShow2FA(false)}
                                            className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest hover:text-slate-600 transition-colors w-full pt-1"
                                        >
                                            Volver al inicio de sesión
                                        </button>
                                    </div>
                                </div>
                            )}

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full h-14 bg-foreground hover:bg-foreground/90 text-background font-bold rounded-xl shadow-xl shadow-primary/10 mt-4 group flex justify-between px-8"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                                ) : (
                                    <>
                                        <span>{show2FA ? "VERIFICAR CÓDIGO" : "ENTRAR AL PANEL"}</span>
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <p className="text-center text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                    Mone.yo • Chdeimos • v2.0.4
                </p>
            </div>
        </main>
    );
}
