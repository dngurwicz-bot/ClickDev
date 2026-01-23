'use client'

import { Column } from '@tanstack/react-table'
import { Check, ChevronDown } from 'lucide-react'
import { useState, useMemo } from 'react'

interface FacetedFilterProps<TData, TValue> {
    column?: Column<TData, TValue>
    title?: string
    options?: { label: string; value: string }[]
}

export function FacetedFilter<TData, TValue>({
    column,
    title,
    options,
}: FacetedFilterProps<TData, TValue>) {
    const [isOpen, setIsOpen] = useState(false)
    const selectedValues = new Set(column?.getFilterValue() as string[])

    // Get unique values from the column if no options provided
    const facets = column?.getFacetedUniqueValues()
    const uniqueValues = useMemo(() => {
        if (options) return options
        if (!facets) return []

        return Array.from(facets.keys()).map((value) => ({
            label: String(value),
            value: String(value),
        }))
    }, [facets, options])

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-primary/20 focus:border-primary outline-none flex items-center justify-between bg-white hover:bg-gray-50"
                type="button"
            >
                <span className="truncate">
                    {selectedValues.size > 0
                        ? `${selectedValues.size} נבחרו`
                        : title || 'בחר...'}
                </span>
                <ChevronDown className="w-3 h-3 ml-1 flex-shrink-0" />
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown */}
                    <div className="absolute top-full left-0 mt-1 w-full min-w-[150px] bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-60 overflow-auto">
                        {/* Clear button */}
                        {selectedValues.size > 0 && (
                            <button
                                onClick={() => {
                                    column?.setFilterValue(undefined)
                                    setIsOpen(false)
                                }}
                                className="w-full px-3 py-2 text-xs text-right hover:bg-gray-50 border-b border-gray-100 text-red-600"
                            >
                                נקה הכל
                            </button>
                        )}

                        {uniqueValues.map((option) => {
                            const isSelected = selectedValues.has(option.value)
                            return (
                                <button
                                    key={option.value}
                                    onClick={() => {
                                        const newSelectedValues = new Set(selectedValues)
                                        if (isSelected) {
                                            newSelectedValues.delete(option.value)
                                        } else {
                                            newSelectedValues.add(option.value)
                                        }
                                        const filterValues = Array.from(newSelectedValues)
                                        column?.setFilterValue(
                                            filterValues.length ? filterValues : undefined
                                        )
                                    }}
                                    className="w-full px-3 py-2 text-xs text-right hover:bg-gray-50 flex items-center justify-between"
                                >
                                    <span className="truncate">{option.label}</span>
                                    {isSelected && (
                                        <Check className="w-3 h-3 text-primary flex-shrink-0" />
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </>
            )}
        </div>
    )
}
