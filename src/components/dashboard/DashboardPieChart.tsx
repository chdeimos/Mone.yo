"use client";

import { memo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/utils";

interface DashboardPieChartProps {
    data: any[];
    percentage: number;
}

function DashboardPieChart({ data, percentage }: DashboardPieChartProps) {
    return (
        <div className="h-[250px] relative">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={95}
                        paddingAngle={5}
                        dataKey="value"
                        animationBegin={400}
                        animationDuration={1500}
                    >
                        <Cell fill="#ef4444" stroke="none" />
                        <Cell fill="#10b981" stroke="none" className="opacity-20" />
                    </Pie>
                    <Tooltip
                        content={({ active, payload }: any) => {
                            if (active && payload && payload.length) {
                                return (
                                    <div className="bg-slate-900/95 dark:bg-black/95 backdrop-blur-sm p-3 rounded-md border border-white/10 shadow-2xl">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{payload[0].name}</p>
                                        <p className="text-sm font-black text-white">{formatCurrency(payload[0].value)}</p>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Gasto Total</span>
                <span className="text-xl font-black text-black dark:text-white tracking-tighter">
                    {percentage}%
                </span>
            </div>
        </div>
    );
}

export default memo(DashboardPieChart);
