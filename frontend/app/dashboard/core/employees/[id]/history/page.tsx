'use client';

import EventHistory from '@/components/employees/EventHistory';
import { useParams } from 'next/navigation';

export default function EmployeeHistoryPage() {
    const params = useParams();
    const id = params.id as string;

    return (
        <div className="p-8 max-w-7xl mx-auto" dir="rtl">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">תיק עובד - היסטוריה</h1>
                    <p className="text-gray-500">צפייה בכל האירועים והשינויים עבור עובד {id}</p>
                </div>
            </div>

            <EventHistory employeeNumber={id} />
        </div>
    );
}
