import { EmployeeHistory } from '@/lib/api/employees'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'
import { Briefcase, DollarSign, Building2, User, AlertCircle } from 'lucide-react'

interface EmployeeHistoryTimelineProps {
  history: EmployeeHistory[]
}

const fieldIcons: Record<string, any> = {
  job_title: Briefcase,
  salary: DollarSign,
  department: Building2,
  manager_id: User,
  status: AlertCircle,
}

const fieldLabels: Record<string, string> = {
  job_title: 'תפקיד',
  salary: 'משכורת',
  department: 'מחלקה',
  manager_id: 'מנהל',
  status: 'סטטוס',
}

export function EmployeeHistoryTimeline({ history }: EmployeeHistoryTimelineProps) {
  if (!history || history.length === 0) {
    return (
      <div className="rounded-lg bg-gray-50 p-8 text-center text-text-secondary">
        אין היסטוריה זמינה
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {history.map((item) => {
        const Icon = fieldIcons[item.field_name] || AlertCircle
        const label = fieldLabels[item.field_name] || item.field_name

        return (
          <div key={item.id} className="relative flex gap-4">
            {/* Timeline line */}
            <div className="absolute right-5 top-8 h-full w-0.5 bg-gray-200 last:hidden" />
            
            {/* Icon */}
            <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-primary-light">
              <Icon className="h-5 w-5 text-primary" />
            </div>

            {/* Content */}
            <div className="flex-1 rounded-lg bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-text-primary">{label} שונה</h4>
                <span className="text-sm text-text-secondary">
                  {format(new Date(item.valid_from), 'dd/MM/yyyy HH:mm', { locale: he })}
                </span>
              </div>
              
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm text-text-secondary">מ:</span>
                <span className="rounded bg-gray-100 px-2 py-1 text-sm font-medium text-text-primary">
                  {item.old_value || 'לא הוגדר'}
                </span>
                <span className="text-text-secondary">→</span>
                <span className="rounded bg-primary-light px-2 py-1 text-sm font-medium text-primary">
                  {item.new_value || 'לא הוגדר'}
                </span>
              </div>

              {item.change_reason && (
                <p className="mt-2 text-sm text-text-secondary">
                  <span className="font-medium">סיבה:</span> {item.change_reason}
                </p>
              )}

              {item.changed_by_user && (
                <p className="mt-1 text-xs text-text-secondary">
                  שונה על ידי: {item.changed_by_user.email}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
