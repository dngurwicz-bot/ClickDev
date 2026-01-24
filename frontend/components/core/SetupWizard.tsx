'use client'

import { useState, useEffect } from 'react'
import {
    Building2,
    ArrowLeft,
    Network,
    Plus,
    Trash2,
    ArrowUp,
    ArrowDown,
    Check,
    ChevronLeft,
    X,
    Lock,
    AlertTriangle,
    Award,
    Briefcase
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { useOrganization } from '@/lib/contexts/OrganizationContext'
import toast from 'react-hot-toast'

const PREDEFINED_LEVELS = [
    { key: 'Division', label: 'חטיבה' },
    { key: 'Wing', label: 'אגף' },
    { key: 'Department', label: 'מחלקה' },
    { key: 'Team', label: 'צוות' },
    { key: 'Role', label: 'תפקיד' }
]

interface SetupWizardProps {
    isOpen: boolean
    onClose: () => void
}

export default function SetupWizard({ isOpen, onClose }: SetupWizardProps) {
    const { currentOrg, refreshOrganizations } = useOrganization()
    const [step, setStep] = useState(1)
    const [levels, setLevels] = useState<string[]>([])
    const [structure, setStructure] = useState<Record<string, string | null>>({})
    const [useJobGrades, setUseJobGrades] = useState(false)
    const [useJobTitles, setUseJobTitles] = useState(false)
    const [saving, setSaving] = useState(false)
    const [isLocked, setIsLocked] = useState(false)

    useEffect(() => {
        if (currentOrg?.config_lock) {
            setIsLocked(true)
        }
    }, [currentOrg])

    if (!isOpen || !currentOrg) return null

    if (isLocked) {
        return (
            <div className="fixed inset-0 bg-gray-50 z-[100] flex items-center justify-center p-4" dir="rtl">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-6">
                    <div className="w-20 h-20 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center mx-auto">
                        <Lock className="w-10 h-10" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">המבנה הארגוני כבר הוגדר</h2>
                        <p className="text-gray-500 mt-2">
                            הגדרת המבנה הארגוני בוצעה והיא נעולה לשינויים כדי לשמור על תקינות הנתונים.
                        </p>
                    </div>
                    <Button onClick={onClose} className="w-full">
                        חזור
                    </Button>
                </div>
            </div>
        )
    }

    const handleLevelToggle = (levelKey: string) => {
        let newLevels = [...levels]
        let newStructure = { ...structure }

        if (newLevels.includes(levelKey)) {
            newLevels = newLevels.filter(l => l !== levelKey)
            delete newStructure[levelKey]
            Object.keys(newStructure).forEach(child => {
                if (newStructure[child] === levelKey) {
                    newStructure[child] = null
                }
            })
        } else {
            newLevels.push(levelKey)
            const myIndex = PREDEFINED_LEVELS.findIndex(l => l.key === levelKey)
            const potentialParents = PREDEFINED_LEVELS.slice(0, myIndex).reverse()
            const parent = potentialParents.find(p => newLevels.includes(p.key))
            newStructure[levelKey] = parent ? parent.key : null
        }

        setLevels(newLevels)
        setStructure(newStructure)
    }

    const handleSave = async () => {
        if (levels.length === 0) {
            toast.error('יש לבחור לפחות רמה אחת')
            return
        }

        setSaving(true)
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

            toast.success('המבנה הארגוני הוגדר בהצלחה')
            await refreshOrganizations()
            onClose()
        } catch (err) {
            console.error('Error saving structure:', err)
            toast.error('שגיאה בשמירת המבנה')
        } finally {
            setSaving(false)
        }
    }

    // Helper for visualization
    const rootLevels = levels.filter(l => !structure[l])
    const getChildren = (parentKey: string) => levels.filter(l => structure[l] === parentKey)

    const renderVisNode = (levelKey: string, depth = 0) => {
        const item = PREDEFINED_LEVELS.find(l => l.key === levelKey)
        const children = getChildren(levelKey)

        return (
            <div key={levelKey} className="flex flex-col items-center">
                <div className="bg-white border border-blue-200 px-4 py-2 rounded-lg text-blue-900 font-bold shadow-sm mb-4">
                    {item?.label}
                </div>
                {children.length > 0 && (
                    <div className="flex gap-4 border-t border-dashed border-gray-300 pt-4">
                        {children.map(child => renderVisNode(child, depth + 1))}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-gray-50 z-[100] flex flex-col md:flex-row h-screen w-screen overflow-hidden" dir="rtl">

            {/* Sidebar */}
            <div className="w-full md:w-1/3 lg:w-1/4 bg-white border-l border-gray-200 p-8 flex flex-col justify-between">
                <div>
                    <div className="flex justify-between items-start mb-6">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                            <Building2 className="w-6 h-6" />
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose} className="md:hidden">
                            <X className="w-5 h-5 text-gray-500" />
                        </Button>
                    </div>

                    <div className="mb-10">
                        <h1 className="font-bold text-xl text-gray-900">הגדרת ארגון ל-CLICK</h1>
                        <p className="text-sm text-gray-500">{currentOrg.name}</p>
                    </div>

                    <div className="space-y-1">
                        <StepIndicator currentStep={step} stepNumber={1} title="ברוכים הבאים" description="סקירה כללית" />
                        <StepIndicator currentStep={step} stepNumber={2} title="מבנה היררכי" description="הגדרת רמות וכפיפות" />
                        <StepIndicator currentStep={step} stepNumber={3} title="תכונות נוספות" description="דירוגים וקטלוג" />
                        <StepIndicator currentStep={step} stepNumber={4} title="סיכום" description="אישור וסיום" />
                    </div>
                </div>

                <div className="text-xs text-gray-400 mt-6 md:mt-0">
                    &copy; 2026 CLICK Systems.
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50 relative">
                <Button variant="ghost" size="icon" onClick={onClose} className="absolute top-6 left-6 hidden md:flex hover:bg-gray-200 z-10">
                    <X className="w-6 h-6 text-gray-500" />
                </Button>

                <div className="flex-1 overflow-y-auto p-8 md:p-12 lg:p-16 flex items-center justify-center">
                    <div className="max-w-3xl w-full">

                        {step === 1 && (
                            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in text-center md:text-right">
                                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 mx-auto md:mx-0">
                                    <Network className="w-8 h-8" />
                                </div>
                                <h2 className="text-3xl font-bold text-gray-900">בואו נבנה את הארגון שלך</h2>
                                <p className="text-lg text-gray-600 leading-relaxed">
                                    כדי להתאים את CLICK לארגון שלך, עלינו להגדיר את המבנה ההיררכי.
                                    <br />
                                    תוכל לבחור אילו רמות קיימות אצלך (חטיבה, אגף, מחלקה וכו') ולקבוע מי כפוף למי.
                                </p>
                                <div className="pt-8 flex justify-center md:justify-start">
                                    <Button size="lg" onClick={() => setStep(2)} className="px-8 text-lg h-12">
                                        התחל בהגדרה
                                        <ArrowLeft className="mr-2 w-5 h-5" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 fade-in">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">מבנה היררכי וכפיפות</h2>
                                    <p className="text-gray-600">בחר את הרמות הרלוונטיות לארגון שלך וקבע את הכפיפות ביניהן.</p>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    {PREDEFINED_LEVELS.map((level) => {
                                        const isSelected = levels.includes(level.key)
                                        return (
                                            <div key={level.key} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${isSelected ? 'border-blue-300 bg-blue-50/50 shadow-sm' : 'border-gray-200 bg-white'}`}>
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => handleLevelToggle(level.key)}
                                                        className="w-5 h-5 rounded border-gray-300 text-blue-600"
                                                    />
                                                    <span className={`font-bold ${isSelected ? 'text-blue-900' : 'text-gray-400'}`}>{level.label}</span>
                                                </div>
                                                {isSelected && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-gray-500 font-medium">כפוף ל:</span>
                                                        <select
                                                            value={structure[level.key] || ''}
                                                            onChange={(e) => setStructure({ ...structure, [level.key]: e.target.value || null })}
                                                            className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                                                        >
                                                            <option value="">(ללא - רמה ראשית)</option>
                                                            {levels.filter(l => l !== level.key).map(l => (
                                                                <option key={l} value={l}>{PREDEFINED_LEVELS.find(pl => pl.key === l)?.label}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>

                                <div className="flex justify-between pt-4">
                                    <Button variant="ghost" onClick={() => setStep(1)}>חזור</Button>
                                    <Button onClick={() => setStep(3)} disabled={levels.length === 0}>
                                        המשך לתכונות
                                        <ArrowLeft className="mr-2 w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 fade-in">
                                <div className="text-center">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">תכונות נוספות</h2>
                                    <p className="text-gray-600">האם תרצה לנהל במערכת דירוגי תפקיד וקטלוג משרות?</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div
                                        onClick={() => setUseJobGrades(!useJobGrades)}
                                        className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${useJobGrades ? 'border-blue-600 bg-blue-50 shadow-md' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                                    >
                                        <div className="flex flex-col gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${useJobGrades ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                                <Award className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900">דירוגי תפקיד</h3>
                                                <p className="text-sm text-gray-500 mt-1">ניהול רמות שכר, דרגות וקידום מקצועי.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div
                                        onClick={() => setUseJobTitles(!useJobTitles)}
                                        className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${useJobTitles ? 'border-blue-600 bg-blue-50 shadow-md' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                                    >
                                        <div className="flex flex-col gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${useJobTitles ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                                <Briefcase className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900">טבלת תפקידים</h3>
                                                <p className="text-sm text-gray-500 mt-1">ניהול קטלוג משרות מרכזי לארגון.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between pt-8">
                                    <Button variant="ghost" onClick={() => setStep(2)}>חזור</Button>
                                    <Button onClick={() => setStep(4)}>
                                        לסיכום ואישור
                                        <ArrowLeft className="mr-2 w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 fade-in">
                                <div className="bg-red-50 border border-red-200 p-6 rounded-2xl flex items-start gap-4 shadow-sm text-right">
                                    <AlertTriangle className="w-8 h-8 text-red-600 shrink-0" />
                                    <div>
                                        <h3 className="text-red-900 font-bold text-lg underline">שים לב - פעולה בלתי הפיכה!</h3>
                                        <p className="text-red-800 mt-1 leading-relaxed">
                                            הגדרת המבנה הארגוני היא יסודית לכל נתוני המערכת. <span className="font-extrabold text-red-700">לא ניתן יהיה לשנות או להוסיף רמות היררכיה</span> לאחר סיום שלב זה. בדוק היטב את התרשים למטה לפני האישור.
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm overflow-x-auto min-h-[300px] flex items-center justify-center">
                                    <div className="flex justify-center min-w-max">
                                        {rootLevels.map(node => renderVisNode(node))}
                                    </div>
                                </div>

                                <div className="flex justify-center gap-4 pt-4">
                                    <Button variant="outline" size="lg" onClick={() => setStep(3)}>ערוך שוב</Button>
                                    <Button size="lg" onClick={handleSave} disabled={saving} className="px-12 bg-blue-600 hover:bg-blue-700 h-12 text-lg">
                                        {saving ? 'מגדיר ארגון...' : 'אישור וסיום הקמה'}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

function StepIndicator({ currentStep, stepNumber, title, description }: { currentStep: number, stepNumber: number, title: string, description: string }) {
    const isActive = currentStep === stepNumber
    const isCompleted = currentStep > stepNumber
    return (
        <div className={`p-4 rounded-xl flex items-center gap-4 transition-all ${isActive ? 'bg-blue-50' : 'bg-transparent'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${isActive ? 'border-blue-600 text-blue-600' : isCompleted ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-200 text-gray-400'}`}>
                {isCompleted ? <Check className="w-4 h-4" /> : stepNumber}
            </div>
            <div className="text-right">
                <p className={`font-bold text-sm ${isActive || isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>{title}</p>
                <p className="text-xs text-gray-500">{description}</p>
            </div>
        </div>
    )
}
