'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
    ArrowRight,
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    FileText,
    Plus,
    Building2,
    X
} from 'lucide-react'
import { NewEmployeeData } from './AddEmployeeForm'

interface EmployeeCreatedViewProps {
    employee: NewEmployeeData
    onBack: () => void
    onEdit?: () => void
}

type TabType = 'favorites' | 'personal' | 'employment' | 'salary' | 'attendance' | 'hr' | 'documents' | 'process'

const tabs: { id: TabType; label: string }[] = [
    { id: 'personal', label: 'פרטים אישיים' },
    { id: 'employment', label: 'פרטי העסקה' },
    { id: 'hr', label: 'משאבי אנוש' },
    { id: 'documents', label: 'מסמכים' },
]

interface SummaryItem {
    code: string
    label: string
}

const summaryItems: SummaryItem[] = [
    { code: '001', label: 'פרטים אישיים' },
]

export default function EmployeeCreatedView({ employee, onBack }: EmployeeCreatedViewProps) {
    const [activeTab, setActiveTab] = useState<TabType>('personal')
    const [selectedSummaryItem, setSelectedSummaryItem] = useState<string>('001')
    const [processingMonth] = useState('02/2026')

    const currentDate = new Date().toLocaleDateString('he-IL')
    const currentTime = new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }).replace(':', '')

    return (
        <div className="flex flex-col h-full bg-bg-main font-sans" dir="rtl">
            {/* Top Header removed to match EmployeeDetails */}

            {/* Second Header Bar - Employee Info - CLICK Style */}
            {/* Second Header Bar - Employee Info - CLICK Style */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-8 shadow-sm">
                <div className="flex items-center gap-3">
                    <Label className="text-xs font-bold text-black uppercase">מס' עובד</Label>
                    <div className="bg-primary/10 text-primary px-4 py-1.5 rounded-lg text-sm font-black border border-primary/20">
                        {employee.employeeNumber}
                    </div>
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-black uppercase">שם משפחה ושם פרטי</span>
                    <div className="flex items-center gap-2 text-xl font-black text-black">
                        <span>{employee.lastName}</span>
                        <span>{employee.firstName}</span>
                    </div>
                </div>

                {/* Icons on the left */}
                <div className="mr-auto flex items-center gap-2">
                    <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <FileText className="h-5 w-5 text-danger" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <Plus className="h-5 w-5 text-warning" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <Building2 className="h-5 w-5 text-info" />
                    </button>
                </div>
            </div>

            {/* Quick Info Bar removed to match EmployeeDetails */}

            {/* Tab Navigation */}
            <div className="bg-white border-b border-gray-200 flex px-4">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "px-6 py-3 text-sm font-medium transition-all relative",
                            activeTab === tab.id
                                ? "text-primary border-b-2 border-primary"
                                : "text-text-secondary hover:text-primary hover:bg-primary/5"
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex gap-3 p-4 overflow-hidden">
                {/* Main Content - Personal Info Layout */}
                <div className="flex-1 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
                    {/* Inner Header - Table Selector Style */}
                    <div className="bg-primary text-white px-8 py-3 flex items-center justify-between">
                        <h2 className="text-xl font-black tracking-tight">טבלה 001 - פרטים אישיים</h2>
                        <div className="flex items-center gap-3">
                            <button className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                                <ArrowRight className="h-5 w-5" />
                            </button>
                            <button className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Employee Details - Right Aligned */}
                    <div className="flex-1 p-3 bg-white overflow-y-auto">
                        <div className="max-w-xl">
                            <div className="space-y-4 flex flex-col items-start pr-4">
                                <DetailRow label="שם האב:" value={employee.fatherName || '-'} />
                                <DetailRow label="תאריך לידה:" value={employee.birthDate ? (employee.birthDate.match(/^\d{4}-\d{2}-\d{2}$/) ? `${employee.birthDate.split('-')[2]}/${employee.birthDate.split('-')[1]}/${employee.birthDate.split('-')[0]}` : employee.birthDate) : '-'} />
                                <DetailRow label="מספר זהות:" value={employee.idNumber} />
                                <DetailRow label="דרכון:" value={employee.passport || ''} />
                                <DetailRow label="שם משפחה אחר:" value={employee.altLastName || ''} />
                                <DetailRow label="שם פרטי אחר:" value={employee.altFirstName || ''} />
                                <DetailRow label="שם פרטי נוסף:" value={employee.additionalFirstName || '-'} />
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="bg-white border-t border-gray-100 px-8 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="outline"
                                onClick={onBack}
                                className="h-10 px-8 border-gray-200 text-secondary font-bold hover:bg-gray-50 rounded-xl"
                            >
                                <X className="h-4 w-4 ml-2" />
                                יציאה
                            </Button>
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

                {/* Right Sidebar - Quick Navigation */}
                <div className="w-64 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                    <div className="bg-secondary text-white px-4 py-3 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        <span className="text-sm font-black uppercase tracking-tight">ניווט מהיר</span>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {summaryItems.map((item) => (
                            <div
                                key={item.code}
                                onClick={() => setSelectedSummaryItem(item.code)}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-gray-100 transition-colors",
                                    selectedSummaryItem === item.code
                                        ? "bg-primary/5 border-r-4 border-r-primary"
                                        : "hover:bg-gray-50"
                                )}
                            >
                                <span className={cn(
                                    "text-[10px] font-black px-1.5 py-0.5 rounded",
                                    selectedSummaryItem === item.code ? "bg-primary text-white" : "bg-gray-100 text-gray-500"
                                )}>
                                    {item.code}
                                </span>
                                <span className={cn(
                                    "text-sm font-medium truncate flex-1",
                                    selectedSummaryItem === item.code ? "text-primary" : "text-secondary"
                                )}>
                                    {item.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Dark Bottom Bar - Strictly matching image */}
            <div className="bg-secondary text-white px-8 py-2 flex items-center justify-start gap-8 z-20 h-10 border-t border-white/5 shadow-2xl">
                <div className="flex items-center gap-3 border-l border-white/10 pl-8">
                    <span className="text-[10px] font-black opacity-40 uppercase tracking-tighter">טבלה</span>
                    <span className="text-sm font-black tracking-widest text-[#00E5FF]">001</span>
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

// Helper component for detail rows
function DetailRow({
    label,
    value,
    highlight = false,
    isBlue = false,
    info
}: {
    label: string
    value: string
    highlight?: boolean
    isBlue?: boolean
    info?: string
}) {
    return (
        <div className="flex items-center gap-6 w-full py-1">
            <span className="text-sm font-bold text-black min-w-[120px]">
                {label}
            </span>
            <div className="flex items-center gap-3 flex-1">
                <span className="text-sm font-bold text-black">
                    {value}
                </span>
                {info && <span className="text-black text-[10px] font-bold uppercase">({info})</span>}
            </div>
        </div>
    )
}
