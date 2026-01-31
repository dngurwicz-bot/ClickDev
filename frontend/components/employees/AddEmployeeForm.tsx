'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
    Save,
    X,
    Eye,
    Plus,
    FileText,
    ArrowRight,
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    Search
} from 'lucide-react'

interface AddEmployeeFormProps {
    onSave: (employee: NewEmployeeData) => void
    onCancel: () => void
}

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

type TabType = 'favorites' | 'personal' | 'employment' | 'salary' | 'attendance' | 'hr' | 'documents' | 'process'

const tabs: { id: TabType; label: string }[] = [
    { id: 'favorites', label: 'מועדפים' },
    { id: 'personal', label: 'פרטים אישיים' },
    { id: 'employment', label: 'פרטי העסקה' },
    { id: 'salary', label: 'שכר' },
    { id: 'attendance', label: 'נוכחות' },
    { id: 'hr', label: 'משאבי אנוש' },
    { id: 'documents', label: 'מסמכים' },
    { id: 'process', label: 'עיבוד עוקב' },
]

export default function AddEmployeeForm({ onSave, onCancel }: AddEmployeeFormProps) {
    const [activeTab, setActiveTab] = useState<TabType>('personal')
    const [employeeNumber, setEmployeeNumber] = useState('')
    const [formData, setFormData] = useState<NewEmployeeData>({
        employeeNumber: '',
        firstName: '',
        lastName: '',
        fatherName: '',
        birthDate: '',
        idNumber: '',
        passport: '',
        altLastName: '',
        altFirstName: '',
        additionalFirstName: '',
    })

    const handleChange = (field: keyof NewEmployeeData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleSave = () => {
        if (!formData.firstName || !formData.lastName || !formData.idNumber) {
            alert('נא למלא שדות חובה (שם פרטי, שם משפחה, מספר זהות)')
            return
        }
        onSave({
            ...formData,
            employeeNumber: employeeNumber || String(Math.floor(Math.random() * 90000) + 10000)
        })
    }

    return (
        <div className="flex flex-col h-full bg-bg-main font-sans" dir="rtl">
            {/* Top Header Bar - CLICK Branding Colors */}
            <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-6 shadow-sm z-10">
                <div className="flex items-center gap-2">
                    <Label className="text-xs font-black text-text-secondary uppercase">מס' עובד</Label>
                    <Input
                        value={employeeNumber}
                        onChange={(e) => setEmployeeNumber(e.target.value)}
                        className="w-24 h-8 text-sm bg-gray-50 border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary font-bold"
                        placeholder="אוטומטי"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Label className="text-xs font-black text-text-secondary uppercase">שם משפחה</Label>
                    <Input
                        value={formData.lastName}
                        onChange={(e) => handleChange('lastName', e.target.value)}
                        className="w-44 h-8 text-sm bg-[#FFF9E6] border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary font-black"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Label className="text-xs font-black text-text-secondary uppercase">שם פרטי</Label>
                    <Input
                        value={formData.firstName}
                        onChange={(e) => handleChange('firstName', e.target.value)}
                        className="w-44 h-8 text-sm bg-[#FFF9E6] border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary font-black"
                    />
                </div>
                {/* Toolbar icons */}
                <div className="mr-auto flex items-center gap-1">
                    <button className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="מסמכים">
                        <FileText className="h-5 w-5 text-danger" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="חדש">
                        <Plus className="h-5 w-5 text-warning" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="חיפוש">
                        <Search className="h-5 w-5 text-info" />
                    </button>
                </div>
            </div>

            {/* Tab Navigation - RTL Start */}
            <div className="bg-white border-b border-gray-200 flex px-4">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "px-6 py-3 text-sm font-bold transition-all relative border-b-2",
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
            <div className="flex-1 p-6 flex flex-col gap-4 overflow-hidden">
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col overflow-hidden w-full h-full max-w-7xl mx-auto">
                    {/* Form Header - Using Primary Color */}
                    <div className="bg-primary text-white px-8 py-4 flex items-center justify-between">
                        <h2 className="text-xl font-black tracking-tight">טבלה 001 - פתיחת עובד</h2>
                        <div className="flex items-center gap-3">
                            <button className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                                <ArrowRight className="h-5 w-5" />
                            </button>
                            <button className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Form Fields - Aligned to the Right (Start in RTL) */}
                    <div className="flex-1 p-10 bg-gray-50/30 overflow-y-auto">
                        <div className="max-w-2xl flex flex-col items-start gap-6">
                            <FormField label="שם האב" value={formData.fatherName} onChange={(v) => handleChange('fatherName', v)} />
                            <FormField
                                label="תאריך לידה"
                                value={formData.birthDate}
                                onChange={(v) => handleChange('birthDate', v)}
                                type="date"
                                hasIcon
                                required
                            />
                            <FormField
                                label="מספר זהות"
                                value={formData.idNumber}
                                onChange={(v) => handleChange('idNumber', v)}
                                required
                            />
                            <FormField label="דרכון" value={formData.passport} onChange={(v) => handleChange('passport', v)} doubleField />
                            <FormField label="שם משפחה אחר" value={formData.altLastName} onChange={(v) => handleChange('altLastName', v)} doubleField />
                            <FormField label="שם פרטי אחר" value={formData.altFirstName} onChange={(v) => handleChange('altFirstName', v)} doubleField />
                            <FormField label="שם פרטי מוסף" value={formData.additionalFirstName} onChange={(v) => handleChange('additionalFirstName', v)} />

                            {/* Check ID Link - Aligned Right (Start) */}
                            <div className="mt-4 w-full flex justify-start pr-[160px]">
                                <a href="#" className="text-primary hover:underline text-sm font-black flex items-center gap-2 group">
                                    <div className="w-2 h-2 rounded-full bg-primary group-hover:scale-125 transition-transform" />
                                    בדיקת אימות נתוני עובד מול המוסד לביטוח לאומי
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Form Footer Actions */}
                    <div className="bg-white border-t border-gray-100 px-8 py-5 flex items-center gap-4">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="outline"
                                onClick={onCancel}
                                className="h-11 px-8 border-gray-200 text-secondary font-bold hover:bg-gray-50 rounded-xl"
                            >
                                <X className="h-4 w-4 ml-2" />
                                יציאה
                            </Button>
                            <Button
                                onClick={handleSave}
                                className="h-11 px-10 bg-primary hover:bg-primary-dark text-white font-black rounded-xl shadow-md border-b-4 border-primary-dark"
                            >
                                <Plus className="h-5 w-5 ml-2 font-black" />
                                הוספה
                            </Button>
                        </div>

                        <div className="mr-auto">
                            <Button
                                variant="ghost"
                                onClick={onCancel}
                                className="h-11 px-6 text-danger hover:bg-danger/10 font-bold rounded-xl"
                            >
                                <X className="h-4 w-4 ml-2" />
                                ביטול רשומה
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Global Status Bar - Aligned Right */}
            <div className="bg-secondary text-white px-8 py-3 flex items-center justify-start gap-8 z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
                <div className="flex items-center gap-3 border-l border-white/10 pl-8">
                    <span className="text-[10px] font-black opacity-40 uppercase tracking-tighter">טבלה</span>
                    <span className="text-base font-black tracking-widest text-primary-light">001</span>
                </div>
                <div className="flex items-center gap-3 border-l border-white/10 pl-8">
                    <span className="text-[10px] font-black opacity-40 uppercase tracking-tighter">תת-שירות</span>
                    <span className="text-base font-black tracking-widest text-primary-light">02</span>
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                        <ChevronRight className="h-5 w-5" />
                    </button>
                    <button className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                </div>
                <Button variant="outline" className="bg-white/5 border-white/20 text-white font-black hover:bg-white/10 h-10 px-8 rounded-xl mr-6">
                    הצג
                </Button>
            </div>
        </div>
    )
}

// Helper component for form fields
function FormField({
    label,
    value,
    onChange,
    type = 'text',
    hasIcon = false,
    doubleField = false,
    required = false
}: {
    label: string
    value: string
    onChange: (value: string) => void
    type?: string
    hasIcon?: boolean
    doubleField?: boolean
    required?: boolean
}) {
    const bgClass = required ? "bg-[#FFF9E6]" : "bg-white"

    return (
        <div className="flex items-center gap-4 w-full group">
            <Label className="text-sm font-black text-secondary min-w-[140px] text-left">
                {label}
            </Label>
            <div className="flex items-center gap-2">
                {hasIcon && (
                    <button className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors">
                        <FileText className="h-4 w-4 text-primary" />
                    </button>
                )}
                <div className="flex items-center gap-2">
                    <Input
                        type={type}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className={cn(
                            "w-56 h-10 text-sm border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary font-bold shadow-sm rounded-xl transition-all group-hover:border-primary/40",
                            bgClass
                        )}
                    />
                    {doubleField && (
                        <Input
                            className="w-24 h-10 text-sm bg-white border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary font-bold shadow-sm rounded-xl group-hover:border-primary/40"
                        />
                    )}
                </div>
            </div>
        </div>
    )
}
