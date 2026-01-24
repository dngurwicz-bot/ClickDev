'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, ArrowUp, ArrowDown, Save, AlertTriangle, Lock, Unlock, Network } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'

interface OrganizationStructureSetupProps {
    orgId: string
    initialLevels?: string[]
    initialLock?: boolean
    onUpdate?: () => void
}

export default function OrganizationStructureSetup({
    orgId,
    initialLevels = ['Wing', 'Department'],
    initialLock = false,
    onUpdate
}: OrganizationStructureSetupProps) {
    const [levels, setLevels] = useState<string[]>(initialLevels)
    const [isLocked, setIsLocked] = useState(initialLock)
    const [loading, setLoading] = useState(false)
    const [hasChanges, setHasChanges] = useState(false)

    // Update local state when props change
    useEffect(() => {
        if (initialLevels) setLevels(initialLevels)
        if (initialLock !== undefined) setIsLocked(initialLock)
    }, [initialLevels, initialLock])

    const handleAddLevel = () => {
        setLevels([...levels, 'New Level'])
        setHasChanges(true)
    }

    const handleRemoveLevel = (index: number) => {
        const newLevels = levels.filter((_, i) => i !== index)
        setLevels(newLevels)
        setHasChanges(true)
    }

    const handleMoveLevel = (index: number, direction: 'up' | 'down') => {
        if (
            (direction === 'up' && index === 0) ||
            (direction === 'down' && index === levels.length - 1)
        ) {
            return
        }

        const newLevels = [...levels]
        const swapIndex = direction === 'up' ? index - 1 : index + 1
        const temp = newLevels[index]
        newLevels[index] = newLevels[swapIndex]
        newLevels[swapIndex] = temp
        setLevels(newLevels)
        setHasChanges(true)
    }

    const handleLevelNameChange = (index: number, value: string) => {
        const newLevels = [...levels]
        newLevels[index] = value
        setLevels(newLevels)
        setHasChanges(true)
    }

    const handleSave = async () => {
        if (levels.some(l => !l.trim())) {
            toast.error('שמות הרמות לא יכולים להיות ריקים')
            return
        }

        setLoading(true)
        try {
            const { data: { session } } = await supabase.auth.getSession()

            const response = await fetch(`/api/organizations/${orgId}/setup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token || ''}`
                },
                body: JSON.stringify({
                    hierarchy_levels: levels,
                    lock_configuration: isLocked
                })
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.detail || 'Failed to update configuration')
            }

            toast.success('המבנה הארגוני עודכן בהצלחה')
            setHasChanges(false)
            if (onUpdate) onUpdate()
        } catch (error: any) {
            console.error('Error saving structure:', error)
            toast.error(error.message || 'שגיאה בעת שמירת המבנה')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                    <Network className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" />
                    <div>
                        <h3 className="text-lg font-bold text-blue-900 mb-2">מוקדי כוח ומבנה ארגוני</h3>
                        <p className="text-blue-800 text-sm leading-relaxed">
                            כאן ניתן להגדיר את ההיררכיה הארגונית (למשל: חטיבה &gt; אגף &gt; מחלקה &gt; צוות).
                            <br />
                            סדר הרמות קובע את הכפיפות: הרמה הראשונה היא הגבוהה ביותר.
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-text-primary">הגדרת רמות</h2>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => {
                                setIsLocked(!isLocked)
                                setHasChanges(true)
                            }}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-colors ${isLocked
                                    ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                                    : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                                }`}
                        >
                            {isLocked ? (
                                <>
                                    <Lock className="w-4 h-4" />
                                    נעל תצורה
                                </>
                            ) : (
                                <>
                                    <Unlock className="w-4 h-4" />
                                    שחרר תצורה
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div className="space-y-3 max-w-2xl">
                    {levels.map((level, index) => (
                        <div
                            key={index}
                            className="group flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg hover:border-primary/50 transition-colors"
                        >
                            <div className="w-8 h-8 flex items-center justify-center bg-white rounded-full border border-gray-200 text-sm font-bold text-text-secondary shadow-sm">
                                {index + 1}
                            </div>

                            <div className="flex-1">
                                <input
                                    type="text"
                                    value={level}
                                    onChange={(e) => handleLevelNameChange(index, e.target.value)}
                                    className="w-full bg-transparent border-none focus:ring-0 p-0 text-text-primary font-medium placeholder-gray-400"
                                    placeholder="שם הרמה (לדוגמה: אגף)"
                                    disabled={isLocked && initialLock} // Disable editing if strictly locked from server (logic depends, for now allow unlock)
                                />
                            </div>

                            <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleMoveLevel(index, 'up')}
                                    disabled={index === 0}
                                    className="p-1.5 hover:bg-white hover:text-primary rounded disabled:opacity-30"
                                    title="הזז למעלה"
                                >
                                    <ArrowUp className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleMoveLevel(index, 'down')}
                                    disabled={index === levels.length - 1}
                                    className="p-1.5 hover:bg-white hover:text-primary rounded disabled:opacity-30"
                                    title="הזז למטה"
                                >
                                    <ArrowDown className="w-4 h-4" />
                                </button>
                                <div className="w-px h-4 bg-gray-300 mx-1"></div>
                                <button
                                    onClick={() => handleRemoveLevel(index)}
                                    className="p-1.5 hover:bg-white hover:text-red-500 rounded text-gray-500"
                                    title="מחק רמה"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}

                    <button
                        onClick={handleAddLevel}
                        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-text-secondary hover:border-primary hover:text-primary hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 font-medium"
                    >
                        <Plus className="w-5 h-5" />
                        הוסף רמה חדשה
                    </button>
                </div>

                <div className="mt-8 flex justify-end pt-6 border-t border-gray-100">
                    <button
                        onClick={handleSave}
                        disabled={loading || !hasChanges}
                        className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center gap-2 font-medium shadow-sm"
                    >
                        {loading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        שמור שינויים
                    </button>
                </div>
            </div>

            {isLocked && (
                <div className="mt-4 flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-4 py-3 rounded-lg border border-amber-200">
                    <AlertTriangle className="w-4 h-4" />
                    <span>שים לב: תצורת הארגון נעולה. שינויים עשויים לחסום אפשרויות מסוימות במערכת עבור מנהלי הארגון.</span>
                </div>
            )}
        </div>
    )
}
