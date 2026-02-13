'use client'

import { useState, useEffect } from 'react'
import { Check, ChevronsUpDown, Loader2, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useOrganization } from '@/lib/contexts/OrganizationContext'

interface Employee {
    id: string
    first_name: string
    last_name: string
    employee_number?: string
}

interface EmployeeSelectProps {
    value?: string | null
    onChange: (value: string | null) => void
    placeholder?: string
    className?: string
}

function describeError(error: unknown) {
    if (error instanceof Error) {
        return {
            name: error.name,
            message: error.message,
            stack: error.stack,
        }
    }

    if (error && typeof error === 'object') {
        const e = error as Record<string, unknown>
        return {
            message: typeof e.message === 'string' ? e.message : null,
            code: typeof e.code === 'string' ? e.code : null,
            details: typeof e.details === 'string' ? e.details : null,
            hint: typeof e.hint === 'string' ? e.hint : null,
            raw: e,
        }
    }

    return { raw: String(error) }
}

export function EmployeeSelect({ value, onChange, placeholder = "בחר עובד...", className }: EmployeeSelectProps) {
    const { currentOrg } = useOrganization()
    const [open, setOpen] = useState(false)
    const [employees, setEmployees] = useState<Employee[]>([])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        if (!currentOrg || !open) return

        const fetchEmployees = async () => {
            setLoading(true)
            try {
                const { data, error } = await supabase
                    .from('employees')
                    .select('id, first_name, last_name, employee_number')
                    .eq('organization_id', currentOrg.id)
                    .eq('is_active', true)
                    .is('deleted_at', null)
                    .order('first_name')

                if (error) throw error
                setEmployees(data || [])
            } catch (err) {
                console.error('Error fetching employees:', describeError(err))
                setEmployees([])
            } finally {
                setLoading(false)
            }
        }

        fetchEmployees()
    }, [currentOrg, open])

    const selectedEmployee = employees.find(e => e.id === value)

    const [displayEmployee, setDisplayEmployee] = useState<Employee | null>(null)

    useEffect(() => {
        if (selectedEmployee) {
            setDisplayEmployee(selectedEmployee)
            return
        }
        if (value && currentOrg) {
            supabase
                .from('employees')
                .select('id, first_name, last_name, employee_number')
                .eq('id', value)
                .eq('organization_id', currentOrg.id)
                .eq('is_active', true)
                .is('deleted_at', null)
                .maybeSingle()
                .then(({ data, error }) => {
                    if (error) {
                        console.error('Error fetching selected employee:', describeError(error))
                        return
                    }
                    setDisplayEmployee(data ?? null)
                })
        } else {
            setDisplayEmployee(null)
        }
    }, [value, selectedEmployee, currentOrg])


    const filteredEmployees = employees.filter(emp =>
        `${emp.first_name} ${emp.last_name} ${emp.employee_number || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className={cn("relative", className)}>
            <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between font-normal"
                onClick={() => setOpen(!open)}
                type="button"
            >
                {displayEmployee ? (
                    <span className="truncate">{displayEmployee.first_name} {displayEmployee.last_name}</span>
                ) : (
                    <span className="text-muted-foreground">{placeholder}</span>
                )}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>

            {open && (
                <div className="absolute top-full left-0 z-50 mt-1 w-full rounded-md border bg-white shadow-xl">
                    <div className="flex items-center border-b px-3">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <input
                            className="flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                            placeholder="חפש עובד..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div className="max-h-60 overflow-y-auto p-1">
                        {loading ? (
                            <div className="flex items-center justify-center py-6 text-sm text-gray-500">
                                <Loader2 className="w-4 h-4 animate-spin ml-2" />
                                טוען...
                            </div>
                        ) : filteredEmployees.length === 0 ? (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                                לא נמצאו תוצאות.
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {filteredEmployees.map((emp) => (
                                    <div
                                        key={emp.id}
                                        className={cn(
                                            "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                                            value === emp.id ? "bg-accent/50" : ""
                                        )}
                                        onClick={() => {
                                            onChange(emp.id)
                                            setOpen(false)
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                value === emp.id ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        <span>{emp.first_name} {emp.last_name} ({emp.employee_number})</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {value && !open && (
                <button
                    onClick={(e) => { e.stopPropagation(); onChange(null); }}
                    className="absolute left-10 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-red-500"
                    title="נקה בחירה"
                >
                    <X className="w-3 h-3" />
                </button>
            )}
        </div>
    )
}
