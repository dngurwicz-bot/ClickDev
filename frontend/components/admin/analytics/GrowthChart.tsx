'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface GrowthChartProps {
    data: any[]
}

export default function GrowthChart({ data }: GrowthChartProps) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-border-light">
            <h3 className="text-lg font-semibold text-text-primary mb-6">מגמת צמיחה (חצי שנה אחרונה)</h3>
            <div className="h-[300px] w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6B7280', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6B7280', fontSize: 12 }}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="organizations"
                            name="ארגונים"
                            stroke="#0EA5E9"
                            strokeWidth={3}
                            dot={{ fill: '#0EA5E9', strokeWidth: 2, r: 4, stroke: '#fff' }}
                            activeDot={{ r: 8 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="employees"
                            name="עובדים"
                            stroke="#8B5CF6"
                            strokeWidth={3}
                            dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4, stroke: '#fff' }}
                            activeDot={{ r: 8 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
