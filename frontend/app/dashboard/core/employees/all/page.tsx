'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import EmployeeTable from '@/components/employees/EmployeeTable'
import { useOrganization } from '@/lib/contexts/OrganizationContext'
import { Employee } from '@/components/employees/EmployeeDetails'
import { useFocusContext } from '@/context/FocusContext'
import {
    Loader2,
    ArrowLeft,
    Search,
    Download,
    Printer,
    RefreshCw,
    Filter,
    X,
    ChevronDown,
    ChevronUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import * as XLSX from 'xlsx'
import { toast } from 'react-hot-toast'
import { cn } from '@/lib/utils'

export default function AllEmployeesPage() {
    const router = useRouter()
    const { currentOrg } = useOrganization()
    const { setFocusedLabel } = useFocusContext()

    const [employees, setEmployees] = useState<Employee[]>([])
    const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([])
    const [loading, setLoading] = useState(true)

    // Search States
    const [searchTerm, setSearchTerm] = useState('')
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

    // Advanced Filters
    const [filters, setFilters] = useState({
        firstName: '',
        lastName: '',
        employeeNumber: '',
        idNumber: '',
        position: ''
    })

    // Clear focus label on mount (Fix sticky footer bug)
    useEffect(() => {
        setFocusedLabel(null)
    }, [setFocusedLabel])

    useEffect(() => {
        if (currentOrg?.id) {
            fetchAllEmployees()
        }
    }, [currentOrg?.id])

    // Filter Logic
    useEffect(() => {
        let result = employees

        // 1. Global Search (if active and advanced filters not primarily used)
        if (searchTerm && !showAdvancedFilters) {
            const lower = searchTerm.toLowerCase()
            result = result.filter(emp =>
                (emp.firstName || '').toLowerCase().includes(lower) ||
                (emp.lastName || '').toLowerCase().includes(lower) ||
                (emp.employeeNumber || '').includes(lower) ||
                (emp.idNumber || '').includes(lower)
            )
        }

        // 2. Advanced Filters (AND logic)
        if (showAdvancedFilters) {
            if (filters.firstName) result = result.filter(e => (e.firstName || '').toLowerCase().includes(filters.firstName.toLowerCase()))
            if (filters.lastName) result = result.filter(e => (e.lastName || '').toLowerCase().includes(filters.lastName.toLowerCase()))
            if (filters.employeeNumber) result = result.filter(e => (e.employeeNumber || '').toLowerCase().includes(filters.employeeNumber.toLowerCase()))
            if (filters.idNumber) result = result.filter(e => (e.idNumber || '').toLowerCase().includes(filters.idNumber.toLowerCase()))
            if (filters.position) result = result.filter(e => (e.position || '').toLowerCase().includes(filters.position.toLowerCase()))
        }

        setFilteredEmployees(result)
    }, [searchTerm, filters, showAdvancedFilters, employees])

    const fetchAllEmployees = async () => {
        setLoading(true)
        try {
            const { supabase } = await import('@/lib/supabase')

            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .eq('organization_id', currentOrg?.id)
                .order('employee_number', { ascending: true })

            if (error) throw error

            const mapped = (data || []).map((emp: any) => ({
                ...emp,
                firstName: emp.first_name_he || emp.firstName || '',
                lastName: emp.last_name_he || emp.lastName || '',
                employeeNumber: emp.employee_number || emp.employeeNumber || '',
                idNumber: emp.id_number || emp.idNumber || '',
                position: emp.position || ''
            }))

            setEmployees(mapped)
            setFilteredEmployees(mapped) // Initial set
        } catch (err) {
            console.error('Error fetching all employees:', err)
            toast.error('שגיאה בטעינת עובדים')
        } finally {
            setLoading(false)
        }
    }

    const handleSelectEmployee = (emp: Employee) => {
        router.push(`/dashboard/core/employees?employeeId=${emp.employeeNumber || emp.id}`)
    }

    const handleExport = () => {
        // Define columns to export
        const columns = [
            { header: 'מספר עובד', accessor: 'employeeNumber' },
            { header: 'שם משפחה', accessor: 'lastName' },
            { header: 'שם פרטי', accessor: 'firstName' },
            { header: 'תעודת זהות', accessor: 'idNumber' },
            { header: 'תפקיד', accessor: 'position' },
            // Add other fields if relevant, e.g., email, phone
            { header: 'עיר', accessor: 'city' },
            { header: 'רחוב', accessor: 'street' },
            { header: 'טלפון', accessor: 'phone' },
        ]

        // Generate Header Row
        const headerRow = columns.map(col => col.header).join(',')

        // Generate Data Rows
        const dataRows = filteredEmployees.map(emp => {
            return columns.map(col => {
                const val = (emp as any)[col.accessor] || ''
                // Escape quotes and wrap in quotes to handle commas in data
                const stringVal = String(val).replace(/"/g, '""')
                return `"${stringVal}"`
            }).join(',')
        })

        const csvContent = [headerRow, ...dataRows].join('\n')

        // Add BOM for Excel UTF-8 compatibility
        const BOM = '\uFEFF'
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.setAttribute('href', url)
        link.setAttribute('download', `employees_export_${new Date().toISOString().slice(0, 10)}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const clearFilters = () => {
        setFilters({
            firstName: '',
            lastName: '',
            employeeNumber: '',
            idNumber: '',
            position: ''
        })
        setSearchTerm('')
    }

    return (
        <div className="flex flex-col h-full w-full bg-bg-main" dir="rtl">
            {/* Extended Header with Tools */}
            <div className="bg-secondary border-b border-white/10 flex flex-col shrink-0 shadow-sm z-10 relative">

                {/* Top Row: Title & Back */}
                <div className="h-14 flex items-center justify-between px-4 border-b border-white/5">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.back()}
                            className="text-gray-300 hover:text-white hover:bg-white/10"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <span className="text-white font-bold text-lg tracking-wide">אינדקס עובדים</span>
                        <div className="h-4 w-px bg-white/20 mx-2" />
                        <span className="text-gray-400 text-sm">{filteredEmployees.length} רשומות</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleExport}
                            className="text-gray-300 hover:text-white hover:bg-white/10 gap-2"
                        >
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">ייצוא ל-Excel</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.print()}
                            className="text-gray-300 hover:text-white hover:bg-white/10 gap-2"
                        >
                            <Printer className="w-4 h-4" />
                            <span className="hidden sm:inline">הדפסה</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={fetchAllEmployees}
                            className="text-gray-300 hover:text-white hover:bg-white/10 gap-2"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">רענן</span>
                        </Button>
                    </div>
                </div>

                {/* Bottom Row: Smart Filter Bar */}
                <div className="h-12 flex items-center px-4 gap-4 bg-[#2C3E50]/50 backdrop-blur-sm transition-all duration-300">
                    {!showAdvancedFilters ? (
                        <>
                            <div className="relative flex-1 max-w-md animate-in fade-in zoom-in-95 duration-200">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="חיפוש מהיר..."
                                    className="w-full bg-white/10 border border-white/10 rounded-md py-1.5 pr-9 pl-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:bg-white/20 transition-all"
                                />
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowAdvancedFilters(true)}
                                className="text-gray-300 hover:text-white hover:bg-white/10 gap-2"
                            >
                                <Filter className="w-4 h-4" />
                                <span>סינון מתקדם</span>
                            </Button>
                        </>
                    ) : (
                        <div className="flex items-center gap-2 w-full animate-in fade-in slide-in-from-top-2 duration-200">
                            <span className="text-xs font-bold text-primary uppercase tracking-wider ml-2 whitespace-nowrap">מסננים פעילים:</span>

                            {/* Filter Inputs Row */}
                            <div className="flex items-center gap-2 flex-1 overflow-x-auto pb-1 no-scrollbar">
                                <input
                                    placeholder="מספר עובד"
                                    value={filters.employeeNumber}
                                    onChange={(e) => setFilters(prev => ({ ...prev, employeeNumber: e.target.value }))}
                                    className="bg-white/10 border border-white/10 rounded px-2 py-1 text-sm text-white w-24 placeholder:text-gray-500 focus:outline-none focus:bg-white/20"
                                />
                                <input
                                    placeholder="שם משפחה"
                                    value={filters.lastName}
                                    onChange={(e) => setFilters(prev => ({ ...prev, lastName: e.target.value }))}
                                    className="bg-white/10 border border-white/10 rounded px-2 py-1 text-sm text-white w-32 placeholder:text-gray-500 focus:outline-none focus:bg-white/20"
                                />
                                <input
                                    placeholder="שם פרטי"
                                    value={filters.firstName}
                                    onChange={(e) => setFilters(prev => ({ ...prev, firstName: e.target.value }))}
                                    className="bg-white/10 border border-white/10 rounded px-2 py-1 text-sm text-white w-32 placeholder:text-gray-500 focus:outline-none focus:bg-white/20"
                                />
                                <input
                                    placeholder="ת.ז."
                                    value={filters.idNumber}
                                    onChange={(e) => setFilters(prev => ({ ...prev, idNumber: e.target.value }))}
                                    className="bg-white/10 border border-white/10 rounded px-2 py-1 text-sm text-white w-28 placeholder:text-gray-500 focus:outline-none focus:bg-white/20"
                                />
                                <input
                                    placeholder="תפקיד"
                                    value={filters.position}
                                    onChange={(e) => setFilters(prev => ({ ...prev, position: e.target.value }))}
                                    className="bg-white/10 border border-white/10 rounded px-2 py-1 text-sm text-white w-32 placeholder:text-gray-500 focus:outline-none focus:bg-white/20"
                                />
                            </div>

                            <div className="flex items-center gap-1 border-r border-white/10 pr-2 mr-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={clearFilters}
                                    title="נקה מסננים"
                                    className="text-gray-400 hover:text-white hover:bg-white/10 h-7 w-7"
                                >
                                    <X className="w-3 h-3" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        clearFilters()
                                        setShowAdvancedFilters(false)
                                    }}
                                    className="text-gray-300 hover:text-white hover:bg-white/10 gap-1 text-xs h-7"
                                >
                                    <ChevronUp className="w-3 h-3" />
                                    <span>סגור</span>
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden relative">
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                ) : (
                    <div className="h-full overflow-hidden flex flex-col">
                        <EmployeeTable
                            employees={filteredEmployees}
                            onSelectEmployee={handleSelectEmployee}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}
