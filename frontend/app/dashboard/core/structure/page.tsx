'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Settings, Network, ChevronDown, ChevronLeft, Building2, Trash2, User } from 'lucide-react'
import Link from 'next/link'
import { useOrganization } from '@/lib/contexts/OrganizationContext'
import { supabase } from '@/lib/supabase'
import { OrgUnitForm } from '@/components/core/OrgUnitForm'

interface OrgUnit {
    id: string
    name: string
    type: string
    parent_id: string | null
    children?: OrgUnit[]
    manager_id: string | null
    manager?: {
        first_name: string
        last_name: string
    } | null
}

export default function StructurePage() {
    const { currentOrg, isLoading: orgLoading } = useOrganization()
    const [units, setUnits] = useState<OrgUnit[]>([])
    const [levels, setLevels] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const [showAddForm, setShowAddForm] = useState(false)
    const [selectedParent, setSelectedParent] = useState<{ id: string | null, type: string | null }>({ id: null, type: null })
    const [editingUnit, setEditingUnit] = useState<OrgUnit | null>(null)

    const fetchData = async () => {
        if (!currentOrg) return
        setLoading(true)
        try {
            // Fetch Levels
            const { data: orgData } = await supabase
                .from('organizations')
                .select('hierarchy_levels')
                .eq('id', currentOrg.id)
                .single()

            if (orgData) setLevels(orgData.hierarchy_levels || [])

            // Fetch Units
            const { data: unitData, error } = await supabase
                .from('org_units')
                .select('*, manager:employees(first_name, last_name)')
                .eq('organization_id', currentOrg.id)
                .order('created_at', { ascending: true })

            if (error) throw error

            // Build Tree
            const buildTree = (items: any[], parentId: string | null = null): OrgUnit[] => {
                return items
                    .filter(item => item.parent_id === parentId)
                    .map(item => ({
                        ...item,
                        children: buildTree(items, item.id)
                    }))
            }

            setUnits(buildTree(unitData || []))

        } catch (err) {
            console.error('Error fetching data:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [currentOrg])

    const handleAddClick = (parentId: string | null, parentType: string | null) => {
        setSelectedParent({ id: parentId, type: parentType })
        setEditingUnit(null)
        setShowAddForm(true)
    }

    const handleEditClick = (unit: OrgUnit) => {
        setEditingUnit(unit)
        setSelectedParent({ id: unit.parent_id, type: null })
        setShowAddForm(true)
    }

    const handleDeleteClick = async (id: string) => {
        if (!confirm('האם אתה בטוח שברצונך למחוק יחידה זו? הפעולה תמחק גם את כל תתי-היחידות.')) return
        try {
            const { error } = await supabase
                .from('org_units')
                .delete()
                .eq('id', id)

            if (error) throw error
            fetchData()
        } catch (err) {
            console.error('Error deleting unit:', err)
            alert('שגיאה במחיקת היחידה')
        }
    }

    const handleFormSuccess = () => {
        setShowAddForm(false)
        fetchData()
    }

    // Recursive Tree Renderer
    const renderTree = (nodes: OrgUnit[], depth = 0) => {
        return (
            <div className="space-y-4">
                {nodes.map(node => (
                    <div key={node.id} className="relative">
                        <Card className={`p-4 border-r-4 ${depth === 0 ? 'border-r-blue-500 bg-blue-50/50' : 'border-r-gray-300'} hover:shadow-md transition-shadow`}>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${depth === 0 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                                        <Building2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">{node.name}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{node.type}</span>
                                            {node.manager && (
                                                <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                                                    <User className="w-3 h-3" />
                                                    <span>{node.manager.first_name} {node.manager.last_name}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button size="sm" variant="ghost" onClick={() => handleEditClick(node)} title="ערוך">
                                        <Settings className="w-4 h-4" />
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => handleDeleteClick(node.id)} className="text-red-500 hover:text-red-600" title="מחק">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => handleAddClick(node.id, node.type)} title="הוסף תת-יחידה">
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </Card>

                        {/* Children Container using native connection lines look via border */}
                        {node.children && node.children.length > 0 && (
                            <div className="mr-8 mt-4 border-r-2 border-dashed border-gray-200 pr-8 space-y-4">
                                {renderTree(node.children, depth + 1)}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        )
    }

    if (orgLoading || loading) return <div className="p-8">טוען...</div>

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8" dir="rtl">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">מבנה ארגוני</h1>
                    <p className="text-gray-500">צפה ונהל את היחידות הארגוניות בארגון.</p>
                </div>
                <div className="flex gap-4">
                    <Link href="/dashboard/core/settings">
                        <Button variant="outline" className="flex items-center gap-2">
                            <Settings className="w-4 h-4" />
                            הגדרות מבנה
                        </Button>
                    </Link>
                    {units.length === 0 && (
                        <Button className="flex items-center gap-2" onClick={() => handleAddClick(null, null)}>
                            <Plus className="w-4 h-4" />
                            הוסף יחידה ראשית
                        </Button>
                    )}
                </div>
            </div>

            {showAddForm ? (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="w-full max-w-md">
                        <OrgUnitForm
                            parentId={selectedParent.id}
                            parentType={selectedParent.type}
                            initialData={editingUnit || undefined}
                            levels={levels}
                            onSuccess={handleFormSuccess}
                            onCancel={() => setShowAddForm(false)}
                        />
                    </div>
                </div>
            ) : null}

            {units.length === 0 ? (
                <Card className="p-12 flex flex-col items-center justify-center text-center space-y-4 border-dashed">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
                        <Network className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-semibold">אין יחידות ארגוניות עדיין</h3>
                    <p className="text-gray-500 max-w-md">
                        התחל בבניית העץ הארגוני שלך על ידי הוספת היחידה הראשונה.
                    </p>
                    <Button className="mt-4" onClick={() => handleAddClick(null, null)}>
                        <Plus className="w-4 h-4 ml-2" />
                        צור יחידה ראשונה
                    </Button>
                </Card>
            ) : (
                <div className="mt-8">
                    {renderTree(units)}
                </div>
            )}
        </div>
    )
}
