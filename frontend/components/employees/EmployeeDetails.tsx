'use client'

import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    User,
    Briefcase,
    Users,
    FileText,
    Star,
    ChevronRight,
    ChevronLeft,
    Edit,
    Phone,
    Mail,
    MapPin,
    Calendar,
    Building2,
    ShieldCheck,
    Plus,
    ArrowRight,
    ArrowLeft,
    X,
    AlertCircle,
    CheckCircle2,
    Search,
    Filter,
    MoreHorizontal,
    Printer
} from 'lucide-react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs' // If using shadcn tabs


import DateRangeSelector, { DateRangeType } from './DateRangeSelector'
import { EmployeeTablesManager, EmployeeTableViewer } from './EmployeeTablesManager'

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
    onSaveNew?: (data: any) => void
    lastCreatedId?: string
    existingIds?: string[]
    existingNationalIds?: string[]
    onUpdate?: (eventCode: string, data: any, operationCode?: string) => Promise<void> | void
}

type TabType = 'general' | 'personal' | 'employment' | 'salary' | 'attendance' | 'hr' | 'documents' | 'process'

const tabs: { id: TabType; label: string }[] = [
    { id: 'general', label: 'פרטים כלליים' },
    { id: 'employment', label: 'תפקיד וצוות' },
    { id: 'salary', label: 'כתובת וטלפון' }, // Reusing 'salary' ID for Address/Phone based on user request mapping? Or just renaming label.
    { id: 'hr', label: 'הגדרות' },
]

