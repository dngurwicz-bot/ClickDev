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
        <div className="flex items-center gap-2 mb-1">
            {/* Label on the right (RTL), fixed width or auto */}
            <label className={cn("text-secondary font-bold text-xs shrink-0 text-left pl-2", labelWidth || "w-32")}>
                {label}:
            </label>
            <div className="flex-1">
                <input
                    className={cn(
                        "w-full h-8 px-2 text-sm border border-gray-300 rounded-none focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all disabled:bg-gray-100 disabled:text-gray-500",
                        error ? "border-red-500" : "",
                        className
                    )}
                    onFocus={(e) => {
                        setFocusedLabel(label)
                        props.onFocus?.(e)
                    }}
                    onBlur={(e) => {
                        // Optional: Clear on blur if desired, but Priority usually keeps last active.
                        // setFocusedLabel(null) 
                        props.onBlur?.(e)
                    }}
                    {...props}
                />
                {error && <span className="text-[10px] text-red-500 mt-0.5 block">{error}</span>}
            </div>
        </div>
    )
}

