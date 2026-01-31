'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'
import { Calendar as CalendarIcon, X, Eye, Plus, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Table001Data {
    id?: string
    employeeNumber: string
    familyName: string
    firstName: string
    fatherName: string
    birthDate: Date | null
    idNumber: string
    isPassport: boolean
    familyNameExtended: string
    firstNameExtended: string
    additionalFirstName: string
}

interface Table001FormProps {
    initialData?: Partial<Table001Data>
    mode?: 'view' | 'add' | 'edit'
    onSave?: (data: Table001Data) => void
    onCancel?: () => void
    onExit?: () => void
}

export default function Table001Form({
    initialData,
    mode = 'view',
    onSave,
    onCancel,
    onExit
}: Table001FormProps) {
    const [formData, setFormData] = useState<Table001Data>({
        employeeNumber: initialData?.employeeNumber || '',
        familyName: initialData?.familyName || '',
        firstName: initialData?.firstName || '',
        fatherName: initialData?.fatherName || '',
        birthDate: initialData?.birthDate || null,
        idNumber: initialData?.idNumber || '',
        isPassport: initialData?.isPassport || false,
        familyNameExtended: initialData?.familyNameExtended || '',
        firstNameExtended: initialData?.firstNameExtended || '',
        additionalFirstName: initialData?.additionalFirstName || '',
    })

    const [currentMode, setCurrentMode] = useState(mode)

    const handleInputChange = (field: keyof Table001Data, value: string | boolean | Date | null) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleSubmit = () => {
        if (onSave) {
            onSave(formData)
        }
    }

    const isViewMode = currentMode === 'view'

    return (
        <div className="flex flex-col h-full bg-white" dir="rtl">
            {/* Header - Blue bar with table number and name */}
            <div className="bg-primary text-white px-4 py-2 flex items-center justify-between">
                <h2 className="text-lg font-bold">001 - פתיחת עובד</h2>
                <div className="flex items-center gap-2 text-sm">
                    <span>טבלה 001</span>
                </div>
            </div>

            {/* Form Content */}
            <div className="flex-1 p-6 overflow-auto">
                <div className="max-w-2xl mx-auto space-y-4">
                    {/* שם האב */}
                    <div className="flex items-center gap-4">
                        <Label className="w-32 text-left text-sm font-medium text-gray-700">
                            שם האב
                        </Label>
                        <Input
                            value={formData.fatherName}
                            onChange={(e) => handleInputChange('fatherName', e.target.value)}
                            disabled={isViewMode}
                            maxLength={7}
                            className="flex-1 max-w-xs text-right"
                            placeholder=""
                        />
                    </div>

                    {/* תאריך לידה */}
                    <div className="flex items-center gap-4">
                        <Label className="w-32 text-left text-sm font-medium text-gray-700">
                            תאריך לידה
                            <span className="text-red-500 mr-1">*</span>
                        </Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    disabled={isViewMode}
                                    className={cn(
                                        "flex-1 max-w-xs justify-start text-right font-normal",
                                        !formData.birthDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="ml-2 h-4 w-4" />
                                    {formData.birthDate ? (
                                        format(formData.birthDate, 'dd/MM/yyyy', { locale: he })
                                    ) : (
                                        <span>בחר תאריך</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={formData.birthDate || undefined}
                                    onSelect={(date: Date | undefined) => handleInputChange('birthDate', date || null)}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* מספר זהות */}
                    <div className="flex items-center gap-4">
                        <Label className="w-32 text-left text-sm font-medium text-gray-700">
                            מספר זהות
                            <span className="text-red-500 mr-1">*</span>
                        </Label>
                        <Input
                            value={formData.idNumber}
                            onChange={(e) => {
                                // Only allow digits, max 9 characters
                                const value = e.target.value.replace(/\D/g, '').slice(0, 9)
                                handleInputChange('idNumber', value)
                            }}
                            disabled={isViewMode}
                            maxLength={9}
                            className="flex-1 max-w-xs text-right"
                            placeholder="9 ספרות"
                        />
                    </div>

                    {/* דרכון */}
                    <div className="flex items-center gap-4">
                        <Label className="w-32 text-left text-sm font-medium text-gray-700">
                            דרכון
                        </Label>
                        <Select
                            value={formData.isPassport ? '1' : '0'}
                            onValueChange={(value) => handleInputChange('isPassport', value === '1')}
                            disabled={isViewMode}
                        >
                            <SelectTrigger className="flex-1 max-w-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="0">0 - מספר זהות</SelectItem>
                                <SelectItem value="1">1 - דרכון</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* שם משפחה ארוך */}
                    <div className="flex items-center gap-4">
                        <Label className="w-32 text-left text-sm font-medium text-gray-700">
                            שם משפחה ארוך
                        </Label>
                        <Input
                            value={formData.familyNameExtended}
                            onChange={(e) => handleInputChange('familyNameExtended', e.target.value)}
                            disabled={isViewMode}
                            maxLength={50}
                            className="flex-1 max-w-xs text-right"
                            placeholder="כאשר שם המשפחה ארוך מ-10 תווים"
                        />
                    </div>

                    {/* שם פרטי ארוך */}
                    <div className="flex items-center gap-4">
                        <Label className="w-32 text-left text-sm font-medium text-gray-700">
                            שם פרטי ארוך
                        </Label>
                        <Input
                            value={formData.firstNameExtended}
                            onChange={(e) => handleInputChange('firstNameExtended', e.target.value)}
                            disabled={isViewMode}
                            maxLength={10}
                            className="flex-1 max-w-xs text-right"
                            placeholder="כאשר השם הפרטי ארוך מ-7 תווים"
                        />
                    </div>

                    {/* שם פרטי נוסף */}
                    <div className="flex items-center gap-4">
                        <Label className="w-32 text-left text-sm font-medium text-gray-700">
                            שם פרטי נוסף
                        </Label>
                        <Input
                            value={formData.additionalFirstName}
                            onChange={(e) => handleInputChange('additionalFirstName', e.target.value)}
                            disabled={isViewMode}
                            maxLength={20}
                            className="flex-1 max-w-xs text-right"
                            placeholder="שם פרטי שני"
                        />
                    </div>
                </div>

                {/* Link to National Insurance validation */}
                <div className="mt-8 text-center">
                    <a href="#" className="text-blue-600 hover:underline text-sm">
                        בדיקת אימות נתוני עובד מול המוסד לביטוח לאומי
                    </a>
                </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="border-t bg-gray-50 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {/* ביטול אירוע - Cancel Event */}
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={onCancel}
                        className="gap-1"
                    >
                        <X className="h-4 w-4" />
                        ביטול אירוע
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    {/* הצגה - Display/View */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentMode('view')}
                        className={cn(
                            "gap-1",
                            currentMode === 'view' && "bg-primary text-white hover:bg-primary/90"
                        )}
                    >
                        <Eye className="h-4 w-4" />
                        הצגה
                    </Button>

                    {/* הוספה - Add */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            if (currentMode !== 'add') {
                                setCurrentMode('add')
                            } else {
                                handleSubmit()
                            }
                        }}
                        className={cn(
                            "gap-1",
                            currentMode === 'add' && "bg-primary text-white hover:bg-primary/90"
                        )}
                    >
                        <Plus className="h-4 w-4" />
                        הוספה
                    </Button>

                    {/* יציאה - Exit */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onExit}
                        className="gap-1"
                    >
                        <LogOut className="h-4 w-4" />
                        יציאה
                    </Button>
                </div>
            </div>
        </div>
    )
}
