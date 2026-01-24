'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { ArrowRight, ShieldCheck, HelpCircle, Mail } from 'lucide-react'
import Link from 'next/link'
import { isSuperAdmin } from '@/lib/auth'

export default function TopBar() {
    const pathname = usePathname()
    const [showAdminLink, setShowAdminLink] = useState(false)
    const isCoreModule = pathname?.startsWith('/dashboard/core')

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

    if (isCoreModule) {
        return (
            <div className="bg-white border-b border-gray-100 px-8 py-4 flex justify-between items-center sticky top-0 z-10 w-full mb-6">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors text-sm font-medium"
                    >
                        <ArrowRight className="w-4 h-4" />
                        <span>חזרה לדשבורד</span>
                    </Link>
                </div>

                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-gray-900">Click Core</h1>
                </div>
            </div>
        )
    }

    // Always show top bar, simplified content for non-admins could go here
    return (
        <div className="bg-white border-b border-gray-100 px-8 py-4 flex justify-between items-center sticky top-0 z-10 w-full mb-6">
            <div className="flex items-center gap-4">
                <button className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors text-sm font-medium">
                    <HelpCircle className="w-4 h-4" />
                    <span>מרכז עזרה</span>
                </button>
                <a href="mailto:support@click-hr.com" className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors text-sm font-medium">
                    <Mail className="w-4 h-4" />
                    <span>צור קשר</span>
                </a>
            </div>

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
