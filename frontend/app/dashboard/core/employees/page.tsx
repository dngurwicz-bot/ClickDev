'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import EmployeeDetails, { Employee } from '@/components/employees/EmployeeDetails'
import { useOrganization } from '@/lib/contexts/OrganizationContext'
import { useViewMode } from '@/context/ViewModeContext'
import { useStatusBar } from '@/context/StatusBarContext'
import { PriorityScreenToolbar } from '@/components/core/PriorityScreenToolbar'
import { PriorityTableView, TableColumn } from '@/components/core/PriorityTableView'
import { useNavigationStack } from '@/lib/screen-lifecycle/NavigationStackProvider'
import { createSavedSearch, dispatchEmployeeAction, dispatchEmployeeCreateAction, listSavedSearches, updateSavedSearch } from '@/lib/api'
import type { SavedSearch } from '@/lib/types/models'

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
    const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([])
    const [selectedSavedSearchId, setSelectedSavedSearchId] = useState<string>('')

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

    const loadSavedSearches = async () => {
        if (!currentOrg?.id) return
        try {
            const items = await listSavedSearches(currentOrg.id, 'employee_file')
            setSavedSearches(items)
            const defaultSearch = items.find((item) => item.is_default)
            if (defaultSearch) {
                setSelectedSavedSearchId(defaultSearch.id)
                setFilterRow((defaultSearch.filters_json as Record<string, string>) || {})
            }
        } catch (error) {
            console.error('Failed to load saved searches', error)
        }
    }

    useEffect(() => {
        loadSavedSearches()
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
            await dispatchEmployeeCreateAction(currentOrg.id, {
                action_key: 'employee_profile.created',
                effective_at: new Date().toISOString().split('T')[0],
                request_id: `new-employee-${crypto.randomUUID()}`,
                payload: {
                    employee_number: employee.employeeNumber || (employee as any).employeeId,
                    id_number: employee.idNumber,
                    first_name_he: employee.firstName,
                    last_name_he: employee.lastName,
                    father_name_he: employee.fatherName,
                    birth_date: formattedBirthDate,
                },
            })

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

    const handleDispatchAction = async (actionKey: string, data: any = {}) => {
        if (!currentOrg?.id || !selectedEmployee) return

        try {
            setError(null)
            const effectiveAt = data.effectiveAt || data.effective_from || new Date().toISOString().split('T')[0]
            let payload: Record<string, any> = { ...data }

            if (actionKey === 'employee_identity.amended') {
                payload = {
                    first_name_he: data.firstName || selectedEmployee.firstName,
                    last_name_he: data.lastName || selectedEmployee.lastName,
                    father_name_he: data.fatherName || selectedEmployee.fatherName || '',
                    birth_date: formatDateForBackend(data.birthDate || selectedEmployee.birthDate || '2000-01-01'),
                }
            } else if (actionKey === 'employee_address.changed') {
                payload = {
                    city_name: data.city || data.city_name || '',
                    street: data.street || '',
                    house_number: data.houseNum || data.house_number || '',
                    phone: data.phone || '',
                }
            } else if (actionKey === 'employee_status.closed') {
                payload = {
                    closed_reason: data.closed_reason || 'manual_close',
                }
            }

            await dispatchEmployeeAction(currentOrg.id, selectedEmployee.id, {
                action_key: actionKey,
                effective_at: effectiveAt,
                payload,
                request_id: `${selectedEmployee.id}-${actionKey}-${effectiveAt}-${crypto.randomUUID()}`,
            })

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
    const filteredEmployees = useMemo(() => {
        return employees.filter((emp) => {
            return Object.entries(filterRow).every(([key, value]) => {
                if (!value) return true
                const cellValue = String((emp as any)[key] || '').toLowerCase()
                return cellValue.includes(value.toLowerCase())
            })
        })
    }, [employees, filterRow])

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
                <div className="flex items-center gap-2 px-3 py-2 border-b border-[#d6e4ee] bg-white">
                    <select
                        className="h-8 rounded border border-[#c8dbe7] px-2 text-xs"
                        value={selectedSavedSearchId}
                        onChange={async (e) => {
                            const id = e.target.value
                            setSelectedSavedSearchId(id)
                            const found = savedSearches.find((s) => s.id === id)
                            if (found) {
                                setFilterRow((found.filters_json as Record<string, string>) || {})
                                if (currentOrg?.id) {
                                    await updateSavedSearch(currentOrg.id, found.id, { touch_last_used: true })
                                }
                            }
                        }}
                    >
                        <option value="">חיפוש שמור...</option>
                        {savedSearches.map((item) => (
                            <option key={item.id} value={item.id}>{item.name}</option>
                        ))}
                    </select>
                    <button
                        className="h-8 rounded bg-[#2b7aaa] px-3 text-xs font-semibold text-white"
                        onClick={async () => {
                            if (!currentOrg?.id) return
                            const name = prompt('שם לחיפוש השמור')
                            if (!name?.trim()) return
                            await createSavedSearch(currentOrg.id, {
                                screen_key: 'employee_file',
                                name: name.trim(),
                                filters_json: filterRow,
                                is_default: false,
                            })
                            await loadSavedSearches()
                        }}
                    >
                        שמור חיפוש
                    </button>
                </div>
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
                        onUpdate={handleDispatchAction}
                        onCancel={handleBackToTable}
                        onToggleView={() => setGlobalViewMode('table')}
                        lastCreatedId={employees.length > 0 ? String(Math.max(0, ...employees.map(e => parseInt(e.employeeNumber || '0')).filter(n => !isNaN(n)))) : undefined}
                        existingIds={existingIds}
                        existingNationalIds={existingNationalIds}
                        onNewSearch={() => {
                            setSelectedEmployee(null)
                        }}
                        onDelete={async () => {
                            if (confirm('האם אתה בטוח שברצונך למחוק רשומה זו?')) {
                                try {
                                    await handleDispatchAction('employee_status.closed', {})
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
