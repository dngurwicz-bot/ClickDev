'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, ArrowUp, ArrowDown, Save, AlertTriangle, Lock, Unlock, Network, Layout, Briefcase, Award } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { useOrganization } from '@/lib/contexts/OrganizationContext'

const PREDEFINED_LEVELS = [
    { key: 'Division', label: 'חטיבה' },
    { key: 'Wing', label: 'אגף' },
    { key: 'Department', label: 'מחלקה' },
    { key: 'Team', label: 'צוות' },
    { key: 'Role', label: 'תפקיד' }
]

export default function StructureDefinitionPage() {
    const { currentOrg, refreshOrganizations } = useOrganization()
    const [levels, setLevels] = useState<string[]>([])
    const [structure, setStructure] = useState<Record<string, string | null>>({})
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)
    const [serverLock, setServerLock] = useState(false)
    const [useJobGrades, setUseJobGrades] = useState(false)
    const [useJobTitles, setUseJobTitles] = useState(false)

    useEffect(() => {
        if (!currentOrg) return

        const fetchSettings = async () => {
            setFetching(true)
            const { data, error } = await supabase
                .from('organizations')
                .select('hierarchy_levels, hierarchy_structure, config_lock, use_job_grades, use_job_titles')
                .eq('id', currentOrg.id)
                .single()

            if (data) {
                setLevels(data.hierarchy_levels || [])
                setStructure(data.hierarchy_structure || {})
                setServerLock(data.config_lock || false)
                setUseJobGrades(data.use_job_grades || false)
                setUseJobTitles(data.use_job_titles || false)
            }
            setFetching(false)
        }

        fetchSettings()
    }, [currentOrg])

    const handleLevelToggle = (levelKey: string) => {
        let newLevels = [...levels]
        let newStructure = { ...structure }

        if (newLevels.includes(levelKey)) {
            newLevels = newLevels.filter(l => l !== levelKey)
            delete newStructure[levelKey]
            // Also clear any children pointing to this level
            Object.keys(newStructure).forEach(child => {
                if (newStructure[child] === levelKey) {
                    newStructure[child] = null // Reset child to root
                }
            })
        } else {
            newLevels.push(levelKey)
            // Default logic: try to parent to the "previous" level in predefined list if available
            // This preserves the default "Division > Wing > Dept" ease of use while allowing customization
            const myIndex = PREDEFINED_LEVELS.findIndex(l => l.key === levelKey)
            const potentialParents = PREDEFINED_LEVELS.slice(0, myIndex).reverse()
            const parent = potentialParents.find(p => newLevels.includes(p.key))
            newStructure[levelKey] = parent ? parent.key : null
        }

        setLevels(newLevels)
        setStructure(newStructure)
    }

    const handleParentChange = (childKey: string, parentKey: string | null) => {
        setStructure({ ...structure, [childKey]: parentKey })
    }

    const handleSave = async () => {
        if (!currentOrg) return
        if (levels.length === 0) {
            toast.error('יש לבחור לפחות רמה אחת')
            return
        }

        setLoading(true)
        try {
            const { error } = await supabase
                .from('organizations')
                .update({
                    hierarchy_levels: levels,
                    hierarchy_structure: structure,
                    use_job_grades: useJobGrades,
                    use_job_titles: useJobTitles,
                    config_lock: true
                })
                .eq('id', currentOrg.id)

            if (error) throw error

            toast.success('המבנה הארגוני עודכן בהצלחה')
            await refreshOrganizations()
            setServerLock(true)
        } catch (error: any) {
            console.error('Error saving structure:', error)
            toast.error('שגיאה בעת שמירת המבנה')
        } finally {
            setLoading(false)
        }
    }

    if (fetching) return <div className="p-8">טוען הגדרות...</div>

    // Sort selected levels for display based on predefined order + explicit parenting?
    // Actually, we want to show a tree.
    // Let's grouping by parent.
    const rootLevels = levels.filter(l => !structure[l])
    const getChildren = (parentKey: string) => levels.filter(l => structure[l] === parentKey)

    // Recursive tree renderer
    const renderNode = (levelKey: string, depth = 0) => {
        const item = PREDEFINED_LEVELS.find(l => l.key === levelKey)
        const children = getChildren(levelKey)

        return (
            <div key={levelKey} className="flex flex-col items-center">
                <div className={`
                    border-2 border-blue-200 bg-white px-4 py-2 rounded-lg text-blue-900 font-bold shadow-sm mb-4 relative
                    ${depth === 0 ? 'border-t-4 border-t-blue-500' : ''}
                `}>
                    {item?.label}
                </div>
                {children.length > 0 && (
                    <div className="flex gap-4 border-t-2 border-dashed border-gray-300 pt-4 relative">
                        {children.map(child => renderNode(child, depth + 1))}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8" dir="rtl">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">הגדרת מבנה ארגוני</h1>
                <p className="text-gray-500 mt-2">
                    בחר את הרמות הרצויות וקבע את הכפיפות ביניהן.
                </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">

                {/* Selection Area */}
                <div className="grid grid-cols-1 gap-4 mb-8">
                    {PREDEFINED_LEVELS.map((level) => {
                        const isSelected = levels.includes(level.key)
                        return (
                            <div
                                key={level.key}
                                className={`
                                    flex items-center justify-between p-4 rounded-xl border transition-all
                                    ${isSelected ? 'border-blue-300 bg-blue-50/50' : 'border-gray-200 bg-gray-50'}
                                    ${serverLock ? 'opacity-80' : ''}
                                `}
                            >
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => !serverLock && handleLevelToggle(level.key)}
                                        disabled={serverLock}
                                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className={`font-bold ${isSelected ? 'text-blue-900' : 'text-gray-500'}`}>
                                        {level.label}
                                    </span>
                                </div>

                                {isSelected && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-500">כפוף ל:</span>
                                        <select
                                            value={structure[level.key] || ''}
                                            onChange={(e) => !serverLock && handleParentChange(level.key, e.target.value || null)}
                                            disabled={serverLock}
                                            className="h-9 rounded-md border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        >
                                            <option value="">(ללא - רמה ראשית)</option>
                                            {levels
                                                .filter(l => l !== level.key) // Cannot report to self
                                                // Prevent cycles (simple check: cannot report to something that reports to me) - simplified here, assumed DAG
                                                .map(l => {
                                                    const parentItem = PREDEFINED_LEVELS.find(pl => pl.key === l)
                                                    return (
                                                        <option key={l} value={l}>
                                                            {parentItem?.label}
                                                        </option>
                                                    )
                                                })}
                                        </select>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Additional Features Area */}
                <div className="grid grid-cols-1 gap-4 mb-8 pt-8 border-t border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">תכונות נוספות</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className={`
                            flex items-center gap-3 p-4 rounded-xl border transition-all
                            ${useJobGrades ? 'border-purple-300 bg-purple-50/50' : 'border-gray-200 bg-gray-50'}
                            ${serverLock ? 'opacity-80' : ''}
                        `}>
                            <input
                                type="checkbox"
                                checked={useJobGrades}
                                onChange={() => !serverLock && setUseJobGrades(!useJobGrades)}
                                disabled={serverLock}
                                className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <div className="flex flex-col">
                                <span className={`font-bold ${useJobGrades ? 'text-purple-900' : 'text-gray-500'}`}>
                                    דירוגי תפקיד
                                </span>
                                <span className="text-xs text-gray-400">ניהול רמות שכר ודרגות בסיסיות</span>
                            </div>
                        </div>

                        <div className={`
                            flex items-center gap-3 p-4 rounded-xl border transition-all
                            ${useJobTitles ? 'border-purple-300 bg-purple-50/50' : 'border-gray-200 bg-gray-50'}
                            ${serverLock ? 'opacity-80' : ''}
                        `}>
                            <input
                                type="checkbox"
                                checked={useJobTitles}
                                onChange={() => !serverLock && setUseJobTitles(!useJobTitles)}
                                disabled={serverLock}
                                className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <div className="flex flex-col">
                                <span className={`font-bold ${useJobTitles ? 'text-purple-900' : 'text-gray-500'}`}>
                                    טבלת תפקידים
                                </span>
                                <span className="text-xs text-gray-400">ניהול קטלוג המשרות הארגוני</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tree Visualization */}
                {levels.length > 0 && (
                    <div className="bg-gray-50 p-8 rounded-xl border border-dashed border-gray-300 mb-8 overflow-x-auto">
                        <h3 className="text-sm font-semibold text-gray-500 mb-6 uppercase tracking-wider text-center">תרשים ההיררכיה</h3>
                        <div className="flex justify-center min-w-max">
                            {rootLevels.map(node => renderNode(node))}
                        </div>
                        {rootLevels.length === 0 && (
                            <div className="text-center text-gray-400">יש לבחור כפיפות כדי להציג את העץ (כרגע יש מעגלים או חוסר בהגדרת ראשי)</div>
                        )}
                    </div>
                )}

                {serverLock && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3 text-amber-800 mb-6">
                        <Lock className="w-5 h-5" />
                        <div className="flex-1">
                            <span className="font-semibold block">המבנה הארגוני ננעל.</span>
                            <span className="text-sm">לא ניתן לבצע שינויים לאחר ההגדרה הראשונית.</span>
                        </div>
                        <Button
                            variant="outline"
                            className="bg-white hover:bg-amber-100 border-amber-300 text-amber-900"
                            onClick={async () => {
                                if (!currentOrg) return
                                if (confirm('פעולה זו תאפס את הגדרת המבנה ותאפשר עריכה מחדש. האם להמשיך?')) {
                                    await supabase.from('organizations').update({ config_lock: false }).eq('id', currentOrg.id)
                                    setServerLock(false)
                                    toast.success('המבנה נפתח לעריכה')
                                }
                            }}
                        >
                            <Unlock className="w-4 h-4 mr-2" />
                            אפס ופתח לעריכה
                        </Button>
                    </div>
                )}

                <div className="flex justify-end">
                    <Button onClick={handleSave} disabled={loading || serverLock} className="px-8 min-w-[150px]">
                        {loading ? 'שומר...' : 'שמור והחל'}
                    </Button>
                </div>
            </div>
        </div>
    )
}
