'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { Search, X, Loader2, User } from 'lucide-react'
import { useOrganization } from '@/lib/contexts/OrganizationContext'

interface Employee {
    id: string
    first_name: string
    last_name: string
    job_title: string
}

interface EmployeeSelectProps {
    value: string | null
    onChange: (value: string | null) => void
    placeholder?: string
}

export function EmployeeSelect({ value, onChange, placeholder = "בחר עובד..." }: EmployeeSelectProps) {
    const { currentOrg } = useOrganization()
    const [isOpen, setIsOpen] = useState(false)
    const [search, setSearch] = useState('')
    const [employees, setEmployees] = useState<Employee[]>([])
    const [loading, setLoading] = useState(false)
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)

    const wrapperRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    useEffect(() => {
        if (value && !selectedEmployee) {
            // Fetch initial selected employee details
            const fetchSelected = async () => {
                const { data } = await supabase
                    .from('employees')
                    .select('id, first_name, last_name, job_title')
                    .eq('id', value)
                    .single()
                if (data) setSelectedEmployee(data)
            }
            fetchSelected()
        } else if (!value) {
            setSelectedEmployee(null)
        }
    }, [value])

    const handleSearch = async (term: string) => {
        setSearch(term)
        if (!term || term.length < 2) {
            setEmployees([])
            return
        }

        setLoading(true)
        try {
            const { data } = await supabase
                .from('employees')
                .select('id, first_name, last_name, job_title')
                .eq('organization_id', currentOrg?.id)
                .or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%`)
                .limit(5)

            setEmployees(data || [])
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleSelect = (employee: Employee) => {
        setSelectedEmployee(employee)
        onChange(employee.id)
        setIsOpen(false)
        setSearch('')
    }

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation()
        setSelectedEmployee(null)
        onChange(null)
    }

    return (
        <div className="relative w-full" ref={wrapperRef}>
            <div
                className="relative cursor-pointer"
                onClick={() => setIsOpen(!isOpen)}
            >
                <Input
                    readOnly
                    value={selectedEmployee ? `${selectedEmployee.first_name} ${selectedEmployee.last_name}` : ''}
                    placeholder={placeholder}
                    className="cursor-pointer bg-white"
                />
                <div className="absolute left-3 top-2.5 text-gray-400 flex items-center gap-1">
                    {selectedEmployee ? (
                        <X className="w-4 h-4 hover:text-red-500 transition-colors" onClick={handleClear} />
                    ) : (
                        <Search className="w-4 h-4" />
                    )}
                </div>
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg p-2 min-h-[100px] max-h-[300px] overflow-auto">
                    <Input
                        autoFocus
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="חפש שם עובד..."
                        className="mb-2"
                    />

                    {loading && (
                        <div className="flex justify-center p-4 text-gray-400">
                            <Loader2 className="w-5 h-5 animate-spin" />
                        </div>
                    )}

                    {!loading && employees.length === 0 && search.length >= 2 && (
                        <div className="text-center p-4 text-sm text-gray-500">לא נמצאו עובדים</div>
                    )}

                    <div className="space-y-1">
                        {employees.map(emp => (
                            <div
                                key={emp.id}
                                onClick={() => handleSelect(emp)}
                                className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-md cursor-pointer transition-colors"
                                dir="rtl"
                            >
                                <div className="bg-blue-100 p-1.5 rounded-full text-blue-600">
                                    <User className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="font-medium text-sm">{emp.first_name} {emp.last_name}</div>
                                    <div className="text-xs text-gray-500">{emp.job_title}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
