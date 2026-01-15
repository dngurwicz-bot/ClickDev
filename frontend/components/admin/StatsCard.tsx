import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: {
    value: number
    direction: 'up' | 'down'
  }
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  subtitle?: string
}

const colorClasses = {
  primary: {
    bg: 'bg-primary/10',
    text: 'text-primary',
    border: 'border-primary/20',
  },
  success: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    border: 'border-emerald-200',
  },
  warning: {
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    border: 'border-amber-200',
  },
  danger: {
    bg: 'bg-red-50',
    text: 'text-red-600',
    border: 'border-red-200',
  },
  info: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    border: 'border-blue-200',
  },
}

export function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  color = 'primary',
  subtitle
}: StatsCardProps) {
  const colors = colorClasses[color]
  
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm border border-gray-100 transition-all hover:shadow-lg hover:border-gray-200">
      {/* Background decoration */}
      <div className={cn(
        "absolute -left-6 -bottom-6 h-24 w-24 rounded-full opacity-50 transition-transform group-hover:scale-110",
        colors.bg
      )} />
      
      {/* Header with icon */}
      <div className="relative flex items-center justify-between mb-4">
        <div className={cn(
          "flex h-11 w-11 items-center justify-center rounded-xl",
          colors.bg
      )}>
          <Icon className={cn("h-5 w-5", colors.text)} />
      </div>
        
        {trend && (
          <div className={cn(
            "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
            trend.direction === 'up' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
          )}>
            {trend.direction === 'up' ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
              {trend.direction === 'up' ? '+' : ''}{trend.value}%
          </div>
        )}
      </div>

      {/* Content */}
      <div className="relative">
        <p className="text-sm font-medium text-text-secondary mb-1">{title}</p>
        <p className="text-2xl font-bold text-text-primary">{value}</p>
        {subtitle && (
          <p className="text-xs text-text-muted mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  )
}
