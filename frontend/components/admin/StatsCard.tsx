import { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  trend?: {
    value: number
    direction: 'up' | 'down'
  }
}

const colorClasses = {
  primary: 'bg-primary-light text-primary',
  success: 'bg-green-100 text-success',
  warning: 'bg-yellow-100 text-warning',
  danger: 'bg-red-100 text-danger',
  info: 'bg-blue-100 text-info',
}

export default function StatsCard({ title, value, icon: Icon, color = 'primary', trend }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm ${trend.direction === 'up' ? 'text-success' : 'text-danger'}`}>
            <span>{trend.direction === 'up' ? '↑' : '↓'}</span>
            <span>{trend.value}%</span>
          </div>
        )}
      </div>
      <h3 className="text-text-secondary text-sm mb-2">{title}</h3>
      <p className="text-3xl font-bold text-text-primary">{value}</p>
    </motion.div>
  )
}
