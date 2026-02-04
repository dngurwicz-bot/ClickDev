'use client'

import { useState, useEffect } from 'react'
import EmployeeToolbar from '@/components/employees/EmployeeToolbar'
import EmployeeSidebar from '@/components/employees/EmployeeSidebar'
import EmployeeTable from '@/components/employees/EmployeeTable'
import EmployeeDetails, { Employee } from '@/components/employees/EmployeeDetails'
// import AddEmployeeForm, { NewEmployeeData } from '@/components/employees/AddEmployeeForm'
import EmployeeCreatedView from '@/components/employees/EmployeeCreatedView'
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

export default function EmployeeFilePage() {
    const { currentOrg } = useOrganization()
    const { hideSidebar, showSidebar } = useSidebarActions()
    const [employees, setEmployees] = useState<Employee[]>([])
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
    const [viewMode, setViewMode] = useState<ViewMode>('list')
    const [newEmployee, setNewEmployee] = useState<NewEmployeeData | null>(null)
    const [lastCreatedId, setLastCreatedId] = useState<string | undefined>(undefined)
    const [isLoaded, setIsLoaded] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchEmployees = async () => {
        if (!currentOrg?.id) return []
        try {
            setError(null)
            const { supabase } = await import('@/lib/supabase')
            const { data: { session } } = await supabase.auth.getSession()

            const response = await fetch(`/api/organizations/${currentOrg.id}/employees`, {
                cache: 'no-store',
                headers: {
                    'Authorization': session?.access_token ? `Bearer ${session.access_token}` : '',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            })
            if (!response.ok) throw new Error('Failed to fetch employees')
            const data = await response.json()
            const list = data.length > 0 ? data : mockEmployees
            setEmployees(list)
            return list
        } catch (err) {
            console.error('Error fetching employees:', err)
            setError('אירעה שגיאה בטעינת העובדים')
            setEmployees(mockEmployees)
            return mockEmployees
        } finally {
            setIsLoaded(true)
        }
    }

    // Load from backend on mount or org change
    useEffect(() => {
        fetchEmployees()
    }, [currentOrg?.id])

    // Collect existing IDs for validation
    const existingIds = employees.map(e => e.employeeNumber || e.id)
    const existingNationalIds = employees.map(e => e.idNumber || '').filter(id => id !== '')

    // Sidebar visibility is controlled globally, we don't force hide it anymore.
    // useEffect(() => {
    //    hideSidebar()
    //    return () => showSidebar()
    // }, [hideSidebar, showSidebar])

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
                        employee_number: employee.employeeNumber,
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
            await fetchEmployees()
            setNewEmployee(employee)
            setLastCreatedId(employee.employeeNumber)
            setViewMode('created')
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
            <div className="flex flex-col h-[calc(100vh-60px)] overflow-hidden bg-[#e0e0e0] p-1" dir="rtl">
                <div className="flex-1 rounded-sm overflow-hidden shadow-sm bg-white">
                    <EmployeeDetails
                        employee={{ id: '' } as any}
                        isNew={true}
                        onSaveNew={(data) => handleSaveNewEmployee(data as any)}
                        onBack={handleBackToList}
                        lastCreatedId={lastCreatedId || (employees.length > 0 ? String(Math.max(0, ...employees.map(e => parseInt(e.employeeNumber || '0')).filter(n => !isNaN(n)))) : undefined)}
                        existingIds={existingIds}
                        existingNationalIds={existingNationalIds}
                    />
                </div>
            </div>
        )
    }

    // Employee Created View (after adding)
    if (viewMode === 'created' && newEmployee) {
        return (
            <div className="h-[calc(100vh-60px)] overflow-hidden">
                <EmployeeCreatedView
                    employee={newEmployee}
                    onBack={handleBackToList}
                />
            </div>
        )
    }

    // Full page employee details view
    if (viewMode === 'details' && selectedEmployee) {
        return (
            <div className="flex flex-col h-[calc(100vh-60px)] overflow-hidden bg-[#e0e0e0] p-1" dir="rtl">
                <div className="flex flex-1 gap-1 overflow-hidden">
                    {/* Collapsible List / Sidebar on Right */}
                    <div className="hidden lg:block w-72 rounded-sm overflow-hidden shadow-sm bg-white flex-shrink-0">
                        <EmployeeSidebar onAction={handleAction} />
                        {/* Optionally show a mini list here if desired, for now keeping sidebar actions implies context */}
                        <div className="h-full overflow-y-auto border-t border-gray-100">
                            <div className="p-2">
                                <Button variant="outline" size="sm" className="w-full text-xs" onClick={handleBackToList}>
                                    <ArrowRight className="w-3 h-3 ml-1" />
                                    חזרה לרשימה
                                </Button>
                            </div>
                            {/* Mini List could go here */}
                            {employees.map(e => (
                                <div
                                    key={e.id}
                                    className={cn(
                                        "px-3 py-2 text-xs border-b border-gray-50 cursor-pointer hover:bg-gray-50 flex items-center gap-2",
                                        selectedEmployee.id === e.id ? "bg-blue-50 border-r-4 border-r-primary" : ""
                                    )}
                                    onClick={() => setSelectedEmployee(e)}
                                >
                                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold">
                                        {e.firstName?.[0]}
                                    </div>
                                    <div>
                                        <div className="font-bold">{e.firstName} {e.lastName}</div>
                                        <div className="text-gray-400">{e.employeeNumber}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Main Details Area */}
                    <div className="flex-1 rounded-sm overflow-hidden shadow-sm bg-white">
                        <EmployeeDetails
                            employee={selectedEmployee}
                            onNext={handleNextEmployee}
                            onPrevious={handlePreviousEmployee}
                            onBack={handleBackToList} // Logic handled by sidebar button too
                            onUpdate={handleUpdateEmployee}
                        />
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="h-1 bg-primary mt-1 opacity-80" />
            </div>
        )
    }

    // Loading state to prevent flash of empty list
    if (!isLoaded) {
        return <div className="flex h-screen items-center justify-center bg-[#e0e0e0] text-primary font-bold">טוען נתונים...</div>
    }

    // Employee list view
    return (
        <div className="flex flex-col h-[calc(100vh-100px)] overflow-hidden bg-[#e0e0e0] p-1" dir="rtl">
            {/* Header / Title Area */}
            <div className="bg-white border-b border-gray-300 p-2 flex items-center justify-between text-xs mb-1 rounded-sm shadow-sm">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-secondary border-l border-gray-300 pl-4 ml-4">{currentOrg?.name || 'טוען...'}</span>
                        <span className="text-gray-500">בחירת עובד</span>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="mb-1 rounded-sm overflow-hidden shadow-sm">
                <EmployeeToolbar />
            </div>

            {/* Main Content Area */}
            <div className="flex flex-1 gap-1 overflow-hidden">
                {/* Right Sidebar (Actions Menu) */}
                <div className="w-72 rounded-sm overflow-hidden shadow-sm bg-white flex-shrink-0">
                    <EmployeeSidebar onAction={handleAction} />
                </div>

                {/* Center Table Area */}
                <div className="flex-1 rounded-sm overflow-hidden shadow-sm bg-white flex flex-col min-w-0">
                    <EmployeeTable
                        employees={employees}
                        selectedId={selectedEmployee?.id}
                        onSelectEmployee={handleSelectEmployee}
                    />
                </div>
            </div>

            {/* Teal Bottom Bar Decorator */}
            <div className="h-1 bg-primary mt-1 opacity-80" />
        </div>
    )
}
