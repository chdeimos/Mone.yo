import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Barra de Navegación Superior Unificada */}
            <Navbar />

            <div className="flex flex-col min-h-screen">
                <main className="flex-1 px-3 py-4 sm:p-6 md:p-10 pb-12 mt-20 print:mt-0 print:p-0">
                    <div className="max-w-[1600px] mx-auto space-y-10">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
