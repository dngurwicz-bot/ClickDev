'use client';

import EmployeesList from '@/components/employees/EmployeesList';
import Link from 'next/link';
import { UserPlus } from 'lucide-react';

export default function EmployeesPage() {
    return (
        <div className="p-8 max-w-7xl mx-auto" dir="rtl">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">ניהול עובדים</h1>
                    <p className="text-gray-500">צפייה וניהול של כל עובדי הארגון.</p>
                </div>
                <Link href="/dashboard/core/employees/new">
                    <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-200">
                        <UserPlus size={20} />
                        הקמת עובד חדש
                    </button>
                </Link>
            </div>

            <EmployeesList />
        </div>
    );
}
