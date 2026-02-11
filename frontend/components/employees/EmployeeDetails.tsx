'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'
import { PriorityRecordLayout } from '@/components/core/PriorityRecordLayout'
import { PriorityTabs } from '@/components/core/PriorityTabs'
import { PriorityFormField } from '@/components/core/PriorityFormField'
import { PriorityDataGrid } from '@/components/core/PriorityDataGrid'
import {
    User,
    FileText,
    MapPin,
    ShieldCheck,
    CheckCircle2,
    Network,
    Building2,
    Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'


import { ClickSearchPopover } from '@/components/core/ClickSearchPopover'

import DateRangeSelector, { DateRangeType } from './DateRangeSelector'
import { cn } from '@/lib/utils'

export interface Employee {
    id: string
    employeeNumber?: string
    firstName: string
    lastName: string
    department: string
    position: string
    budgetItem: string
    status?: string
    code?: string
    email?: string
    phone?: string
    address?: string
    birthDate?: string
    idNumber?: string
    fatherName?: string
    passport?: string

    first_name_he?: string
    last_name_he?: string
    effective_from?: string

    // Org Hierarchy
    org_unit_id?: string
    organization_id: string // REQUIRED for child tables
    org_path?: { id: string, name: string, type: string }[]
}

export interface NameHistoryRecord {
    id: string;
    employee_id: string;
    first_name_he: string;
    last_name_he: string;
    effective_from: string;
    effective_to?: string;
    created_at: string;
}

export interface AddressHistoryRecord {
    id: string
    city_name: string
    city_code?: string
    street?: string
    house_number?: string
    apartment?: string
    entrance?: string
    postal_code?: string
    phone?: string
    phone_additional?: string
    valid_from: string
    valid_to?: string
    effective_from: string
    effective_to?: string
}

interface EmployeeDetailsProps {
    employee: Employee | null
    onNext?: () => void
    onPrevious?: () => void
    onEdit?: () => void
    onBack?: () => void
    isNew?: boolean
    onSaveNew?: (data: any) => Promise<void> | void
    lastCreatedId?: string
    existingIds?: string[]
    existingNationalIds?: string[]
    onUpdate?: (eventCode: string, data: any, operationCode?: string) => Promise<void> | void
    onCancel?: () => void
    onDelete?: () => void
    searchMode?: boolean
    onSearch?: (criteria: any) => void
    onNewSearch?: () => void
    onToggleView?: () => void
    initialEmployees?: Employee[]
}

const MASTER_TABS = [
    { id: 'general', label: 'פרטים כלליים' },
    { id: 'address', label: 'כתובת וטלפון' },
    { id: 'role', label: 'תפקיד וצוות' },
    { id: 'settings', label: 'הגדרות' },
]

const DETAIL_TABS = [
    { id: 'personal', label: 'פרטים אישיים' },
]

export default function EmployeeDetails({
    employee,
    onNext,
    onPrevious,
    onEdit,
    onBack,
    isNew = false,
    searchMode = false,
    onSearch,
    initialEmployees = [],
    onSaveNew,
    lastCreatedId,
    existingIds = [],
    existingNationalIds = [],
    onUpdate,
    onCancel,
    onDelete,
    onNewSearch,
    onToggleView
}: EmployeeDetailsProps) {
    const router = useRouter()
    // --- State ---
    const [activeMasterTab, setActiveMasterTab] = useState<string>('general')
    const [activeDetailTab, setActiveDetailTab] = useState<string>('personal')
    const [isSelectionVisible, setIsSelectionVisible] = useState(false)
    const [isSearching, setIsSearching] = useState(false)

    const [orgPath, setOrgPath] = useState<{ id: string, name: string, type: string }[]>([])

    // Hierarchy Path Fetching
    useEffect(() => {
        if (employee?.org_unit_id) {
            const fetchPath = async () => {
                const { data, error } = await supabase.rpc('get_unit_hierarchy_path', { p_unit_id: employee.org_unit_id })
                if (!error && data) setOrgPath(data)
            }
            fetchPath()
        }
    }, [employee?.org_unit_id])

    // State for Filter / Tables
    const [activeTable, setActiveTable] = useState<string>('001') // Keeping for backward compat if needed
    const [filteredNameHistory, setFilteredNameHistory] = useState<NameHistoryRecord[]>([])
    const [addressHistory, setAddressHistory] = useState<AddressHistoryRecord[]>([])

    // Form Data
    const [formData, setFormData] = useState({
        employeeId: '',
        idNumber: '',
        lastName: '',
        firstName: '',
        fatherName: '',
        birthDate: '',
        passport: '',
        status: 'active',
        // Address specific fields can be added here
        city: '',
        street: '',
        houseNum: '',
        phone: ''
    })

    // Track initial form data for dirty detection
    const initialFormDataRef = useRef(formData)

    // Init Data
    useEffect(() => {
        if (employee) {
            const newData = {
                employeeId: employee.employeeNumber || '',
                idNumber: employee.idNumber || '',
                lastName: employee.lastName || '',
                firstName: employee.firstName || '',
                fatherName: employee.fatherName || '',
                birthDate: formatDisplayDate(employee.birthDate || ''),
                passport: employee.passport || '',
                status: employee.status || 'active',
                city: '',
                street: '',
                houseNum: '',
                phone: employee.phone || '',
            }
            setFormData(newData)
            initialFormDataRef.current = newData
            setIsSelectionVisible(false)
            setIsSearching(false)
        } else if (searchMode) {
            // Reset form for search
            const emptyData = {
                employeeId: '',
                idNumber: '',
                lastName: '',
                firstName: '',
                fatherName: '',
                birthDate: '',
                passport: '',
                status: 'active',
                city: '',
                street: '',
                houseNum: '',
                phone: ''
            }
            setFormData(emptyData)
            initialFormDataRef.current = emptyData
            // Default show selection if Landing and no employee
            if (!employee && initialEmployees.length > 0) {
                setIsSelectionVisible(true)
            }
            setIsSearching(false)
        }
    }, [employee, searchMode])

    const handleInputChange = (field: string, value: string) => {
        if (field === 'birthDate') {
            const formatted = autoFormatDate(value)
            setFormData(prev => ({ ...prev, [field]: formatted }))
        } else {
            setFormData(prev => ({ ...prev, [field]: value }))
        }
    }

    // --- Date Formatting Helpers ---

    // Converts YYYY-MM-DD to DD/MM/YY
    const formatDisplayDate = (isoDate: string): string => {
        if (!isoDate) return ''
        const parts = isoDate.split('-')
        if (parts.length !== 3) return isoDate
        const year = parts[0].slice(-2)
        const month = parts[1]
        const day = parts[2]
        return `${day}/${month}/${year}`
    }

    // Converts DD/MM/YY or DD/MM/YYYY to YYYY-MM-DD
    const parseDisplayDate = (displayDate: string): string => {
        if (!displayDate) return ''
        const parts = displayDate.split('/')
        if (parts.length !== 3) return displayDate

        let day = parts[0].padStart(2, '0')
        let month = parts[1].padStart(2, '0')
        let yearPart = parts[2]

        let year = yearPart
        if (yearPart.length === 2) {
            const currentYear = new Date().getFullYear() % 100
            const century = parseInt(yearPart) <= currentYear + 10 ? '20' : '19'
            year = century + yearPart
        } else if (yearPart.length === 4) {
            year = yearPart
        }

        return `${year}-${month}-${day}`
    }

    // Handles 010161 -> 01/01/61
    const autoFormatDate = (value: string): string => {
        // Remove non-digits
        const digits = value.replace(/\D/g, '')

        if (digits.length === 6 && !value.includes('/')) {
            return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 6)}`
        }

        if (digits.length === 8 && !value.includes('/')) {
            return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`
        }

        return value
    }

    // Age Calculation Helper
    const calculateAge = (dateStr: string): string => {
        if (!dateStr) return ''

        let birth: Date
        if (dateStr.includes('/')) {
            const iso = parseDisplayDate(dateStr)
            birth = new Date(iso)
        } else {
            birth = new Date(dateStr)
        }

        if (isNaN(birth.getTime())) return ''

        const today = new Date()
        let years = today.getFullYear() - birth.getFullYear()
        let months = today.getMonth() - birth.getMonth()

        if (months < 0 || (months === 0 && today.getDate() < birth.getDate())) {
            years--
            months += 12
        }

        // Adjust for partial months (if not reached the day of birth yet)
        if (today.getDate() < birth.getDate()) {
            months--
        }

        // Ensure month is non-negative after day adjustment
        if (months < 0) {
            months += 12
        }

        return `${years}.${months >= 0 ? months : 0}`
    }

    // Search Handler
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && searchMode && onSearch) {
            console.log('[EmployeeDetails] Enter pressed. Triggering search with data:', formData)
            setIsSearching(true)
            onSearch(formData)
            setIsSelectionVisible(false)
        }
    }

    const handleEmployeeSelect = (emp: Employee) => {
        console.log('[EmployeeDetails] Employee selected from popover:', emp.employeeNumber)
        setIsSearching(true)
        if (onSearch) {
            onSearch({ employeeId: emp.employeeNumber })
        }
        setIsSelectionVisible(false)
    }

    // Dirty detection: compare current form data with initial snapshot
    const isDirty = JSON.stringify(formData) !== JSON.stringify(initialFormDataRef.current)

    if (!employee && !isNew && !searchMode) {
        return <div className="p-8 text-center text-gray-500">בחר עובד מהרשימה</div>
    }

    return (
        <PriorityRecordLayout
            title={isNew ? 'יצירת עובד חדש' : searchMode ? 'חיפוש עובד' : 'כרטיס ליבה - עובד'}
            subtitle={!isNew && !searchMode ? `${formData.lastName} ${formData.firstName}` : undefined}
            id={formData.employeeId}
            status={formData.status}
            isDirty={isDirty}
            suppressEnterSave={searchMode}
            onSave={async () => {
                const preparedData = {
                    ...formData,
                    birthDate: parseDisplayDate(formData.birthDate)
                }

                if (isNew && onSaveNew) {
                    try {
                        await onSaveNew({
                            ...preparedData,
                            employeeNumber: formData.employeeId
                        });
                    } catch (err: any) {
                        toast.error(err.message || 'שגיאה בשמירת העובד');
                    }
                } else if (onUpdate && employee) {
                    try {
                        await onUpdate('100', preparedData, '2');
                        toast.success('העובד עודכן בהצלחה');
                    } catch (err: any) {
                        toast.error(err.message || 'שגיאה בעדכון העובד');
                    }
                }
            }}
            onPrint={() => window.print()}
            onCancel={onCancel}
            onDelete={onDelete}
            onSearch={onNewSearch}
        >
            {/* SEARCHING OVERLAY */}
            {isSearching && (
                <div className="absolute inset-0 z-[200] bg-white/50 flex items-center justify-center backdrop-blur-[1px]">
                    <div className="flex flex-col items-center gap-4 p-8 bg-white border border-gray-300 shadow-xl rounded-sm">
                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                        <span className="font-bold text-lg text-primary">מחפש עובד...</span>
                    </div>
                </div>
            )}

            {/* MASTER SECTION (TOP) */}
            <div className="bg-white border-b border-gray-300 p-6 shadow-sm pb-6 relative" dir="rtl">
                <div className="flex gap-8">

                    {/* Right Panel: Static Identity Fields */}
                    <div className="w-1/3 min-w-[300px] border-l border-gray-200 pl-8">
                        <div className="flex gap-6">
                            {/* Image Section */}
                            <div className="flex-none pt-1">
                                <div className="w-24 h-32 border border-blue-200 bg-blue-50 flex items-center justify-center text-blue-300 relative shadow-sm">
                                    <User className="w-12 h-12" />
                                    <span className="absolute bottom-1 right-1 text-[10px] text-blue-500">הפעלה</span>
                                </div>
                            </div>

                            {/* Fields Section */}
                            <div className="flex-1 space-y-4">
                                <div className="relative">
                                    <PriorityFormField
                                        label="מס עובד"
                                        value={formData.employeeId}
                                        color="red"
                                        required
                                        disabled={!isNew && !searchMode}
                                        onChange={(e) => handleInputChange('employeeId', e.target.value)}
                                        onClick={() => searchMode && setIsSelectionVisible(true)}
                                        onKeyDown={handleKeyDown}
                                        placeholder={searchMode ? "חפש לפי מספר..." : ""}
                                    />
                                    {isSelectionVisible && searchMode && initialEmployees.length > 0 && (
                                        <ClickSearchPopover
                                            initialEmployees={initialEmployees}
                                            onSelect={handleEmployeeSelect}
                                            onAddNew={() => {
                                                setIsSelectionVisible(false)
                                            }}
                                            onAdvancedSearch={() => setIsSelectionVisible(false)}
                                            onClose={() => setIsSelectionVisible(false)}
                                        />
                                    )}
                                </div>
                                <PriorityFormField
                                    label="ת. זהות"
                                    value={formData.idNumber}
                                    color="red"
                                    required
                                    disabled={!isNew && !searchMode}
                                    onChange={(e) => handleInputChange('idNumber', e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={searchMode ? "חפש לפי ת.ז..." : ""}
                                />
                                <PriorityFormField
                                    label="שם משפחה"
                                    value={formData.lastName}
                                    color="red"
                                    required
                                    disabled={!isNew && !searchMode && false} // UNLOCKED for edit
                                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={searchMode ? "חפש לפי משפחה..." : ""}
                                />
                                <PriorityFormField
                                    label="שם פרטי"
                                    value={formData.firstName}
                                    color="red"
                                    required
                                    disabled={!isNew && !searchMode && false} // UNLOCKED for edit
                                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={searchMode ? "חפש לפי פרטי..." : ""}
                                />

                                <div className="space-y-1">
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide">סטטוס</label>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-sm text-gray-800">{formData.status === 'active' ? 'פעיל' : 'לא פעיל'}</span>
                                        <div className={cn("w-2 h-2 rounded-full", formData.status === 'active' ? "bg-green-500" : "bg-gray-300")}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Left Panel: Tabs + Form Content */}
                    <div className="flex-1">
                        <PriorityTabs
                            tabs={MASTER_TABS}
                            activeTab={activeMasterTab}
                            onTabChange={setActiveMasterTab}
                            variant="folder"
                        />

                        <div className="pt-2 px-1">
                            {activeMasterTab === 'general' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                                    <PriorityFormField
                                        label="תואר לפני שם"
                                        value=""
                                        onChange={() => { }}
                                        width="w-24"
                                        disabled={!isNew && !searchMode && false} // UNLOCKED
                                    />
                                    <PriorityFormField
                                        label="מין"
                                        value=""
                                        onChange={() => { }}
                                        disabled={!isNew && !searchMode && false} // UNLOCKED
                                        width="w-32"
                                    />
                                    <PriorityFormField
                                        label="שם האב"
                                        value={formData.fatherName}
                                        onChange={(e) => handleInputChange('fatherName', e.target.value)}
                                        disabled={!isNew && !searchMode && false} // UNLOCKED
                                    />
                                    <PriorityFormField
                                        label="תאריך לידה"
                                        value={formData.birthDate || ''}
                                        onChange={(e) => handleInputChange('birthDate', e.target.value)}
                                        disabled={!isNew && !searchMode && !!employee?.birthDate}
                                        placeholder="DD/MM/YY"
                                    />
                                    <PriorityFormField
                                        label="גיל"
                                        labelWidth="w-12"
                                        value={calculateAge(formData.birthDate)}
                                        disabled
                                        className="bg-blue-50/50 text-blue-700 font-black text-xl border-blue-200"
                                    />
                                    <PriorityFormField
                                        label="שם משתמש"
                                        value={employee?.email?.split('@')[0] || ''}
                                        disabled
                                    />
                                </div>
                            )}

                            {activeMasterTab === 'address' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                                    <PriorityFormField
                                        label="עיר"
                                        value={formData.city}
                                        onChange={(e) => handleInputChange('city', e.target.value)}
                                    />
                                    <PriorityFormField
                                        label="רחוב"
                                        value={formData.street}
                                        onChange={(e) => handleInputChange('street', e.target.value)}
                                    />
                                    <PriorityFormField
                                        label="טלפון נייד"
                                        value={formData.phone}
                                        onChange={(e) => handleInputChange('phone', e.target.value)}
                                    />
                                </div>
                            )}

                            {activeMasterTab === 'role' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                                    <PriorityFormField
                                        label="תפקיד נוכחי"
                                        value={employee?.position || ''}
                                        disabled
                                    />
                                    <PriorityFormField
                                        label="יחידה ארגונית"
                                        value={employee?.department || ''}
                                        disabled
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* DETAIL SECTION (BOTTOM) */}
            <div className="flex-1 bg-[#ECF0F1] p-2 overflow-hidden flex flex-col">
                <PriorityTabs
                    tabs={DETAIL_TABS}
                    activeTab={activeDetailTab}
                    onTabChange={setActiveDetailTab}
                    variant="strip"
                />

                <div className="flex-1 bg-white border border-gray-300 shadow-sm p-4 overflow-y-auto">


                    {['personal'].includes(activeDetailTab) && (
                        <div className="text-center text-gray-400 py-10">
                            תוכן לשונית {DETAIL_TABS.find(t => t.id === activeDetailTab)?.label} בבנייה
                        </div>
                    )}
                </div>
            </div>
        </PriorityRecordLayout>
    )
}