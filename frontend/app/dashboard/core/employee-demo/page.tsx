'use client'

import React, { useState } from 'react'
import { ModuleWrapper } from '@/components/layout/ModuleWrapper'
import { Save, Edit, ArrowLeft, Printer } from 'lucide-react'

export default function EmployeeRecordPage() {
    const [activeTab, setActiveTab] = useState('general')

    const tabs = [
        { label: 'פרטים אישיים', value: 'general' },
        { label: 'כתובת וקשר', value: 'contact' },
        { label: 'נתוני העסקה', value: 'employment' },
        { label: 'שכר ותנאים', value: 'salary' },
        { label: 'היסטוריה', value: 'history' },
        { label: 'מסמכים', value: 'docs' },
    ]

    return (
        <ModuleWrapper
            title="כרטיס עובד: 100234 - ישראל ישראלי"
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            actions={
                <>
                    <button className="flex items-center gap-2 px-3 py-1.5 bg-secondary text-white text-sm font-medium rounded hover:bg-secondary-light transition-colors">
                        <Printer className="w-4 h-4" />
                        הדפס
                    </button>
                    <button className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white text-sm font-medium rounded hover:bg-primary-dark transition-colors shadow-sm">
                        <Save className="w-4 h-4" />
                        שמור שינויים
                    </button>
                </>
            }
        >
            <div className="max-w-5xl mx-auto space-y-8" dir="rtl">
                {/* Dense Form Section - General */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500">מספר עובד</label>
                        <input type="text" value="100234" disabled className="w-full bg-gray-50 border border-gray-300 rounded px-2 py-1 text-sm text-gray-700" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500">תעודת זהות</label>
                        <input type="text" value="012345678" className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-secondary">שם פרטי</label>
                        <input type="text" value="ישראל" className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-secondary">שם משפחה</label>
                        <input type="text" value="ישראלי" className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500">סטטוס</label>
                        <select className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none">
                            <option>פעיל</option>
                            <option>בחופשה</option>
                            <option>לא פעיל</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500">מחלקה</label>
                        <select className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none">
                            <option>פיתוח</option>
                            <option>שיווק</option>
                            <option>מכירות</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500">תפקיד</label>
                        <input type="text" value="מפתח בכיר" className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500">מנהל ישיר</label>
                        <input type="text" value="דני דין" className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
                    </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                    <h3 className="text-sm font-bold text-secondary mb-4 border-r-4 border-primary pr-2">פרטי התקשרות</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500">טלפון נייד</label>
                            <input type="text" value="050-1234567" className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500">אימייל עבודה</label>
                            <input type="email" value="israel@company.com" className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500">אימייל פרטי</label>
                            <input type="email" value="israel@gmail.com" className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                    <h3 className="text-sm font-bold text-secondary mb-4 border-r-4 border-primary pr-2">הערות</h3>
                    <textarea className="w-full h-24 border border-gray-300 rounded p-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" placeholder="הערות נוספות..."></textarea>
                </div>
            </div>
        </ModuleWrapper>
    )
}
