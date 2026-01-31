'use client'

import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
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
    CheckCircle2
} from 'lucide-react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import DateRangeSelector, { DateRangeType } from './DateRangeSelector'
import { EmployeeTablesManager } from './EmployeeTablesManager'

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
    altLastName?: string
    altFirstName?: string
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
    onUpdate?: (eventCode: string, data: any, operationCode?: string) => void
}

type TabType = 'favorites' | 'personal' | 'employment' | 'salary' | 'attendance' | 'hr' | 'documents' | 'process'

const tabs: { id: TabType; label: string; icon: typeof User }[] = [
    { id: 'personal', label: 'פרטים אישיים', icon: User },
    { id: 'employment', label: 'פרטי העסקה', icon: Briefcase },
    { id: 'hr', label: 'משאבי אנוש', icon: Users },
    { id: 'documents', label: 'מסמכים', icon: FileText },
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
    const [activeTab, setActiveTab] = useState<TabType>('personal')
    const [activeTable, setActiveTable] = useState<string>('001')
    const [table100Mode, setTable100Mode] = useState<'form' | 'table'>('table') // New state for Table 100 view mode
    const [dateRange, setDateRange] = useState<DateRangeType>('all')
    const [isEditing, setIsEditing] = useState(isNew)
    const [error, setError] = useState<string | null>(null)
    const [nameHistory, setNameHistory] = useState<any[]>([])

    useEffect(() => {
        if (activeTable === '100' && employee?.id) {
            const fetchHistory = async () => {
                const { data, error } = await supabase
                    .from('employee_name_history')
                    .select('*')
                    .eq('employee_id', employee.id)
                    .order('effective_from', { ascending: false })

                if (data) {
                    setNameHistory(data)
                } else if (error) {
                    console.error('Error fetching name history for employee:', employee.id, JSON.stringify(error, null, 2))
                }
            }
            fetchHistory()
        }
    }, [activeTable, employee?.id])


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
        altLastName: employee?.altLastName || '',
        altFirstName: employee?.altFirstName || '',
        effectiveDate: (() => {
            const d = new Date()
            return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
        })()
    })

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleSave = () => {
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
                onSaveNew({
                    employeeNumber: formData.employeeId,
                    ...formData
                })
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
                // Determine Op Code: For now default to ' ' (Change Name)
                onUpdate('100', {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    effectiveFrom: effectiveFrom
                }, ' ') // Pass ' ' (Space) as Operation Code for History
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
        <div className="flex flex-col h-full bg-bg-main font-sans" dir="rtl">

            {/* Second Header Bar - Employee Quick Info - MORE COMPACT & LARGER FONTS */}
            <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-8 shadow-sm relative">
                <div className="flex items-center gap-3">
                    <Label className="text-xs font-bold text-black uppercase">מס' עובד</Label>
                    <div className={cn(
                        "transition-all duration-200",
                        isNew ? "relative" : "bg-primary/5 text-primary px-4 py-1.5 rounded-md text-sm font-black border border-primary/10 shadow-sm"
                    )}>
                        {isNew ? (
                            <input
                                ref={idInputRef}
                                type="text"
                                maxLength={9}
                                value={formData.employeeId}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '')
                                    handleInputChange('employeeId', val)
                                }}
                                className="bg-white border-2 border-primary/30 text-primary px-4 py-1.5 rounded-md text-sm font-black outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 shadow-inner w-44 tracking-widest text-center"
                                placeholder="0"
                            />
                        ) : (
                            employee?.employeeNumber || employee?.id
                        )}
                    </div>
                </div>
                {isNew && lastCreatedId && (
                    <div className="flex items-center gap-2 bg-success/10 text-success px-4 py-1.5 rounded-lg border border-success/20 animate-in fade-in slide-in-from-top-2 duration-500">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-xs font-black">עובד אחרון שנפתח: <span className="underline decoration-2 underline-offset-2">{lastCreatedId}</span></span>
                    </div>
                )}
                {error && (
                    <div className="flex items-center gap-2 bg-danger/10 text-danger px-4 py-1.5 rounded-lg border border-danger/20 animate-bounce">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-xs font-black">{error}</span>
                    </div>
                )}
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-black uppercase leading-tight">שם משפחה ושם פרטי</span>
                    <div className="flex items-center gap-2 text-2xl font-black text-black leading-tight min-h-[32px]">
                        <span>{formData.lastName || (isNew ? '---' : '')}</span>
                        <span>{formData.firstName || (isNew ? '---' : '')}</span>
                    </div>
                </div>

                <div className="hidden md:flex items-center gap-8 text-xs font-bold border-r border-gray-100 pr-8 mr-8 h-12">
                    <div className="flex flex-col">
                        <span className="text-text-muted font-normal text-[10px]">מחלקה:</span>
                        <span className="text-secondary text-sm">{employee?.department || '---'}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-text-muted font-normal text-[10px]">תפקיד:</span>
                        <span className="text-secondary text-sm">{employee?.position || '---'}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-text-muted font-normal text-[10px]">מצב:</span>
                        <span className="text-success text-sm">{employee?.status || (isNew ? 'חדש' : 'עובד רגיל')}</span>
                    </div>
                </div>

                {/* Navigation & Icons */}
                <div className="mr-auto flex items-center gap-1.5">
                    <div className="flex items-center bg-gray-50 p-0.5 rounded-lg ml-3">
                        <button
                            onClick={onPrevious}
                            className="p-1 hover:bg-white hover:shadow-xs rounded transition-all"
                            title="העובד הקודם"
                        >
                            <ChevronRight className="h-4 w-4 text-secondary" />
                        </button>
                        <button
                            onClick={onNext}
                            className="p-1 hover:bg-white hover:shadow-xs rounded transition-all"
                            title="העובד הבא"
                        >
                            <ChevronLeft className="h-4 w-4 text-secondary" />
                        </button>
                    </div>
                    <button className="p-1.5 hover:bg-gray-50 rounded-full transition-colors">
                        <FileText className="h-4 w-4 text-danger" />
                    </button>
                    <button className="p-1.5 hover:bg-gray-50 rounded-full transition-colors" onClick={onEdit}>
                        <Edit className="h-4 w-4 text-warning" />
                    </button>
                    <button className="p-1.5 hover:bg-gray-50 rounded-full transition-colors">
                        <Building2 className="h-4 w-4 text-info" />
                    </button>
                </div>
            </div>


            {/* Tabs - Aligned to Start (Right in RTL) */}
            <div className="bg-white border-b border-gray-200 flex px-2 overflow-x-auto no-scrollbar">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "px-5 py-3 text-sm font-bold transition-all relative border-b-2 whitespace-nowrap",
                            activeTab === tab.id
                                ? "text-primary border-primary"
                                : "text-text-muted border-transparent hover:text-primary hover:border-primary/30"
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex gap-2 p-2 overflow-hidden">
                <div className="flex-1 bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col overflow-hidden">
                    {/* Inner Header - Table Selector Style */}
                    <div className="bg-primary text-white px-8 py-3 flex items-center justify-between">
                        <h2 className="text-xl font-black tracking-tight">
                            {activeTable === '001' ? 'טבלה 001 - פרטים אישיים' : 'טבלה 100 - עדכון שם'}
                        </h2>
                        <div className="flex items-center gap-3">
                            <button className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                                <ArrowRight className="h-5 w-5" />
                            </button>
                            <button className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Tab Content - Right Aligned Details */}
                    <div className="flex-1 p-3 bg-white overflow-y-auto">
                        <div className="max-w-xl">
                            {activeTab === 'personal' && activeTable === '001' && (
                                <div className="space-y-4 flex flex-col items-start pr-4">
                                    <DetailRow
                                        label="שם האב:"
                                        value={formData.fatherName}
                                        isEditMode={isEditing}
                                        onChange={(v) => handleInputChange('fatherName', v)}
                                    />
                                    <DetailRow
                                        label="מספר זהות:"
                                        value={formData.idNumber}
                                        isEditMode={isEditing}
                                        onChange={(v) => handleInputChange('idNumber', v)}
                                    />
                                    <DetailRow
                                        label="שם משפחה:"
                                        value={formData.lastName}
                                        highlight
                                        isEditMode={isEditing}
                                        onChange={(v) => handleInputChange('lastName', v)}
                                    />
                                    <DetailRow
                                        label="שם פרטי:"
                                        value={formData.firstName}
                                        isEditMode={isEditing}
                                        onChange={(v) => handleInputChange('firstName', v)}
                                    />
                                    <DetailRow
                                        label="תאריך לידה:"
                                        value={formData.birthDate}
                                        info={calculateAge(formData.birthDate) ? `גיל: ${calculateAge(formData.birthDate)}` : undefined}
                                        isEditMode={isEditing}
                                        onChange={(v) => handleInputChange('birthDate', formatDate(v))}
                                    />
                                    <DetailRow
                                        label="דרכון:"
                                        value={formData.passport}
                                        isEditMode={isEditing}
                                        onChange={(v) => handleInputChange('passport', v)}
                                    />
                                    <DetailRow
                                        label="שם משפחה אחר:"
                                        value={formData.altLastName}
                                        isEditMode={isEditing}
                                        onChange={(v) => handleInputChange('altLastName', v)}
                                    />
                                    <DetailRow
                                        label="שם פרטי אחר:"
                                        value={formData.altFirstName}
                                        isEditMode={isEditing}
                                        onChange={(v) => handleInputChange('altFirstName', v)}
                                    />

                                </div>
                            )}
                        </div>
                        {/* End of max-w-xl container */}


                        {activeTab === 'personal' && activeTable === '100' && (
                            <div className="flex flex-col h-full">
                                {/* Hilan 552 Window Header with Toolbar */}
                                <div className="bg-gradient-to-r from-[#E3EFFF] to-[#F1F7FF] border border-[#8497B0] flex items-center justify-between px-2 h-9 shadow-sm shrink-0" dir="rtl">
                                    <div className="flex items-center gap-2">
                                        {/* Toolbar Icons - Mode Switchers */}
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => setTable100Mode('form')}
                                                className={cn(
                                                    "p-1 rounded border hover:bg-white/50 transition-colors",
                                                    table100Mode === 'form' ? "bg-[#FFE8A6] border-[#E8C060] shadow-inner" : "bg-transparent border-transparent"
                                                )}
                                                title="תצוגת טופס"
                                            >
                                                <FileText className="w-4 h-4 text-[#1F497D]" />
                                            </button>
                                            <button
                                                onClick={() => setTable100Mode('table')}
                                                className={cn(
                                                    "p-1 rounded border hover:bg-white/50 transition-colors",
                                                    table100Mode === 'table' ? "bg-[#FFE8A6] border-[#E8C060] shadow-inner" : "bg-transparent border-transparent"
                                                )}
                                                title="תצוגת טבלה"
                                            >
                                                <div className="h-4 w-4 grid grid-cols-2 gap-0.5 opacity-80 border border-[#1F497D] bg-white" />
                                            </button>
                                        </div>
                                        <div className="h-4 w-px bg-[#8497B0] mx-2" />
                                        <div className="flex gap-1 opacity-60 grayscale hover:grayscale-0 transition-all">
                                            <div className="w-4 h-4 bg-gray-200 border border-gray-400 rounded-sm shadow-sm" />
                                            <div className="w-4 h-4 bg-gray-200 border border-gray-400 rounded-sm shadow-sm" />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-[#000080] text-sm tracking-tight">שינוי שם</span>
                                    </div>
                                </div>

                                {/* CONTENT AREA */}
                                <div className="border-x border-b border-[#8497B0] bg-white p-4 flex-1 overflow-auto">

                                    {/* MODE: FORM (INPUT) */}
                                    {table100Mode === 'form' && (
                                        <div className="w-full space-y-3 pt-6 mr-0">
                                            <DetailRow label="שם משפחה חדש" value={formData.lastName} isEditMode onChange={(v) => handleInputChange('lastName', v)} />
                                            <DetailRow label="שם פרטי חדש" value={formData.firstName} isEditMode onChange={(v) => handleInputChange('firstName', v)} />

                                            <div className="pt-2">
                                                <DetailRow
                                                    label="תאריך שינוי"
                                                    value={formData.effectiveDate}
                                                    highlight
                                                    isEditMode
                                                    onChange={(v) => handleInputChange('effectiveDate', formatDate(v))}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* MODE: TABLE (READ) */}
                                    {table100Mode === 'table' && (
                                        <div className="h-full flex flex-col">
                                            {/* Filter / Top Bar mimicking image */}
                                            <div className="flex items-center justify-end gap-2 mb-2 pb-2 border-b border-gray-100 text-xs">
                                                <div className="flex items-center gap-1 bg-yellow-50 border border-yellow-200 px-2 py-0.5">
                                                    <span>לפי תאריכים</span>
                                                </div>
                                                <div className="border border-gray-300 px-2 py-0.5 bg-white">01/2020 - מ</div>
                                                <div className="border border-gray-300 px-2 py-0.5 bg-white">02/2026 עד</div>
                                            </div>

                                            <div className="overflow-x-auto border border-[#8497B0]" dir="rtl">
                                                <table className="w-full border-collapse text-xs">
                                                    <thead>
                                                        <tr className="bg-[#B9CDE5] text-center text-[#1F497D] font-bold border-b border-[#8497B0] h-8">
                                                            <th className="border-l border-[#8497B0] px-2 min-w-[100px]">שם פרטי ישן</th>
                                                            <th className="border-l border-[#8497B0] px-2 min-w-[100px]">שם משפחה ישן</th>
                                                            <th className="px-2 min-w-[90px]">תאריך</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white">
                                                        {nameHistory.length === 0 ? (
                                                            <tr>
                                                                <td colSpan={6} className="border-b border-gray-200 px-2 py-4 text-center text-gray-400">
                                                                    אין היסטוריית שינויים
                                                                </td>
                                                            </tr>
                                                        ) : (
                                                            nameHistory.map((record, idx) => (
                                                                <tr key={record.id || idx} className="hover:bg-[#FCE4D6] transition-colors border-b border-gray-200 group text-center h-7">
                                                                    <td className="border-l border-gray-200 px-2 text-black">{record.first_name_he}</td>
                                                                    <td className="border-l border-gray-200 px-2 text-black">{record.last_name_he}</td>
                                                                    <td className="px-2 text-black font-medium">
                                                                        {record.effective_from ? new Date(record.effective_from).toLocaleDateString('en-GB') : '-'}
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        )}
                                                        {/* Empty rows filler for visual fidelity */}
                                                        {Array.from({ length: Math.max(0, 10 - nameHistory.length) }).map((_, i) => (
                                                            <tr key={`empty-${i}`} className="border-b border-gray-100 h-7">
                                                                <td className="border-l border-gray-100"></td>
                                                                <td className="border-l border-gray-100"></td>
                                                                <td></td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="bg-white border-t border-gray-100 px-8 py-4 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="outline"
                                onClick={onBack}
                                className="h-10 px-8 border-gray-200 text-secondary font-bold hover:bg-gray-50 rounded-xl"
                            >
                                <X className="h-4 w-4 ml-2" />
                                יציאה
                            </Button>

                            {/* Save/Update Button - Show only in Form Mode or New Employee */}
                            {(activeTable === '100' ? table100Mode === 'form' : true) && (
                                <Button
                                    onClick={handleSave}
                                    className="h-10 px-10 bg-primary hover:bg-primary-dark text-white font-black rounded-xl shadow-md"
                                >
                                    {activeTable === '100' ? (
                                        <>
                                            <CheckCircle2 className="h-4 w-4 ml-2" />
                                            עדכון
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="h-4 w-4 ml-2" />
                                            הוספה
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                onClick={onBack}
                                className="text-danger hover:bg-danger/5 font-bold gap-2 px-4 h-10 rounded-xl"
                            >
                                <X className="h-4 w-4" />
                                ביטול רשומה
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Right Summary Sidebar - Outside the main content div, but inside the flex-row container */}
                <div className="w-64 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col m-4 mr-0 shrink-0">
                    <div className="bg-secondary text-white px-4 py-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        <span className="text-base font-black uppercase tracking-tight">תקציר פרטים אישיים</span>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <div onClick={() => setActiveTable('001')}>
                            <SummaryItem code="001" label="פרטים אישיים" active={activeTable === '001'} />
                        </div>
                        <div onClick={() => setActiveTable('100')}>
                            <SummaryItem code="100" label="עדכון שם" active={activeTable === '100'} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Dark Bottom Bar - Sibling to the Main Row Container (at the root flex-col level) */}
            <div className="bg-secondary text-white px-8 py-2 flex items-center justify-start gap-8 z-20 h-10 border-t border-white/5 shadow-2xl shrink-0">
                <div className="flex items-center gap-3 border-l border-white/10 pl-8">
                    <span className="text-[10px] font-black opacity-40 uppercase tracking-tighter">טבלה</span>
                    <span className="text-sm font-black tracking-widest text-[#00E5FF]">{activeTable}</span>
                </div>
                <div className="flex items-center gap-3 border-l border-white/10 pl-8">
                    <span className="text-[10px] font-black opacity-40 uppercase tracking-tighter">תת-שירות</span>
                    <span className="text-sm font-black tracking-widest text-[#00E5FF]">02</span>
                </div>
                <div className="flex items-center gap-4 mr-auto">
                    <div className="flex items-center gap-1 border-l border-white/10 pl-6 ml-6">
                        <button className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                            <ChevronRight className="h-4 w-4" />
                        </button>
                        <button className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// Helper Components
const formatDate = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '')

    // Mask as DD/MM/YYYY
    if (digits.length <= 2) return digits
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`
}

const calculateAge = (birthDate: string) => {
    if (!birthDate || birthDate.length < 10) return undefined

    const parts = birthDate.split('/')
    if (parts.length !== 3) return undefined

    const day = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10) - 1 // Months are 0-indexed
    const year = parseInt(parts[2], 10)

    const birth = new Date(year, month, day)
    if (isNaN(birth.getTime())) return undefined

    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()

    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--
    }

    return age
}

function DetailRow({
    label,
    value,
    highlight = false,
    isBlue = false,
    info,
    isEditMode = false,
    onChange
}: {
    label: string
    value: string
    highlight?: boolean
    isBlue?: boolean
    info?: string
    isEditMode?: boolean
    onChange?: (value: string) => void
}) {
    return (
        <div className="flex items-center w-full py-1 border-b border-gray-50 last:border-0 group min-h-[48px]">
            {/* Label - Locked to the right in RTL - LARGER FONT */}
            <span className="text-sm font-bold text-black min-w-[140px] text-right">
                {label}
            </span>

            {/* Value / Input Area */}
            <div className="flex items-center gap-3 pr-6 flex-1 max-w-md">
                {isEditMode ? (
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => onChange?.(e.target.value)}
                        className={cn(
                            "w-full bg-gray-50 border border-gray-200 rounded px-3 py-1.5 text-sm font-black text-black outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all",
                            highlight && "text-black border-primary/20 bg-primary/5",
                            isBlue && "text-black border-info/20 bg-info/5"
                        )}
                    />
                ) : (
                    <span className={cn(
                        "text-sm font-black",
                        highlight ? "text-black" : isBlue ? "text-black" : "text-black"
                    )}>
                        {value}
                    </span>
                )}
                {info && <span className="text-text-muted text-[10px] font-bold uppercase whitespace-nowrap">({info})</span>}
            </div>
        </div>
    )
}

function SummaryItem({ code, label, active = false }: { code: string; label: string; active?: boolean }) {
    return (
        <div className={cn(
            "flex items-center gap-3 px-5 py-4 cursor-pointer border-b border-gray-50 transition-all",
            active ? "bg-primary/5 border-r-4 border-r-primary" : "hover:bg-gray-50"
        )}>
            <span className={cn(
                "text-xs font-black px-2 py-0.5 rounded",
                active ? "bg-primary text-white" : "bg-gray-100 text-text-muted"
            )}>
                {code}
            </span>
            <span className={cn(
                "text-base font-semibold truncate flex-1",
                active ? "text-primary" : "text-secondary"
            )}>
                {label}
            </span>
        </div>
    )
}
