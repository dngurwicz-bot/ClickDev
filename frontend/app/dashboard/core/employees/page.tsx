'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import EmployeeDetails, { Employee } from '@/components/employees/EmployeeDetails'
import { useOrganization } from '@/lib/contexts/OrganizationContext'
import { useViewMode } from '@/context/ViewModeContext'
import { useStatusBar } from '@/context/StatusBarContext'
import { PriorityScreenToolbar } from '@/components/core/PriorityScreenToolbar'
import { PriorityTableView, TableColumn } from '@/components/core/PriorityTableView'
import { useNavigationStack } from '@/lib/screen-lifecycle/NavigationStackProvider'

export interface NewEmployeeData {
    employeeNumber: string
    firstName: string
    lastName: string
    fatherName: string
    birthDate: string
    idNumber: string
    passport: string
    altLastName: string
    altFirstName: string
    additionalFirstName: string
}

// Table columns matching the Priority employee card table view
const EMPLOYEE_TABLE_COLUMNS: TableColumn[] = [
    { key: 'idNumber', header: 'מספר זהות', required: true, width: '120px' },
    { key: 'employeeNumber', header: 'מס. עובד', required: true, width: '100px' },
    { key: 'firstName', header: 'שם פרטי', width: '120px' },
    { key: 'lastName', header: 'שם משפחה', width: '120px' },
    { key: 'address', header: 'כתובת', width: '150px' },
    { key: 'city', header: 'עיר', width: '100px' },
    { key: 'employeeName', header: 'שם עובד', required: true, width: '150px' },
    { key: 'lastNameEn', header: 'שם בלועזית', width: '120px' },
    { key: 'firstNameEn', header: 'שם פרטי בלועזית', width: '130px' },
    { key: 'familyNameEn', header: 'שם משפחה בלועזית', width: '140px' },
    { key: 'username', header: 'שם משתמש', width: '120px' },
    { key: 'inactive', header: 'עובד לא פעיל', width: '110px' },
    { key: 'usernameExt', header: 'שם המשתמש בחלו...', width: '150px' },
    { key: 'title', header: 'תואר', width: '80px' },
    { key: 'titleEn', header: 'תואר (אנגלית)', width: '110px' },
]

// Toolbar tabs like in the screenshot
const SCREEN_TABS = [
    { id: 'actions', label: 'פעולות ...' },
    { id: 'company_change', label: 'שינוי חברה לעובד' },
    { id: 'salary_data', label: 'נתוני שכר לעובד' },
]

export default function EmployeeFilePageWrapper() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <EmployeeFilePage />
        </Suspense>
    )
}

