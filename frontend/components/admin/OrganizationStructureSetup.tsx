'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, ArrowUp, ArrowDown, Save, AlertTriangle, Lock, Unlock, Network, Layout, Briefcase, Award } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

interface OrganizationStructureSetupProps {
    orgId: string
    initialLevels?: string[]
    initialLock?: boolean
    onUpdate?: () => void
}

const PREDEFINED_LEVELS = [
    { key: 'Division', label: 'חטיבה' },
    { key: 'Wing', label: 'אגף' },
    { key: 'Department', label: 'מחלקה' },
    { key: 'Team', label: 'צוות' }
]

const TABS = [
    { id: 'structure', label: 'מבנה היררכי', icon: Network },
    { id: 'grades', label: 'דירוגי תפקיד', icon: Award },
    { id: 'roles', label: 'תפקידים', icon: Briefcase }
]

export default function OrganizationStructureSetup({
    orgId,
    initialLevels = ['Wing', 'Department'],
    initialLock = false,
    onUpdate
}: OrganizationStructureSetupProps) {
    const [activeTab, setActiveTab] = useState('structure')
    const [levels, setLevels] = useState<string[]>(initialLevels)
    const [loading, setLoading] = useState(false)
    const [hasChanges, setHasChanges] = useState(false)

    // Sync props to state
    useEffect(() => {
        if (initialLevels) setLevels(initialLevels)
    }, [initialLevels])

    const handleLevelToggle = (levelKey: string) => {
        let newLevels = [...levels]
        if (newLevels.includes(levelKey)) {
            newLevels = newLevels.filter(l => l !== levelKey)
        } else {
            newLevels.push(levelKey)
        }

        // Enforce strict order based on PREDEFINED_LEVELS index
        newLevels.sort((a, b) => {
            const indexA = PREDEFINED_LEVELS.findIndex(l => l.key === a)
            const indexB = PREDEFINED_LEVELS.findIndex(l => l.key === b)
            return indexA - indexB
        })

        setLevels(newLevels)
        setHasChanges(true)
    }

    const handleSave = async () => {
        if (levels.length === 0) {
            toast.error('יש לבחור לפחות רמה אחת')
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
                    lock_configuration: true // Always lock per user request "client cannot write what they want" logic implies strictness
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
        <div className="space-y-6" dir="rtl">

            {/* Tabs Navigation */}
            <div className="flex border-b border-gray-200">
                {TABS.map(tab => {
                    const isActive = activeTab === tab.id
                    const Icon = tab.icon
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors border-b-2
                                ${isActive
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                            `}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    )
                })}
            </div>

            {/* Tab Content */}
            <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm min-h-[400px]">

                {/* 1. Structure Tab */}
                {activeTab === 'structure' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">מבנה היררכי</h2>
                            <p className="text-gray-500 mt-2">
                                אנא בחר את רמות ההיררכיה הרצויות בארגון שלך. המערכת תסדר אותן אוטומטית לפי סדר החשיבות (חטיבה &gt; אגף &gt; מחלקה &gt; צוות).
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                            {PREDEFINED_LEVELS.map((level) => {
                                const isSelected = levels.includes(level.key)
                                return (
                                    <div
                                        key={level.key}
                                        onClick={() => handleLevelToggle(level.key)}
                                        className={`
                                            cursor-pointer p-4 rounded-xl border-2 transition-all flex items-center justify-between
                                            ${isSelected
                                                ? 'border-blue-600 bg-blue-50'
                                                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}
                                        `}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`
                                                w-5 h-5 rounded border flex items-center justify-center
                                                ${isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}
                                            `}>
                                                {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                            </div>
                                            <span className={`font-semibold ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>
                                                {level.label}
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Visual Chain */}
                        {levels.length > 0 && (
                            <div className="bg-gray-50 p-6 rounded-xl border border-dashed border-gray-300">
                                <h3 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">המבנה שלי</h3>
                                <div className="flex flex-wrap items-center gap-2">
                                    {levels.map((levelKey, index) => {
                                        const label = PREDEFINED_LEVELS.find(l => l.key === levelKey)?.label
                                        return (
                                            <div key={levelKey} className="flex items-center gap-2 animate-in fade-in zoom-in duration-300">
                                                <div className="px-4 py-2 bg-white border border-blue-200 text-blue-800 font-bold rounded-lg shadow-sm">
                                                    {index + 1}. {label}
                                                </div>
                                                {index < levels.length - 1 && (
                                                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                    </svg>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end pt-4">
                            <Button onClick={handleSave} disabled={loading || !hasChanges} className="px-8">
                                {loading ? 'שומר...' : 'שמור הגדרות'}
                            </Button>
                        </div>
                    </div>
                )}

                {/* 2. Job Grades Tab */}
                {activeTab === 'grades' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">דירוגי תפקיד</h2>
                                <p className="text-gray-500 mt-1">ניהול רמות שכר ודירוג בארגון.</p>
                            </div>
                            <Button variant="outline">הוסף דירוג</Button>
                        </div>
                        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed text-gray-400">
                            כאן תופיע טבלת דירוגי תפקיד (Job Grades)
                        </div>
                    </div>
                )}

                {/* 3. Roles Tab */}
                {activeTab === 'roles' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">תפקידים</h2>
                                <p className="text-gray-500 mt-1">קטלוג התפקידים בארגון.</p>
                            </div>
                            <Button variant="outline">הוסף תפקיד</Button>
                        </div>
                        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed text-gray-400">
                            כאן תופיע טבלת התפקידים (Job Titles)
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
