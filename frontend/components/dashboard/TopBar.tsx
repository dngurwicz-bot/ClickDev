'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'
import { isSuperAdmin } from '@/lib/auth'

export default function TopBar() {
    const [showAdminLink, setShowAdminLink] = useState(false)

    useEffect(() => {
        const checkRole = async () => {
            try {
                const isSA = await isSuperAdmin()
                console.log('TopBar checkRole result:', isSA)
                setShowAdminLink(isSA)
            } catch (err) {
                console.error('TopBar checkRole error:', err)
            }
        }
        checkRole()
    }, [])

    return (
        <div className="bg-white border-b border-gray-100 px-8 py-4 flex justify-between items-center sticky top-0 z-10">
            <h1 className="text-xl font-semibold text-gray-800"></h1>

            <div className="flex items-center gap-4">
                {showAdminLink && (
                    <Link
                        href="/admin/dashboard"
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium text-sm"
                    >
                        <ShieldCheck className="w-4 h-4" />
                        <span>תפריט סופר אדמין</span>
                    </Link>
                )}
            </div>
        </div>
    )
}
