'use client';

import { EmployeeForm } from '@/components/core/EmployeeForm';
import { useRouter } from 'next/navigation';

export default function NewEmployeePage() {
    const router = useRouter();

    return (
        <div className="p-8 max-w-4xl mx-auto" dir="rtl">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">הקמת עובד חדש</h1>
                    <p className="text-gray-500">הזן את פרטי העובד הראשוניים להקמה במערכת.</p>
                </div>
            </div>

            <EmployeeForm onSuccess={() => router.push('/dashboard/core')} />
        </div>
    );
}
