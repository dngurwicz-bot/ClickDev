'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Lock, Plus, Trash2, Save } from 'lucide-react'
import { useOrganization } from '@/lib/contexts/OrganizationContext'
import { supabase } from '@/lib/supabase'
import { JobGradesSettings } from './JobGradesSettings'
import { JobTitlesSettings } from './JobTitlesSettings'

export default function StructureSettingsPage() {
    const { currentOrg, isLoading: orgLoading } = useOrganization()
    const [levels, setLevels] = useState<string[]>([])
    const [isLocked, setIsLocked] = useState(false)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [activeTab, setActiveTab] = useState('structure')

    useEffect(() => {
        if (!currentOrg) return

        const fetchSettings = async () => {
            try {
                const { data, error } = await supabase
                    .from('organizations')
                    .select('hierarchy_levels, config_lock')
                    .eq('id', currentOrg.id)
                    .single()

                if (error) throw error

                if (data) {
                    setLevels(data.hierarchy_levels || ['אגף', 'מחלקה', 'צוות'])
                    setIsLocked(data.config_lock || false)
                }
            } catch (err) {
                console.error('Error fetching settings:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchSettings()
    }, [currentOrg])

    const handleAddLevel = () => {
        setLevels([...levels, 'רמה חדשה'])
    }

    const handleRemoveLevel = (index: number) => {
        const newLevels = [...levels]
        newLevels.splice(index, 1)
        setLevels(newLevels)
    }

    const handleLevelChange = (index: number, value: string) => {
        const newLevels = [...levels]
        newLevels[index] = value
        setLevels(newLevels)
    }

    const handleSave = async () => {
        if (!currentOrg) return
        setSaving(true)
        try {
            const { error } = await supabase
                .from('organizations')
                .update({ hierarchy_levels: levels })
                .eq('id', currentOrg.id)

            if (error) throw error
            alert('ההגדרות נשמרו בהצלחה')
        } catch (err) {
            console.error('Error saving settings:', err)
            alert('שמירת ההגדרות נכשלה')
        } finally {
            setSaving(false)
        }
    }

    const handleLock = async () => {
        if (!currentOrg) return
        if (!confirm('האם אתה בטוח שברצונך לנעול את התצורה? פעולה זו אינה הפיכה.')) return

        setSaving(true)
        try {
            const { error } = await supabase
                .from('organizations')
                .update({ config_lock: true })
                .eq('id', currentOrg.id)

            if (error) throw error
            setIsLocked(true)
        } catch (err) {
            console.error('Error locking settings:', err)
            alert('נעילת התצורה נכשלה')
        } finally {
            setSaving(false)
        }
    }

    if (orgLoading || loading) return <div className="p-8">טוען...</div>

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8" dir="rtl">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">הגדרות ארגוניות</h1>
                <p className="text-gray-500">הגדר את מבנה ההיררכיה, דירוגים ותפקידים בארגון.</p>
            </div>

            {/* Tabs Navigation */}
            <div className="flex border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('structure')}
                    className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'structure'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    מבנה היררכי
                </button>
                <button
                    onClick={() => setActiveTab('grades')}
                    className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'grades'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    דירוגי תפקיד
                </button>
                <button
                    onClick={() => setActiveTab('titles')}
                    className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'titles'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    תפקידים
                </button>
            </div>

            {/* Content */}
            <div className="mt-6">
                {activeTab === 'structure' && (
                    <Card className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold">רמות היררכיה</h2>
                            {isLocked && (
                                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1 rounded-full text-sm font-medium">
                                    <Lock className="w-4 h-4" />
                                    <span>נעל</span>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            {levels.map((level, index) => (
                                <div key={index} className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                                        {index + 1}
                                    </div>
                                    <Input
                                        value={level}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleLevelChange(index, e.target.value)}
                                        disabled={isLocked}
                                        className="max-w-md"
                                        placeholder="שם הרמה (לדוגמה: מחלקה)"
                                    />
                                    {!isLocked && (
                                        <button
                                            onClick={() => handleRemoveLevel(index)}
                                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}

                            {!isLocked && (
                                <Button
                                    variant="outline"
                                    onClick={handleAddLevel}
                                    className="mt-4 flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    הוסף רמה
                                </Button>
                            )}
                        </div>

                        <div className="flex justify-end gap-4 mt-8 pt-4 border-t">
                            {!isLocked && (
                                <>
                                    <Button
                                        variant="destructive"
                                        onClick={handleLock}
                                        disabled={saving}
                                        className="flex items-center gap-2"
                                    >
                                        <Lock className="w-4 h-4" />
                                        נעל תצורה
                                    </Button>
                                    <Button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="flex items-center gap-2"
                                    >
                                        <Save className="w-4 h-4" />
                                        {saving ? 'שומר...' : 'שמור שינויים'}
                                    </Button>
                                </>
                            )}
                        </div>
                    </Card>
                )}

                {activeTab === 'grades' && <JobGradesSettings />}
                {activeTab === 'titles' && <JobTitlesSettings />}
            </div>
        </div>
    )
}

