// @ts-ignore - xlsx types issue
import * as XLSX from 'xlsx'

export interface ExportData {
  sheetName: string
  data: any[]
  columns: Array<{ key: string; header: string }>
}

export function exportToExcel(exports: ExportData[], filename: string = 'analytics-export') {
  const workbook = XLSX.utils.book_new()

  exports.forEach(({ sheetName, data, columns }) => {
    // Transform data to match column keys
    const transformedData = data.map(row => {
      const newRow: any = {}
      columns.forEach(col => {
        newRow[col.header] = row[col.key] ?? ''
      })
      return newRow
    })

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(transformedData)
    
    // Set column widths
    const colWidths = columns.map(() => ({ wch: 20 }))
    worksheet['!cols'] = colWidths

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  })

  // Generate Excel file and download
  XLSX.writeFile(workbook, `${filename}-${new Date().toISOString().split('T')[0]}.xlsx`)
}

export function exportAnalyticsData(data: {
  organizations: any[]
  employees: any[]
  users: any[]
  stats: any
  dateRange: { start: Date; end: Date }
}) {
  const formatDate = (date: Date | string) => {
    if (!date) return ''
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('he-IL')
  }

  const exports: ExportData[] = [
    {
      sheetName: 'סיכום',
      data: [
        { metric: 'סה"כ ארגונים', value: data.stats.totalOrgs },
        { metric: 'ארגונים פעילים', value: data.stats.activeOrgs },
        { metric: 'סה"כ עובדים', value: data.stats.totalEmployees },
        { metric: 'סה"כ משתמשים', value: data.stats.totalUsers },
        { metric: 'תקופה', value: `${formatDate(data.dateRange.start)} - ${formatDate(data.dateRange.end)}` }
      ],
      columns: [
        { key: 'metric', header: 'מדד' },
        { key: 'value', header: 'ערך' }
      ]
    },
    {
      sheetName: 'ארגונים',
      data: data.organizations.map(org => ({
        ...org,
        created_at: formatDate(org.created_at),
        employeeCount: org.employeeCount || 0
      })),
      columns: [
        { key: 'name', header: 'שם ארגון' },
        { key: 'email', header: 'אימייל' },
        { key: 'subscription_tier', header: 'רמת מנוי' },
        { key: 'status', header: 'סטטוס' },
        { key: 'created_at', header: 'תאריך יצירה' },
        { key: 'employeeCount', header: 'מספר עובדים' }
      ]
    },
    {
      sheetName: 'עובדים',
      data: data.employees.map(emp => ({
        ...emp,
        hire_date: formatDate(emp.hire_date),
        created_at: formatDate(emp.created_at)
      })),
      columns: [
        { key: 'first_name', header: 'שם פרטי' },
        { key: 'last_name', header: 'שם משפחה' },
        { key: 'email', header: 'אימייל' },
        { key: 'job_title', header: 'תפקיד' },
        { key: 'department', header: 'מחלקה' },
        { key: 'hire_date', header: 'תאריך העסקה' },
        { key: 'created_at', header: 'תאריך יצירה' }
      ]
    },
    {
      sheetName: 'משתמשים',
      data: data.users.map(user => ({
        ...user,
        created_at: formatDate(user.created_at)
      })),
      columns: [
        { key: 'email', header: 'אימייל' },
        { key: 'role', header: 'תפקיד' },
        { key: 'created_at', header: 'תאריך יצירה' }
      ]
    }
  ]

  exportToExcel(exports, 'analytics-report')
}
