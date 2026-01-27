'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'react-hot-toast'
import { Loader2, Save } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useOrganization } from '@/lib/contexts/OrganizationContext'

export function Event200Form() {
    const router = useRouter()
    const { currentOrg } = useOrganization()
    const [loading, setLoading] = useState(false)

    // Using a flat state object to mimic the "Row/Record" nature of legacy systems
    const [formData, setFormData] = useState({
        id_number: '', // ZEUT
        first_name: '', // SHEM
        last_name: '', // MISPAHA
        first_name_en: '', // SHEMMALE
        last_name_en: '', // MISPAHAM
        birth_date: '', // LEIDA
        gender: '',
        address: '',
        city: '',
        phone: '',
        job_title: '',
        start_date: new Date().toISOString().split('T')[0], // TAARICH_TCHULA
        action_code: 'A' // 'A' = Insert, '3' = Cancel
    })

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!currentOrg) return

        setLoading(true)
        try {
            // Mapping Legacy Form to Modern Schema
            const payload = {
                organization_id: currentOrg.id,
                id_number: formData.id_number,
                first_name: formData.first_name,
                last_name: formData.last_name,
                first_name_en: formData.first_name_en,
                last_name_en: formData.last_name_en,
                birth_date: formData.birth_date,
                gender: formData.gender,
                phone: formData.phone,
                address: formData.address,
                city: formData.city,
                hire_date: formData.start_date,
                job_title: formData.job_title,
                is_active: true,
                // Hilan Default Values
                salary_currency: 'ILS',
                employment_type: 'full_time'
            }


            const { data: { session } } = await supabase.auth.getSession()

            const res = await fetch('/api/employees', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify(payload)
            })

            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.detail || 'Failed to create employee')
            }

            toast.success('עובד נוצר בהצלחה (אירוע 200)')
            router.push('/dashboard/core/employees')
        } catch (error: any) {
            console.error(error)
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 font-sans text-sm pb-10">
            {/* Header / Toolbar */}
            <div className="bg-gray-100 p-2 border-b flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <div className="bg-blue-600 text-white px-2 py-1 text-xs font-mono font-bold rounded">
                        EVENT 200
                    </div>
                    <span className="font-bold text-gray-700">פתיחת עובד חדש / עדכון פרטים</span>
                </div>
                <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => router.back()}>
                        ביטול (F3)
                    </Button>
                    <Button type="submit" size="sm" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Save className="w-4 h-4 ml-2" />}
                        שמור (F10)
                    </Button>
                </div>
            </div>

            <div className="p-4 grid grid-cols-12 gap-y-4 gap-x-6">

                {/* Section: Identifiers */}
                <div className="col-span-12 border-b pb-1 mb-2 text-gray-500 font-bold text-xs">
                    זיהוי (Identification)
                </div>

                <div className="col-span-3">
                    <div className="flex justify-between mb-1">
                        <Label className="text-xs font-bold text-gray-700">מספר זהות</Label>
                        <span className="text-[10px] font-mono text-blue-600">ZEUT</span>
                    </div>
                    <Input
                        required
                        className="h-8 bg-yellow-50 font-mono text-sm border-gray-400 focus:border-blue-500"
                        placeholder="9 ספרות"
                        value={formData.id_number}
                        onChange={e => handleChange('id_number', e.target.value)}
                        maxLength={9}
                    />
                </div>

                <div className="col-span-2">
                    <div className="flex justify-between mb-1">
                        <Label className="text-xs text-gray-600">קוד פעולה</Label>
                        <span className="text-[10px] font-mono text-gray-400">OP</span>
                    </div>
                    <Select
                        value={formData.action_code}
                        onValueChange={(val) => handleChange('action_code', val)}
                    >
                        <SelectTrigger className="h-8">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent align="end">
                            <SelectItem value="A">הוספה (Insert)</SelectItem>
                            <SelectItem value="3">ביטול (Cancel)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="col-span-7"></div> {/* Spacer */}

                {/* Section: Personal Details */}
                <div className="col-span-12 border-b pb-1 mb-2 mt-2 text-gray-500 font-bold text-xs">
                    פרטים אישיים (Personal Details)
                </div>

                <div className="col-span-4">
                    <div className="flex justify-between mb-1">
                        <Label className="text-xs font-bold text-gray-700">שם משפחה (עברית)</Label>
                        <span className="text-[10px] font-mono text-blue-600">MISPAHA</span>
                    </div>
                    <Input
                        required
                        className="h-8 border-gray-300"
                        value={formData.last_name}
                        onChange={e => handleChange('last_name', e.target.value)}
                    />
                </div>

                <div className="col-span-4">
                    <div className="flex justify-between mb-1">
                        <Label className="text-xs font-bold text-gray-700">שם פרטי (עברית)</Label>
                        <span className="text-[10px] font-mono text-blue-600">SHEM</span>
                    </div>
                    <Input
                        required
                        className="h-8 border-gray-300"
                        value={formData.first_name}
                        onChange={e => handleChange('first_name', e.target.value)}
                    />
                </div>

                <div className="col-span-4">
                    <div className="flex justify-between mb-1">
                        <Label className="text-xs text-gray-600">תאריך לידה</Label>
                        <span className="text-[10px] font-mono text-blue-600">LEIDA</span>
                    </div>
                    <Input
                        type="date"
                        required
                        className="h-8 border-gray-300"
                        value={formData.birth_date}
                        onChange={e => handleChange('birth_date', e.target.value)}
                    />
                </div>

                {/* English Names */}
                <div className="col-span-4">
                    <div className="flex justify-between mb-1">
                        <Label className="text-xs text-gray-600">שם משפחה (לועזי)</Label>
                        <span className="text-[10px] font-mono text-gray-400">MISPAHAM</span>
                    </div>
                    <Input
                        className="h-8 border-gray-300 font-sans"
                        dir="ltr"
                        value={formData.last_name_en}
                        onChange={e => handleChange('last_name_en', e.target.value)}
                    />
                </div>

                <div className="col-span-4">
                    <div className="flex justify-between mb-1">
                        <Label className="text-xs text-gray-600">שם פרטי (לועזי)</Label>
                        <span className="text-[10px] font-mono text-gray-400">SHEMMALE</span>
                    </div>
                    <Input
                        className="h-8 border-gray-300 font-sans"
                        dir="ltr"
                        value={formData.first_name_en}
                        onChange={e => handleChange('first_name_en', e.target.value)}
                    />
                </div>

                <div className="col-span-4">
                    <div className="flex justify-between mb-1">
                        <Label className="text-xs text-gray-600">מין</Label>
                        <span className="text-[10px] font-mono text-gray-400">MIN</span>
                    </div>
                    <Select
                        value={formData.gender}
                        onValueChange={(val) => handleChange('gender', val)}
                    >
                        <SelectTrigger className="h-8 border-gray-300">
                            <SelectValue placeholder="בחר..." />
                        </SelectTrigger>
                        <SelectContent align="end">
                            <SelectItem value="male">זכר</SelectItem>
                            <SelectItem value="female">נקבה</SelectItem>
                        </SelectContent>
                    </Select>
                </div>


                {/* Section: Contact & Job */}
                <div className="col-span-12 border-b pb-1 mb-2 mt-2 text-gray-500 font-bold text-xs">
                    כתובת והעסקה (Job & Address)
                </div>

                <div className="col-span-5">
                    <div className="flex justify-between mb-1">
                        <Label className="text-xs text-gray-600">כתובת</Label>
                        <span className="text-[10px] font-mono text-gray-400">KTOVET</span>
                    </div>
                    <Input
                        className="h-8 border-gray-300"
                        value={formData.address}
                        onChange={e => handleChange('address', e.target.value)}
                    />
                </div>
                <div className="col-span-3">
                    <div className="flex justify-between mb-1">
                        <Label className="text-xs text-gray-600">עיר</Label>
                        <span className="text-[10px] font-mono text-gray-400">IR</span>
                    </div>
                    <Input
                        className="h-8 border-gray-300"
                        value={formData.city}
                        onChange={e => handleChange('city', e.target.value)}
                    />
                </div>
                <div className="col-span-4">
                    <div className="flex justify-between mb-1">
                        <Label className="text-xs text-gray-600">טלפון</Label>
                        <span className="text-[10px] font-mono text-gray-400">TELEPHON</span>
                    </div>
                    <Input
                        className="h-8 border-gray-300"
                        value={formData.phone}
                        onChange={e => handleChange('phone', e.target.value)}
                    />
                </div>

                <div className="col-span-4">
                    <div className="flex justify-between mb-1">
                        <Label className="text-xs font-bold text-gray-700">תפקיד התחלתי</Label>
                        <span className="text-[10px] font-mono text-blue-600">TAFKID</span>
                    </div>
                    <Input
                        required
                        className="h-8 border-gray-300"
                        value={formData.job_title}
                        onChange={e => handleChange('job_title', e.target.value)}
                    />
                </div>

                <div className="col-span-4">
                    <div className="flex justify-between mb-1">
                        <Label className="text-xs font-bold text-gray-700">תאריך קליטה</Label>
                        <span className="text-[10px] font-mono text-blue-600">KLITA</span>
                    </div>
                    <Input
                        type="date"
                        required
                        className="h-8 border-gray-300"
                        value={formData.start_date}
                        onChange={e => handleChange('start_date', e.target.value)}
                    />
                </div>

            </div>

            <div className="p-4 bg-yellow-50 text-xs text-yellow-800 border-t border-yellow-200">
                <strong>שים לב:</strong> שדות המסומנים ב-<span className="text-blue-600">כחול</span> הם שדות חובה לפי הגדרות אירוע 200.
                <br />
                יש לוודא שמספר הזהות תקין (ספרת ביקורת) לפני השמירה.
            </div>
        </form>
    )
}
