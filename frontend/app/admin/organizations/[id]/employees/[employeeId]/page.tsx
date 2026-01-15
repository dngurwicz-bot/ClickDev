import { getEmployeeById } from '@/lib/api/employees'
import { getEmployeeHistory } from '@/lib/api/employees'
import { EmployeeHistoryTimeline } from '@/components/admin/EmployeeHistoryTimeline'
import Link from 'next/link'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'

export default async function EmployeeDetailPage({
  params,
}: {
  params: { id: string; employeeId: string }
}) {
  const { data: employee, error: empError } = await getEmployeeById(params.employeeId)
  const { data: history } = await getEmployeeHistory(params.employeeId)

  if (empError || !employee) {
    return (
      <div className="p-8">
        <div className="rounded-lg bg-red-50 p-4 text-red-800">
          שגיאה בטעינת העובד
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link
          href={`/admin/organizations/${params.id}`}
          className="mb-4 inline-block text-primary hover:text-primary-dark"
        >
          ← חזור לארגון
        </Link>
        <h1 className="text-3xl font-bold text-text-primary">
          {employee.first_name} {employee.last_name}
        </h1>
        <p className="mt-2 text-text-secondary">{employee.job_title}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Employee Info */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-text-primary">פרטי עובד</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-text-secondary">מספר זהות</p>
              <p className="font-medium text-text-primary">{employee.id_number}</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">אימייל</p>
              <p className="font-medium text-text-primary">{employee.email || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">טלפון</p>
              <p className="font-medium text-text-primary">{employee.phone || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">מחלקה</p>
              <p className="font-medium text-text-primary">{employee.department || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">תאריך העסקה</p>
              <p className="font-medium text-text-primary">
                {format(new Date(employee.hire_date), 'dd/MM/yyyy', { locale: he })}
              </p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">משכורת</p>
              <p className="font-medium text-text-primary">
                {employee.salary ? `₪${employee.salary.toLocaleString()}` : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">סטטוס</p>
              <p className="font-medium text-text-primary">{employee.status}</p>
            </div>
          </div>
        </div>

        {/* History Timeline */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-text-primary">היסטוריית שינויים</h2>
          <EmployeeHistoryTimeline history={history || []} />
        </div>
      </div>
    </div>
  )
}