export default function EmployeeDetails({
    employee,
    onNext,
    onPrevious,
    onEdit,
    onBack,
    isNew = false,
    onSaveNew,
    lastCreatedId,
    existingIds = [],
    existingNationalIds = [],
    onUpdate
}: EmployeeDetailsProps) {
    const [activeTab, setActiveTab] = useState<TabType>('general')
    const [activeTable, setActiveTable] = useState<string>('001')
    const AVAILABLE_TABLES = ['001', '100', '101']
    const [table100Mode, setTable100Mode] = useState<'form' | 'table'>('table') // New state for Table 100 view mode
    const [dateRange, setDateRange] = useState<DateRangeType>('all')
    const [isEditing, setIsEditing] = useState(isNew)
    const [error, setError] = useState<string | null>(null)
    const [filteredNameHistory, setFilteredNameHistory] = useState<NameHistoryRecord[]>([])
    const [addressHistory, setAddressHistory] = useState<AddressHistoryRecord[]>([])
    const [table101Mode, setTable101Mode] = useState<'table' | 'form'>('table')
    const [selectedAddressRecord, setSelectedAddressRecord] = useState<AddressHistoryRecord | null>(null)
    const [filterMode, setFilterMode] = useState<'all' | 'dates' | 'current_month'>('current_month')
    const [filterFromDate, setFilterFromDate] = useState('01/2020')
    const [filterToDate, setFilterToDate] = useState('12/2024')
    const [tableInputValue, setTableInputValue] = useState('001')
    const [selectedHistoryRecord, setSelectedHistoryRecord] = useState<any | null>(null)
    const [addressFormData, setAddressFormData] = useState({
        city_name: '',
        city_code: '',
        street: '',
        house_number: '',
        apartment: '',
        entrance: '',
        postal_code: '',
        phone: '',
        phone_additional: '',
        effectiveDate: (() => {
            const d = new Date()
            return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
        })(),
        endDate: ''
    })
    const [operationCode, setOperationCode] = useState<string>('2') // Default to '2' (Update) for existing, ' ' for new

    // Auto-format date input: 122020 -> 12/2020
    const formatDateInput = (value: string): string => {
        const digits = value.replace(/\D/g, '')
        if (digits.length === 6) {
            return `${digits.slice(0, 2)}/${digits.slice(2)}`
        }
        return value
    }

    // Filter name history by date range
    const filterNameHistoryByDate = (history: NameHistoryRecord[]) => {
        return history.filter(record => {
            if (filterMode === 'all') return true
            if (!record.effective_from) return true

            const recordStart = new Date(record.effective_from)
            const recordEnd = record.effective_to ? new Date(record.effective_to) : null

            if (filterMode === 'current_month') {
                const now = new Date()
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
                const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

                // Check overlap: (Start <= EndMonth) AND (End >= StartMonth OR End is NULL)
                return recordStart <= endOfMonth && (recordEnd === null || recordEnd >= startOfMonth)
            }

            // Custom Dates
            const [fromMonth, fromYear] = filterFromDate.split('/').map(Number)
            const [toMonth, toYear] = filterToDate.split('/').map(Number)
            if (!fromMonth || !fromYear || !toMonth || !toYear) return true
            const fromDate = new Date(fromYear, fromMonth - 1, 1)
            const toDate = new Date(toYear, toMonth, 0) // Last day of month

            return recordStart <= toDate && (recordEnd === null || recordEnd >= fromDate)
        })
    }

    // Filter address history by date range
    const filterAddressHistoryByDate = (history: AddressHistoryRecord[]) => {
        return history.filter(record => {
            if (filterMode === 'all') return true
            if (!record.effective_from) return true

            const recordStart = new Date(record.effective_from)
            const recordEnd = record.effective_to ? new Date(record.effective_to) : null

            if (filterMode === 'current_month') {
                const now = new Date()
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
                const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
                return recordStart <= endOfMonth && (recordEnd === null || recordEnd >= startOfMonth)
            }

            const [fromMonth, fromYear] = filterFromDate.split('/').map(Number)
            const [toMonth, toYear] = filterToDate.split('/').map(Number)
            if (!fromMonth || !fromYear || !toMonth || !toYear) return true
            const fromDate = new Date(fromYear, fromMonth - 1, 1)
            const toDate = new Date(toYear, toMonth, 0)

            return recordStart <= toDate && (recordEnd === null || recordEnd >= fromDate)
        })
    }

    const fetchNameHistory = async () => {
        if (!employee?.id) return
        try {
            const { data, error } = await supabase
                .from('employee_name_history')
                .select('*')
                .eq('employee_id', employee.id)
                .order('effective_from', { ascending: true })

            if (error) throw error
            setFilteredNameHistory(filterNameHistoryByDate(data || []))
        } catch (err) {
            console.error('Error fetching name history:', err)
        }
    }

    const fetchAddressHistory = async () => {
        if (!employee?.id) return
        try {
            const { data, error } = await supabase
                .from('employee_address')
                .select('*')
                .eq('employee_id', employee.id)
                .order('valid_from', { ascending: true })

            if (error) throw error
            // Map valid_from/to to effective_from/to for consistency
            const mapped = (data || []).map(r => ({
                ...r,
                effective_from: r.valid_from,
                effective_to: r.valid_to
            }))
            setAddressHistory(filterAddressHistoryByDate(mapped))
        } catch (err) {
            console.error('Error fetching address history:', err)
        }
    }

    useEffect(() => {
        if (activeTable === '100') fetchNameHistory()
        if (activeTable === '101') fetchAddressHistory()
    }, [activeTable, employee?.id, employee, filterMode, filterFromDate, filterToDate]) // Refresh history when employee data changes (prop update)


    const idInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (isNew && idInputRef.current) {
            idInputRef.current.focus()
        }
    }, [isNew])

    // Initialize form data with all potential fields
    const [formData, setFormData] = useState({
        employeeId: isNew ? '' : (employee?.employeeNumber || ''),
        idNumber: employee?.idNumber || '',
        lastName: employee?.lastName || '',
        firstName: employee?.firstName || '',
        fatherName: employee?.fatherName || '',
        birthDate: employee?.birthDate ? (employee.birthDate.match(/^\d{4}-\d{2}-\d{2}$/) ? `${employee.birthDate.split('-')[2]}/${employee.birthDate.split('-')[1]}/${employee.birthDate.split('-')[0]}` : employee.birthDate) : '',
        passport: employee?.passport || '',

        effectiveDate: (() => {
            const d = new Date()
            return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
        })()
    })

    // Sync form data when employee prop changes (e.g., after onUpdate refresh)
    useEffect(() => {
        if (employee) {
            setFormData(prev => ({
                ...prev,
                firstName: employee.firstName || '',
                lastName: employee.lastName || '',
                employeeId: employee.employeeNumber || '',
                idNumber: employee.idNumber || '',
                fatherName: employee.fatherName || '',
                birthDate: employee.birthDate ? (employee.birthDate.match(/^\d{4}-\d{2}-\d{2}$/) ? `${employee.birthDate.split('-')[2]}/${employee.birthDate.split('-')[1]}/${employee.birthDate.split('-')[0]}` : employee.birthDate) : '',
                passport: employee.passport || '',

            }))
        }
        // Reset operation code when switching employee or table
        setOperationCode(isNew ? ' ' : (activeTable === '001' ? '2' : ' '))
    }, [employee, activeTable, isNew])

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleAddressInputChange = (field: string, value: string) => {
        setAddressFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleSave = async () => {
        setError(null)

        if (isNew) {
            if (!formData.idNumber) {
                setError('יש להזין מספר זהות')
                return
            }
            if (!formData.employeeId) {
                setError('יש להזין מספר עובד')
                return
            }
            if (!formData.firstName) {
                setError('יש להזין שם פרטי')
                return
            }
            if (!formData.lastName) {
                setError('יש להזין שם משפחה')
                return
            }
            if (!formData.birthDate) {
                setError('יש להזין תאריך לידה')
                return
            }

            // Duplication checks
            if (existingIds.includes(formData.employeeId)) {
                setError(`מספר עובד ${formData.employeeId} כבר קיים במערכת`)
                return
            }
            if (existingNationalIds.includes(formData.idNumber)) {
                setError(`מספר זהות ${formData.idNumber} כבר קיים במערכת`)
                return
            }

            if (onSaveNew) {
                try {
                    await onSaveNew({
                        employeeNumber: formData.employeeId,
                        ...formData
                    })
                    toast.success('האירוע נקלט')
                } catch (err: any) {
                    toast.error(err.message || 'האירוע לא נקלט')
                }
            }
        } else if (activeTable === '100') {
            // Handle Table 100 Save (Name Update - Event 552)
            console.log('Saving Table 100:', formData)

            let effectiveFrom = new Date().toISOString().split('T')[0]
            if (formData.effectiveDate && formData.effectiveDate.includes('/')) {
                const [d, m, y] = formData.effectiveDate.split('/')
                effectiveFrom = `${y}-${m}-${d}`
            } else if (formData.effectiveDate) {
                effectiveFrom = formData.effectiveDate
            }

            if (onUpdate) {
                try {
                    // Determine Op Code: For now default to ' ' (Change Name)
                    await onUpdate('100', {
                        firstName: formData.firstName || employee?.firstName || '',
                        lastName: formData.lastName || employee?.lastName || '',
                        effectiveFrom: effectiveFrom
                    }, operationCode) // Use selected Operation Code

                    toast.success('האירוע נקלט')

                    // Switch to table view after update
                    setTable100Mode('table')
                    setSelectedHistoryRecord(null)
                } catch (err: any) {
                    toast.error(err.message || 'האירוע לא נקלט')
                }
            }
        } else if (activeTable === '001') {
            // Handle Table 001 Save (Personal Details - Event 200)
            if (onUpdate) {
                try {
                    await onUpdate('200', {
                        firstName: employee?.firstName || '',
                        lastName: employee?.lastName || '',
                        fatherName: formData.fatherName,
                        birthDate: employee?.birthDate || ''
                    }, operationCode) // Use selected Operation Code

                    toast.success('האירוע נקלט')
                    setIsEditing(false)
                } catch (err: any) {
                    toast.error(err.message || 'האירוע לא נקלט')
                }
            }
        } else if (activeTable === '101') {
            handleAddressSave()
        }
    }

    const handleAddressSave = async () => {
        if (!onUpdate) return

        let effectiveFrom = new Date().toISOString().split('T')[0]
        let validTo: string | undefined = undefined

        if (addressFormData.effectiveDate && addressFormData.effectiveDate.includes('/')) {
            const [d, m, y] = addressFormData.effectiveDate.split('/')
            effectiveFrom = `${y}-${m}-${d}`
        }

        if (addressFormData.endDate && addressFormData.endDate.includes('/')) {
            const [d, m, y] = addressFormData.endDate.split('/')
            validTo = `${y}-${m}-${d}`
        }

        const payload = {
            cityName: addressFormData.city_name,
            cityCode: addressFormData.city_code,
            street: addressFormData.street,
            houseNumber: addressFormData.house_number,
            apartment: addressFormData.apartment,
            entrance: addressFormData.entrance,
            postalCode: addressFormData.postal_code,
            phone: addressFormData.phone,
            phoneAdditional: addressFormData.phone_additional,
            effectiveFrom: effectiveFrom,
            validTo: validTo
        }

        try {
            await onUpdate('101', payload, operationCode)
            toast.success('האירוע נקלט')

            // Refresh history immediately for feedback
            fetchAddressHistory()

            setTable101Mode('table')
            setSelectedAddressRecord(null)
        } catch (err: any) {
            toast.error(err.message || 'האירוע לא נקלט')
        }
    }

    const ActionCodeSelector = () => (
        <div className="flex items-center w-full py-1 border-b border-gray-50 last:border-0 group min-h-[48px] mb-2">
            <span className="text-sm font-bold text-black min-w-[140px] text-right">
                קוד פעולה:
            </span>
            <div className="flex items-center gap-4 pr-6 flex-1 max-w-md">
                {[
                    { code: ' ', label: 'רישום', color: 'text-success' },
                    { code: '2', label: 'טיוב', color: 'text-warning' },
                    { code: '3', label: 'גריעה', color: 'text-danger' },
                    { code: '4', label: 'אכיפה', color: 'text-info' }
                ].map((op) => (
                    <label
                        key={op.code}
                        className={cn(
                            "flex items-center gap-1.5 cursor-pointer transition-all px-2 py-1 rounded-md",
                            operationCode === op.code ? "bg-gray-100 shadow-sm outline outline-1 outline-gray-200" : "hover:bg-gray-50"
                        )}
                    >
                        <input
                            type="radio"
                            name="operationCode"
                            value={op.code}
                            checked={operationCode === op.code}
                            onChange={(e) => setOperationCode(e.target.value)}
                            className="hidden"
                        />
                        <div className={cn(
                            "w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all",
                            operationCode === op.code ? "bg-primary border-primary" : "border-gray-400 bg-white"
                        )}>
                            {operationCode === op.code && <div className="w-1 h-1 bg-white rounded-full" />}
                        </div>
                        <span className={cn(
                            "text-xs font-black whitespace-nowrap",
                            operationCode === op.code ? "text-primary" : "text-gray-500"
                        )}>
                            {op.label}
                            <span className="mr-0.5 opacity-40 text-[9px] font-mono">({op.code === ' ' ? 'ריק' : op.code})</span>
                        </span>
                    </label>
                ))}
            </div>
        </div>
    )

    const handleDeleteRecord = async () => {
        if (!selectedHistoryRecord || !onUpdate) return

        if (confirm('האם אתה בטוח שברצונך לבטל רשומה זו?')) {
            try {
                await onUpdate('100', {
                    firstName: selectedHistoryRecord.first_name_he,
                    lastName: selectedHistoryRecord.last_name_he,
                    effectiveFrom: selectedHistoryRecord.effective_from
                }, '3') // Operation Code '3' = Delete

                toast.success('האירוע נקלט')

                // On success, reset state
                setTable100Mode('table')
                setSelectedHistoryRecord(null)
            } catch (err) {
                console.error('Error deleting record:', err)
                toast.error('האירוע לא נקלט')
            }
        }
    }

    if (!employee && !isNew) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gray-50 text-gray-400 font-sans">
                <div className="text-center">
                    <User className="h-16 w-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-bold">בחר עובד מהרשימה</p>
                    <p className="text-sm mt-2">לחץ על שורה בטבלה לצפייה בפרטים</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full bg-slate-50 font-sans text-right" dir="rtl">
            {/* MODERN HEADER CARD */}
            <div className="bg-white px-8 py-6 border-b border-gray-200 shadow-sm flex items-start justify-between">
                <div className="flex items-center gap-6">
                    <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-blue-600 text-white text-2xl font-bold">
                            {formData.firstName?.[0]}{formData.lastName?.[0]}
                        </AvatarFallback>
                    </Avatar>
                    
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                                {formData.firstName} {formData.lastName}
                            </h1>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 px-3 py-1">
                                פעיל
                            </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-gray-500 mt-2 text-sm font-medium">
                            <div className="flex items-center gap-1">
                                <Briefcase className="w-4 h-4" />
                                <span>{employee?.position || 'מפתח פול סטאק'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                <span>{employee?.address || 'תל אביב-יפו'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Building2 className="w-4 h-4" />
                                <span>{employee?.department || 'פיתוח'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button 
                         variant="outline" 
                         className="border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 hidden md:flex"
                         onClick={() => onEdit?.()}
                    >
                        <Printer className="w-4 h-4 ml-2" />
                        הדפס כרטיס
                    </Button>
                    <Button 
                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all hover:shadow-lg"
                        onClick={handleSave}
                    >
                        <CheckCircle2 className="w-4 h-4 ml-2" />
                        שמור שינויים
                    </Button>
                </div>
            </div>

            {/* MAIN CONTENT - TABS & CARDS */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
                
                {/* NAVIGATION TABS */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-gray-200 w-fit shadow-sm mx-auto md:mx-0">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id)
                                if (tab.id === 'general') setActiveTable('001')
                                if (tab.id === 'salary') setActiveTable('101') // Keeping mapping logic
                            }}
                            className={cn(
                                "flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 gap-2",
                                activeTab === tab.id
                                    ? "bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100"
                                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                            )}
                        >
                            {tab.id === 'general' && <User className="w-4 h-4" />}
                            {tab.id === 'employment' && <Briefcase className="w-4 h-4" />}
                            {tab.id === 'salary' && <MapPin className="w-4 h-4" />} {/* Mapped to Address */}
                            {tab.id === 'hr' && <ShieldCheck className="w-4 h-4" />}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* CONTENT AREA */}
                <div className="max-w-5xl animate-in fade-in slide-in-from-bottom-3 duration-500">
                    
                    {/* CONDITIONAL CONTENT BASED ON TABS */}
                    
                    {(activeTab === 'general' && activeTable === '001') && (
                        <div className="grid grid-cols-12 gap-8">
                            {/* LEFT COLUMN (Details) */}
                            <div className="col-span-12 md:col-span-8 space-y-6">
                                
                                {/* CARD: BASIC INFO */}
                                <Card className="p-6 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
                                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                            <User className="w-5 h-5" />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900">פרטים אישיים</h3>
                                    </div>

                                    {(isEditing || isNew) && (
                                        <div className="mb-6">
                                             <ActionCodeSelector />
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                        <div className="space-y-2">
                                            <Label className="text-gray-500 text-xs font-bold uppercase tracking-wider">שם פרטי</Label>
                                            <input 
                                                value={formData.firstName}
                                                onChange={(e) => handleInputChange('firstName', e.target.value)}
                                                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-gray-900"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-gray-500 text-xs font-bold uppercase tracking-wider">שם משפחה</Label>
                                            <input 
                                                value={formData.lastName}
                                                onChange={(e) => handleInputChange('lastName', e.target.value)}
                                                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-gray-900"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-gray-500 text-xs font-bold uppercase tracking-wider">מספר עובד</Label>
                                            <input 
                                                value={formData.employeeId}
                                                onChange={(e) => handleInputChange('employeeId', e.target.value)}
                                                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-gray-900"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-gray-500 text-xs font-bold uppercase tracking-wider">תעודת זהות</Label>
                                            <input 
                                                value={formData.idNumber}
                                                onChange={(e) => handleInputChange('idNumber', e.target.value)}
                                                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-gray-900"
                                            />
                                        </div>
                                    </div>
                                </Card>

                                {/* CARD: ADDITIONAL INFO */}
                                <Card className="p-6 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
                                        <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900">תאריכים וסטטוס</h3>
                                    </div>
                                    
                                     <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                        <div className="space-y-2">
                                            <Label className="text-gray-500 text-xs font-bold uppercase tracking-wider">תאריך לידה</Label>
                                            <input 
                                                value={formData.birthDate}
                                                onChange={(e) => handleInputChange('birthDate', formatDate(e.target.value))}
                                                placeholder="DD/MM/YYYY"
                                                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-gray-900"
                                            />
                                        </div>
                                     </div>
                                </Card>
                            </div>

                            {/* RIGHT COLUMN (Stats / Quick Actions) */}
                            <div className="col-span-12 md:col-span-4 space-y-6">
                                <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white border-0 shadow-lg p-6">
                                    <div className="flex justify-between items-start mb-8">
                                        <div>
                                            <p className="text-blue-100 font-medium mb-1">יתרת חופשה</p>
                                            <h2 className="text-3xl font-black">12.5 <span className="text-sm font-normal opacity-80">ימים</span></h2>
                                        </div>
                                        <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                                            <Star className="w-6 h-6 text-yellow-300" />
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center pt-4 border-t border-white/20">
                                        <p className="text-blue-100 font-medium">ימי מחלה</p>
                                        <p className="text-xl font-bold">5.0</p>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    )}

                    {/* HISTORY TABLE & ADDRESS LOGIC */}
                    {(activeTab === 'general' && activeTable === '100') && (
                        <Card className="border-gray-200 shadow-sm overflow-hidden">
                             <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                                 <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                     <FileText className="w-4 h-4 text-gray-500" />
                                     היסטוריית שינוי שם
                                 </h3>
                                 <div className="flex gap-2">
                                    <Button size="sm" variant={table100Mode === 'table' ? 'secondary' : 'ghost'} onClick={() => { setTable100Mode('table'); setSelectedHistoryRecord(null); }}>
                                        טבלה
                                    </Button>
                                    <Button size="sm" variant={table100Mode === 'form' ? 'secondary' : 'ghost'} onClick={() => { setTable100Mode('form'); setSelectedHistoryRecord(null); }}>
                                        טופס
                                    </Button>
                                 </div>
                             </div>
                             <div className="p-6">
                                 {/* Reuse existing Table 100 Logic but stripped of 'Priority' styling */}
                                 {table100Mode === 'form' ? (
                                     <div className="space-y-4 max-w-lg">
                                        <ActionCodeSelector />
                                        <div className="space-y-2">
                                            <Label>שם משפחה</Label>
                                            <input value={formData.lastName} onChange={(e) => handleInputChange('lastName', e.target.value)} className="w-full p-2 border rounded" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>שם פרטי</Label>
                                            <input value={formData.firstName} onChange={(e) => handleInputChange('firstName', e.target.value)} className="w-full p-2 border rounded" />
                                        </div>
                                     </div>
                                 ) : (
                                     <div className="overflow-x-auto">
                                         <table className="w-full text-sm text-right">
                                             <thead className="bg-gray-100 text-gray-600 font-semibold uppercase text-xs">
                                                 <tr>
                                                     <th className="p-3">שם משפחה</th>
                                                     <th className="p-3">שם פרטי</th>
                                                     <th className="p-3">תאריך שינוי</th>
                                                 </tr>
                                             </thead>
                                             <tbody className="divide-y divide-gray-100">
                                                 {filteredNameHistory.map((rec) => (
                                                     <tr key={rec.id} className="hover:bg-blue-50 transition-colors cursor-pointer" onClick={() => { setSelectedHistoryRecord(rec); setFormData(prev => ({...prev, firstName: rec.first_name_he, lastName: rec.last_name_he})); setTable100Mode('form'); }}>
                                                         <td className="p-3 font-medium text-gray-900">{rec.last_name_he}</td>
                                                         <td className="p-3 text-gray-600">{rec.first_name_he}</td>
                                                         <td className="p-3 text-gray-500">
                                                             {rec.effective_from ? new Date(rec.effective_from).toLocaleDateString('he-IL') : '-'}
                                                         </td>
                                                     </tr>
                                                 ))}
                                             </tbody>
                                         </table>
                                     </div>
                                 )}
                             </div>
                        </Card>
                    )}

                    {(activeTab === 'salary' && activeTable === '101') && ( // Address
                         <Card className="border-gray-200 shadow-sm overflow-hidden">
                             <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                                 <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                     <MapPin className="w-4 h-4 text-gray-500" />
                                     כתובות ופרטי קשר
                                 </h3>
                                  <div className="flex gap-2">
                                    <Button size="sm" variant={table101Mode === 'table' ? 'secondary' : 'ghost'} onClick={() => { setTable101Mode('table'); setSelectedAddressRecord(null); }}>
                                        טבלה
                                    </Button>
                                    <Button size="sm" variant={table101Mode === 'form' ? 'secondary' : 'ghost'} onClick={() => { setTable101Mode('form'); setSelectedAddressRecord(null); }}>
                                        טופס
                                    </Button>
                                 </div>
                             </div>
                             <div className="p-6">
                                 {table101Mode === 'form' ? (
                                     <div className="grid grid-cols-2 gap-6">
                                        <div className="col-span-2"><ActionCodeSelector /></div>
                                        <div className="space-y-2">
                                            <Label>עיר</Label>
                                            <input value={addressFormData.city_name} onChange={(e) => handleAddressInputChange('city_name', e.target.value)} className="w-full p-2 border rounded" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>רחוב</Label>
                                            <input value={addressFormData.street} onChange={(e) => handleAddressInputChange('street', e.target.value)} className="w-full p-2 border rounded" />
                                        </div>
                                         <div className="space-y-2">
                                            <Label>מספר בית</Label>
                                            <input value={addressFormData.house_number} onChange={(e) => handleAddressInputChange('house_number', e.target.value)} className="w-full p-2 border rounded" />
                                        </div>
                                         <div className="space-y-2">
                                            <Label>מיקוד</Label>
                                            <input value={addressFormData.postal_code} onChange={(e) => handleAddressInputChange('postal_code', e.target.value)} className="w-full p-2 border rounded" />
                                        </div>
                                     </div>
                                 ) : (
                                      <div className="overflow-x-auto">
                                         <table className="w-full text-sm text-right">
                                             <thead className="bg-gray-100 text-gray-600 font-semibold uppercase text-xs">
                                                 <tr>
                                                     <th className="p-3">עיר</th>
                                                     <th className="p-3">רחוב</th>
                                                     <th className="p-3">מספר</th>
                                                     <th className="p-3">תאריך</th>
                                                 </tr>
                                             </thead>
                                             <tbody className="divide-y divide-gray-100">
                                                 {addressHistory.map((rec, idx) => (
                                                     <tr key={rec.id || idx} className="hover:bg-blue-50 transition-colors">
                                                         <td className="p-3 font-medium text-gray-900">{rec.city_name}</td>
                                                         <td className="p-3 text-gray-600">{rec.street}</td>
                                                         <td className="p-3 text-gray-500">{rec.house_number}</td>
                                                          <td className="p-3 text-gray-500">
                                                             {rec.effective_from ? new Date(rec.effective_from).toLocaleDateString('he-IL') : '-'}
                                                         </td>
                                                     </tr>
                                                 ))}
                                             </tbody>
                                         </table>
                                     </div>
                                 )}
                             </div>
                         </Card>
                    )}

                </div>
            </div>
        </div>
    )

}