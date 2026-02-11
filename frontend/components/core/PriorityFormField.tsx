'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface PriorityFormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string
    labelWidth?: string
    error?: string
}

import { useFocusContext } from '@/context/FocusContext'

export function PriorityFormField({ label, labelWidth, error, className, ...props }: PriorityFormFieldProps) {
    const { setFocusedLabel } = useFocusContext()

    return (
        <div className="flex items-center gap-3 mb-2.5">
            {/* Label on the right (RTL), fixed width or auto */}
            <label className={cn("text-gray-500 font-medium text-sm shrink-0 text-left pl-2", labelWidth || "w-32")}>
                {label}:
            </label>
            <div className="flex-1">
                <input
                    className={cn(
                        "w-full h-9 px-3 text-sm border border-gray-200 rounded-md bg-gray-50/50 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white focus:outline-none transition-all duration-200 disabled:bg-gray-100 disabled:text-gray-400",
                        error ? "border-red-500" : "",
                        className
                    )}
                    onFocus={(e) => {
                        setFocusedLabel(label)
                        props.onFocus?.(e)
                    }}
                    onBlur={(e) => {
                        props.onBlur?.(e)
                    }}
                    {...props}
                />
                {error && <span className="text-xs text-red-500 mt-0.5 block">{error}</span>}
            </div>
        </div>
    )
}

