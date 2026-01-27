'use client'

import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { Event200Form } from '@/components/core/Event200Form'
import { Toaster } from 'react-hot-toast'

export default function NewEmployeePage() {
    const router = useRouter()

    return (
        <div className="min-h-screen bg-gray-50/50 p-8" dir="rtl">
            <div className="max-w-5xl mx-auto">
                <div className="flex items-center gap-4 mb-6">
                    <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-gray-500 hover:text-gray-900">
                        <ArrowRight className="w-4 h-4 ml-1" />
                        חזרה לרשימה
                    </Button>
                    <h1 className="text-3xl font-bold text-gray-900">הוספת עובד חדש</h1>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                    <Event200Form />
                </div>
            </div>
            <Toaster position="top-center" />
        </div>
    )
}