function EmployeeFilePage() {
    const searchParams = useSearchParams()
    const { currentOrg } = useOrganization()
    const { viewMode, setViewMode: setGlobalViewMode } = useViewMode()
    const { setRecordStatus } = useStatusBar()
    const { goBackOrFallback } = useNavigationStack()
    const [employees, setEmployees] = useState<Employee[]>([])
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
    const [isNew, setIsNew] = useState(false)
    const [isLoaded, setIsLoaded] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [filterRow, setFilterRow] = useState<Record<string, string>>({})

    useEffect(() => {
        if (searchParams.get('new') === 'true') {
            setIsNew(true)
            setGlobalViewMode('form')
            return
        }

        // Always open "All Employees" route in table mode.
        setIsNew(false)
        setGlobalViewMode('table')
    }, [searchParams, setGlobalViewMode])

    // Fetch employees
    const fetchEmployees = async () => {
        if (!currentOrg?.id) return []

        try {
            const { supabase } = await import('@/lib/supabase')
            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .eq('organization_id', currentOrg.id)
                .eq('is_active', true)
                .is('deleted_at', null)
                .limit(50)

            if (error) throw error

            const mapped = (data || []).map((emp: any) => ({
                ...emp,
                firstName: emp.first_name_he || emp.firstName || '',
                lastName: emp.last_name_he || emp.lastName || '',
                fatherName: emp.father_name_he || emp.fatherName || '',
                birthDate: emp.birth_date || emp.birthDate || '',
                employeeNumber: emp.employee_number || emp.employeeNumber || '',
                idNumber: emp.id_number || emp.idNumber || '',
                employeeName: `${emp.last_name_he || ''} ${emp.first_name_he || ''}`.trim(),
            }))

            setEmployees(mapped)
            return mapped
        } catch (err) {
            console.error('Error fetching employees:', err)
            return []
        }
    }

    useEffect(() => {
        if (currentOrg?.id) {
            fetchEmployees()
        }
    }, [currentOrg?.id])

    const existingIds = employees.map(e => e.employeeNumber || '').filter(Boolean)
    const existingNationalIds = employees.map(e => e.idNumber || '').filter(Boolean)

    // Handle search from form view
    const handleSearch = async (criteria: any) => {
        if (!currentOrg?.id) {
            alert('שגיאה: לא נבחר ארגון. אנא בחר ארגון בבורר למעלה.')
            return
        }

        setIsLoaded(false)
        try {
            const { supabase } = await import('@/lib/supabase')
            let query = supabase
                .from('employees')
                .select('*')
                .eq('organization_id', currentOrg.id)
                .eq('is_active', true)
                .is('deleted_at', null)

            if (criteria.employeeId?.trim()) query = query.ilike('employee_number', `%${criteria.employeeId.trim()}%`)
            if (criteria.idNumber?.trim()) query = query.ilike('id_number', `%${criteria.idNumber.trim()}%`)
            if (criteria.lastName?.trim()) query = query.ilike('last_name_he', `%${criteria.lastName.trim()}%`)
            if (criteria.firstName?.trim()) query = query.ilike('first_name_he', `%${criteria.firstName.trim()}%`)

            const { data, error } = await query

            if (error) {
                alert(`שגיאת תקשורת עם מסד הנתונים: ${error.message}`)
                throw error
            }

            const mappedData = (data || []).map((emp: any) => ({
                ...emp,
                firstName: emp.first_name_he || emp.firstName || '',
                lastName: emp.last_name_he || emp.lastName || '',
                fatherName: emp.father_name_he || emp.fatherName || '',
                birthDate: emp.birth_date || emp.birthDate || '',
                employeeNumber: emp.employee_number || emp.employeeNumber || '',
                idNumber: emp.id_number || emp.idNumber || '',
                employeeName: `${emp.last_name_he || ''} ${emp.first_name_he || ''}`.trim(),
            }))

            if (mappedData.length === 1) {
                setSelectedEmployee(mappedData[0])
            } else if (mappedData.length > 1) {
                setEmployees(mappedData)
                setSelectedEmployee(null)
                setGlobalViewMode('table')
            } else {
                alert('לא נמצאו עובדים התואמים לחיפוש.')
                setSelectedEmployee(null)
            }
        } catch (err: any) {
            console.error('Search error:', err)
        } finally {
            setIsLoaded(true)
        }
    }

    // Row selection in table view
    const handleRowClick = (employee: Employee) => {
        setSelectedEmployee(employee)
    }

    // Double-click switches to form view
    const handleRowDoubleClick = (employee: Employee) => {
        setSelectedEmployee(employee)
        setIsNew(false)
        setGlobalViewMode('form')
    }

    // Navigation
    const handleNextEmployee = () => {
        if (!selectedEmployee) return
        const currentIndex = employees.findIndex(e => e.id === selectedEmployee.id)
        const nextIndex = (currentIndex + 1) % employees.length
        setSelectedEmployee(employees[nextIndex])
    }

    const handlePreviousEmployee = () => {
        if (!selectedEmployee) return
        const currentIndex = employees.findIndex(e => e.id === selectedEmployee.id)
        const prevIndex = currentIndex === 0 ? employees.length - 1 : currentIndex - 1
        setSelectedEmployee(employees[prevIndex])
    }

    const handleAddEmployee = () => {
        setIsNew(true)
        setSelectedEmployee(null)
        setGlobalViewMode('form')
    }

    const formatDateForBackend = (dateStr: string): string => {
        if (!dateStr) return ''
        if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr
        const parts = dateStr.split('/')
        if (parts.length === 3) {
            const [day, month, year] = parts
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
        }
        return dateStr
    }

    const handleSaveNewEmployee = async (employee: NewEmployeeData) => {
        if (!currentOrg?.id) return

        if (!employee.birthDate) {
            alert('תאריך לידה הוא שדה חובה')
            return
        }

        const formattedBirthDate = formatDateForBackend(employee.birthDate)
        if (formattedBirthDate.length < 10) {
            alert(`תאריך לידה לא תקין: ${employee.birthDate}. יש להזין בפורמט DD/MM/YYYY`)
            return
        }

        try {
            setError(null)
            const { supabase } = await import('@/lib/supabase')
            const { data: { session } } = await supabase.auth.getSession()

            const response = await fetch(`/api/organizations/${currentOrg.id}/employees`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': session?.access_token ? `Bearer ${session.access_token}` : '',
                },
                body: JSON.stringify({
                    operation_code: 'ADD',
                    data: {
                        employee_number: employee.employeeNumber || (employee as any).employeeId,
                        id_number: employee.idNumber,
                        id_type: 'israeli_id',
                        firstName: employee.firstName,
                        lastName: employee.lastName,
                        fatherName: employee.fatherName,
                        birthDate: formattedBirthDate,
                        effectiveFrom: new Date().toISOString().split('T')[0],
                    }
                })
            })

            if (!response.ok) {
                const errData = await response.json()
                let errorMessage = 'Failed to save employee'
                if (typeof errData.detail === 'string') {
                    errorMessage = errData.detail
                } else if (Array.isArray(errData.detail)) {
                    errorMessage = errData.detail.map((e: any) =>
                        `${e.loc.join('.')} (${e.type}): ${e.msg}`
                    ).join('\n')
                } else if (errData.message) {
                    errorMessage = errData.message
                }
                throw new Error(errorMessage)
            }

            const updatedList = await fetchEmployees()
            if (updatedList) {
                const updated = updatedList.find((e: Employee) => e.employeeNumber === employee.employeeNumber)
                if (updated) {
                    setSelectedEmployee(updated)
                }
            }
            setIsNew(false)
        } catch (err: any) {
            throw err
        }
    }

    const handleUpdateEmployee = async (eventCode: string, data: any, operationCode: string = '2') => {
        if (!currentOrg?.id || !selectedEmployee) return

        try {
            setError(null)
            const { supabase } = await import('@/lib/supabase')
            const { data: { session } } = await supabase.auth.getSession()

            let payloadData: any = {
                employee_number: selectedEmployee.employeeNumber || selectedEmployee.id,
                id_number: selectedEmployee.idNumber || '',
                id_type: 'israeli_id',
            }

            if (eventCode === '100') {
                payloadData = {
                    ...payloadData,
                    firstName: operationCode === '3' ? data.firstName : (data.firstName || selectedEmployee.firstName),
                    lastName: operationCode === '3' ? data.lastName : (data.lastName || selectedEmployee.lastName),
                    fatherName: data.fatherName || selectedEmployee.fatherName || '',
                    birthDate: formatDateForBackend(data.birthDate || selectedEmployee.birthDate || '2000-01-01'),
                    effectiveFrom: data.effectiveFrom || new Date().toISOString().split('T')[0]
                }
            } else {
                payloadData = {
                    ...payloadData,
                    ...data,
                    effectiveFrom: data.effectiveFrom || data.effective_from || new Date().toISOString().split('T')[0]
                }
            }

            const response = await fetch(`/api/organizations/${currentOrg.id}/employees`, {
                method: 'POST',
                cache: 'no-store',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': session?.access_token ? `Bearer ${session.access_token}` : '',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                },
                body: JSON.stringify({
                    operation_code: operationCode,
                    event_code: eventCode,
                    data: payloadData
                })
            })

            if (!response.ok) {
                const errData = await response.json()
                throw new Error(errData.message || errData.detail || 'Failed to update employee')
            }

            const updatedList = await fetchEmployees()
            if (updatedList) {
                const updated = updatedList.find((e: Employee) => e.id === selectedEmployee.id)
                if (updated) {
                    setSelectedEmployee(updated)
                }
            }
        } catch (err: any) {
            throw err
        }
    }

    const handleFilterChange = (key: string, value: string) => {
        setFilterRow(prev => ({ ...prev, [key]: value }))
    }

    // Filter data based on filterRow
    const filteredEmployees = employees.filter(emp => {
        return Object.entries(filterRow).every(([key, value]) => {
            if (!value) return true
            const cellValue = String((emp as any)[key] || '').toLowerCase()
            return cellValue.includes(value.toLowerCase())
        })
    })

    const handleBackToTable = () => {
        setIsNew(false)
        setGlobalViewMode('table')
    }

    useEffect(() => {
        const total = viewMode === 'table' ? filteredEmployees.length : employees.length
        const source = viewMode === 'table' ? filteredEmployees : employees
        const selectedIndex = selectedEmployee
            ? source.findIndex((emp) => emp.id === selectedEmployee.id)
            : -1

        setRecordStatus({
            label: 'תוצאות',
            current: total === 0 ? 0 : selectedIndex >= 0 ? selectedIndex + 1 : 1,
            total,
        })
    }, [employees, filteredEmployees, selectedEmployee, setRecordStatus, viewMode])

    useEffect(() => {
        return () => {
            setRecordStatus(null)
        }
    }, [setRecordStatus])

    return (
        <div className="flex flex-col h-full w-full bg-[#ECF0F1]" dir="rtl">
            {/* Screen Toolbar */}
            <PriorityScreenToolbar
                title="כרטיס עובד"
                tabs={SCREEN_TABS}
                onRequestExit={() => goBackOrFallback('/dashboard/core')}
                onAddNew={handleAddEmployee}
                onRefresh={() => fetchEmployees()}
                showViewToggle={true}
            />

            {/* Content Area: Table View or Form View */}
            <div className="flex-1 overflow-hidden">
                {viewMode === 'table' ? (
                    <PriorityTableView
                        columns={EMPLOYEE_TABLE_COLUMNS}
                        data={filteredEmployees}
                        selectedId={selectedEmployee?.id}
                        onRowClick={handleRowClick}
                        onRowDoubleClick={handleRowDoubleClick}
                        onAddNew={handleAddEmployee}
                        isLoading={!isLoaded}
                        filterRow={filterRow}
                        onFilterChange={handleFilterChange}
                    />
                ) : (
                    <EmployeeDetails
                        employee={selectedEmployee}
                        initialEmployees={employees}
                        isNew={isNew}
                        searchMode={!selectedEmployee && !isNew}
                        onSearch={handleSearch}
                        onNext={handleNextEmployee}
                        onPrevious={handlePreviousEmployee}
                        onBack={handleBackToTable}
                        onSaveNew={(data) => handleSaveNewEmployee(data as any)}
                        onUpdate={handleUpdateEmployee}
                        onCancel={handleBackToTable}
                        lastCreatedId={employees.length > 0 ? String(Math.max(0, ...employees.map(e => parseInt(e.employeeNumber || '0')).filter(n => !isNaN(n)))) : undefined}
                        existingIds={existingIds}
                        existingNationalIds={existingNationalIds}
                        onNewSearch={() => {
                            setSelectedEmployee(null)
                        }}
                        onDelete={async () => {
                            if (confirm('האם אתה בטוח שברצונך למחוק רשומה זו?')) {
                                try {
                                    await handleUpdateEmployee('200', {}, '3')
                                    alert('העובד נמחק בהצלחה')
                                    setSelectedEmployee(null)
                                } catch (err: any) {
                                    alert(`שגיאה במחיקת עובד: ${err.message}`)
                                }
                            }
                        }}
                    />
                )}
            </div>
        </div>
    )
}
