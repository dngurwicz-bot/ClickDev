'use client'

import { useState } from 'react'
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
    Lock
} from 'lucide-react'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { useOrganization } from '@/lib/contexts/OrganizationContext'
import toast from 'react-hot-toast'

interface SetupWizardProps {
    isOpen: boolean
    onClose: () => void
}

export default function SetupWizard({ isOpen, onClose }: SetupWizardProps) {
    const { currentOrg } = useOrganization()
    const [step, setStep] = useState(1)
    const [levels, setLevels] = useState<string[]>(['אגף', 'מחלקה', 'צוות'])
    const [enableJobGrades, setEnableJobGrades] = useState(true)
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

    const handleAddLevel = () => {
        setLevels([...levels, ''])
    }

    const handleRemoveLevel = (index: number) => {
        const newLevels = levels.filter((_, i) => i !== index)
        setLevels(newLevels)
    }

    const handleLevelChange = (index: number, value: string) => {
        const newLevels = [...levels]
        newLevels[index] = value
        setLevels(newLevels)
    }

    const handleMoveLevel = (index: number, direction: 'up' | 'down') => {
        if ((direction === 'up' && index === 0) || (direction === 'down' && index === levels.length - 1)) return

        const newLevels = [...levels]
        const swapIndex = direction === 'up' ? index - 1 : index + 1
        const temp = newLevels[index]
        newLevels[index] = newLevels[swapIndex]
        newLevels[swapIndex] = temp
        setLevels(newLevels)
    }

    const handleSave = async () => {
        if (levels.some(l => !l.trim())) {
            toast.error('נא למלא את שמות כל הרמות')
            return
        }

        setSaving(true)
        try {
            const { error } = await supabase
                .from('organizations')
                .update({
                    hierarchy_levels: levels,
                    enable_job_grades: enableJobGrades,
                    config_lock: true
                })
                .eq('id', currentOrg.id)

            if (error) throw error

            toast.success('המבנה הארגוני הוגדר בהצלחה')
            onClose()
        } catch (err) {
            console.error('Error saving structure:', err)
            toast.error('שגיאה בשמירת המבנה')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-gray-50 z-[100] flex flex-col md:flex-row h-screen w-screen overflow-hidden" dir="rtl">

            {/* Sidebar / Progress Section */}
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
                        <StepIndicator
                            currentStep={step}
                            stepNumber={1}
                            title="ברוכים הבאים"
                            description="סקירה כללית"
                        />
                        <StepIndicator
                            currentStep={step}
                            stepNumber={2}
                            title="היררכיה"
                            description="הגדרת רמות הארגון"
                        />
                        <StepIndicator
                            currentStep={step}
                            stepNumber={3}
                            title="דירוגי תפקיד"
                            description="ניהול דרגות ושכר"
                        />
                        <StepIndicator
                            currentStep={step}
                            stepNumber={4}
                            title="סיכום"
                            description="אישור וסיום"
                        />
                    </div>
                </div>

                <div className="text-xs text-gray-400 mt-6 md:mt-0">
                    &copy; 2026 CLICK Systems. כל הזכויות שמורות.
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50 relative">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="absolute top-6 left-6 hidden md:flex hover:bg-gray-200 z-10"
                >
                    <X className="w-6 h-6 text-gray-500" />
                </Button>

                <div className="flex-1 overflow-y-auto p-8 md:p-12 lg:p-16 flex items-center justify-center">
                    <div className="max-w-2xl w-full">
                        {step === 1 && (
                            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in">
                                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                                    <Network className="w-8 h-8" />
                                </div>
                                <h2 className="text-3xl font-bold text-gray-900">בואו נגדיר את המבנה הארגוני</h2>
                                <p className="text-lg text-gray-600 leading-relaxed">
                                    כדי להתאים את המערכת בדיוק לצרכים שלכם, עלינו להבין כיצד הארגון בנוי.
                                    <br />
                                    המערכת מאפשרת גמישות מלאה בהגדרת ההיררכיה (לדוגמה: חטיבה, אגף, מחלקה).
                                </p>

                                <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm mt-8">
                                    <h3 className="font-semibold text-gray-900 mb-2">דוגמה נפוצה:</h3>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <span className="bg-gray-100 px-3 py-1 rounded-md">חטיבה</span>
                                        <ChevronLeft className="w-4 h-4 text-gray-400" />
                                        <span className="bg-gray-100 px-3 py-1 rounded-md">אגף</span>
                                        <ChevronLeft className="w-4 h-4 text-gray-400" />
                                        <span className="bg-gray-100 px-3 py-1 rounded-md">מחלקה</span>
                                    </div>
                                </div>

                                <div className="pt-8">
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
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">הגדרת רמות ההיררכיה</h2>
                                    <p className="text-gray-600">
                                        הוסף, הסר או שנה את סדר הרמות מהגבוהה (1) לנמוכה ביותר.
                                    </p>
                                </div>

                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                    <div className="p-1 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 px-6 py-2 flex justify-between">
                                        <span>רמה</span>
                                        <span>שם הרמה</span>
                                        <span>פעולות</span>
                                    </div>
                                    <div className="divide-y divide-gray-100">
                                        {levels.map((level, index) => (
                                            <div key={index} className="p-4 flex items-center gap-4 group hover:bg-gray-50 transition-colors">
                                                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-sm">
                                                    {index + 1}
                                                </div>
                                                <Input
                                                    value={level}
                                                    onChange={(e) => handleLevelChange(index, e.target.value)}
                                                    placeholder={`שם הרמה ה-${index + 1}`}
                                                    className="border-gray-200 focus:ring-blue-500"
                                                    autoFocus={index === levels.length - 1}
                                                />
                                                <div className="flex items-center gap-1">
                                                    <div className="flex flex-col gap-0.5">
                                                        <button
                                                            onClick={() => handleMoveLevel(index, 'up')}
                                                            disabled={index === 0}
                                                            className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-20"
                                                        >
                                                            <ArrowUp className="w-3 h-3" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleMoveLevel(index, 'down')}
                                                            disabled={index === levels.length - 1}
                                                            className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-20"
                                                        >
                                                            <ArrowDown className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                    <div className="w-px h-8 bg-gray-200 mx-2"></div>
                                                    <button
                                                        onClick={() => handleRemoveLevel(index)}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-4 bg-gray-50 border-t border-gray-200">
                                        <Button
                                            variant="outline"
                                            onClick={handleAddLevel}
                                            className="w-full border-dashed border-gray-300 text-gray-600 hover:text-blue-600 hover:border-blue-300"
                                        >
                                            <Plus className="w-4 h-4 ml-2" />
                                            הוסף רמה נוספת
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex justify-between pt-4">
                                    <Button variant="ghost" onClick={() => setStep(1)} className="text-gray-500">
                                        חזור
                                    </Button>
                                    <Button onClick={() => setStep(3)} disabled={levels.some(l => !l.trim())}>
                                        הבא: סיכום
                                        <ArrowLeft className="mr-2 w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                        )}
                        {step === 3 && (
                            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 fade-in">
                                <div className="text-center mb-8">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">ניהול דירוגי תפקיד</h2>
                                    <p className="text-gray-600">
                                        האם תרצה לנהל במערכת דירוגי תפקיד ודרגות שכר?
                                    </p>
                                </div>

                                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:border-blue-300 transition-colors cursor-pointer" onClick={() => setEnableJobGrades(!enableJobGrades)}>
                                    <div className="flex items-center gap-4">
                                        <div className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${enableJobGrades ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}>
                                            {enableJobGrades && <Check className="w-4 h-4 text-white" />}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">כן, הפעל דירוגי תפקיד</h3>
                                            <p className="text-sm text-gray-500">מאפשר להגדיר דרגות (כמו ג'וניור, בכיר, מנהל) ולשייך אותן לתפקידים ולעובדים.</p>
                                        </div>
                                    </div>
                                </div>

                                {!enableJobGrades && (
                                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-600">
                                        בבחירה זו, המערכת תעבוד בצורה שטוחה ללא ניהול דרגות רוחבי. כל תפקיד יעמוד בפני עצמו.
                                    </div>
                                )}

                                <div className="flex justify-between pt-4">
                                    <Button variant="ghost" onClick={() => setStep(2)} className="text-gray-500">
                                        חזור
                                    </Button>
                                    <Button onClick={() => setStep(4)}>
                                        הבא: סיכום
                                        <ArrowLeft className="mr-2 w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                        )}

                        {step === 4 && (
                            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 fade-in text-center">
                                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Check className="w-10 h-10" />
                                </div>

                                <div>
                                    <h2 className="text-3xl font-bold text-gray-900 mb-4">המבנה מוכן</h2>
                                    <p className="text-gray-600 max-w-lg mx-auto">
                                        שים לב: הגדרת המבנה הארגוני היא חד-פעמית. <br />
                                        <span className="font-semibold text-red-600">לא ניתן</span> לשנות את היררכיית הרמות לאחר הסיום.
                                    </p>
                                </div>

                                <div className="bg-white border border-gray-200 rounded-xl p-8 max-w-xl mx-auto shadow-sm">
                                    <div className="flex flex-col items-center gap-4">
                                        {levels.map((level, i) => (
                                            <div key={i} className="flex flex-col items-center w-full animate-in fade-in slide-in-from-top-2" style={{ animationDelay: `${i * 100}ms` }}>
                                                <div className="w-full bg-blue-50 border border-blue-100 text-blue-800 font-semibold py-3 px-6 rounded-lg shadow-sm">
                                                    {level}
                                                </div>
                                                {i < levels.length - 1 && (
                                                    <div className="h-6 w-px bg-gray-300 my-1"></div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-center gap-4 pt-8">
                                    <Button variant="outline" onClick={() => setStep(3)}>
                                        חזור לעריכה
                                    </Button>
                                    <Button size="lg" onClick={handleSave} disabled={saving} className="px-8 min-w-[200px]">
                                        {saving ? 'שומר הגדרות...' : 'סיים והתחל לעבוד'}
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
        <div className={`p-4 rounded-lg flex items-center gap-4 transition-colors ${isActive ? 'bg-blue-50' : 'bg-transparent'}`}>
            <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all
                ${isActive ? 'border-blue-600 text-blue-600 bg-white' : ''}
                ${isCompleted ? 'bg-blue-600 border-blue-600 text-white' : ''}
                ${!isActive && !isCompleted ? 'border-gray-200 text-gray-400' : ''}
            `}>
                {isCompleted ? <Check className="w-4 h-4" /> : stepNumber}
            </div>
            <div>
                <p className={`font-semibold text-sm ${isActive || isCompleted ? 'text-gray-900' : 'text-gray-500'}`}>{title}</p>
                <p className="text-xs text-gray-500">{description}</p>
            </div>
        </div>
    )
}
