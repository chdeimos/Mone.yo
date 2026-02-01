"use client";

import { memo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface DashboardAreaChartProps {
    data: any[];
    isMobile: boolean;
}

function DashboardAreaChart({ data, isMobile }: DashboardAreaChartProps) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3c50e0" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#3c50e0" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#64748B' }}
                    dy={10}
                    interval="preserveStartEnd"
                />
                <YAxis
                    hide={isMobile}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#64748B' }}
                    tickFormatter={(val) => `€${val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val}`}
                />
                <Tooltip
                    content={({ active, payload }: any) => {
                        if (active && payload && payload.length) {
                            return (
                                <div className="bg-slate-900/95 dark:bg-black/95 backdrop-blur-sm p-4 rounded-lg border border-white/10 shadow-2xl">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">{payload[0].payload.date}</p>
                                    <p className="text-lg font-black text-white">{formatCurrency(payload[0].value)}</p>
                                    <div className="mt-2 pt-2 border-t border-white/5">
                                        {/* @ts-ignore */}
                                        <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                                            Tendencia Activa
                                        </p>
                                    </div>
                                </div>
                            );
                        }
                        return null;
                    }}
                />
                <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#3c50e0"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorValue)"
                    animationDuration={1500}
                    animationBegin={300}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}

export default memo(DashboardAreaChart);
