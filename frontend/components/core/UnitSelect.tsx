'use client'

import { useState, useEffect } from 'react'
import { Check, ChevronsUpDown, Loader2, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useOrganization } from '@/lib/contexts/OrganizationContext'

interface OrgUnit {
    id: string
    name: string
    type: string
}

interface UnitSelectProps {
    value?: string | null
    onChange: (value: string | null) => void
    type?: string // Filter by type (e.g. 'Wing' to select only wings)
    placeholder?: string
    excludeId?: string
    className?: string
}

export function UnitSelect({ value, onChange, type, placeholder = "בחר יחידה...", excludeId, className }: UnitSelectProps) {
    const { currentOrg } = useOrganization()
    const [open, setOpen] = useState(false)
    const [units, setUnits] = useState<OrgUnit[]>([])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        if (!currentOrg || !open) return

        const fetchUnits = async () => {
            setLoading(true)
            try {
                let query = supabase
                    .from('org_units')
                    .select('id, name, type')
                    .eq('organization_id', currentOrg.id)
                    .order('name')

                if (type) {
                    query = query.eq('type', type)
                }

                if (excludeId) {
                    query = query.neq('id', excludeId)
                }

                const { data, error } = await query
                if (error) throw error
                setUnits(data || [])
            } catch (err) {
                console.error('Error fetching units:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchUnits()
    }, [currentOrg, open, type, excludeId])

    const selectedUnit = units.find(u => u.id === value)

    // Also fetch the selected unit if it's not in the list (e.g. when closed or filtered out)
    const [displayUnit, setDisplayUnit] = useState<OrgUnit | null>(null)

    useEffect(() => {
        if (selectedUnit) {
            setDisplayUnit(selectedUnit)
            return
        }
        if (value && currentOrg) {
            supabase.from('org_units').select('id, name, type').eq('id', value).single()
                .then(({ data }) => { if (data) setDisplayUnit(data) })
        } else {
            setDisplayUnit(null)
        }
    }, [value, selectedUnit, currentOrg])


    const filteredUnits = units.filter(unit =>
        unit.name.toLowerCase().includes(searchTerm.toLowerCase())
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
                {displayUnit ? (
                    <span className="truncate">{displayUnit.name}</span>
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
                            placeholder="חפש..."
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
                        ) : filteredUnits.length === 0 ? (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                                לא נמצאו תוצאות.
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {filteredUnits.map((unit) => (
                                    <div
                                        key={unit.id}
                                        className={cn(
                                            "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                                            value === unit.id ? "bg-accent/50" : ""
                                        )}
                                        onClick={() => {
                                            onChange(unit.id)
                                            setOpen(false)
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                value === unit.id ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        <span>{unit.name}</span>
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
