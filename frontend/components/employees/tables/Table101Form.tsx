'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

export interface Table101Data {
    id?: string
    city_name: string
    city_code: string
    street: string
    house_number: string
    apartment: string
    entrance: string
    postal_code: string
    phone: string
    phone_additional: string
    effective_from: Date | null
}

interface Table101FormProps {
    initialData?: Partial<Table101Data>
    mode?: 'view' | 'add' | 'edit'
    onSave?: (data: Table101Data) => void
    onCancel?: () => void
    onExit?: () => void
}

export default function Table101Form({
    initialData,
    mode = 'view',
    onSave,
    onCancel,
    onExit
}: Table101FormProps) {
    const [formData, setFormData] = useState<Table101Data>({
        city_name: initialData?.city_name || '',
        city_code: initialData?.city_code || '',
        street: initialData?.street || '',
        house_number: initialData?.house_number || '',
        apartment: initialData?.apartment || '',
        entrance: initialData?.entrance || '',
        postal_code: initialData?.postal_code || '',
        phone: initialData?.phone || '',
        phone_additional: initialData?.phone_additional || '',
        effective_from: initialData?.effective_from ? new Date(initialData.effective_from) : new Date(),
    })

    const [currentMode, setCurrentMode] = useState(mode)

    const handleInputChange = (field: keyof Table101Data, value: string | Date | null) => {
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
                <h2 className="text-lg font-bold">101 - כתובת</h2>
                <div className="flex items-center gap-2 text-sm">
                    <span>טבלה 101</span>
                </div>
            </div>

            {/* Form Content */}
            <div className="flex-1 p-6 overflow-auto">
                <div className="max-w-2xl mx-auto space-y-4">
                    {/* שם יישוב וסמל */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-4">
                            <Label className="w-24 text-left text-sm font-medium text-gray-700">
                                שם יישוב
                            </Label>
                            <Input
                                value={formData.city_name}
                                onChange={(e) => handleInputChange('city_name', e.target.value)}
                                disabled={isViewMode}
                                className="flex-1 text-right"
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <Label className="w-24 text-left text-sm font-medium text-gray-700">
                                סמל יישוב
                            </Label>
                            <Input
                                value={formData.city_code}
                                onChange={(e) => handleInputChange('city_code', e.target.value)}
                                disabled={isViewMode}
                                maxLength={5}
                                className="w-24 text-right"
                            />
                        </div>
                    </div>

                    {/* רחוב ומספר בית */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-4">
                            <Label className="w-24 text-left text-sm font-medium text-gray-700">
                                רחוב
                            </Label>
                            <Input
                                value={formData.street}
                                onChange={(e) => handleInputChange('street', e.target.value)}
                                disabled={isViewMode}
                                className="flex-1 text-right"
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <Label className="w-24 text-left text-sm font-medium text-gray-700">
                                מספר בית
                            </Label>
                            <Input
                                value={formData.house_number}
                                onChange={(e) => handleInputChange('house_number', e.target.value)}
                                disabled={isViewMode}
                                className="w-24 text-right"
                            />
                        </div>
                    </div>

                    {/* דירה וכניסה */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-4">
                            <Label className="w-24 text-left text-sm font-medium text-gray-700">
                                דירה
                            </Label>
                            <Input
                                value={formData.apartment}
                                onChange={(e) => handleInputChange('apartment', e.target.value)}
                                disabled={isViewMode}
                                className="w-24 text-right"
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <Label className="w-24 text-left text-sm font-medium text-gray-700">
                                כניסה
                            </Label>
                            <Input
                                value={formData.entrance}
                                onChange={(e) => handleInputChange('entrance', e.target.value)}
                                disabled={isViewMode}
                                className="w-24 text-right"
                            />
                        </div>
                    </div>

                    {/* מיקוד */}
                    <div className="flex items-center gap-4">
                        <Label className="w-24 text-left text-sm font-medium text-gray-700">
                            מיקוד
                        </Label>
                        <Input
                            value={formData.postal_code}
                            onChange={(e) => handleInputChange('postal_code', e.target.value)}
                            disabled={isViewMode}
                            maxLength={7}
                            className="w-32 text-right"
                        />
                    </div>

                    {/* טלפונים */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-4">
                            <Label className="w-24 text-left text-sm font-medium text-gray-700">
                                טלפון
                            </Label>
                            <Input
                                value={formData.phone}
                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                disabled={isViewMode}
                                maxLength={10}
                                className="flex-1 text-right"
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <Label className="w-24 text-left text-sm font-medium text-gray-700">
                                טלפון נוסף
                            </Label>
                            <Input
                                value={formData.phone_additional}
                                onChange={(e) => handleInputChange('phone_additional', e.target.value)}
                                disabled={isViewMode}
                                maxLength={10}
                                className="flex-1 text-right"
                            />
                        </div>
                    </div>

                    {/* תאריך תוקף */}
                    <div className="flex items-center gap-4 border-t pt-4">
                        <Label className="w-24 text-left text-sm font-medium text-gray-700">
                            מתאריך
                        </Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    disabled={isViewMode}
                                    className={cn(
                                        "w-48 justify-start text-right font-normal",
                                        !formData.effective_from && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="ml-2 h-4 w-4" />
                                    {formData.effective_from ? (
                                        format(formData.effective_from, 'dd/MM/yyyy', { locale: he })
                                    ) : (
                                        <span>בחר תאריך</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={formData.effective_from || undefined}
                                    onSelect={(date: Date | undefined) => handleInputChange('effective_from', date || null)}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="border-t bg-gray-50 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
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
