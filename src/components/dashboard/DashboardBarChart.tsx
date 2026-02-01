"use client";

import { memo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from "recharts";
import { formatCurrency } from "@/lib/utils";

interface DashboardBarChartProps {
    data: any[];
    isMobile: boolean;
}

function DashboardBarChart({ data, isMobile }: DashboardBarChartProps) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart
                layout="vertical"
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" className="dark:stroke-strokedark" />
                <XAxis type="number" hide />
                <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    width={isMobile ? 65 : 100}
                    tick={{ fontSize: isMobile ? 9 : 10, fontWeight: 700, fill: '#64748B' }}
                />
                <Tooltip
                    cursor={{ fill: '#f1f5f9', opacity: 0.1 }}
                    content={({ active, payload }: any) => {
                        if (active && payload && payload.length) {
                            const itemData = payload[0].payload;
                            const isDebt = itemData.balance < 0;
                            return (
                                <div className="bg-slate-900/95 dark:bg-black/95 backdrop-blur-sm p-3 rounded-md border border-white/10 shadow-2xl min-w-[150px]">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{itemData.name}</p>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${isDebt ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                                        <p className="text-sm font-black text-white">{formatCurrency(itemData.balance)}</p>
                                    </div>
                                    <p className={`text-[9px] font-bold mt-1 uppercase tracking-wider ${isDebt ? 'text-rose-400' : 'text-emerald-400'}`}>
                                        {isDebt ? 'Pasivo (Deuda)' : 'Activo (Capital)'}
                                    </p>
                                </div>
                            );
                        }
                        return null;
                    }}
                />
                <ReferenceLine x={0} stroke="#94a3b8" strokeDasharray="3 3" />
                <Bar dataKey="balance" radius={[4, 4, 4, 4]} barSize={20}>
                    {data.map((entry: any, index: number) => (
                        <Cell
                            key={`cell-${index}`}
                            fill={Number(entry.balance) >= 0 ? (entry.color || "#3c50e0") : "#f43f5e"}
                        />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}

export default memo(DashboardBarChart);
