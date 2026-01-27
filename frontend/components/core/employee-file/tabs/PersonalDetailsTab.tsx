'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { HilanModuleLayout } from '../HilanModuleLayout'
import { HistoryTable } from '../HistoryTable'
import { EmployeeForm } from '@/components/core/EmployeeForm'
import { authFetch } from '@/lib/api'

interface PersonalDetailsTabProps {
    employee: any
    onSuccess?: () => void
    onOverviewClick?: () => void
}

export function PersonalDetailsTab({ employee, onSuccess, onOverviewClick }: PersonalDetailsTabProps) {
    const [activeEvent, setActiveEvent] = useState('101_identity')
    const [selectedRecord, setSelectedRecord] = useState<any | null>(null)
    const router = useRouter()

    const handleDeleteEmployee = async () => {
        if (!confirm('האם אתה בטוח שברצונך למחוק עובד זה לצמיתות? פעולה זו תימחק גם את כל ההיסטוריה, המינויים והנתונים האישיים ולא ניתנת לביטול.')) {
            return
        }

        try {
            await authFetch(`/api/employees/${employee.id}`, {
                method: 'DELETE',
            })
            router.push('/dashboard/core/employees')
        } catch (error) {
            console.error('Failed to delete employee:', error)
            alert('שגיאה במחיקת העובד. אנא נסה שוב.')
        }
    }

    const menuItems = useMemo(() => [
        { id: '101_identity', label: 'פרטי זיהוי', code: '101' },
        { id: '104_status', label: 'מצב אישי', code: '104' },
        { id: '101_names', label: 'שמות', code: '101' },
        { id: '102', label: 'התקשרות וכתובת', code: '102' },
        { id: '103', label: 'שירות צבאי', code: '103' },
    ], [])

    const handleSuccess = () => {
        setSelectedRecord(null)
        if (onSuccess) onSuccess()
    }

    const renderContent = () => {
        switch (activeEvent) {
            case '101_identity':
                return (
                    <div className="space-y-4">
                        {!selectedRecord ? (
                            <HistoryTable
                                employeeId={employee.id}
                                title="פרטי זיהוי"
                                eventCode="101"
                                onAddClick={() => setSelectedRecord({})} // Pass empty object for new record
                                onRowClick={setSelectedRecord}
                                columns={[
                                    { key: 'id_number', label: 'ת.זהות' },
                                    { key: 'employee_number', label: 'מס\' עובד' },
                                    { key: 'birth_date', label: 'תאריך לידה', format: (val) => val ? new Date(val).toLocaleDateString('he-IL') : '-' },
                                ]}
                            />
                        ) : (
                            <div className="animate-in slide-in-from-right duration-300">
                                <EmployeeForm
                                    initialData={Object.keys(selectedRecord).length > 0 ? { ...employee, ...selectedRecord } : employee}
                                    onSuccess={handleSuccess}
                                    onCancel={() => setSelectedRecord(null)}
                                    onlySections={['identification']}
                                />
                            </div>
                        )}
                    </div>
                )
            case '104_status':
                return (
                    <div className="space-y-4">
                        {!selectedRecord ? (
                            <HistoryTable
                                employeeId={employee.id}
                                title="מצב אישי"
                                eventCode="104"
                                onAddClick={() => setSelectedRecord({})}
                                onRowClick={setSelectedRecord}
                                columns={[
                                    { key: 'marital_status', label: 'מצב משפחתי', format: (val) => val === 'married' ? 'נשוי/ה' : val === 'divorced' ? 'גרוש/ה' : val === 'widowed' ? 'אלמן/ה' : 'רווק/ה' },
                                    { key: 'gender', label: 'מגדר', format: (val) => val === 'male' ? 'זכר' : val === 'female' ? 'נקבה' : 'לא ידוע' },
                                    { key: 'nationality', label: 'לאום', format: (val) => val === 'IL' ? 'ישראלי' : 'אחר' },
                                    { key: 'birth_country', label: 'ארץ לידה' },
                                    { key: 'passport_number', label: 'דרכון' },
                                ]}
                            />
                        ) : (
                            <div className="animate-in slide-in-from-right duration-300">
                                <EmployeeForm
                                    initialData={Object.keys(selectedRecord).length > 0 ? { ...employee, ...selectedRecord } : employee}
                                    onSuccess={handleSuccess}
                                    onCancel={() => setSelectedRecord(null)}
                                    onlySections={['status']}
                                />
                            </div>
                        )}
                    </div>
                )
            case '101_names':
                return (
                    <div className="space-y-4">
                        {!selectedRecord ? (
                            <HistoryTable
                                employeeId={employee.id}
                                title="שמות"
                                eventCode="101"
                                onAddClick={() => setSelectedRecord({})}
                                onRowClick={setSelectedRecord}
                                columns={[
                                    { key: 'first_name', label: 'שם פרטי' },
                                    { key: 'last_name', label: 'שם משפחה' },
                                    { key: 'first_name_en', label: 'שם (En)' },
                                    { key: 'last_name_en', label: 'משפחה (En)' },
                                    { key: 'prev_last_name', label: 'משפחה קודם' },
                                ]}
                            />
                        ) : (
                            <div className="animate-in slide-in-from-right duration-300">
                                <EmployeeForm
                                    initialData={Object.keys(selectedRecord).length > 0 ? { ...employee, ...selectedRecord } : employee}
                                    onSuccess={handleSuccess}
                                    onCancel={() => setSelectedRecord(null)}
                                    onlySections={['names']}
                                />
                            </div>
                        )}
                    </div>
                )
            case '102':
                return (
                    <div className="space-y-4">
                        {!selectedRecord ? (
                            <HistoryTable
                                employeeId={employee.id}
                                title="התקשרות וכתובת"
                                eventCode="102"
                                onAddClick={() => setSelectedRecord({})}
                                onRowClick={setSelectedRecord}
                                columns={[
                                    { key: 'address_city', label: 'יישוב' },
                                    { key: 'address_street', label: 'רחוב' },
                                    { key: 'phone', label: 'טלפון' },
                                    { key: 'email', label: 'אימייל' },
                                    { key: 'mobile', label: 'נייד' },
                                ]}
                            />
                        ) : (
                            <div className="animate-in slide-in-from-right duration-300">
                                <EmployeeForm
                                    initialData={Object.keys(selectedRecord).length > 0 ? { ...employee, ...selectedRecord } : employee}
                                    onSuccess={handleSuccess}
                                    onCancel={() => setSelectedRecord(null)}
                                    onlySections={['contact']}
                                />
                            </div>
                        )}
                    </div>
                )
            case '103':
                return (
                    <div className="space-y-4">
                        {!selectedRecord ? (
                            <HistoryTable
                                employeeId={employee.id}
                                title="שירות צבאי"
                                eventCode="103"
                                onAddClick={() => setSelectedRecord({})}
                                onRowClick={setSelectedRecord}
                                columns={[
                                    { key: 'army_status', label: 'סטטוס צבאי' },
                                    { key: 'army_release_date', label: 'תאריך שחרור' },
                                ]}
                            />
                        ) : (
                            <div className="animate-in slide-in-from-right duration-300">
                                <EmployeeForm
                                    initialData={Object.keys(selectedRecord).length > 0 ? { ...employee, ...selectedRecord } : employee}
                                    onSuccess={handleSuccess}
                                    onCancel={() => setSelectedRecord(null)}
                                    onlySections={['army']}
                                />
                            </div>
                        )}
                    </div>
                )
            default:
                return null
        }
    }

    return (
        <HilanModuleLayout
            menuItems={menuItems}
            activeItemId={activeEvent}
            onItemSelect={(id) => {
                setActiveEvent(id)
                setSelectedRecord(null)
            }}
            title="פרטים אישיים וזהות"
            onOverviewClick={onOverviewClick}
            onDelete={handleDeleteEmployee}
        >
            {renderContent()}
        </HilanModuleLayout>
    )
}
