import { LucideIcon } from 'lucide-react'

interface StatsCardProps {
    title: string
    value: string | number
    icon: LucideIcon
    trend?: {
        value: number
        label: string
        positive: boolean
    }
    color?: string
}

export default function StatsCard({ title, value, icon: Icon, trend, color = "primary" }: StatsCardProps) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-border-light hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm text-text-secondary mb-1">{title}</p>
                    <h3 className="text-2xl font-bold text-text-primary">{value}</h3>
                </div>
                <div className={`p-3 rounded-lg bg-${color}-50 text-${color}-600`}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>

            {trend && (
                <div className="mt-4 flex items-center text-sm">
                    <span className={`font-medium ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
                        {trend.positive ? '+' : ''}{trend.value}%
                    </span>
                    <span className="text-text-secondary ml-2">{trend.label}</span>
                </div>
            )}
        </div>
    )
}
