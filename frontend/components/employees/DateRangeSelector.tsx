'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Calendar, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export type DateRangeType = 'all' | 'processing_month' | 'custom' | 'last_calculation' | 'tax_year'

interface DateRangeSelectorProps {
    value: DateRangeType
    onChange: (value: DateRangeType) => void
    className?: string
}

const dateRangeOptions: { value: DateRangeType; label: string }[] = [
    { value: 'all', label: 'הכל' },
    { value: 'processing_month', label: 'חודש העיבוד' },
    { value: 'custom', label: 'לפי תאריכים' },
    { value: 'last_calculation', label: 'חישוב אחרון' },
    { value: 'tax_year', label: 'מתח׳ שנת המס' },
]

export default function DateRangeSelector({
    value,
    onChange,
    className
}: DateRangeSelectorProps) {
    return (
        <div className={cn("flex items-center gap-2", className)}>
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-xs text-gray-500">טווח תאריכים:</span>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger className="h-7 w-[140px] text-xs">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {dateRangeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value} className="text-xs">
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}
