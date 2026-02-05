'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import EmployeeToolbar from '@/components/employees/EmployeeToolbar'
import EmployeeSidebar from '@/components/employees/EmployeeSidebar'
import EmployeeTable from '@/components/employees/EmployeeTable'
import EmployeeDetails, { Employee } from '@/components/employees/EmployeeDetails'
// import AddEmployeeForm, { NewEmployeeData } from '@/components/employees/AddEmployeeForm'
import { useOrganization } from '@/lib/contexts/OrganizationContext'
import { useSidebarActions } from '@/lib/contexts/SidebarContext'
import { mockEmployees } from './mockData'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type ViewMode = 'list' | 'details' | 'add' | 'created'

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
    const { hideSidebar, showSidebar } = useSidebarActions()
    const [employees, setEmployees] = useState<Employee[]>([])
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
    const [viewMode, setViewMode] = useState<ViewMode>('details') // Default to details/search
    const [newEmployee, setNewEmployee] = useState<NewEmployeeData | null>(null)
    const [lastCreatedId, setLastCreatedId] = useState<string | undefined>(undefined)
    const [isLoaded, setIsLoaded] = useState(true) // Ready immediately
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (searchParams.get('new') === 'true') {
            setViewMode('add')
        }
    }, [searchParams])


    // Search Logic
    const fetchEmployees = async () => {
        if (!currentOrg?.id) return []

        try {
            const { supabase } = await import('@/lib/supabase')
            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .eq('organization_id', currentOrg.id)
                .limit(50) // Reasonable limit for default view

            if (error) throw error

            const mapped = (data || []).map((emp: any) => ({
                ...emp,
                firstName: emp.first_name_he || emp.firstName || '',
                lastName: emp.last_name_he || emp.lastName || '',
                employeeNumber: emp.employee_number || emp.employeeNumber || '',
                idNumber: emp.id_number || emp.idNumber || '',
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

    // Derived state for validation
    const existingIds = employees.map(e => e.employeeNumber || '').filter(Boolean)
    const existingNationalIds = employees.map(e => e.idNumber || '').filter(Boolean)

    const handleSearch = async (criteria: any) => {
        if (!currentOrg?.id) {
            alert('שגיאה: לא נבחר ארגון. אנא בחר ארגון בבורר למעלה.')
            return
        }

        console.log(`[Search Diagnostic] Starting search for Org: ${currentOrg.name} (${currentOrg.id})`, criteria)

        setIsLoaded(false)
        try {
            const { supabase } = await import('@/lib/supabase')

            // Log current user for RLS debugging
            const { data: { user } } = await supabase.auth.getUser()
            console.log('[Search Diagnostic] Current User Context:', user?.id || 'Not Mocked/Logged In')

            let query = supabase
                .from('employees')
                .select('*')
                .eq('organization_id', currentOrg.id)

            // Dynamic filters based on input
            if (criteria.employeeId?.trim()) query = query.ilike('employee_number', `%${criteria.employeeId.trim()}%`)
            if (criteria.idNumber?.trim()) query = query.ilike('id_number', `%${criteria.idNumber.trim()}%`)
            if (criteria.lastName?.trim()) query = query.ilike('last_name_he', `%${criteria.lastName.trim()}%`)
            if (criteria.firstName?.trim()) query = query.ilike('first_name_he', `%${criteria.firstName.trim()}%`)

            const { data, error } = await query

            if (error) {
                console.error('[Search Diagnostic] Query error:', error)
                alert(`שגיאת תקשורת עם מסד הנתונים: ${error.message}`)
                throw error
            }

            console.log(`[Search Diagnostic] Local results found: ${data?.length || 0}`)

            const mappedData = (data || []).map((emp: any) => ({
                ...emp,
                firstName: emp.first_name_he || emp.firstName || '',
                lastName: emp.last_name_he || emp.lastName || '',
                employeeNumber: emp.employee_number || emp.employeeNumber || '',
                idNumber: emp.id_number || emp.idNumber || '',
            }))

            if (mappedData.length === 1) {
                setSelectedEmployee(mappedData[0])
                setViewMode('details')
            } else if (mappedData.length > 1) {
                setEmployees(mappedData)
                setViewMode('list')
            } else {
                console.warn('[Search Diagnostic] No local results. Checking other organizations...')

                // Simplified Global Check (No Joins to avoid permission issues)
                let globalQuery = supabase.from('employees').select('organization_id')
                if (criteria.employeeId?.trim()) globalQuery = globalQuery.ilike('employee_number', `%${criteria.employeeId.trim()}%`)
                if (criteria.idNumber?.trim()) globalQuery = globalQuery.ilike('id_number', `%${criteria.idNumber.trim()}%`)

                const { data: globalData, error: globalErr } = await globalQuery.limit(1)

                if (globalErr) {
                    console.error('[Search Diagnostic] Global check error:', globalErr)
                }

                if (globalData && globalData.length > 0) {
                    const otherOrgId = globalData[0].organization_id
                    console.error('[Search Diagnostic] Employee exists in Org ID:', otherOrgId)
                    alert(`העובד נמצא בארגון אחר (מזהה: ${otherOrgId}). אנא וודא שבחרת את הארגון הנכון למעלה.`)
                } else {
                    alert('לא נמצאו עובדים התואמים לחיפוש בשום ארגון שאתה מורשה לראות.')
                }
                setSelectedEmployee(null)
            }
        } catch (err: any) {
            console.error('[Search Diagnostic] Fatal search error:', err)
            alert(`שגיאה קריטית בחיפוש: ${err.message || 'שגיאה לא ידועה'}`)
        } finally {
            setIsLoaded(true)
        }
    }

    const handleSelectEmployee = (employee: Employee) => {
        setSelectedEmployee(employee)
        setViewMode('details')
    }


    const handleBackToList = () => {
        setViewMode('list')
        setNewEmployee(null)
    }

    const handleNextEmployee = () => {
        if (!selectedEmployee) return
        const currentIndex = employees.findIndex(e => e.id === selectedEmployee.id)
        const nextIndex = (currentIndex + 1) % employees.length
        const next = employees[nextIndex]
        setSelectedEmployee(next)
    }

    const handlePreviousEmployee = () => {
        if (!selectedEmployee) return
        const currentIndex = employees.findIndex(e => e.id === selectedEmployee.id)
        const prevIndex = currentIndex === 0 ? employees.length - 1 : currentIndex - 1
        const prev = employees[prevIndex]
        setSelectedEmployee(prev)
    }

    const handleAddEmployee = () => {
        setViewMode('add')
    }

    // Helper to format date consistent with backend requirements (YYYY-MM-DD)
    const formatDateForBackend = (dateStr: string): string => {
        if (!dateStr) return ''
        // Check if already in YYYY-MM-DD
        if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr

        // Handle DD/MM/YYYY
        const parts = dateStr.split('/')
        if (parts.length === 3) {
            const [day, month, year] = parts
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
        }
        return dateStr
    }

    const handleSaveNewEmployee = async (employee: NewEmployeeData) => {
        if (!currentOrg?.id) return

        // Frontend validation for required fields (handling here avoids backend roundtrip for obvious errors)
        if (!employee.birthDate) {
            alert('תאריך לידה הוא שדה חובה')
            return
        }

        const formattedBirthDate = formatDateForBackend(employee.birthDate)
        if (formattedBirthDate.length < 10) { // Basic check for complete date
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
                console.error('Full error data:', errData)

                let errorMessage = 'Failed to save employee'

                if (typeof errData.detail === 'string') {
                    errorMessage = errData.detail
                } else if (Array.isArray(errData.detail)) {
                    // Handle Pydantic validation errors
                    errorMessage = errData.detail.map((e: any) =>
                        `${e.loc.join('.')} (${e.type}): ${e.msg}`
                    ).join('\n')
                } else if (errData.message) {
                    errorMessage = errData.message
                }

                throw new Error(errorMessage)
            }

            // Reload employees and show success view
            const updatedList = await fetchEmployees()
            if (updatedList) {
                const updated = updatedList.find((e: Employee) => e.employeeNumber === employee.employeeNumber)
                if (updated) {
                    setSelectedEmployee(updated)
                }
            }
            setViewMode('details')
        } catch (err: any) {
            // Re-throw to be handled by the UI
            throw err
        }
    }

    const handleUpdateEmployee = async (eventCode: string, data: any, operationCode: string = '2') => {
        if (!currentOrg?.id || !selectedEmployee) return

        try {
            setError(null)
            const { supabase } = await import('@/lib/supabase')
            const { data: { session } } = await supabase.auth.getSession()

            // Map data for Update (Event 100/Table 100 or General)
            // Ensure we match Table001Data schema required fields
            // Construct payload
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
                    fatherName: selectedEmployee.fatherName || '---',
                    birthDate: formatDateForBackend(selectedEmployee.birthDate || '2000-01-01'),
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
                    operation_code: operationCode, // Use passed code (e.g., ' ' for History, '2' for Correction)
                    event_code: eventCode,
                    data: payloadData
                })
            })

            if (!response.ok) {
                const errData = await response.json()
                throw new Error(errData.message || errData.detail || 'Failed to update employee')
            }

            // Reload employees and update view
            const updatedList = await fetchEmployees()

            // Find the updated employee and refresh selectedEmployee state
            if (updatedList) {
                const updated = updatedList.find((e: Employee) => e.id === selectedEmployee.id)
                if (updated) {
                    setSelectedEmployee(updated)
                }
            }

        } catch (err: any) {
            // Re-throw to be handled by the UI
            throw err
        }
    }

    const handleAction = (actionId: string) => {
        console.log('Action clicked:', actionId)
        switch (actionId) {
            case 'add':
                handleAddEmployee()
                break
            // Add more action handlers here
        }
    }

    // Add Employee Form View - Unified with EmployeeDetails
    if (viewMode === 'add') {
        return (
            <div className="flex flex-col h-full w-full bg-bg-main" dir="rtl">
                <EmployeeDetails
                    employee={{ id: '' } as any}
                    isNew={true}
                    onSaveNew={(data) => handleSaveNewEmployee(data as any)}
                    onBack={handleBackToList}
                    lastCreatedId={lastCreatedId || (employees.length > 0 ? String(Math.max(0, ...employees.map(e => parseInt(e.employeeNumber || '0')).filter(n => !isNaN(n)))) : undefined)}
                    existingIds={existingIds}
                    existingNationalIds={existingNationalIds}
                    onCancel={handleBackToList}
                />
            </div>
        )

    }



    // Full page employee details view (Search OR Edit)
    if (viewMode === 'details') {
        return (
            <div className="flex flex-col h-full w-full bg-bg-main" dir="rtl">
                <EmployeeDetails
                    employee={selectedEmployee}
                    initialEmployees={employees}
                    searchMode={!selectedEmployee}
                    onSearch={handleSearch}
                    onNext={handleNextEmployee}
                    onPrevious={handlePreviousEmployee}
                    onBack={handleBackToList}
                    onUpdate={handleUpdateEmployee}
                    onCancel={handleBackToList}
                    onNewSearch={() => {
                        setSelectedEmployee(null)
                        setViewMode('details')
                    }}
                    onDelete={async () => {
                        if (confirm('האם אתה בטוח שברצונך למחוק רשומה זו?')) {
                            try {
                                await handleUpdateEmployee('200', {}, '3')
                                alert('העובד נמחק בהצלחה')
                                setSelectedEmployee(null)
                                setViewMode('details')
                            } catch (err: any) {
                                alert(`שגיאה במחיקת עובד: ${err.message}`)
                            }
                        }
                    }}
                />
            </div>
        )
    }

    // Employee list view (Only for multiple search results)
    if (viewMode === 'list') {
        return (
            <div className="flex flex-col h-full w-full bg-bg-main" dir="rtl">
                {/* Header / Title Area */}
                <div className="bg-surface border-b border-border p-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-secondary text-lg border-l border-border pl-4 ml-4">תוצאות חיפוש</span>
                            <span className="text-text-secondary">{employees.length} עובדים נמצאו</span>
                        </div>
                    </div>
                    <Button variant="ghost" onClick={() => setViewMode('details')}>חזרה לחיפוש</Button>
                </div>

                {/* Main Content Area */}
                <div className="flex flex-1 overflow-hidden p-6 gap-6">
                    {/* Center Table Area */}
                    <div className="flex-1 bg-surface rounded-xl shadow-sm border border-border overflow-hidden flex flex-col">
                        <EmployeeTable
                            employees={employees}
                            selectedId={selectedEmployee?.id}
                            onSelectEmployee={handleSelectEmployee}
                        />
                    </div>
                </div>
            </div>
        )
    }

    return null
}

